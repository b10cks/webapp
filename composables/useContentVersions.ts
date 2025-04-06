import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { ContentVersionsQueryParams } from '~/api/resources/content-versions'
import { api } from '~/api'
import { queryKeys } from './useQueryClient'
import { toast } from 'vue-sonner'

export function useContentVersions(
  spaceIdRef: MaybeRefOrComputed<string>,
  contentIdRef: MaybeRefOrComputed<string>
) {
  const queryClient = useQueryClient()

  const spaceId = computed(() => unref(spaceIdRef))
  const contentId = computed(() => unref(contentIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))
  const versionsAPI = computed(() => spaceAPI.value.contentVersions(contentId.value))

  const useContentVersionsQuery = (paramsRef: MaybeRefOrComputed<ContentVersionsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.contentVersions(spaceId.value, contentId.value).list(params.value)),
      queryFn: async () => {
        const response = await versionsAPI.value.index({
          ...params.value,
          sort: '-created_at',
        })
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!contentId.value),
    })
  }

  const useContentVersionQuery = (versionIdRef: MaybeRefOrComputed<string>) => {
    const versionId = computed(() => unref(versionIdRef))

    return useQuery({
      queryKey: computed(() => queryKeys.contentVersions(spaceId.value, contentId.value).detail(versionId.value)),
      queryFn: async () => {
        const response = await versionsAPI.value.get(versionId.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!contentId.value && !!versionId.value),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).detail(data.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).detail(contentId.value) })
        toast.success('Version set as current successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to set version as current: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateVersionMutation = () => {
    return useMutation({
      mutationFn: async ({id, payload }: {
        id: string
        payload: never
      }) => {
        const response = await versionsAPI.value.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).detail(data.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).detail(contentId.value) })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentVersions(spaceId.value, contentId.value).detail(data.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).detail(contentId.value) })
        toast.success('Version published successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to publish version: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Helper to find the current version
  const useCurrentVersion = () => {
    const { data: versions, isLoading, error } = useContentVersionsQuery()

    const currentVersion = computed(() => {
      if (!versions.value) return null
      return versions.value.find(v => v.isCurrentVersion) || null
    })

    return {
      currentVersion,
      isLoading,
      error,
    }
  }

  const usePublishedVersion = () => {
    const { data: versions, isLoading, error } = useContentVersionsQuery()

    const publishedVersion = computed(() => {
      if (!versions.value) return null
      return versions.value.find(v => v.isPublished) || null
    })

    return {
      publishedVersion,
      isLoading,
      error,
    }
  }


  return {
    // Queries
    useContentVersionsQuery,
    useContentVersionQuery,

    // Helpers
    useCurrentVersion,
    usePublishedVersion,

    // Mutations
    useUpdateVersionMutation,
    useSetCurrentVersionMutation,
    usePublishVersionMutation,
  }
}