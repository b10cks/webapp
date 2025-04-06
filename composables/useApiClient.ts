import { ApiClient } from '@/api/client'

export function useApiClient() {
  const apiClient = useState<ApiClient>('apiClient', () => {
    const config = useRuntimeConfig()
    let authToken: string | undefined

    if (import.meta.client) {
      authToken = localStorage.getItem('authToken') || undefined
    }

    return new ApiClient({
      baseURL: (config.public.apiBase || '/') as string,
      authToken,
    })
  })

  const setAuthToken = (token?: string) => {
    if (token) {
      if (import.meta.client) {
        localStorage.setItem('authToken', token)
      }
    } else {
      if (import.meta.client) {
        localStorage.removeItem('authToken')
      }
    }

    apiClient.value.setAuthToken(token)
  }

  const getAuthToken = () => {
    if (import.meta.client) {
      return localStorage.getItem('authToken')
    }
    return undefined
  }

  return {
    client: apiClient.value,
    setAuthToken,
    getAuthToken
  }
}