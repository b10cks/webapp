import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { CommentsQueryParams } from '~/api/resources/comments'
import type { CreateCommentRequest, UpdateCommentRequest } from '~/types/comments'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useComments(spaceId: MaybeRef<string>, contentId: MaybeRef<string>) {
  const queryClient = useQueryClient()
  const commentsAPI = computed(() => api.forSpace(toValue(spaceId)).comments(toValue(contentId)))

  const useCommentsQuery = (params: MaybeRef<CommentsQueryParams> = {}) => {
    return useQuery({
      queryKey: computed(() => queryKeys.comments(spaceId, contentId).list(params)),
      queryFn: async () => {
        const response = await commentsAPI.value.index(toValue(params))
        return response.data
      },
    })
  }

  const useCommentQuery = (commentId: MaybeRef<string>) => {
    return useQuery({
      queryKey: computed(() => queryKeys.comments(spaceId, contentId).detail(commentId)),
      queryFn: async () => {
        const response = await commentsAPI.value.get(toValue(commentId))
        return response.data
      },
    })
  }

  const useCreateCommentMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateCommentRequest) => {
        const response = await commentsAPI.value.create(payload)
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        toast.success('Comment added successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to add comment: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateCommentMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateCommentRequest }) => {
        const response = await commentsAPI.value.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).detail(data.id),
        })
        toast.success('Comment updated successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to update comment: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteCommentMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await commentsAPI.value.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        queryClient.removeQueries({
          queryKey: queryKeys.comments(spaceId, contentId).detail(id),
        })
        toast.success('Comment deleted successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete comment: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useResolveCommentMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await commentsAPI.value.resolve(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).detail(data.id),
        })
        toast.success('Comment resolved')
      },
      onError: (error: Error) => {
        toast.error(`Failed to resolve comment: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUnresolveCommentMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await commentsAPI.value.unresolve(id)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).detail(data.id),
        })
        toast.success('Comment unresolved')
      },
      onError: (error: Error) => {
        toast.error(`Failed to unresolve comment: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useAddReactionMutation = () => {
    return useMutation({
      mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
        const response = await commentsAPI.value.addReaction(commentId, emoji)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).detail(data.id),
        })
      },
      onError: (error: Error) => {
        toast.error(`Failed to add reaction: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useRemoveReactionMutation = () => {
    return useMutation({
      mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
        await commentsAPI.value.removeReaction(commentId, emoji)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments(spaceId, contentId).lists(),
        })
      },
      onError: (error: Error) => {
        toast.error(`Failed to remove reaction: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useCommentsQuery,
    useCommentQuery,

    // Mutations
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useResolveCommentMutation,
    useUnresolveCommentMutation,
    useAddReactionMutation,
    useRemoveReactionMutation,
  }
}
