import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

import type { DataSourcesQueryParams } from '~/api/resources/data-sources'
import type { CreateDataSourcePayload, UpdateDataSourcePayload } from '~/types/data-sources'

import { api } from '~/api'

import { queryKeys } from './useQueryClient'

export function useDataSources(spaceIdRef: MaybeRefOrComputed<string>) {
  const queryClient = useQueryClient()

  // Get the space ID value
  const spaceId = computed(() => unref(spaceIdRef))

  // Get the API instance for this space
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  /**
   * Query all data sources in a space
   */
  const useDataSourcesQuery = (paramsRef: MaybeRefOrComputed<DataSourcesQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.dataSources(spaceId.value).list(params.value)),
      queryFn: async () => {
        return await spaceAPI.value.dataSources.index({
          sort: '+name',
          ...params.value,
        })
      },
      enabled: computed(() => !!spaceId.value),
    })
  }

  /**
   * Query a single data source by ID
   */
  const useDataSourceQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.dataSources(spaceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.dataSources.get(id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!id.value),
    })
  }

  /**
   * Create a new data source
   */
  const useCreateDataSourceMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateDataSourcePayload) => {
        const response = await spaceAPI.value.dataSources.create(payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dataSources(spaceId.value).lists() })
        toast.success(`Data source "${data.name}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create data source: ${error.message || 'Unknown error'}`)
      },
    })
  }

  /**
   * Update an existing data source
   */
  const useUpdateDataSourceMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateDataSourcePayload }) => {
        const response = await spaceAPI.value.dataSources.update(id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dataSources(spaceId.value).lists() })
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataSources(spaceId.value).detail(data.id),
        })
        toast.success(`Data source "${data.name}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update data source: ${error.message || 'Unknown error'}`)
      },
    })
  }

  /**
   * Delete a data source
   */
  const useDeleteDataSourceMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.dataSources.delete(id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dataSources(spaceId.value).lists() })
        queryClient.removeQueries({ queryKey: queryKeys.dataSources(spaceId.value).detail(id) })
        toast.success(`Data source deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete data source: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useDataSourcesQuery,
    useDataSourceQuery,

    // Mutations
    useCreateDataSourceMutation,
    useUpdateDataSourceMutation,
    useDeleteDataSourceMutation,
  }
}
