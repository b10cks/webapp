<script setup lang="ts">
import { computed } from 'vue'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '~/components/ui/select'
import { Button } from '~/components/ui/button'

interface SortOption {
  value: string
  label: string
}

const props = defineProps<{
  options: SortOption[]
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

// Split the modelValue into direction and field
const sortDirection = computed(() => {
  return props.modelValue.startsWith('-') ? 'desc' : 'asc'
})

const sortField = computed(() => {
  return props.modelValue.startsWith('+') || props.modelValue.startsWith('-')
    ? props.modelValue.substring(1)
    : props.modelValue
})

// Handle selection of a sort field
const handleFieldChange = (field: string) => {
  // Keep the current direction but change the field
  const prefix = sortDirection.value === 'desc' ? '-' : '+'
  emit('update:modelValue', `${prefix}${field}`)
}

// Toggle direction for the current field
const toggleDirection = () => {
  // Toggle between ascending and descending
  const newDirection = sortDirection.value === 'asc' ? 'desc' : 'asc'
  const prefix = newDirection === 'desc' ? '-' : '+'
  emit('update:modelValue', `${prefix}${sortField.value}`)
}

// Get the currently selected option label
const selectedOptionLabel = computed(() => {
  const option = props.options.find(opt => opt.value === sortField.value)
  return option ? option.label : props.placeholder || 'Sort by'
})

// Get icon based on sort direction
const directionIcon = computed(() => {
  return sortDirection.value === 'asc' ? 'lucide:arrow-up-narrow-wide' : 'lucide:arrow-down-wide-narrow'
})

// Get aria label for toggle button
const toggleButtonLabel = computed(() => {
  return sortDirection.value === 'asc'
    ? 'Switch to descending order'
    : 'Switch to ascending order'
})
</script>

<template>
  <div class="inline-flex items-center">
    <Select
      :model-value="sortField"
      @update:model-value="handleFieldChange"
    >
      <SelectTrigger class="rounded-r-none">
        <span>{{ selectedOptionLabel }}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
      <Button
        size="icon"
        :aria-label="toggleButtonLabel"
        class="rounded-l-none -mx-px rounded-r-md border-l border-l-surface"
        @click="toggleDirection"
      >
        <Icon
          :name="directionIcon"
          size="1rem"
          class="transition-transform"
        />
      </Button>
    </Select>
  </div>
</template>