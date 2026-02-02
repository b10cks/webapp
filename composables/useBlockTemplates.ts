import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { BlockTemplatesQueryParams } from '~/api/resources/block-templates'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useBlockTemplates(spaceId: MaybeRef<string>, blockId: MaybeRef<string>) {
  const queryClient = useQueryClient()
  const spaceAPI = computed(() => api.forSpace(toValue(spaceId)))
  const templatesAPI = computed(() => spaceAPI.value.blockTemplates(toValue(blockId)))

  const useBlockTemplatesQuery = (params: MaybeRef<BlockTemplatesQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.blockTemplates(spaceId, blockId).list(params)),
      queryFn: async () => {
        const response = await templatesAPI.value.index({
          sort: '-created_at',
          ...toValue(params),
        })
        return response.data
      },
    })
  }

  const useBlockTemplateQuery = (templateId: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.blockTemplates(spaceId, blockId).detail(templateId)),
      queryFn: async () => {
        const response = await templatesAPI.value.get(toValue(templateId))
        return response.data
      },
    })
  }

  const useCreateBlockTemplateMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateBlockTemplatePayload) => {
        const response = await templatesAPI.value.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockTemplates(spaceId, blockId).lists(),
        })
        toast.success(`Template "${data.name}" created successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to create template: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateBlockTemplateMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateBlockTemplatePayload }) => {
        const response = await templatesAPI.value.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockTemplates(spaceId, blockId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockTemplates(spaceId, blockId).detail(data.id),
        })
        toast.success(`Template "${data.name}" updated successfully`)
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to update template: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteBlockTemplateMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await templatesAPI.value.delete(id)
        return id
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.blockTemplates(spaceId, blockId).lists(),
        })
        toast.success('Template deleted successfully')
      },
      onError: (error: { message: string }) => {
        toast.error(`Failed to delete template: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    useBlockTemplatesQuery,
    useBlockTemplateQuery,
    useCreateBlockTemplateMutation,
    useUpdateBlockTemplateMutation,
    useDeleteBlockTemplateMutation,
  }
}
