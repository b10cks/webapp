<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipIcon } from '~/components/ui/tooltip'
import type { CleanTranslation } from 'nuxt-i18n-micro-types/src'
import Label from '~/components/ui/form/Label.vue'

const props = defineProps<{
  id?: string
  label?: string | CleanTranslation
  required?: boolean
  hideLabel?: boolean
  tooltip?: string | CleanTranslation
  description?: string | CleanTranslation
  name: string
  error?: string
  class?: HTMLAttributes['class']
}>()

const uniqueId = computed(() => props.id || `${props.name}-${Math.random().toString(36).substring(2, 9)}`)
const hasError = computed(() => !!props.error)

</script>

<template>
  <div :class="['grid w-full items-center gap-2', props.class]">
    <div
      v-if="label"
      class="flex items-center gap-2"
    >
      <Label
        :label="label"
        :hide-label="hideLabel"
        :required="required"
        :for="uniqueId"
      />
      <TooltipIcon v-if="tooltip">{{ tooltip }}</TooltipIcon>
    </div>
    <div :class="{ 'ring-1 text-destructive focus-within:ring-2': hasError, 'rounded-md': true }">
      <slot
        v-bind="{
          id: uniqueId,
          name: props.name
        }"
        :has-error="hasError"
      />
    </div>
    <p
      v-if="hasError"
      class="mt-1 whitespace-pre-line text-sm leading-tight text-destructive"
    >
      {{ error }}
    </p>
    <p
      v-if="description"
      class="text-sm text-text-muted"
    >
      {{ description }}
    </p>
  </div>
</template>