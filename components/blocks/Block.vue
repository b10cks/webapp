<script setup lang="ts">

import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from 'reka-ui'
import BooleanBlock from '~/components/blocks/BooleanBlock.vue'
import BlocksBlock from '~/components/blocks/BlocksBlock.vue'
import LinkBlock from '~/components/blocks/LinkBlock.vue'
import NumberBlock from '~/components/blocks/NumberBlock.vue'
import OptionBlock from '~/components/blocks/OptionBlock.vue'
import TextBlock from '~/components/blocks/TextBlock.vue'
import TextareaBlock from '~/components/blocks/TextareaBlock.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import BlockType from '~/components/ui/BlockType.vue'
import { CheckboxField, InputField, TextField } from '~/components/ui/form'
import ReferencesBlock from '~/components/blocks/ReferencesBlock.vue'

const emit = defineEmits(['delete', 'to-page', 'update:name', 'update:item'])

const props = defineProps<{
  item: BooleanSchema | LinkSchema | ReferencesSchema | NumberSchema | OptionSchema | TextSchema | TextareaSchema | BlocksSchema
  pages: EditorPage[]
  currentPage: number
  isOpen: boolean
  name: string
}>()

const localItem = ref({ ...props.item })
const translatable = ['text', 'textarea', 'markdown', 'number', 'link']

const schemas = {
  blocks: BlocksBlock,
  boolean: BooleanBlock,
  link: LinkBlock,
  number: NumberBlock,
  option: OptionBlock,
  reference: ReferencesBlock,
  text: TextBlock,
  textarea: TextareaBlock
}

watch(props.item as SchemaType, (newItem) => {
  localItem.value = { ...newItem }
}, { deep: true })

const updateValue = (key: string, value: unknown) => {
  emit('update:item', {
    ...localItem.value,
    [key]: value
  })
}

</script>

<template>
  <AccordionItem :value="name">
    <AccordionHeader class="flex items-center gap-3 group">
      <div
        class="cursor-ns-resize flex h-full items-center"
        draggable
      >
        <Icon name="lucide:grip-vertical"/>
      </div>
      <BlockType :type="item.type"/>
      <AccordionTrigger class="cursor-pointer flex flex-col grow text-left">
        <h4 class="font-bold">{{ item.name || name }}</h4>
        <div class="text-sm">{{ $t(`labels.blocks.fieldTypes.${item.type}.label`) }}</div>
      </AccordionTrigger>
      <div
        class="ml-auto flex gap-3 items-center group-hover:opacity-100 opacity-0 transition-opacity duration-200 ease-in-out"
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            class="hover:text-primary focus:text-primary cursor-pointer"
            :disabled="pages.length <= 1"
          >
            <Icon name="lucide:folder-input"/>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup :model-value="`${currentPage}`">
              <DropdownMenuRadioItem
                v-for="(page, i) in pages"
                :key="i"
                :value="`${i}`"
                @click="$emit('to-page', i)"
              >
                {{ page.header }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          class="hover:text-destructive focus:text-destructive cursor-pointer"
          type="button"
          @click="$emit('delete', name)"
        >
          <Icon name="lucide:trash-2"/>
        </button>
        <AccordionTrigger class="cursor-pointer">
          <Icon
            name="lucide:chevron-down"
            :class="['transition-transform duration-200 ease-in-out', isOpen && 'rotate-180']"
          />
        </AccordionTrigger>
      </div>
    </AccordionHeader>
    <AccordionContent class="flex flex-col gap-6 p-2 pt-4">
      <InputField
        :model-value="name"
        :label="$t('labels.blocks.fields.slug')"
        name="key"
        disabled
      />
      <InputField
        :model-value="localItem.name"
        :label="$t('labels.blocks.fields.name')"
        name="name"
        @update:model-value="(v) => updateValue('name', v)"
      />
      <TextField
        :model-value="localItem.description"
        :label="$t('labels.blocks.fields.description')"
        name="description"
        @update:model-value="(v) => updateValue('description', v)"
      />
      <CheckboxField
        :model-value="localItem.required"
        name="required"
        :label="$t('labels.blocks.fields.required')"
        :tooltip="$t('labels.blocks.fields.requiredTooltip')"
        @update:model-value="(v) => updateValue('required', v)"
      />
      <CheckboxField
        v-if="translatable.includes(item.type)"
        :model-value="localItem.translatable"
        name="translatable"
        :label="$t('labels.blocks.fields.translatable')"
        :tooltip="$t('labels.blocks.fields.translatableTooltip')"
        @update:model-value="(v) => updateValue('translatable', v)"
      />
      <component
        :is="schemas[localItem.type]"
        :value="item as SchemaType"
        @update:item-value="(key, value) => updateValue(key, value)"
      />
    </AccordionContent>
  </AccordionItem>
</template>