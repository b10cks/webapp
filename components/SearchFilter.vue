<script setup lang="ts">
import { SplitBadge } from '~/components/ui/badge'
import type { CleanTranslation } from 'nuxt-i18n-micro-types/src'

interface FilterableItem {
  value: string | number
  label: string
}

interface FilterableOperator {
  value: 'null' | '!null' | 'eq' | 'neq' | 'empty' | '!empty' | 'like' | '!like' | '^like' | 'like$' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | '!in'
  label: string | CleanTranslation
}

interface FilterableField {
  id: string
  label: string | CleanTranslation
  items?: FilterableItem[]
  operators?: FilterableOperator[]
  datepicker?: {
    max?: string
    min?: string
  }
}

interface FilterValue {
  field: string
  fieldLabel: string
  operator?: string
  operatorLabel?: string
  value: string | number
  valueLabel?: string
}

const props = defineProps<{
  modelValue?: Record<string, unknown>
  filterableFields: FilterableField[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
  (e: 'search', value: string): void
  (e: 'reset'): void
}>()

// Initialize i18n
const { $t } = useI18n()

// State variables
const inputValue = ref('')
const dropdownOpen = ref(false)
const activeFilters = ref<FilterValue[]>([])
const stage = ref<'field' | 'operator' | 'value'>('field')
const selectedField = ref<FilterableField | null>(null)
const selectedOperator = ref<FilterableItem | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dateValue = ref('')
const selectedDropdownIndex = ref(0)
const dropdownRef = ref<HTMLDivElement | null>(null)
const editingFilterIndex = ref<number | null>(null)

// Input placeholder
const placeholder = computed(() => {
  if (stage.value === 'field') {
    return $t('labels.search.searchOrSelectField')
  } else if (stage.value === 'operator') {
    return $t('labels.search.selectOperatorFor', { field: selectedField.value?.label })
  } else if (stage.value === 'value') {
    if (selectedField.value?.items && selectedField.value.items.length > 0) {
      return $t('labels.search.selectValueFor', { field: selectedField.value.label })
    } else if (selectedField.value?.datepicker) {
      return $t('labels.search.enterDateFor', { field: selectedField.value.label })
    } else {
      return $t('labels.search.enterValueFor', { field: selectedField.value?.label })
    }
  }
  return $t('labels.search.search')
})

const dropdownItems = computed(() => {
  if (stage.value === 'field') {
    const availableFields = editingFilterIndex.value !== null
      ? props.filterableFields
      : props.filterableFields.filter(field =>
        !activeFilters.value.some(filter => filter.field === field.id)
      )

    return availableFields.filter(field =>
      !inputValue.value || field.label.toLowerCase().includes(inputValue.value.toLowerCase())
    )
  } else if (stage.value === 'operator' && selectedField.value?.operators) {
    return selectedField.value.operators
  } else if (stage.value === 'value' && selectedField.value?.items) {
    return selectedField.value.items.filter(item =>
      !inputValue.value || String(item.label).toLowerCase().includes(inputValue.value.toLowerCase())
    )
  }
  return []
})

// Reset selected index when dropdown items change
watch(dropdownItems, () => {
  selectedDropdownIndex.value = 0
})

// Computed property for all filters, encoded as {field}={operator}:{value}
const allFilters = computed(() => {
  const result: Record<string, any> = {}

  // Add search query if it exists and we're in field stage
  if (inputValue.value && stage.value === 'field') {
    result.q = inputValue.value
  }

  activeFilters.value.forEach(filter => {
    const field = filter.field
    const value = filter.value

    if (filter.operator) {
      result[field] = `${filter.operator}:${value}`
    } else {
      result[field] = value
    }
  })

  return result
})

const pendingFilter = computed(() => {
  if (!selectedField.value) return null

  return {
    field: selectedField.value.id,
    fieldLabel: selectedField.value.label,
    operator: selectedOperator.value?.value,
    operatorLabel: selectedOperator.value?.label,
    value: stage.value === 'value' ? inputValue.value : '',
    valueLabel: stage.value === 'value' ? inputValue.value : ''
  }
})

const resetSelectionState = () => {
  selectedField.value = null
  selectedOperator.value = null
  stage.value = 'field'
  inputValue.value = ''
  dateValue.value = ''
  selectedDropdownIndex.value = 0
  editingFilterIndex.value = null
}

const clearAllFilters = () => {
  activeFilters.value = []
  resetSelectionState()
  emit('update:modelValue', {})
  announceToScreenReader($t('labels.search.allFiltersCleared'))

  // Focus the input after clearing
  nextTick(() => {
    inputRef.value?.focus()
  })

  emit('reset')
}

// Scroll to selected item in dropdown
const scrollToSelected = () => {
  nextTick(() => {
    if (dropdownRef.value && dropdownRef.value.children[selectedDropdownIndex.value]) {
      const selectedEl = dropdownRef.value.children[selectedDropdownIndex.value] as HTMLElement
      selectedEl.scrollIntoView({
        block: 'nearest'
      })
    }
  })
}

// Handle field selection
const handleFieldSelect = (field: FilterableField) => {
  selectedField.value = field
  inputValue.value = ''

  if (field.operators && field.operators.length > 0) {
    stage.value = 'operator'
  } else {
    stage.value = 'value'

    nextTick(() => {
      inputRef.value?.focus()
    })
  }

  dropdownOpen.value = true
  selectedDropdownIndex.value = 0

  announceToScreenReader($t('labels.search.fieldSelected', { field: field.label }))
}

const handleOperatorSelect = (operator: FilterableItem) => {
  selectedOperator.value = operator
  inputValue.value = ''

  if (['null', '!null', 'empty', '!empty'].includes(String(operator.value))) {
    handleValueSelect()
    return
  }

  stage.value = 'value'

  nextTick(() => {
    inputRef.value?.focus()
  })

  dropdownOpen.value = !!selectedField.value?.items
  selectedDropdownIndex.value = 0

  announceToScreenReader($t('labels.search.operatorSelected', { operator: operator.label }))
}

const handleValueSelect = (item?: FilterableItem) => {
  if (!selectedField.value) return

  const newFilter: FilterValue = {
    field: selectedField.value.id,
    fieldLabel: selectedField.value.label
  }

  if (selectedOperator.value) {
    newFilter.operator = String(selectedOperator.value.value)
    newFilter.operatorLabel = selectedOperator.value.label
  }

  if (item) {
    newFilter.value = item.value
    newFilter.valueLabel = item.label
  } else if (dateValue.value && selectedField.value.datepicker) {
    newFilter.value = dateValue.value
    newFilter.valueLabel = dateValue.value
  } else {
    newFilter.value = inputValue.value
    newFilter.valueLabel = inputValue.value
  }

  if (newFilter.value !== undefined && newFilter.value !== null && String(newFilter.value).trim() !== '') {
    if (editingFilterIndex.value !== null) {
      activeFilters.value[editingFilterIndex.value] = newFilter
      announceToScreenReader($t('labels.search.filterUpdated', {
        field: newFilter.fieldLabel,
        operator: newFilter.operatorLabel || '',
        value: newFilter.valueLabel || newFilter.value
      }))
    } else {
      activeFilters.value.push(newFilter)
      announceToScreenReader($t('labels.search.filterAdded', {
        field: newFilter.fieldLabel,
        operator: newFilter.operatorLabel || '',
        value: newFilter.valueLabel || newFilter.value
      }))
    }
    emit('update:modelValue', allFilters.value)
  }

  // Reset all selection state
  resetSelectionState()
  dropdownOpen.value = false
}

const handleDateSelect = () => {
  if (dateValue.value) {
    handleValueSelect()
  }
}

const removeFilter = (index: number) => {
  const filter = activeFilters.value[index]
  activeFilters.value.splice(index, 1)
  emit('update:modelValue', allFilters.value)

  announceToScreenReader($t('labels.search.filterRemoved', {
    field: filter.fieldLabel
  }))
}

const editFilter = (index: number) => {
  const filter = activeFilters.value[index]
  editingFilterIndex.value = index

  const field = props.filterableFields.find(f => f.id === filter.field)
  if (!field) return

  selectedField.value = field

  if (filter.operator && field.operators) {
    const operator = field.operators.find(op => String(op.value) === filter.operator)
    if (operator) {
      selectedOperator.value = operator
      stage.value = 'value'
    } else {
      stage.value = 'operator'
    }
  } else {
    stage.value = 'value'
  }

  if (stage.value === 'value') {
    if (field.datepicker) {
      dateValue.value = String(filter.value)
    } else if (field.items) {
      inputValue.value = ''
      dropdownOpen.value = true
    } else {
      inputValue.value = String(filter.value)
    }
  }

  nextTick(() => {
    inputRef.value?.focus()
    announceToScreenReader($t('labels.search.editingFilter', {
      field: filter.fieldLabel
    }))
  })
}

const handleRemoveLastFilter = () => {
  if (activeFilters.value.length > 0) {
    removeFilter(activeFilters.value.length - 1)
    return true
  }
  return false
}

const handleInputFocus = () => {
  if (stage.value === 'field') {
    dropdownOpen.value = true
  } else if (stage.value === 'value' && selectedField.value?.items) {
    dropdownOpen.value = true
  }
}

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value

  if ((stage.value === 'field' || (stage.value === 'value' && selectedField.value?.items)) &&
    !dropdownOpen.value) {
    dropdownOpen.value = true
  }
}

const announceToScreenReader = (message: string | CleanTranslation) => {
  const announcer = document.getElementById('sr-announcer')
  if (announcer) {
    announcer.textContent = message
  } else {
    const newAnnouncer = document.createElement('div')
    newAnnouncer.id = 'sr-announcer'
    newAnnouncer.setAttribute('aria-live', 'polite')
    newAnnouncer.setAttribute('aria-atomic', 'true')
    newAnnouncer.classList.add('sr-only')
    newAnnouncer.textContent = message
    document.body.appendChild(newAnnouncer)
  }
}

// Handle navigation and selection with keyboard
const handleKeyDown = (e: KeyboardEvent) => {
  // Handle arrow up/down for dropdown navigation with cycling
  if (dropdownOpen.value && dropdownItems.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Cycle to first item if at the end
      selectedDropdownIndex.value = (selectedDropdownIndex.value + 1) % dropdownItems.value.length
      scrollToSelected()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Cycle to last item if at the beginning
      selectedDropdownIndex.value = selectedDropdownIndex.value <= 0
        ? dropdownItems.value.length - 1
        : selectedDropdownIndex.value - 1
      scrollToSelected()
    }
  }

  // Handle Enter key
  if (e.key === 'Enter') {
    e.preventDefault()

    if (dropdownOpen.value && dropdownItems.value.length > 0) {
      const selectedItem = dropdownItems.value[selectedDropdownIndex.value]

      if (stage.value === 'field') {
        handleFieldSelect(selectedItem, selectedDropdownIndex.value)
      } else if (stage.value === 'operator') {
        handleOperatorSelect(selectedItem, selectedDropdownIndex.value)
      } else if (stage.value === 'value') {
        handleValueSelect(selectedItem, selectedDropdownIndex.value)
      }
    } else if (stage.value === 'value') {
      // Use input value when no dropdown or no selection
      handleValueSelect()
    } else if (inputValue.value) {
      // Trigger search when there's input text
      emit('search', inputValue.value)
    }
  }

  // Handle backspace to go back a stage or remove last filter
  if (e.key === 'Backspace' && inputValue.value === '') {
    if (stage.value !== 'field') {
      e.preventDefault()
      if (stage.value === 'value') {
        stage.value = selectedField.value?.operators?.length ? 'operator' : 'field'
        selectedOperator.value = null
        announceToScreenReader($t('labels.search.goingBack'))
      } else if (stage.value === 'operator') {
        stage.value = 'field'
        selectedField.value = null
        announceToScreenReader($t('labels.search.goingBack'))
      }
    } else if (editingFilterIndex.value === null) {
      // In field stage with empty input, remove the last filter (but not if editing)
      if (handleRemoveLastFilter()) {
        e.preventDefault()
      }
    }
  }

  // Handle escape to reset
  if (e.key === 'Escape') {
    if (dropdownOpen.value) {
      dropdownOpen.value = false
      e.preventDefault()

      // Complete filter if in value stage with a value
      if (stage.value === 'value' && inputValue.value) {
        handleValueSelect()
      }
    } else if (stage.value !== 'field' || editingFilterIndex.value !== null) {
      resetSelectionState()
      announceToScreenReader($t('labels.search.filteringCancelled'))
    } else {
      inputValue.value = ''
      emit('reset')
    }
  }

  // Handle Tab key to advance through stages
  if (e.key === 'Tab' && !e.shiftKey) {
    if (stage.value === 'field' && selectedField.value) {
      e.preventDefault()
      if (selectedField.value.operators?.length) {
        stage.value = 'operator'
      } else {
        stage.value = 'value'
      }
    } else if (stage.value === 'operator' && selectedOperator.value) {
      e.preventDefault()
      stage.value = 'value'
    }
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false

    if (stage.value === 'value' && inputValue.value) {
      handleValueSelect()
    } else if (stage.value !== 'field') {
      resetSelectionState()
    }
  }
}

watch(activeFilters, () => {
  emit('update:modelValue', allFilters.value)
}, { deep: true })

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  const announcer = document.getElementById('sr-announcer')
  if (announcer) {
    announcer.remove()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full"
  >
    <div
      class="flex h-9 text-primary shadow-sm transition-colors flex-wrap items-center gap-2 pr-6 py-1 pl-2 bg-input rounded-md placeholder:text-muted focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      role="combobox"
      :aria-expanded="dropdownOpen"
      :aria-owns="dropdownOpen ? 'search-filter-dropdown' : undefined"
      aria-haspopup="listbox"
    >
      <!-- Applied Filters as Badges -->
      <SplitBadge
        v-for="(filter, index) in activeFilters"
        :key="`filter-${index}`"
        :label="filter.fieldLabel"
        removable
        :aria-label="$t('labels.search.removeFilter', {
          field: filter.fieldLabel,
          operator: filter.operatorLabel || '',
          value: filter.valueLabel || filter.value
        })"
        @remove="removeFilter(index)"
        @click="editFilter(index)"
      >
        {{ filter.operatorLabel ? `${filter.operatorLabel} ` : '' }}
        {{ filter.valueLabel || filter.value }}
      </SplitBadge>

      <SplitBadge
        v-if="pendingFilter"
        :label="pendingFilter.fieldLabel"
        aria-live="polite"
      >
        {{ pendingFilter.operatorLabel ? `${pendingFilter.operatorLabel} ` : '' }}
      </SplitBadge>

      <div class="relative flex-1 min-w-20">
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          class="w-full bg-transparent border-none text-primary p-1 focus:outline-none text-sm font-semibold"
          :placeholder="placeholder"
          :aria-label="placeholder"
          :aria-autocomplete="dropdownItems.length > 0 ? 'list' : 'none'"
          :aria-controls="dropdownOpen ? 'search-filter-dropdown' : undefined"
          :aria-activedescendant="dropdownOpen && dropdownItems.length > 0 ?
            `dropdown-item-${selectedDropdownIndex}` : undefined"
          @focus="handleInputFocus"
          @input="handleInputChange"
          @keydown="handleKeyDown"
        >
      </div>

      <button
        v-if="activeFilters.length > 0 || inputValue"
        type="button"
        class="absolute h-5 w-5 p-0.5 right-1 top-2 items-center rounded-full hover:bg-elevated focus:outline-none focus:ring-2 focus:ring-ring"
        :aria-label="$t('labels.search.clearAllFilters')"
        @click="clearAllFilters"
      >
        <Icon
          name="lucide:x"
          class="text-muted"
        />
      </button>
    </div>

    <div
      v-if="dropdownOpen"
      id="search-filter-dropdown"
      ref="dropdownRef"
      class="absolute z-50 w-full mt-1 p-1 bg-input rounded-md shadow-lg max-h-60 overflow-y-auto"
      role="listbox"
      :aria-label="$t(`labels.search.${stage}DropdownLabel`)"
    >
      <template v-if="dropdownItems.length > 0">
        <div
          v-for="(item, index) in dropdownItems"
          :id="`dropdown-item-${index}`"
          :key="`dropdown-item-${index}`"
          :class="[
            'relative flex select-none text-sm font-semibold items-center rounded-md gap-2 px-2 py-1.5 outline-none transition-colors hover:bg-blue-600 hover:text-primary focus:bg-blue-600 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
            index === selectedDropdownIndex && 'bg-blue-600 text-primary'
          ]"
          role="option"
          :aria-selected="index === selectedDropdownIndex"
          @click="
            stage === 'field'
              ? handleFieldSelect(item, index)
              : stage === 'operator'
                ? handleOperatorSelect(item, index)
                : handleValueSelect(item, index)
          "
        >
          {{ item.label }}
        </div>
      </template>

      <div
        v-else-if="stage === 'value' && selectedField?.datepicker"
        class="p-4"
      >
        <label
          :for="'date-input'"
          class="sr-only"
        >{{ $t('labels.search.dateInput') }}</label>
        <input
          id="date-input"
          v-model="dateValue"
          type="date"
          class="w-full p-2 bg-elevated border border-gray-600 rounded text-primary"
          :max="selectedField.datepicker.max?.split('T')[0]"
          :min="selectedField.datepicker.min?.split('T')[0]"
          :aria-label="$t('labels.search.enterDateFor', { field: selectedField.label })"
          @change="handleDateSelect"
        >
      </div>

      <div
        v-else-if="stage === 'value'"
        class="px-4 py-2 select-none text-sm font-semibold text-muted"
        role="status"
      >
        {{ $t('labels.search.typeValueAndEnter') }}
      </div>

      <div
        v-else
        class="px-4 py-2 select-none text-sm font-semibold text-muted"
        role="status"
      >
        {{ $t('labels.search.noResultsFound') }}
      </div>
    </div>

    <div
      class="sr-only"
      role="status"
      aria-live="polite"
    >
      {{ dropdownOpen ? $t('labels.search.keyboardNavHint') : '' }}
    </div>
  </div>
</template>