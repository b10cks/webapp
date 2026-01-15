import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { BlockFolderResource, UpsertBlockFolderPayload } from '~/api/resources/block-folders'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useBlockFolders(spaceId: string) {
  const queryClient = useQueryClient()
  const spaceAPI = api.forSpace(spaceId)

  const useBlockFoldersQuery = (filters = {}) => {
    return useQuery({
      queryKey: queryKeys.blockFolders(spaceId).list(filters),
      queryFn: async () => {
        const response = await spaceAPI.blockFolders.index({
          sort: '+name',
          ...filters,
        })
        return response.data
      },
    })
  }

  const useBlockFolderQuery = (folderId: string) => {
    return useQuery({
      queryKey: queryKeys.blockFolders(spaceId).detail(folderId),
      queryFn: async () => {
        const response = await spaceAPI.blockFolders.get(folderId)
        return response.data
      },
      enabled: !!folderId,
    })
  }

  const useCreateBlockFolderMutation = () => {
    return useMutation({
      mutationFn: async (payload: UpsertBlockFolderPayload) => {
        const response = await spaceAPI.blockFolders.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockFolders(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Folder "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create folder: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateBlockFolderMutation = () => {
    return useMutation({
      mutationFn: async ({
        folderId,
        payload,
      }: {
        folderId: string
        payload: UpsertBlockFolderPayload
      }) => {
        const response = await spaceAPI.blockFolders.update(folderId, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockFolders(spaceId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.blockFolders(spaceId).detail(data.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Folder "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update folder: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteBlockFolderMutation = () => {
    return useMutation({
      mutationFn: async (folderId: string) => {
        await spaceAPI.blockFolders.delete(folderId)
        return folderId
      },
      onSuccess: (folderId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blockFolders(spaceId).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.blockFolders(spaceId).detail(folderId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks(spaceId).lists() })
        toast.success(`Folder deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete folder: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useFolderStructure = () => {
    const { data: folders, isLoading, error } = useBlockFoldersQuery()

    const rootFolders = computed(() => {
      if (!folders.value) return []
      return folders.value.filter((folder) => !folder.parent_id)
    })

    const getChildrenOfFolder = (parentId: string | null) => {
      if (!folders.value) return []
      return folders.value.filter((folder) => folder.parent_id === parentId)
    }

    const getBreadcrumbs = (folderId: string): BlockFolderResource[] => {
      if (!folders.value) return []

      const breadcrumbs: BlockFolderResource[] = []
      let currentFolder = folders.value.find((f) => f.id === folderId)

      if (!currentFolder) return []

      breadcrumbs.unshift(currentFolder)

      while (currentFolder?.parent_id) {
        const parentFolder = folders.value.find((f) => f.id === currentFolder?.parent_id)
        if (parentFolder) {
          breadcrumbs.unshift(parentFolder)
          currentFolder = parentFolder
        } else {
          break
        }
      }

      return breadcrumbs
    }

    return {
      folders,
      isLoading,
      error,
      rootFolders,
      getChildrenOfFolder,
      getBreadcrumbs,
    }
  }

  return {
    useBlockFoldersQuery,
    useBlockFolderQuery,

    useFolderStructure,

    useCreateBlockFolderMutation,
    useUpdateBlockFolderMutation,
    useDeleteBlockFolderMutation,
  }
}
