import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { CreateTokenRequest, TokenQueryParams } from '~/api/resources/tokens'
import { api } from '~/api'
import { queryKeys } from './useQueryClient'
import { toast } from 'vue-sonner'

export function useTokens(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()
  const spaceId = computed(() => unref(spaceIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  const useTokensQuery = (paramsRef: MaybeRefOrComputed<TokenQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.tokens(spaceId.value).list(params.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.tokens.index({
          ...params.value,
          sort: '+name', // Default sorting
        })
        return response.data
      },
      enabled: computed(() => !!spaceId.value), // Only run query if spaceId is provided
    })
  }

  // Mutation to create a token
  const useCreateTokenMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateTokenRequest) => {
        const response = await spaceAPI.value.tokens.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        // Invalidate the tokens list query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.tokens(spaceId.value).lists() })
        toast.success(`Token "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create token: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Mutation to delete a token
  const useDeleteTokenMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.tokens.delete(id)
        return id
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tokens(spaceId.value).lists() })
        toast.success(`Token deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete token: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useTokensQuery,

    // Mutations
    useCreateTokenMutation,
    useDeleteTokenMutation,
  }
}