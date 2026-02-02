import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { BlockTagsQueryParams, UpsertBlockTagPayload } from '~/api/resources/block-tags'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useBlockTags(spaceId: MaybeRef<string>) {
  const queryClient = useQueryClient()
  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))

  const useBlockTagsQuery = (params: MaybeRef<BlockTagsQueryParams> = {}) => {
    return useQuery({
      queryKey: queryKeys.blockTags(spaceId).list(params),
      queryFn: async () => {
        return await spaceAPI.value.blockTags.index({
          sort: '+name',
          ...toValue(params),
        })
      },
    })
  }

  const useBlockTagQuery = (tagNameRef: string) => {
    const tagName = computed(() => unref(tagNameRef))

    return useQuery({
      queryKey: queryKeys.blockTags(spaceId).detail(tagName.value),
      queryFn: async () => {
        const response = await spaceAPI.value.blockTags.get(tagName.value)
        return response.data
      },
      enabled: computed(() => !!tagName.value),
    })
  }

  const useCreateBlockTagMutation = () => {
    return useMutation({
      mutationFn: async (payload: UpsertBlockTagPayload) => {
        const response = await spaceAPI.value.blockTags.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Tag "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateBlockTagMutation = () => {
    return useMutation({
      mutationFn: async ({
        tagName,
        payload,
      }: {
        tagName: string
        payload: UpsertBlockTagPayload
      }) => {
        const response = await spaceAPI.value.blockTags.update(tagName, payload)
        return response.data
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockTags(spaceId).detail(variables.tagName),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).detail(data.name) })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Tag "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteBlockTagMutation = () => {
    return useMutation({
      mutationFn: async (tagName: string) => {
        await spaceAPI.value.blockTags.delete(tagName)
        return tagName
      },
      onSuccess: (tagName) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.blockTags(spaceId).detail(tagName) })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Tag deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete tag: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    useBlockTagsQuery,
    useBlockTagQuery,

    useCreateBlockTagMutation,
    useUpdateBlockTagMutation,
    useDeleteBlockTagMutation,
  }
}
