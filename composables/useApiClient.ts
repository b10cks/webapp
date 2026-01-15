import type { ApiClient } from '~/api/client'

import { api } from '@/api'

export function useApiClient() {
  const apiClient = useState<ApiClient>('apiClient', () => {
    return api.client
  })

  return {
    client: apiClient.value,
  }
}
