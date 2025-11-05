import { useRouter } from 'vue-router'
import type { ApiResponse } from '~/types'
import type { User } from '~/types/users'
import { useStorage } from '@vueuse/core'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  firstname: string
  lastname: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number
}

interface QueuedRequest {
  resolve: (value: any) => void
  reject: (reason: any) => void
  endpoint: string
  options: any
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

class TokenManager {
  private static readonly AUTH_KEY = 'auth'
  private static authStorage = useStorage<AuthTokens | null>(this.AUTH_KEY, {})

  static getAccessToken(): string | null {
    return this.authStorage.value?.accessToken || null
  }

  static getRefreshToken(): string | null {
    return this.authStorage.value?.refreshToken || null
  }

  static getExpiresAt(): number {
    return this.authStorage.value?.expiresAt || 0
  }

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000
    this.authStorage.value = {
      accessToken,
      refreshToken,
      expiresAt
    }
  }

  static clearTokens(): void {
    this.authStorage.value = null
  }

  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt()
    return Date.now() >= expiresAt - 60000 // 1 minute buffer
  }
}

export function useAuth() {
  const router = useRouter()
  const { $posthog } = useNuxtApp()

  const user = useState<User>('auth_user', () => null)
  const isAuthenticated = computed(() => !!TokenManager.getAccessToken())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isRefreshing = ref(false)
  const refreshTimer = ref<NodeJS.Timeout | null>(null)
  const requestQueue = ref<QueuedRequest[]>([])

  const processRequestQueue = (success: boolean, newToken?: string) => {
    const queue = requestQueue.value.splice(0)

    queue.forEach(({ resolve, reject, endpoint, options }) => {
      if (success && newToken) {
        resolve({ endpoint, options, token: newToken })
      } else {
        reject(new Error('Token refresh failed'))
      }
    })
  }

  const setupTokenRefresh = (expiresIn: number) => {
    if (!import.meta.client) return

    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
    }

    const refreshDelay = Math.max(expiresIn, 60) * 1000

    refreshTimer.value = setTimeout(() => {
      refreshToken()
    }, refreshDelay)
  }

  const makeAuthenticatedRequest = async <T>(endpoint: string, options: any = {}): Promise<T> => {
    const { api } = await import('~/api')
    return api.client.request<T>(endpoint, options)
  }

  const loadUser = async (force: boolean = false): Promise<void> => {
    if (user.value && !force) return

    try {
      const response = await makeAuthenticatedRequest<ApiResponse<User>>('/mgmt/v1/users/me')
      user.value = response.data

      if (user.value && $posthog) {
        $posthog().identify(user.value.id, {
          email: user.value.email,
          name: `${user.value.firstname} ${user.value.lastname}`,
        })
      }
    } catch (err: any) {
      console.error('Failed to load user:', err)
      await logout()
    }
  }

  const login = async (payload: LoginPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { api } = await import('~/api')
      const response = await api.client.post<AuthResponse>('/auth/v1/token', payload)

      if (response.access_token) {
        TokenManager.setTokens(
          response.access_token,
          response.access_token,
          response.expires_in
        )

        api.setAuthToken(response.access_token)
        setupTokenRefresh(response.expires_in)
        await loadUser()

        router.push('/')
        return true
      }

      throw new Error('Invalid response from server')
    } catch (err: any) {
      error.value = err?.response?.status === 401
        ? 'Invalid email or password'
        : 'Login failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { api } = await import('~/api')
      await api.client.post('/auth/v1/register', payload)

      return await login({
        email: payload.email,
        password: payload.password
      })
    } catch (err: any) {
      error.value = err?.response?.status === 409
        ? 'An account with this email already exists'
        : 'Registration failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing.value) {
      return new Promise((resolve) => {
        requestQueue.value.push({
          resolve: (result) => resolve(true),
          reject: (error) => resolve(false),
          endpoint: '',
          options: {}
        })
      })
    }

    const refreshTokenValue = TokenManager.getRefreshToken()
    if (!refreshTokenValue) {
      await logout()
      return false
    }

    isRefreshing.value = true

    try {
      const { api } = await import('~/api')
      const response = await api.client.post<AuthResponse>('/auth/v1/token/refresh', {
        refresh_token: refreshTokenValue
      })

      if (response.access_token) {
        TokenManager.setTokens(
          response.access_token,
          response.access_token,
          response.expires_in
        )

        api.setAuthToken(response.access_token)
        setupTokenRefresh(response.expires_in)
        processRequestQueue(true, response.access_token)

        return true
      }

      throw new Error('Invalid refresh response')
    } catch (err: any) {
      processRequestQueue(false)

      if (err?.response?.status === 401) {
        error.value = 'Your session has expired. Please log in again.'
        await logout()
      } else {
        console.error('Token refresh failed:', err)
      }

      return false
    } finally {
      isRefreshing.value = false
    }
  }

  const handleUnauthorized = async (endpoint: string, options: any): Promise<any> => {
    if (endpoint.includes('/auth/v1/token')) {
      throw new Error('Authentication failed')
    }

    if (isRefreshing.value) {
      return new Promise((resolve, reject) => {
        requestQueue.value.push({ resolve, reject, endpoint, options })
      })
    }

    const success = await refreshToken()
    if (success) {
      return { endpoint, options, token: TokenManager.getAccessToken() }
    }

    throw new Error('Authentication required')
  }

  const logout = async (returnPath?: string): Promise<void> => {
    try {
      const refreshTokenValue = TokenManager.getRefreshToken()
      if (refreshTokenValue) {
        const { api } = await import('~/api')
        await api.client.post('/auth/v1/logout', {
          refresh_token: refreshTokenValue
        }).catch(() => { /** ignore */ })
      }
    } catch (err) { /** ignore */ }

    user.value = null
    error.value = null

    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
      refreshTimer.value = null
    }

    TokenManager.clearTokens()
    const { api } = await import('~/api')
    api.setAuthToken(undefined)

    const currentRoute = router.currentRoute.value.fullPath
    router.push({
      name: 'login',
      query: { return: returnPath || currentRoute }
    })
  }

  const initAuth = async (): Promise<void> => {
    if (!import.meta.client) return

    const accessToken = TokenManager.getAccessToken()
    const refreshTokenValue = TokenManager.getRefreshToken()

    if (!accessToken || !refreshTokenValue) return

    const { api } = await import('~/api')
    api.setAuthToken(accessToken)

    if (TokenManager.isTokenExpired()) {
      const success = await refreshToken()
      if (!success) return
    } else {
      const expiresAt = TokenManager.getExpiresAt()
      const remainingTime = Math.max(expiresAt - Date.now(), 0) / 1000
      setupTokenRefresh(remainingTime)
    }

    await loadUser()
  }

  onMounted(() => {
    initAuth()
  })

  onUnmounted(() => {
    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
    }
  })

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error,

    login,
    register,
    logout,
    refreshToken,
    handleUnauthorized,
    loadUser
  }
}