import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from './useQueryClient'
import { toast } from 'vue-sonner'
import { api } from '~/api'
import type { SpaceQueryParams } from '~/api/resources/spaces'
import type { MaybeRefOrGetter } from '@vue/reactivity'

export function useSpaces() {
  const queryClient = useQueryClient()

  const useSpacesQuery =  (params: MaybeRefOrGetter<SpaceQueryParams>) => {
    return useQuery({
      queryKey: queryKeys.spaces.list(params),
      queryFn: async () => {
        const response = await api.spaces.index({
          sort: '+name',
          ...toValue(params),
        })
        return response.data
      },
    })
  }

  const useSpaceQuery = (id: string) => {
    return useQuery({
      queryKey: queryKeys.spaces.detail(id),
      queryFn: async () => {
        const response = await api.spaces.get(id)
        return response.data
      },
      enabled: !!id,
    })
  }

  const useCreateSpaceMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateSpacePayload) => {
        const response = await api.spaces.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
        toast.success(`Space "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create space: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateSpaceMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload, }: {
        id: string
        payload: UpdateSpacePayload
      }) => {
        const response = await api.spaces.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.detail(data.id) })
        toast.success(`Space "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update space: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteSpaceMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await api.spaces.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
        queryClient.removeQueries({ queryKey: queryKeys.spaces.detail(id) })
        toast.success(`Space deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete space: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useArchiveSpaceMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await api.spaces.archive(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
        queryClient.removeQueries({ queryKey: queryKeys.spaces.detail(id) })
        toast.success(`Space archived successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to archive space: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useSpacesQuery: useSpacesQuery,
    useSpaceQuery: useSpaceQuery,
    useCurrentSpaceQuery() {
      const route = useRoute()
      const spaceId = route.params?.space as string || null
      if (!spaceId) {
        return { data: null }
      }

      return useSpaceQuery(spaceId as string)
    },

    // Mutations
    useCreateSpaceMutation,
    useUpdateSpaceMutation,
    useArchiveSpaceMutation,
    useDeleteSpaceMutation,
  }
}