import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { TeamsQueryParams } from '~/api/resources/teams'
import type { MaybeRefOrComputed } from '~/types'
import type {
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamUserPayload,
  UpdateTeamUserPayload,
  TeamUserQueryParams,
  TeamHierarchyItem,
} from '~/types/teams'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useTeams() {
  const queryClient = useQueryClient()

  // Teams Queries
  const useTeamsQuery = (paramsRef: MaybeRefOrComputed<TeamsQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.teams.list(params.value)),
      queryFn: async () => {
        const response = await api.teams.index({
          sort: '+name',
          ...params.value,
        })
        return response.data
      },
    })
  }

  const useTeamQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.teams.detail(id.value)),
      queryFn: async () => {
        const response = await api.teams.get(id.value)
        return response.data
      },
      enabled: computed(() => !!id.value),
    })
  }

  const useTeamHierarchyQuery = () => {
    return useQuery({
      queryKey: queryKeys.teams.hierarchy(),
      queryFn: async () => {
        const response = await api.teams.getHierarchy()
        return response.data
      },
    })
  }

  // Team Users Queries
  const useTeamUsersQuery = (
    teamIdRef: MaybeRefOrComputed<string>,
    paramsRef: MaybeRefOrComputed<TeamUserQueryParams> = {}
  ) => {
    const teamId = computed(() => unref(teamIdRef))
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.teams.users(teamId.value).list(params.value)),
      queryFn: async () => {
        const response = await api.teams.getUsers(teamId.value, {
          sort: '+user.firstname',
          ...params.value,
        })
        return response
      },
      enabled: computed(() => !!teamId.value),
    })
  }

  // Team Mutations
  const useCreateTeamMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateTeamPayload) => {
        const response = await api.teams.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.hierarchy() })
        toast.success(`Team "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create team: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateTeamMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateTeamPayload }) => {
        const response = await api.teams.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(data.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.hierarchy() })
        toast.success(`Team "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update team: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useDeleteTeamMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await api.teams.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() })
        queryClient.removeQueries({ queryKey: queryKeys.teams.detail(id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.hierarchy() })
        // Also invalidate team users queries
        queryClient.removeQueries({ queryKey: queryKeys.teams.users(id).all() })
        toast.success('Team deleted successfully')
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete team: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Team User Mutations
  const useAddTeamUserMutation = () => {
    return useMutation({
      mutationFn: async ({ teamId, payload }: { teamId: string; payload: AddTeamUserPayload }) => {
        const response = await api.teams.addUser(teamId, payload)
        return { teamId, user: response.data }
      },
      onSuccess: ({ teamId, user }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.users(teamId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) })
        toast.success(`User "${user.user.firstname} ${user.user.lastname}" added to team`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to add user to team: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useUpdateTeamUserMutation = () => {
    return useMutation({
      mutationFn: async ({
        teamId,
        userId,
        payload,
      }: {
        teamId: string
        userId: string
        payload: UpdateTeamUserPayload
      }) => {
        const response = await api.teams.updateUser(teamId, userId, payload)
        return { teamId, userId, user: response.data }
      },
      onSuccess: ({ teamId, user }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.users(teamId).lists() })
        toast.success(`User role updated to ${user.role}`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update user role: ${error.message || 'Unknown error'}`)
      },
    })
  }

  const useRemoveTeamUserMutation = () => {
    return useMutation({
      mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
        await api.teams.removeUser(teamId, userId)
        return { teamId, userId }
      },
      onSuccess: ({ teamId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.users(teamId).lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) })
        toast.success('User removed from team')
      },
      onError: (error: Error) => {
        toast.error(`Failed to remove user from team: ${error.message || 'Unknown error'}`)
      },
    })
  }

  // Utility functions
  const findTeamInHierarchy = (
    hierarchyRef: MaybeRefOrComputed<TeamHierarchyItem[] | undefined>,
    teamIdRef: MaybeRefOrComputed<string>
  ): ComputedRef<TeamHierarchyItem | undefined> => {
    const hierarchy = computed(() => unref(hierarchyRef))
    const teamId = computed(() => unref(teamIdRef))

    return computed(() => {
      if (!hierarchy.value || !teamId.value) return undefined

      const findInTree = (items: TeamHierarchyItem[]): TeamHierarchyItem | undefined => {
        for (const item of items) {
          if (item.id === teamId.value) return item
          if (item.children?.length) {
            const found = findInTree(item.children)
            if (found) return found
          }
        }
        return undefined
      }

      return findInTree(hierarchy.value)
    })
  }

  const getTeamAncestors = (
    hierarchyRef: MaybeRefOrComputed<TeamHierarchyItem[] | undefined>,
    teamIdRef: MaybeRefOrComputed<string>
  ): ComputedRef<TeamHierarchyItem[]> => {
    const hierarchy = computed(() => unref(hierarchyRef))
    const teamId = computed(() => unref(teamIdRef))

    return computed(() => {
      if (!hierarchy.value || !teamId.value) return []

      const findAncestors = (
        items: TeamHierarchyItem[],
        targetId: string,
        ancestors: TeamHierarchyItem[] = []
      ): TeamHierarchyItem[] => {
        for (const item of items) {
          const currentPath = [...ancestors, item]

          if (item.id === targetId) {
            return currentPath.slice(0, -1) // Exclude the target team itself
          }

          if (item.children?.length) {
            const found = findAncestors(item.children, targetId, currentPath)
            if (found.length > 0) return found
          }
        }
        return []
      }

      return findAncestors(hierarchy.value, teamId.value)
    })
  }

  const getTeamDescendants = (
    hierarchyRef: MaybeRefOrComputed<TeamHierarchyItem[] | undefined>,
    teamIdRef: MaybeRefOrComputed<string>
  ): ComputedRef<TeamHierarchyItem[]> => {
    const hierarchy = computed(() => unref(hierarchyRef))
    const teamId = computed(() => unref(teamIdRef))

    return computed(() => {
      if (!hierarchy.value || !teamId.value) return []

      const team = findTeamInHierarchy(hierarchy, teamId).value
      if (!team) return []

      const getAllDescendants = (item: TeamHierarchyItem): TeamHierarchyItem[] => {
        const descendants: TeamHierarchyItem[] = []

        if (item.children?.length) {
          for (const child of item.children) {
            descendants.push(child)
            descendants.push(...getAllDescendants(child))
          }
        }

        return descendants
      }

      return getAllDescendants(team)
    })
  }

  return {
    // Team Queries
    useTeamsQuery,
    useTeamQuery,
    useTeamHierarchyQuery,

    // Team User Queries
    useTeamUsersQuery,

    // Team Mutations
    useCreateTeamMutation,
    useUpdateTeamMutation,
    useDeleteTeamMutation,

    // Team User Mutations
    useAddTeamUserMutation,
    useUpdateTeamUserMutation,
    useRemoveTeamUserMutation,

    // Utility Functions
    findTeamInHierarchy,
    getTeamAncestors,
    getTeamDescendants,
  }
}
