<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { useVModel } from '@vueuse/core'
import FormField from './FormField.vue'
import Input from '../input/Input.vue'
import type { CleanTranslation } from 'nuxt-i18n-micro-types/src'

const props = defineProps<{
  // FormField props
  id?: string
  label?: string | CleanTranslation
  required?: boolean
  tooltip?: string | CleanTranslation
  description?: string | CleanTranslation
  error?: string
  autoFocus?: boolean
  class?: HTMLAttributes['class']
  inputClass?: HTMLAttributes['class']

  // Input props
  modelValue?: string | number
  defaultValue?: string | number
  placeholder?: unknown
  type?: string
  disabled?: boolean
  readonly?: boolean
  name: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

// Create two-way binding for modelValue
const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

// Additional input props that should be passed to the Input component
const inputProps = computed(() => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id, label, tooltip, description, error, class: _class,
    modelValue: _modelValue, defaultValue: _defaultValue,
    ...rest
  } = props

  return { ...rest, class: props.inputClass }
})

</script>

<template>
  <FormField
    :id="id"
    :label="label"
    :name="name"
    :required="required"
    :tooltip="tooltip"
    :description="description"
    :error="error"
    :class="props.class"
  >
    <template #default="{ id, hasError }">
      <Input
        :id="id"
        v-model="modelValue"
        :class="{ 'border-red-500': hasError }"
        v-bind="{ ...inputProps, ...$attrs }"
      />
    </template>
  </FormField>
</template>