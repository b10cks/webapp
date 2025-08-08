<script lang="ts" setup>
import AssetBlock from '~/components/editor/AssetBlock.vue'
import { InputField, TextField } from '~/components/ui/form'

const props = defineProps<{
  item: MetaSchema & { key: string }
  modelValue?: unknown
  spaceId: string
}>()

const content = inject('content')

const emit = defineEmits<{
  (e: 'update:model-value', value: unknown): void
}>()

const localValue = ref({ ...props.modelValue })

const updateValue = (key: string, value: unknown) => {
  emit('update:model-value', {
    ...localValue.value,
    [key]: value
  })
}

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue ? { ...newValue } : {}
}, { immediate: true, deep: true })

const serpTitle = computed(() => {
  return localValue.value?.title || content.value.name
})

const serpDescription = computed(() => {
  return localValue.value?.description || ''
})

const serpUrl = computed(() => {
  return `https://example.com${content.value.full_slug}`
})

const truncatedDescription = computed(() => {
  const desc = serpDescription.value
  if (desc.length <= 155) return desc

  // Find the last space before the 155 character limit
  const truncated = desc.substring(0, 155)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
})

const truncatedTitle = computed(() => {
  const title = serpTitle.value
  if (title.length <= 60) return title

  const truncated = title.substring(0, 60)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <InputField
      v-model="localValue.title"
      :name="item.key + '-title'"
      :label="$t('labels.blocks.fields.meta.title')"
      :placeholder="$t('labels.blocks.fields.meta.titlePlaceholder')"
      @update:model-value="updateValue('title', $event)"
    />
    <TextField
      v-model="localValue.description"
      :name="item.key + '-description'"
      :label="$t('labels.blocks.fields.meta.description')"
      :placeholder="$t('labels.blocks.fields.meta.descriptionPlaceholder')"
      @update:model-value="updateValue('description', $event)"
    />
    <template v-if="item.has_og_tags">
      <AssetBlock
        :model-value="localValue.ogImage"
        :space-id="spaceId"
        :item="{ key: 'ogImage', type: 'asset', file_types: ['image'] }"
        @update:model-value="updateValue('ogImage', $event)"
      />
      <InputField
        v-model="localValue.ogTitle"
        :name="item.key + '-ogTitle'"
        :label="$t('labels.blocks.fields.meta.ogTitle')"
        :placeholder="$t('labels.blocks.fields.meta.ogTitlePlaceholder')"
        @update:model-value="updateValue('ogTitle', $event)"
      />
      <TextField
        v-model="localValue.ogDescription"
        :name="item.key + '-ogDescription'"
        :label="$t('labels.blocks.fields.meta.ogDescription')"
        :placeholder="$t('labels.blocks.fields.meta.ogDescriptionPlaceholder')"
        @update:model-value="updateValue('ogDescription', $event)"
      />
    </template>
    <div class="p-3 rounded-lg border-input border bg-background">
      <div class="text-sm text-muted mb-1">
        {{ serpUrl }}
      </div>
      <h3 class="text-lg text-blue-500 font-semibold cursor-pointer mb-1 leading-tight">
        {{ truncatedTitle }}
      </h3>
      <p class="text-sm text-muted leading-relaxed">
        {{ truncatedDescription }}
      </p>
      <div class="mt-3 pt-3 border-t border-border text-xs text-muted flex gap-4">
          <span :class="{ 'text-red-500': serpTitle.length > 60 }">
            Title: {{ serpTitle.length }}/60 chars
          </span>
        <span :class="{ 'text-red-500': serpDescription.length > 155 }">
            Description: {{ serpDescription.length }}/155 chars
          </span>
      </div>
    </div>
  </div>
</template>