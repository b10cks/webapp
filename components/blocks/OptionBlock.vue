<script setup lang="ts">

import { useSortable } from '@vueuse/integrations/useSortable'
import { FormField } from '~/components/ui/form'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '~/components/ui/combobox'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

const props = defineProps<{ value: OptionSchema }>()
const list = ref<HTMLDivElement | null>(null)

const emit = defineEmits<{
  (e: 'update:item-value', key: string, value: unknown): void
}>()

useSortable(list, props.value.options, {
  handle: '[draggable]',
})

function handleBlur(option: OptionItem) {
  if (option.name && !option.value) {
    option.value = option.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }
}

function addOption(focusNew = false) {
  const newIndex = props.value.options.length
  emit('update:item-value', 'options', [...props.value.options, {
    name: '',
    value: '',
  }])

  if (focusNew) {
    nextTick(() => {
      const newInput = document.querySelector(`[data-row="${newIndex}"][data-col="0"]`) as HTMLElement
      newInput?.focus()
    })
  }
}

function removeOption(index: number) {
  emit('update:item-value', 'options', props.value.options.filter((_, i) => i !== index))

  nextTick(() => {
    if (props.value.options.length > 0) {
      const newFocusIndex = Math.min(index, props.value.options.length - 1)
      const inputToFocus = document.querySelector(`[data-row="${newFocusIndex}"][data-col="0"]`) as HTMLElement
      inputToFocus?.focus()
    }
  })
}

function handleKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number) {
  const lastRowIndex = props.value.options.length - 1

  switch (event.key) {
    case 'ArrowUp':
      if (rowIndex > 0) {
        event.preventDefault()
        const upElement = document.querySelector(`[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`) as HTMLElement
        upElement?.focus()
      }
      break

    case 'ArrowDown':
      if (rowIndex < lastRowIndex) {
        event.preventDefault()
        const downElement = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`) as HTMLElement
        downElement?.focus()
      } else {
        event.preventDefault()
        addOption(true)
      }
      break

    case 'Tab':
      if (!event.shiftKey && rowIndex === lastRowIndex && colIndex === 1) {
        event.preventDefault()
        addOption(true)
      }
      break

    case 'Enter':
      event.preventDefault()
      if (rowIndex === lastRowIndex) {
        addOption(true)
      } else {
        const nextRowElement = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`) as HTMLElement
        nextRowElement?.focus()
      }
      break
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-background py-3 rounded-xl">
      <div
        ref="list"
        class="flex flex-col mb-3"
      >
        <div
          v-for="(option, index) in value.options"
          :key="`option-${index}`"
          class="flex items-center gap-2 bg-background py-1 px-3 rounded-xl"
        >
          <Icon
            name="lucide:grip-vertical"
            class="cursor-ns-resize shrink-0 hover:text-primary"
            draggable
          />
          <Input
            v-model="option.name"
            :data-row="index"
            data-col="0"
            :placeholder="$t('labels.blocks.options.label')"
            @blur="() => handleBlur(option)"
            @keydown="(e: KeyboardEvent) => handleKeyDown(e, index, 0)"
          />
          <Input
            v-model="option.value"
            :data-row="index"
            data-col="1"
            :placeholder="$t('labels.blocks.options.value')"
            @keydown="(e: KeyboardEvent) => handleKeyDown(e, index, 1)"
          />
          <button
            type="button"
            class="text-gray-4 hover:text-red-500 focus:text-red-500 ml-auto cursor-pointer p-2"
            aria-label="Remove option"
            tabindex="-1"
            @click="() => removeOption(index)"
            @keydown.enter.prevent="() => removeOption(index)"
          >
            <Icon name="lucide:trash-2"/>
          </button>
        </div>
      </div>
      <div class="px-3">
        <Button
          class="flex gap-2 cursor-pointer"
          type="button"
          @click="() => addOption(true)"
        >
          <Icon name="lucide:plus"/>
          <span>{{ $t('actions.blocks.options.add') }}</span>
        </Button>
      </div>
    </div>

    <FormField
      :label="$t('labels.blocks.fields.default')"
      name="default"
    >
      <template #default="{ id }">
        <Combobox>
          <ComboboxAnchor class="relative w-full">
            <ComboboxInput
              :id="id"
              :model-value="value.default"
              @update:model-value="emit('update:item-value', 'default', $event)"
            />
            <Icon
              v-if="value.default"
              name="lucide:x"
              class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              @click="emit('update:item-value', 'default', undefined)"
            />
          </ComboboxAnchor>

          <ComboboxList>
            <ComboboxGroup>
              <ComboboxItem
                v-for="option in value.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.name }}
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
      </template>
    </FormField>
  </div>
</template>