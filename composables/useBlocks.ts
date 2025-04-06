import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import type { BlocksQueryParams } from '~/api/resources/blocks'
import { api } from '~/api'
import { queryKeys } from './useQueryClient'
import type { MaybeRefOrComputed } from '~/types'

export function useBlocks(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()
  const spaceId = computed(() => unref(spaceIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  const useBlocksQuery = (paramsRef: MaybeRefOrComputed<BlocksQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))
    return useQuery({
      queryKey: computed(() => queryKeys.blocks(spaceId.value).list(params.value)),
      queryFn: async () => {
        return await spaceAPI.value.blocks.index({
          sort: '+slug',
          ...params.value,
        })
      },
      enabled: computed(() => !!spaceId.value),
    })
  }

  const useBlockQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.blocks(spaceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.blocks.get(id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!id.value),
    })
  }

  const useBlockBySlugQuery = (slugRef: MaybeRefOrComputed<string>) => {
    const slug = computed(() => unref(slugRef))
    const { data: blocks, isLoading } = useBlocksQuery()

    // Find block by slug
    const block = computed(() => {
      if (!blocks.value) return null
      return blocks.value.find(b => b.slug === slug.value) || null
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
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId.value).lists() })
        toast.success(`Block "${data.slug}" created successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to create block: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateBlockMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload, }: {
        id: string
        payload: UpdateBlockPayload
      }) => {
        const response = await spaceAPI.value.blocks.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        // Invalidate the blocks list and the specific block detail
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId.value).detail(data.id) })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId.value).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.blocks(spaceId.value).detail(id) })
        toast.success(`Block deleted successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to delete block: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const getBlockBySlug = (blocksRef: MaybeRefOrComputed<BlockResource[] | undefined>, slugRef: MaybeRefOrComputed<string>) => {
    const blocks = unref(blocksRef)
    const slug = slugRef

    if (!blocks) return []
    return blocks.data.find(block => block.slug == slug)
  }

  const getBlockById = (blocksRef: MaybeRefOrComputed<BlockResource[] | undefined>, idRef: MaybeRefOrComputed<string>) => {
    const blocks = unref(blocksRef)
    const id = idRef

    if (!blocks) return []
    return blocks.data.find(block => block.id == id)
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