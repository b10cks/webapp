import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { ContentVersionsQueryParams } from '~/api/resources/content-versions'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useContentVersions(spaceId: MaybeRef<string>, contentId: MaybeRef<string>) {
  const queryClient = useQueryClient()

  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))
  const versionsAPI = computed(() => spaceAPI.value.contentVersions(toValue(contentId)))

  const useContentVersionsQuery = (params: MaybeRef<ContentVersionsQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.contentVersions(spaceId, contentId).list(params)),
      queryFn: async () => {
        const response = await versionsAPI.value.index({
          ...toValue(params),
          sort: '-created_at',
        })
        return response.data
      },
    })
  }

  const useContentVersionQuery = (versionId: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.contentVersions(spaceId, contentId).detail(versionId)),
      queryFn: async () => {
        const response = await versionsAPI.value.get(toValue(versionId))
        return response.data
      },
    })
  }

  // Mutation to set a version as the current version
  const useSetCurrentVersionMutation = () => {
    return useMutation({
      mutationFn: async (versionId: string) => {
        await versionsAPI.value.current(versionId)
        return { id: versionId }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).detail(data.id),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId).detail(contentId),
        })
        toast.success('Version set as current successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to set version as current: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateVersionMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: never }) => {
        const response = await versionsAPI.value.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).detail(data.id),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId).detail(contentId),
        })
        toast.success('Version set as current successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to set version as current: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Mutation to publish a version
  const usePublishVersionMutation = () => {
    return useMutation({
      mutationFn: async (versionId: string) => {
        await versionsAPI.value.publish(versionId)
        return { id: versionId }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId, contentId).detail(data.id),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId).detail(contentId),
        })
        toast.success('Version published successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to publish version: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useContentVersionsQuery,
    useContentVersionQuery,

    // Mutations
    useUpdateVersionMutation,
    useSetCurrentVersionMutation,
    usePublishVersionMutation,
  }
}
