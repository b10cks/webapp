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
  modelValue: {
    column: string
    direction: 'asc' | 'desc'
  }
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const sortDirection = computed(() => {
  return props.modelValue.direction
})

const sortField = computed(() => {
  return props.modelValue.column
})

const handleFieldChange = (field: string) => {
  emit('update:modelValue', {
    column: field,
    direction: sortDirection.value
  })
}

const toggleDirection = () => {
  emit('update:modelValue', {
    column: sortField.value,
    direction: sortDirection.value === 'asc' ? 'desc' : 'asc'
  })
}

const selectedOptionLabel = computed(() => {
  const option = props.options.find(opt => opt.value === sortField.value)
  return option ? option.label : props.placeholder || 'Sort by'
})

const directionIcon = computed(() => {
  return sortDirection.value === 'asc' ? 'lucide:arrow-up-narrow-wide' : 'lucide:arrow-down-wide-narrow'
})

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
          class="transition-transform"
        />
      </Button>
    </Select>
  </div>
</template>