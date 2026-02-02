import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type {
  AssignVersionsRequest,
  CreateReleaseRequest,
  Release,
  ReleaseState,
  UpdateReleaseRequest,
} from '~/types/releases'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useReleases(spaceId: MaybeRef<string>) {
  const queryClient = useQueryClient()
  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))

  const useReleasesQuery = (params: MaybeRef<any> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.releases(spaceId).list(params)),
      queryFn: async () => {
        const response = await spaceAPI.value.releases.index(toValue(params))
        return response.data
      },
    })
  }

  const useReleaseQuery = (id: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.releases(spaceId).detail(id)),
      queryFn: async () => {
        const response = await spaceAPI.value.releases.getDetail(toValue(id))
        return response.data
      },
    })
  }

  const useCreateReleaseMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateReleaseRequest) => {
        const response = await spaceAPI.value.releases.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })

        toast.success(`Release "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateReleaseMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateReleaseRequest }) => {
        const response = await spaceAPI.value.releases.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        toast.success(`Release "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useCommitReleaseMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await spaceAPI.value.releases.commit(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        toast.success(`Release "${data.name}" committed successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to commit release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useCancelReleaseMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await spaceAPI.value.releases.cancel(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        toast.success(`Release "${data.name}" cancelled successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to cancel release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const usePublishReleaseMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await spaceAPI.value.releases.publish(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        toast.success(`Release "${data.name}" published successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to publish release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteReleaseMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.releases.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.releases(spaceId).detail(id) })

        toast.success(`Release deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete release: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useAssignVersionsMutation = () => {
    return useMutation({
      mutationFn: async ({
        releaseId,
        payload,
      }: {
        releaseId: string
        payload: AssignVersionsRequest
      }) => {
        const response = await spaceAPI.value.releases.assignVersions(releaseId, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        const versionCount = (data as any).versions?.length || 1
        toast.success(`${versionCount} version(s) added to release "${data.name}"`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to assign versions: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useRemoveVersionsMutation = () => {
    return useMutation({
      mutationFn: async ({
        releaseId,
        payload,
      }: {
        releaseId: string
        payload: AssignVersionsRequest
      }) => {
        const response = await spaceAPI.value.releases.removeVersions(releaseId, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.releases(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.releases(spaceId).detail(data.id),
        })

        toast.success(`Version(s) removed from release "${data.name}"`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to remove versions: ${error.message || 'Unknown error'}`)
      },
    })
  }

  function getReleaseState(release: Release): ReleaseState {
    if (release.published_at) {
      return 'published'
    }

    if (!release.committed_at) {
      return 'draft'
    }

    const publishAt = new Date(release.publish_at)
    const now = new Date()

    return publishAt <= now ? 'pending' : 'scheduled'
  }

  return {
    // Queries
    useReleasesQuery,
    useReleaseQuery,
    getReleaseState,

    // Mutations
    useCreateReleaseMutation,
    useUpdateReleaseMutation,
    useCommitReleaseMutation,
    useCancelReleaseMutation,
    usePublishReleaseMutation,
    useDeleteReleaseMutation,
    useAssignVersionsMutation,
    useRemoveVersionsMutation,
  }
}
