<script setup lang="ts">

import ValueRenderer from '~/components/content/ValueRenderer.vue'

const props = defineProps({
  changes: {
    type: Array,
    default: () => []
  }
})

const activeFilter = ref('all')

const stats = computed(() => {
  return props.changes.reduce((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1
    return acc
  }, { added: 0, removed: 0, changed: 0 })
})

const filteredChanges = computed(() => {
  if (activeFilter.value === 'all') return props.changes
  return props.changes.filter(change => change.type === activeFilter.value)
})

const formatPath = (path) => {
  return path.replace(/\./g, ' → ')
}

const getChangeClasses = (type) => {
  const baseClasses = 'border-l-4'

  switch (type) {
    case 'added':
      return `${baseClasses} bg-success/10 border-success`
    case 'removed':
      return `${baseClasses} bg-destructive/10 border-destructive`
    case 'changed':
      return `${baseClasses} bg-info/10 border-info`
    default:
      return `${baseClasses} bg-gray/10 border-gray`
  }
}

const getChangeIcon = (type) => {
  switch (type) {
    case 'added':
      return 'lucide:plus'
    case 'removed':
      return 'lucide:minus'
    default:
      return 'lucide:edit'
  }
}

const getBadgeClasses = (type) => {
  switch (type) {
    case 'added':
      return 'bg-success/20 text-success'
    case 'removed':
      return 'bg-destructive/20 text-destructive'
    case 'changed':
      return 'bg-info/20 text-info'
    default:
      return 'bg-gray/20 text-gray-700'
  }
}

const toggleFilter = (filter) => {
  if (activeFilter.value === filter) {
    activeFilter.value = 'all'
  } else {
    activeFilter.value = filter
  }
}

const getFilterButtonClasses = (filter) => {
  return activeFilter.value === filter || activeFilter.value === 'all'
    ? ''
    : 'opacity-50 hover:opacity-100'
}

</script>

<template>
  <div class="w-full min-h-0">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-secondary-foreground">Changes Overview</h2>
      </div>
      <div class="flex gap-4">
        <button
          v-if="stats.added > 0"
          class="cursor-pointer flex items-center gap-2"
          :class="getFilterButtonClasses('added')"
          @click="toggleFilter('added')"
        >
          <div class="w-3 h-3 bg-success rounded-full"/>
          <span class="text-sm font-semibold text-success">{{ stats.added }} added</span>
        </button>
        <button
          v-if="stats.changed > 0"
          class="cursor-pointer flex items-center gap-2"
          :class="getFilterButtonClasses('changed')"
          @click="toggleFilter('changed')"
        >
          <div class="w-3 h-3 bg-info rounded-full"/>
          <span class="text-sm font-semibold text-info">{{ stats.changed }} changed</span>
        </button>
        <button
          v-if="stats.removed > 0"
          class="cursor-pointer flex items-center gap-2"
          :class="getFilterButtonClasses('removed')"
          @click="toggleFilter('removed')"
        >
          <div class="w-3 h-3 bg-destructive rounded-full"/>
          <span class="text-sm font-semibold text-destructive">{{ stats.removed }} removed</span>
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="change in filteredChanges"
        :key="change.path"
        :class="getChangeClasses(change.type)"
        class="px-4 py-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <Icon
              :name="getChangeIcon(change.type)"
              class="w-4 h-4 shrink-0"
            />
            <div class="text-sm font-mono">
              {{ formatPath(change.path) }}
            </div>
          </div>
          <span
            :class="getBadgeClasses(change.type)"
            class="px-2 py-1 text-xs font-semibold rounded-full"
          >
              {{ change.type.toUpperCase() }}
            </span>
        </div>
        <div class="ml-6">
          <div
            v-if="change.type === 'added'"
            class="space-y-1"
          >
            <div class="text-xs uppercase tracking-wide font-semibold">New Value</div>
            <div class="font-mono text-sm bg-success/5 border border-success/20 rounded px-3 py-2">
              <ValueRenderer :value="change.newValue"/>
            </div>
          </div>
          <div
            v-else-if="change.type === 'removed'"
            class="space-y-1"
          >
            <div class="text-xs uppercase tracking-wide font-semibold">Removed Value</div>
            <div class="font-mono text-sm bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
              <ValueRenderer :value="change.oldValue"/>
            </div>
          </div>
          <div
            v-else-if="change.type === 'changed'"
            class="space-x-3 grid grid-cols-2"
          >
            <div class="space-y-1">
              <div class="text-xs uppercase tracking-wide font-semibold">Previous Value</div>
              <div class="font-mono text-sm bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                <ValueRenderer :value="change.oldValue"/>
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-xs uppercase tracking-wide font-semibold">New Value</div>
              <div class="font-mono text-sm bg-success/5 border border-success/20 rounded px-3 py-2">
                <ValueRenderer :value="change.newValue"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>