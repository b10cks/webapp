import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from './useQueryClient'
import { toast } from 'vue-sonner'

import { api } from '~/api'
import type { BlockTagsQueryParams, UpsertBlockTagPayload } from '~/api/resources/block-tags'
import type { MaybeRefOrComputed } from '~/types'

export function useBlockTags(spaceId: string) {
  const queryClient = useQueryClient()
  const spaceAPI = api.forSpace(spaceId)

  const useBlockTagsQuery = (paramsRef: MaybeRefOrComputed<BlockTagsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: queryKeys.blockTags(spaceId).list(params.value),
      queryFn: async () => {
        return await spaceAPI.blockTags.index({
          sort: '+name',
          ...params.value,
        })
      },
    })
  }

  const useBlockTagQuery = (tagNameRef: string) => {
    const tagName = computed(() => unref(tagNameRef))

    return useQuery({
      queryKey: queryKeys.blockTags(spaceId).detail(tagName.value),
      queryFn: async () => {
        const response = await spaceAPI.blockTags.get(tagName.value)
        return response.data
      },
      enabled: computed(() =>!!tagName.value),
    })
  }

  const useCreateBlockTagMutation = () => {
    return useMutation({
      mutationFn: async (payload: UpsertBlockTagPayload) => {
        const response = await spaceAPI.blockTags.create(payload)
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
                           payload
                         }: {
        tagName: string
        payload: UpsertBlockTagPayload
      }) => {
        const response = await spaceAPI.blockTags.update(tagName, payload)
        return response.data
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blockTags(spaceId).detail(variables.tagName) })
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
        await spaceAPI.blockTags.delete(tagName)
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