import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { ContentsQueryParams } from '~/api/resources/contents'
import type { CreateContentPayload, UpdateContentPayload } from '~/types/contents'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useContent(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()
  const spaceId = computed(() => unref(spaceIdRef))
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  const useContentsQuery = (paramsRef: MaybeRefOrComputed<ContentsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.contents(spaceId.value).list(params.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.contents.index(params.value)
        return response
      },
      enabled: computed(() => !!spaceId.value),
    })
  }

  // Query to fetch a single content item
  const useContentQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.contents(spaceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.contents.get(id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!id.value),
    })
  }

  // Query to fetch children of a specific content item
  const useContentChildrenQuery = (parentIdRef: MaybeRefOrComputed<string | null>) => {
    const parentId = computed(() => unref(parentIdRef))

    return useQuery({
      queryKey: computed(() => queryKeys.contents(spaceId.value).list({ parent: parentId.value })),
      queryFn: async () => {
        const response = await spaceAPI.value.contents.index({
          filter: {
            parent_id: parentId.value,
          },
        })
        return response.data
      },
      enabled: computed(() => !!spaceId.value),
    })
  }

  const useCreateContentMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateContentPayload) => {
        const response = await spaceAPI.value.contents.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })

        toast.success(`Content "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateContentMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateContentPayload }) => {
        const response = await spaceAPI.value.contents.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId.value).detail(data.id),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId.value, data.id).lists(),
        })

        toast.success(`Content "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const usePublishContentMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateContentPayload }) => {
        const response = await spaceAPI.value.contents.publish(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId.value).detail(data.id),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId.value, data.id).lists(),
        })

        toast.success(`Content "${data.name}" published successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to publish content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUnpublishContentMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateContentPayload }) => {
        const response = await spaceAPI.value.contents.unpublish(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contents(spaceId.value).detail(data.id),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentVersions(spaceId.value, data.id).lists(),
        })

        toast.success(`Content "${data.name}" unpublished successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to unpublish content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDuplicateContentMutation = () => {
    return useMutation({
      mutationFn: async ({
        id,
        options,
      }: {
        id: string
        options?: { name?: string; parent_id?: string | null }
      }) => {
        const response = await spaceAPI.value.contents.duplicate(id, options)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })

        toast.success(`Content duplicated successfully as "${data.name}"`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to duplicate content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteContentMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.contents.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contents(spaceId.value).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.contents(spaceId.value).detail(id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.contentMenu(spaceId.value).all() })

        toast.success(`Content deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete content: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useContentsQuery,
    useContentQuery,
    useContentChildrenQuery,

    // Mutations
    useCreateContentMutation,
    useUpdateContentMutation,
    usePublishContentMutation,
    useUnpublishContentMutation,
    useDuplicateContentMutation,
    useDeleteContentMutation,
  }
}
