import { api } from '@/api'
import type { ApiClient } from '~/api/client'

export function useApiClient() {
  const apiClient = useState<ApiClient>('apiClient', () => {
    return api.client
  })

  return {
    client: apiClient.value
  }
}