import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { MaybeRefOrComputed } from '~/types'
import type { AcceptInvitePayload, CreateInvitePayload, InviteQueryParams } from '~/types/invites'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useInvites() {
  const queryClient = useQueryClient()

  // Public Invites Queries
  const usePublicInviteQuery = (tokenRef: MaybeRefOrComputed<string>) => {
    const token = computed(() => unref(tokenRef))

    return useQuery({
      queryKey: computed(() => queryKeys.invites.public(token.value)),
      queryFn: async () => {
        const response = await api.invites.getPublicInvite(token.value)
        console.log(response.data)
        return response.data
      },
      enabled: computed(() => !!token.value),
    })
  }

  // User Invites Queries
  const useMyInvitesQuery = (paramsRef: MaybeRefOrComputed<InviteQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.invites.myList(params.value)),
      queryFn: async () => {
        const response = await api.invites.listMyInvites(params.value)
        return response.data
      },
    })
  }

  const useMyInviteQuery = (inviteIdRef: MaybeRefOrComputed<string>) => {
    const inviteId = computed(() => unref(inviteIdRef))

    return useQuery({
      queryKey: computed(() => queryKeys.invites.myDetail(inviteId.value)),
      queryFn: async () => {
        const response = await api.invites.getMyInvite(inviteId.value)
        return response.data
      },
      enabled: computed(() => !!inviteId.value),
    })
  }

  // Space Invites Queries
  const useSpaceInvitesQuery = (
    spaceIdRef: MaybeRefOrComputed<string>,
    paramsRef: MaybeRefOrComputed<InviteQueryParams> = {}
  ) => {
    const spaceId = computed(() => unref(spaceIdRef))
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.invites.spaceList(spaceId.value, params.value)),
      queryFn: async () => {
        const response = await api.invites.listSpaceInvites(spaceId.value, params.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value),
    })
  }

  // Team Invites Queries
  const useTeamInvitesQuery = (
    teamIdRef: MaybeRefOrComputed<string>,
    paramsRef: MaybeRefOrComputed<InviteQueryParams> = {}
  ) => {
    const teamId = computed(() => unref(teamIdRef))
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.invites.teamList(teamId.value, params.value)),
      queryFn: async () => {
        const response = await api.invites.listTeamInvites(teamId.value, params.value)
        return response.data
      },
      enabled: computed(() => !!teamId.value),
    })
  }

  // Space Invites Mutations
  const useCreateSpaceInviteMutation = () => {
    return useMutation({
      mutationFn: async ({
        spaceId,
        payload,
      }: {
        spaceId: string
        payload: CreateInvitePayload
      }) => {
        const response = await api.invites.createSpaceInvite(spaceId, payload)
        return { spaceId, invite: response.data }
      },
      onSuccess: ({ spaceId, invite }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.spaceList(spaceId) })
        toast.success(`Invite sent to ${invite.email}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to send invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteSpaceInviteMutation = () => {
    return useMutation({
      mutationFn: async ({ spaceId, inviteId }: { spaceId: string; inviteId: string }) => {
        await api.invites.deleteSpaceInvite(spaceId, inviteId)
        return { spaceId, inviteId }
      },
      onSuccess: ({ spaceId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.spaceList(spaceId) })
        toast.success('Invite revoked')
      },
      onError: (error: Error) => {
        toast.error(`Failed to revoke invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useResendSpaceInviteMutation = () => {
    return useMutation({
      mutationFn: async ({ spaceId, inviteId }: { spaceId: string; inviteId: string }) => {
        const response = await api.invites.resendSpaceInvite(spaceId, inviteId)
        return { spaceId, invite: response.data }
      },
      onSuccess: ({ invite }) => {
        toast.success(`Invite resent to ${invite.email}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to resend invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Team Invites Mutations
  const useCreateTeamInviteMutation = () => {
    return useMutation({
      mutationFn: async ({ teamId, payload }: { teamId: string; payload: CreateInvitePayload }) => {
        const response = await api.invites.createTeamInvite(teamId, payload)
        return { teamId, invite: response.data }
      },
      onSuccess: ({ teamId, invite }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.teamList(teamId) })
        toast.success(`Invite sent to ${invite.email}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to send invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteTeamInviteMutation = () => {
    return useMutation({
      mutationFn: async ({ teamId, inviteId }: { teamId: string; inviteId: string }) => {
        await api.invites.deleteTeamInvite(teamId, inviteId)
        return { teamId, inviteId }
      },
      onSuccess: ({ teamId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.teamList(teamId) })
        toast.success('Invite revoked')
      },
      onError: (error: Error) => {
        toast.error(`Failed to revoke invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useResendTeamInviteMutation = () => {
    return useMutation({
      mutationFn: async ({ teamId, inviteId }: { teamId: string; inviteId: string }) => {
        const response = await api.invites.resendTeamInvite(teamId, inviteId)
        return { teamId, invite: response.data }
      },
      onSuccess: ({ invite }) => {
        toast.success(`Invite resent to ${invite.email}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to resend invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Accept Invite Mutation
  const useAcceptInviteMutation = () => {
    return useMutation({
      mutationFn: async ({
        inviteId,
        payload,
      }: {
        inviteId: string
        payload: AcceptInvitePayload
      }) => {
        const response = await api.invites.acceptInvite(inviteId, payload)
        return response.data
      },
      onSuccess: (invite) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.myList() })
        console.log('Invite accepted', invite)
        const targetName = invite.space?.name || invite.team?.name || 'resource'
        toast.success(`Successfully joined ${targetName}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to accept invite: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Public Queries
    usePublicInviteQuery,

    // User Invites Queries
    useMyInvitesQuery,
    useMyInviteQuery,

    // Space Invites Queries
    useSpaceInvitesQuery,

    // Team Invites Queries
    useTeamInvitesQuery,

    // Space Invites Mutations
    useCreateSpaceInviteMutation,
    useDeleteSpaceInviteMutation,
    useResendSpaceInviteMutation,

    // Team Invites Mutations
    useCreateTeamInviteMutation,
    useDeleteTeamInviteMutation,
    useResendTeamInviteMutation,

    // Accept Invite Mutation
    useAcceptInviteMutation,
  }
}
