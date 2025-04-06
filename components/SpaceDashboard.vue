<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ApiClient } from '~/api/client'

const { formatDuration, formatNumber } = useFormat()

// import LineChart from '~/components/charts/LineChart.vue'
// import BarChart from '~/components/charts/BarChart.vue'

const props = defineProps<{
  spaceId: string
}>()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const stats = ref<any>(null)
const period = ref('daily')
const dateRange = ref('last30')

// Computed values for date ranges
const dateRangeValues = computed(() => {
  const now = new Date()
  let startDate: Date
  const endDate = new Date()

  switch (dateRange.value) {
    case 'last7':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    case 'last30':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      break
    case 'last90':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 90)
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
  }

  return {
    startDate: formatDateToISO(startDate),
    endDate: formatDateToISO(endDate)
  }
})

// Fetch dashboard stats
const fetchDashboardStats = async () => {
  loading.value = true
  error.value = null
  const client = new ApiClient()

  try {
    const { startDate, endDate } = dateRangeValues.value
    stats.value = await client.get(`/mgmt/v1/spaces/${props.spaceId}/stats`, {
      period: period.value,
      start_date: startDate,
      end_date: endDate
    })
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Helper functions
const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatRoleDistribution = (roleDistribution: Record<string, number>): string => {
  return Object.entries(roleDistribution)
    .map(([role, count]) => `${count} ${role}`)
    .join(', ')
}

const formatLanguageData = (languages: Record<string, number>): Array<{ name: string, count: number }> => {
  return Object.entries(languages).map(([lang, count]) => ({
    name: lang,
    count
  }))
}

const formatPublishingFrequency = (frequency: Record<string, number>): Array<{ name: string, value: number }> => {
  return Object.entries(frequency).map(([date, count]) => ({
    name: date,
    value: count
  }))
}

const transformTrendData = (trends: any, key: string): Array<{ name: string, value: number }> => {
  if (!trends || !trends.periods) return []

  return trends.periods.map((period: string, index: number) => ({
    name: period,
    value: trends[key][period] || 0
  }))
}

const formatTrendData = (trends: any): Array<{ name: string, creation: number, publishing: number }> => {
  if (!trends || !trends.periods) return []

  return trends.periods.map((period: string) => ({
    name: period,
    creation: trends.content_creation[period] || 0,
    publishing: trends.content_publishing[period] || 0
  }))
}

// Watch for changes to refetch data
watch([period, dateRange], () => {
  fetchDashboardStats()
})

// Fetch data on mount
onMounted(() => {
  fetchDashboardStats()
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-bold"/>

      <div class="flex space-x-4">
        <Select v-model="dateRange">
          <SelectTrigger class="w-36">
            <SelectValue placeholder="Date Range"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="last90">Last 90 days</SelectItem>
            <SelectItem value="thisYear">This year</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="period">
          <SelectTrigger class="w-36">
            <SelectValue placeholder="Period"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex items-center justify-center h-64"
    >
      <div class="text-center">
        <div
          class="spinner w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"
        />
        <p class="mt-2 text-muted">Loading statistics...</p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="text-center p-8"
    >
      <p class="text-destructive">{{ error }}</p>
    </div>

    <div
      v-else-if="!stats"
      class="text-center p-8"
    >
      <p class="text-muted">No statistics available.</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Total Content</CardTitle>
            <Icon
              name="lucide:book-open"
              class="h-4 w-4 text-muted"
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-primary">{{ formatNumber(stats.content.count.total) }}</div>
            <p class="text-sm text-muted">
              {{ formatNumber(stats.content.count.published) }} published, {{ formatNumber(stats.content.count.draft) }}
              draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Total Users</CardTitle>
            <Icon
              name="lucide:users"
              class="h-4 w-4 text-muted"
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-primary">{{ formatNumber(stats.user_activity.total_users) }}</div>
            <p class="text-sm text-muted">
              {{ formatRoleDistribution(stats.user_activity.role_distribution) }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">API Requests</CardTitle>
            <Icon
              name="lucide:server"
              class="h-4 w-4 text-muted"
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-primary">{{ formatNumber(stats.system.api.total_requests) }}</div>
            <p class="text-sm text-muted">
              {{ formatNumber(stats.system.api.success_rate, 2) }}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Avg Response Time</CardTitle>
            <Icon
              name="lucide:zap"
              class="h-4 w-4 text-muted"
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-primary">{{
                formatDuration(stats.system.api.avg_response_time_ms, 2)
              }}
            </div>
            <p class="text-sm text-muted">
              API response time
            </p>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>