import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'

import type { ApiResponse } from '~/types'
import type { User } from '~/types/users'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  firstname: string
  lastname: string
  invite_id?: string
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
    return TokenManager.authStorage.value?.accessToken || null
  }

  static getRefreshToken(): string | null {
    return TokenManager.authStorage.value?.accessToken || null
  }

  static getExpiresAt(): number {
    return TokenManager.authStorage.value?.expiresAt || 0
  }

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000
    TokenManager.authStorage.value = {
      accessToken,
      refreshToken,
      expiresAt,
    }
  }

  static clearTokens(): void {
    TokenManager.authStorage.value = null
  }

  static isTokenExpired(): boolean {
    const expiresAt = TokenManager.getExpiresAt()
    return Date.now() >= expiresAt - 60000 // 1 minute buffer
  }
}

export function useAuth() {
  const router = useRouter()
  const route = useRoute()
  const { $posthog } = useNuxtApp()
  const { t } = useI18n()

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
        reject(new Error('Token refresh failed: Error: Authentication failed'))
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
      console.error(t('composables.auth.failedToLoadUser') as string, err)
      await logout()
    }
  }

  const handleAuthResponse = async (api: Api, response: AuthResponse, cb: CallableFunction) => {
    if (!response.access_token) {
      throw new Error(t('composables.auth.invalidResponse') as string)
    }
    TokenManager.setTokens(response.access_token, response.refresh_token, response.expires_in)

    api.setAuthToken(response.access_token)

    setupTokenRefresh(response.expires_in)
    await loadUser()
    cb()

    return true
  }

  const requiresTwoFactor = ref(false)
  const pendingLoginPayload = ref<LoginPayload | null>(null)

  const parseErrorResponse = (
    err: any
  ): { status?: number; errorCode?: string; message?: string } => {
    // Handle $fetch error structure which may vary
    const status = err?.status || err?.statusCode || err?.response?.status
    const data = err?.data || err?.response?.data || err?.response?._data
    const errorCode = data?.error_code || data?.code
    const message = data?.message || data?.error || err?.message

    return { status, errorCode, message }
  }

  const login = async (payload: LoginPayload, twoFactorCode?: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { api } = await import('~/api')
      const headers: Record<string, string> = {}

      if (twoFactorCode) {
        headers['X-TOTP-Code'] = twoFactorCode
      }

      const response = await api.client.post<AuthResponse>('/auth/v1/token', payload, { headers })

      requiresTwoFactor.value = false
      pendingLoginPayload.value = null

      return await handleAuthResponse(api, response, () => {
        router.push((route.query.return as string) || '/')
      })
    } catch (err: any) {
      const { status, errorCode, message } = parseErrorResponse(err)

      // Debug logging for 2FA troubleshooting
      if (import.meta.dev) {
        console.log('Login error:', { status, errorCode, message, rawError: err })
      }

      // Check for 2FA required (423 status with TOTP_VERIFICATION_REQUIRED)
      if (status === 423 && errorCode === 'TOTP_VERIFICATION_REQUIRED') {
        requiresTwoFactor.value = true
        pendingLoginPayload.value = payload
        error.value = null
        return false
      }

      // Handle specific error cases
      if (status === 401) {
        error.value = 'Invalid email or password'
      } else if (status === 403 && errorCode === 'INVALID_TOTP_CODE') {
        error.value = 'Invalid authentication code. Please try again.'
      } else if (status === 409 && errorCode === 'EMAIL_NOT_VERIFIED') {
        error.value = 'Please verify your email address before logging in.'
      } else if (message) {
        error.value = message
      } else {
        error.value = 'Login failed. Please try again.'
      }

      return false
    } finally {
      isLoading.value = false
    }
  }

  const verifyTwoFactorAndLogin = async (code: string): Promise<boolean> => {
    if (!pendingLoginPayload.value) {
      error.value = 'Login session expired. Please try again.'
      return false
    }

    return await login(pendingLoginPayload.value, code)
  }

  const cancelTwoFactorLogin = () => {
    requiresTwoFactor.value = false
    pendingLoginPayload.value = null
    error.value = null
  }

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { api } = await import('~/api')
      const response = await api.client.post<AuthResponse>('/auth/v1/register', payload)

      return await handleAuthResponse(api, response, () => {
        router.push((route.query.return as string) || '/')
      })
    } catch (err: any) {
      error.value =
        err?.response?.status === 409
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
          options: {},
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
        refresh_token: refreshTokenValue,
      })

      return await handleAuthResponse(api, response, () => {
        processRequestQueue(true, response.access_token)
      })
    } catch (err: any) {
      processRequestQueue(false)

      error.value = t('composables.auth.sessionExpired') as string
      console.error(t('composables.auth.tokenRefreshFailed') as string, err)
      await logout()

      return false
    } finally {
      isRefreshing.value = false
    }
  }

  const handleUnauthorized = async (endpoint: string, options: any): Promise<any> => {
    if (endpoint.includes('/auth/v1/token')) {
      error.value = t('composables.auth.sessionExpired') as string
      await logout()
      throw new Error(t('composables.auth.tokenRefreshFailed') as string)
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

    throw new Error(t('composables.auth.tokenRefreshFailed') as string)
  }

  const logout = async (returnPath?: string): Promise<void> => {
    try {
      const refreshTokenValue = TokenManager.getRefreshToken()
      if (refreshTokenValue) {
        const { api } = await import('~/api')
        await api.client
          .post('/auth/v1/logout', {
            refresh_token: refreshTokenValue,
          })
          .catch(() => {
            /** ignore */
          })
      }
    } catch (err) {
      /** ignore */
    }

    user.value = null
    error.value = null

    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
      refreshTimer.value = null
    }

    TokenManager.clearTokens()
    const { api } = await import('~/api')
    api.setAuthToken(undefined)

    if (route.fullPath.startsWith('/login')) {
      return Promise.resolve()
    }

    navigateTo({
      name: 'login',
      query: { return: returnPath || route.query.return || route.fullPath || '/' },
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
    requiresTwoFactor: readonly(requiresTwoFactor),

    login,
    verifyTwoFactorAndLogin,
    cancelTwoFactorLogin,
    register,
    logout,
    refreshToken,
    handleUnauthorized,
    loadUser,
  }
}
