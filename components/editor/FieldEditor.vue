<script setup lang="ts">
import TextBlock from '~/components/editor/TextBlock.vue'
import NumberBlock from '~/components/editor/NumberBlock.vue'
import BlocksBlock from '~/components/editor/BlocksBlock.vue'
import TextareaBlock from '~/components/editor/TextareaBlock.vue'
import OptionBlock from '~/components/editor/OptionBlock.vue'
import BooleanBlock from '~/components/editor/BooleanBlock.vue'
import MarkdownBlock from '~/components/editor/MarkdownBlock.vue'
import LinkBlock from '~/components/editor/LinkBlock.vue'
import AssetBlock from '~/components/editor/AssetBlock.vue'
import MultiAssetsBlock from '~/components/editor/MultiAssetsBlock.vue'
import ReferenceBlock from '~/components/editor/ReferenceBlock.vue'
import MetaBlock from '~/components/editor/MetaBlock.vue'
import DateBlock from '~/components/editor/DateBlockEditor.vue'

const editors = {
  text: TextBlock,
  textarea: TextareaBlock,
  markdown: MarkdownBlock,
  option: OptionBlock,
  link: LinkBlock,
  boolean: BooleanBlock,
  blocks: BlocksBlock,
  number: NumberBlock,
  asset: AssetBlock,
  multiAsset: MultiAssetsBlock,
  reference: ReferenceBlock,
  meta: MetaBlock,
  date: DateBlock
} as const

const props = defineProps<{
  item: SchemaType & { key: string }
  modelValue: Record<string, unknown>
  spaceId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

// const updatePreviewItem = inject<(data: never) => void>('updatePreviewItem')

const fieldValue = computed({
  get() {
    return props.modelValue[props.item.key]
  },
  set(newValue) {
    if (newValue === props.modelValue[props.item.key]) return

    const updatedModel = { ...props.modelValue }

    if (Array.isArray(newValue)) {
      updatedModel[props.item.key] = [...newValue]
    } else {
      updatedModel[props.item.key] = newValue
    }

    // Emit the update with the new object
    emit('update:modelValue', updatedModel)
  }
})

</script>

<template>
  <div>
    <component
      :is="editors[item.type]"
      v-if="item.type in editors"
      v-model="fieldValue"
      :item="item"
      :space-id="spaceId"
    />
    <div v-else>
      Unknown editor type: {{ item.type }}
    </div>
  </div>
</template>