import { api } from '@/api'
import type { ApiClient } from '~/api/client'

const apiClient = useState<ApiClient>('apiClient', () => {
  return api.client
})
export function useApiClient() {
  return {
    client: apiClient.value
  }
}