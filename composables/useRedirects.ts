import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { RedirectsQueryParams } from '~/api/resources/redirects'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useRedirects(spaceId: MaybeRef<string>) {
  const queryClient = useQueryClient()

  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))

  const useRedirectsQuery = (params: MaybeRef<RedirectsQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.redirects(spaceId).list(params)),
      queryFn: async () => {
        const response = await spaceAPI.value.redirects.index({
          sort: 'source',
          ...toValue(params),
        })
        return response
      },
    })
  }

  const useRedirectQuery = (id: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.redirects(spaceId).detail(id)),
      queryFn: async () => {
        const response = await spaceAPI.value.redirects.get(toValue(id))
        return response.data
      },
    })
  }

  const useCreateRedirectMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateRedirectPayload) => {
        const response = await spaceAPI.value.redirects.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.redirects(spaceId).lists() })
        toast.success(`Redirect "${data.source}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create redirect: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateRedirectMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateRedirectPayload }) => {
        const response = await spaceAPI.value.redirects.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.redirects(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.redirects(spaceId).detail(data.id),
        })
        toast.success(`Redirect "${data.source}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update redirect: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteRedirectMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.redirects.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.redirects(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.redirects(spaceId).detail(id) })
        toast.success(`Redirect deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete redirect: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useResetRedirectStatsMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await spaceAPI.value.redirects.reset(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.redirects(spaceId).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.redirects(spaceId).detail(data.id),
        })
        toast.success(`Statistics for redirect "${data.source}" reset successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to reset redirect statistics: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useRedirectsQuery,
    useRedirectQuery,

    // Mutations
    useCreateRedirectMutation,
    useUpdateRedirectMutation,
    useDeleteRedirectMutation,
    useResetRedirectStatsMutation,
  }
}
