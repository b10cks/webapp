import { api } from '~/api'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '~/types'
import type { User } from '~/types/users'

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
}

export function useAuth() {
  const router = useRouter()
  const { $queryClient, $posthog } = useNuxtApp()

  const user = useState<User>('auth_user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Token management
  const tokenExpiresAt = useState<number>('token_expires_at', () => 0)
  const refreshTimerId = useState<NodeJS.Timeout | null>('token_refresh_timer', () => null)
  const isRefreshing = ref(false)
  const failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = []

  // Process the queued requests after token refresh
  const processQueue = (error: Error | null) => {
    failedQueue.forEach(request => {
      if (error) {
        request.reject(error)
      } else {
        request.resolve(null)
      }
    })

    failedQueue.length = 0
  }

  // Set up the automatic token refresh
  const setupTokenRefresh = (expiresIn: number) => {
    if (import.meta.client) {
      // Clear any existing timer
      if (refreshTimerId.value) {
        clearTimeout(refreshTimerId.value)
      }

      // Store the expiration time
      const expiryTime = Date.now() + expiresIn * 1000
      tokenExpiresAt.value = expiryTime
      localStorage.setItem('tokenExpiresAt', expiryTime.toString())

      // Set up the refresh timer (refresh 1 minute before expiration)
      const refreshDelay = Math.max(expiresIn - 60, 0) * 1000
      refreshTimerId.value = setTimeout(() => {
        refreshToken()
      }, refreshDelay)
    }
  }

  const loadUser = async (force: boolean = false) => {
    if (user.value && !force) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await api.client.get<ApiResponse<User>>('/mgmt/v1/users/me')
      user.value = response.data

    } catch (err) {
      logout()
      error.value = err?.message || 'Failed to load user information'
    } finally {
      isLoading.value = false
    }
  }

  const login = async (payload: LoginPayload) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.client.post<LoginResponse>('/auth/v1/token', payload)

      if (import.meta.client && response.access_token) {
        localStorage.setItem('authToken', response.access_token)
        api.setAuthToken(response.access_token)
        setupTokenRefresh(response.expires_in)
        await loadUser()
      }

      router.push('/')
      return true
    } catch (err: any) {
      error.value = 'Login failed. Please check your credentials.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = async (forceReload: boolean = false): Promise<boolean> => {
    if (isRefreshing.value) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => true).catch(() => false)
    }

    isRefreshing.value = true
    error.value = null

    try {
      const response = await api.client.post<LoginResponse>('/auth/v1/token/refresh')

      if (import.meta.client && response.access_token) {
        localStorage.setItem('authToken', response.access_token)
        api.setAuthToken(response.access_token)
        setupTokenRefresh(response.expires_in)

        if (forceReload) {
          await loadUser()
        }
      }

      processQueue(null)
      return true
    } catch (err: any) {
      // Check if refresh token has expired (401 on refresh endpoint)
      if (err?.response?.status === 401) {
        error.value = 'Your session has expired. Please log in again.'
        processQueue(new Error('Refresh token expired'))

        // Clear refresh token related data but don't call logout() to avoid redirect loop
        if (refreshTimerId.value) {
          clearTimeout(refreshTimerId.value)
          refreshTimerId.value = null
        }

        if (import.meta.client) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('tokenExpiresAt')
        }

        api.setAuthToken(undefined)
        $queryClient.clear()

        // Navigate to login with a specific message
        router.push({ name: 'login', query: { message: 'session_expired' } })
        return false
      }

      // For other errors, treat as temporary failure
      error.value = err?.message || 'Failed to refresh token'
      processQueue(new Error('Failed to refresh token'))

      await logout()
      return false
    } finally {
      isRefreshing.value = false
    }
  }

  const logout = async (returnPath?: string | undefined) => {
    user.value = null

    if (refreshTimerId.value) {
      clearTimeout(refreshTimerId.value)
      refreshTimerId.value = null
    }

    if (import.meta.client) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('tokenExpiresAt')
    }

    api.setAuthToken(undefined)
    $queryClient.clear()

    router.push({ name: 'login', query: { return: returnPath || '/' } })
  }

  const initAuth = async () => {
    if (import.meta.client) {
      const token = localStorage.getItem('authToken')
      const expiryTimeStr = localStorage.getItem('tokenExpiresAt')

      if (token) {
        api.setAuthToken(token)

        if (expiryTimeStr) {
          const expiryTime = parseInt(expiryTimeStr, 10)
          tokenExpiresAt.value = expiryTime

          if (Date.now() >= expiryTime - 60000) {
            await refreshToken()
          } else {
            const remainingTime = expiryTime - Date.now()
            setupTokenRefresh(remainingTime / 1000)
          }
        } else {
          await refreshToken()
        }

        await loadUser().then(() => {
          if (user.value && $posthog) {
            $posthog().identify(user.value.id, {
              email: user.value.email,
              name: `${user.value.firstname} ${user.value.lastname}`,
            })
          }
        })
      }
    }
  }

  if (import.meta.client) {
    const originalRequest = api.client.request.bind(api.client)
    api.client.request = async function (endpoint, options = {}) {
      try {
        return await originalRequest(endpoint, options)
      } catch (error: any) {
        if (error?.response?.status === 401 && !endpoint.includes('/auth/v1/token/refresh')) {
          const isRefreshed = await refreshToken()

          if (isRefreshed) {
            return await originalRequest(endpoint, options)
          }
        }

        throw error
      }
    }
  }

  onMounted(() => {
    initAuth()
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    error,

    login,
    logout,
    loadUser,
    refreshToken
  }
}