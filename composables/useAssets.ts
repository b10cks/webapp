import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useDebounceFn } from '@vueuse/core'
import type { AssetsQueryParams } from '~/api/resources/assets'
import { toast } from 'vue-sonner'
import { api } from '~/api'
import { queryKeys } from './useQueryClient'
import type { MaybeRefOrComputed } from '~/types'

export function useAssets(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()

  const spaceId = computed(() => unref(spaceIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))
  const apiClient = useApiClient()
  const error = ref<string | null>(null)

  const useAssetsQuery = (paramsRef: MaybeRefOrComputed<AssetsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.assets(spaceId.value).list(params.value)),
      queryFn: async () => {
        return await spaceAPI.value.assets.index({
          sort: '+created_at',
          ...params.value,
        })
      },
      enabled: computed(() => !!spaceId.value), // Only run query if spaceId is provided
    })
  }

  const useAssetQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.assets(spaceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.assets.get(id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!id.value),
    })
  }

  /**
   * Upload a new asset
   */
  const uploadAsset = async (
    payload: UploadAssetPayload,
    onProgress?: (progress: number) => void
  ): Promise<AssetResource | null> => {
    const debouncedInvalidateQueries = useDebounceFn(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId.value).lists() })
      toast.success(`Assets uploaded successfully`)
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', payload.file)

      if (payload.folder_id) {
        formData.append('folder_id', payload.folder_id)
      }
      if (payload.tags) {
        formData.append('tags', JSON.stringify(payload.tags))
      }
      if (payload.data) {
        formData.append('data', JSON.stringify(payload.data))
      }

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const promise = new Promise<AssetResource | null>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            onProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              const assetData = response.data

              if (assetData) {
                debouncedInvalidateQueries()
                resolve(assetData)
              } else {
                resolve(null)
              }
            } catch (_) {
              reject(new Error('Failed to parse server response'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'))
        })

        const apiBaseUrl = ''
        const authToken = apiClient.getAuthToken() || ''

        xhr.open('POST', `${apiBaseUrl}/mgmt/v1/spaces/${spaceId.value}/assets`)

        // Set headers
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
          xhr.setRequestHeader('accept', 'application/json')
        }
        xhr.send(formData)
      })

      return await promise
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload asset'
      return null
    } finally {
      // isLoading.value = false
    }
  }


  const useUpdateAssetMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload, }: {
        id: string
        payload: UpdateAssetPayload
      }) => {
        const response = await spaceAPI.value.assets.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId.value).detail(data.id) })
        toast.success(`Asset updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update asset: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteAssetMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.assets.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId.value).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.assets(spaceId.value).detail(id) })
        toast.success(`Asset deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete asset: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // State
    error,

    // Queries
    useAssetQuery,
    useAssetsQuery,

    // Mutations
    useUpdateAssetMutation,
    useDeleteAssetMutation,
    uploadAsset,
  }
}