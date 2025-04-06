import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { api } from '~/api'
import { queryKeys } from './useQueryClient'
import type {
  CreateDataEntryPayload,
  DataEntryQueryParams,
  DataEntryResource,
  UpdateDataEntryPayload
} from '~/types/data-sources'
import type { ApiResponse } from '~/types'

export function useDataEntries(
  spaceIdRef: MaybeRefOrComputed<string>,
  dataSourceIdRef: MaybeRefOrComputed<string>
) {
  const queryClient = useQueryClient()

  // Get the space ID and data source ID values
  const spaceId = computed(() => unref(spaceIdRef))
  const dataSourceId = computed(() => unref(dataSourceIdRef))

  // Get the API instance for this space
  const spaceAPI = computed(() => api.forSpace(spaceId.value))

  /**
   * Query all entries in a data source
   */
  const useDataEntriesQuery = (paramsRef: MaybeRefOrComputed<DataEntryQueryParams> = {}) => {
    const params = computed(() => unref(paramsRef))

    return useQuery({
      queryKey: computed(() => queryKeys.dataEntries(spaceId.value, dataSourceId.value).list(params.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.dataSources.getEntries(dataSourceId.value, {
          sort: '+key',
          ...params.value,
        })
        return response
      },
      enabled: computed(() => !!spaceId.value && !!dataSourceId.value),
    })
  }

  /**
   * Query a single data entry by ID
   */
  const useDataEntryQuery = (idRef: MaybeRefOrComputed<string>) => {
    const id = computed(() => unref(idRef))

    return useQuery({
      queryKey: computed(() => queryKeys.dataEntries(spaceId.value, dataSourceId.value).detail(id.value)),
      queryFn: async () => {
        const response = await spaceAPI.value.dataSources.getEntry(dataSourceId.value, id.value)
        return response.data
      },
      enabled: computed(() => !!spaceId.value && !!dataSourceId.value && !!id.value),
    })
  }

  /**
   * Create a new data entry
   */
  const useCreateDataEntryMutation = () => {
    return useMutation({
      mutationFn: async (payload: CreateDataEntryPayload) => {
        const response = await spaceAPI.value.dataSources.createEntry(dataSourceId.value, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).lists()
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataSources(spaceId.value).detail(dataSourceId.value)
        })
        toast.success(`Data entry "${data.key}" created successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to create data entry: ${error.message || 'Unknown error'}`)
      },
    })
  }

  /**
   * Update an existing data entry
   */
  const useUpdateDataEntryMutation = () => {
    return useMutation({
      mutationFn: async ({ id, payload }: {
        id: string;
        payload: UpdateDataEntryPayload;
      }) => {
        const response = await spaceAPI.value.dataSources.updateEntry(dataSourceId.value, id, payload)
        return response.data
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).lists()
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).detail(data.id)
        })
        toast.success(`Data entry "${data.key}" updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to update data entry: ${error.message || 'Unknown error'}`)
      },
    })
  }

  /**
   * Delete a data entry
   */
  const useDeleteDataEntryMutation = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await spaceAPI.value.dataSources.deleteEntry(dataSourceId.value, id)
        return id
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).lists()
        })
        queryClient.removeQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).detail(id)
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataSources(spaceId.value).detail(dataSourceId.value)
        })
        toast.success(`Data entry deleted successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete data entry: ${error.message || 'Unknown error'}`)
      },
    })
  }

  /**
   * Batch update or create data entries
   */
  const useBatchUpdateEntriesMutation = () => {
    return useMutation({
      mutationFn: async (entries: CreateDataEntryPayload[]) => {
        const response = await spaceAPI.value.dataSources.custom<ApiResponse<DataEntryResource[]>>(
          'POST',
          `${dataSourceId.value}/entries/batch`,
          { entries }
        )
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataEntries(spaceId.value, dataSourceId.value).lists()
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.dataSources(spaceId.value).detail(dataSourceId.value)
        })
        toast.success(`Batch update completed successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Failed to batch update entries: ${error.message || 'Unknown error'}`)
      },
    })
  }

  return {
    // Queries
    useDataEntriesQuery,
    useDataEntryQuery,

    // Mutations
    useCreateDataEntryMutation,
    useUpdateDataEntryMutation,
    useDeleteDataEntryMutation,
    useBatchUpdateEntriesMutation,
  }
}