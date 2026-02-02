import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'

import type { AssetsQueryParams } from '~/api/resources/assets'
import type {
  AssetResource,
  ExportTypes,
  UpdateAssetPayload,
  UploadAssetPayload,
} from '~/types/assets'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useAssets(spaceId: MaybeRef<string>) {
  const queryClient = useQueryClient()

  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))
  const { client: apiClient } = useApiClient()
  const error = ref<string | null>(null)

  const useAssetsQuery = (params: MaybeRef<AssetsQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.assets(spaceId).list(params)),
      queryFn: async () => {
        return await spaceAPI.value.assets.index({
          sort: '+created_at',
          ...toValue(params),
        })
      },
    })
  }

  const useAssetQuery = (id: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.assets(spaceId).detail(id)),
      queryFn: async () => {
        const response = await spaceAPI.value.assets.get(toValue(id))
        return response.data
      },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId).lists() })
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
        const authToken = apiClient.getAuthHeaders()['Authorization']?.replace('Bearer ', '') || ''

        xhr.open('POST', `${apiBaseUrl}/mgmt/v1/spaces/${toValue(spaceId)}/assets`)

        // Set headers
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
          xhr.setRequestHeader('accept', 'application/json')
        }
        xhr.send(formData)
      })

      return await promise
    } catch (err) {
      console.error(err)
      error.value = err instanceof Error ? err.message : 'Failed to upload asset'
      return null
    } finally {
      // isLoading.value = false
    }
  }

  const useUpdateAssetMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateAssetPayload }) => {
        const response = await spaceAPI.value.assets.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId).detail(data.id) })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.assets(spaceId).detail(id) })
        toast.success(`Asset deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete asset: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useExportAssetsMutation = () => {
    return useMutation({
      mutationFn: async (params: AssetsQueryParams & { as: ExportTypes }) => {
        return await spaceAPI.value.assets.export(params)
      },
      onError: (error: Error) => {
        toast.error(`Failed to export assets: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useImportAssetsMutation = () => {
    return useMutation({
      mutationFn: async (file: File) => {
        return await spaceAPI.value.assets.import(file)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId).lists() })
        toast.success(`Assets imported successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to import assets: ${error.message || 'Unknown error'}`)
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
    useExportAssetsMutation,
    useImportAssetsMutation,
    uploadAsset,
  }
}
