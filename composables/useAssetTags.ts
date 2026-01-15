import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { AssetTagsQueryParams } from '~/api/resources/asset-tags'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useAssetTags(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()

  const spaceId = computed(() => unref(spaceIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  const useAssetTagsQuery = (paramsRef: MaybeRefOrComputed<AssetTagsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.assetTags(spaceId.value).list(params.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.assetTags.index({
          ...params.value,
          sort: '+name', // Default sorting
        })
        return response.data
      },
      enabled: computed(() => !!spaceId.value), // Only run query if spaceId is provided
    })
  }

  // Query to fetch a single asset tag
  const useAssetTagQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.assetTags(spaceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.assetTags.get(id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!id.value), // Only run query if both IDs are provided
    })
  }

  // Mutation to create an asset tag
  const useCreateAssetTagMutation = () => {
    return useMutation({
      mutationFn: async (payload: UpsertAssetTagPayload) => {
        const response = await spaceAPI.value.assetTags.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        // Invalidate the asset tags list query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.assetTags(spaceId.value).lists() })
        toast.success(`Tag "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Mutation to update an asset tag
  const useUpdateAssetTagMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpsertAssetTagPayload }) => {
        const response = await spaceAPI.value.assetTags.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        // Invalidate the asset tags list and the specific tag detail
        queryClient.invalidateQueries({ queryKey: queryKeys.assetTags(spaceId.value).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.assetTags(spaceId.value).detail(data.id),
        })
        toast.success(`Tag "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Mutation to delete an asset tag
  const useDeleteAssetTagMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.assetTags.delete(id)
        return id
      },
      onSuccess: (id) => {
        // Invalidate the asset tags list and remove the deleted tag from cache
        queryClient.invalidateQueries({ queryKey: queryKeys.assetTags(spaceId.value).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.assetTags(spaceId.value).detail(id) })
        // Also invalidate assets that might have used this tag
        queryClient.invalidateQueries({ queryKey: queryKeys.assets(spaceId.value).lists() })
        toast.success(`Tag deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Helper to find a tag by slug
  const useTagBySlug = (slugRef: MaybeRefOrComputed<string>) => {
    const slug = computed(() => unref(slugRef))
    const { data: tags, isLoading } = useAssetTagsQuery({})

    const tag = computed(() => {
      if (!tags.value) return null
      return tags.value.find((t) => t.slug === slug.value) || null
    })

    return {
      tag,
      isLoading,
    }
  }

  // Query to fetch assets for a specific tag
  const useAssetsForTagQuery = (tagIdRef: MaybeRefOrComputed<string>) => {
    const tagId = computed(() => unref(tagIdRef))

    return useQuery({
      queryKey: computed(() => [...queryKeys.assets(spaceId.value).lists(), { tag: tagId.value }]),
      queryFn: async () => {
        const response = await spaceAPI.value.assets.index({
          tags: [tagId.value],
        })
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!tagId.value),
    })
  }

  return {
    // Queries
    useAssetTagsQuery,
    useAssetTagQuery,
    useAssetsForTagQuery,

    // Helpers
    useTagBySlug,

    // Mutations
    useCreateAssetTagMutation,
    useUpdateAssetTagMutation,
    useDeleteAssetTagMutation,
  }
}
