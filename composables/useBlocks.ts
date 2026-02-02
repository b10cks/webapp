import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { BlocksQueryParams } from '~/api/resources/blocks'
import type { ApiResponse } from '~/types'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useBlocks(spaceId: MaybeRef<string>) {
  const queryClient = useQueryClient()
  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))

  const useBlocksQuery = (params: MaybeRef<BlocksQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.blocks(spaceId).list(params)),
      queryFn: async () => {
        return await spaceAPI.value.blocks.index({
          sort: '+slug',
          ...toValue(params),
        })
      },
      enabled: computed(() => !!toValue(spaceId)),
    })
  }

  const useBlockQuery = (id: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.blocks(spaceId).detail(id)),
      queryFn: async () => {
        const response = await spaceAPI.value.blocks.get(toValue(id))
        return response.data
      },
    })
  }

  const useBlockBySlugQuery = (slug: MaybeRef<string>) => {
    const { data: blocks, isLoading } = useBlocksQuery()

    // Find block by slug
    const block = computed(() => {
      if (!blocks.value?.data) return null
      return blocks.value.data.find((b) => b.slug === toValue(slug)) || null
    })

    return {
      block,
      isLoading,
    }
  }

  const useCreateBlockMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateBlockPayload) => {
        const response = await spaceAPI.value.blocks.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Block "${data.slug}" created successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to create block: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateBlockMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateBlockPayload }) => {
        const response = await spaceAPI.value.blocks.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        // Invalidate the blocks list and the specific block detail
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).detail(data.id) })
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockVersions(spaceId, data.id).lists(),
        })

        toast.success(`Block "${data.slug}" updated successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to update block: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteBlockMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.blocks.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.blocks(spaceId).detail(id) })
        toast.success(`Block deleted successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to delete block: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const getBlockBySlug = (
    blocksRef: ApiResponse<BlockResource[] | undefined>,
    slugRef: MaybeRef<string>
  ) => {
    const blocks = unref(blocksRef)
    const slug = slugRef

    if (!blocks) return null
    return blocks.data.find((block) => block.slug == slug)
  }

  const getBlockById = (
    blocksRef: ApiResponse<BlockResource[] | undefined>,
    idRef: MaybeRef<string>
  ) => {
    const blocks = unref(blocksRef)
    const id = idRef

    if (!blocks) return null
    return blocks.data.find((block) => block.id == id)
  }

  return {
    // Queries
    useBlocksQuery,
    useBlockQuery,
    useBlockBySlugQuery,

    // Filters
    getBlockById,
    getBlockBySlug,

    // Mutations
    useCreateBlockMutation,
    useUpdateBlockMutation,
    useDeleteBlockMutation,
  }
}
