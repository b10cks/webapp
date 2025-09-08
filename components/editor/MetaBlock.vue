<script lang="ts" setup>
import AssetBlock from '~/components/editor/AssetBlock.vue'
import { InputField, TextField } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { toast } from 'vue-sonner'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  item: MetaSchema & { key: string }
  modelValue?: unknown
  spaceId: string
}>()

const content = inject('content')
const { client: apiClient } = useApiClient()

const emit = defineEmits<{
  (e: 'update:model-value', value: unknown): void
}>()

const localValue = ref({ ...props.modelValue })
const isGenerating = ref(false)

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

const generateMetaWithAI = async () => {
  try {
    isGenerating.value = true
    const requestData = {
      name: content.value.name,
      slug: content.value.full_slug,
      body: content.value.content || '',
      current_meta: {
        title: localValue.value?.title || '',
        description: localValue.value?.description || '',
        ogTitle: localValue.value?.ogTitle || '',
        ogDescription: localValue.value?.ogDescription || ''
      }
    }

    const response = await apiClient.post<ApiResponse<{
      title: string
      description: string
      ogTitle: string
      ogDescription: string
    }>>('mgmt/v1/ai/meta-tags', { context: requestData }, { query: { spaceId: props.spaceId } })

    // Update local values and emit changes
    const generatedMeta = response.data
    const newValue = {
      ...localValue.value,
      title: generatedMeta.title,
      description: generatedMeta.description,
      ...(props.item.has_og_tags && {
        ogTitle: generatedMeta.ogTitle,
        ogDescription: generatedMeta.ogDescription
      })
    }

    localValue.value = newValue
    emit('update:model-value', newValue)

    toast.success('Meta tags generated successfully!')
  } catch (error) {
    toast.error(`Meta generation failed: ${error.message}`)
  } finally {
    isGenerating.value = false
  }
}

const hasContent = computed(() => {
  return content.value?.name || content.value?.content
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-primary">Meta Tags</h3>
      <Button
        size="sm"
        :disabled="isGenerating || !hasContent"
        class="flex items-center gap-2"
        @click="generateMetaWithAI"
      >
        <Icon
          v-if="isGenerating"
          name="lucide:loader"
          class="animate-spin text-ai"
        />
        <Icon
          v-else
          name="lucide:sparkles"
          class="text-ai"
        />
        <span>{{ isGenerating ? 'Generating...' : 'AI Generate' }}</span>
      </Button>
    </div>

    <InputField
      v-model="localValue.title"
      :name="item.key + '-title'"
      :label="$t('labels.contents.fields.meta.title')"
      :placeholder="$t('labels.contents.fields.meta.titlePlaceholder')"
      :disabled="isGenerating"
      @update:model-value="updateValue('title', $event)"
    />
    <TextField
      v-model="localValue.description"
      :name="item.key + '-description'"
      :label="$t('labels.contents.fields.meta.description')"
      :placeholder="$t('labels.contents.fields.meta.descriptionPlaceholder')"
      :disabled="isGenerating"
      auto-size
      @update:model-value="updateValue('description', $event)"
    />
    <InputField
      v-model="localValue.canonical"
      :name="item.key + '-canonical'"
      :label="$t('labels.contents.fields.meta.canonical')"
      :tooltip="$t('labels.contents.fields.meta.canonicalDescription')"
      :disabled="isGenerating"
      @update:model-value="updateValue('title', $event)"
    />
    <InputField
      v-model="localValue.robots"
      :name="item.key + '-robots'"
      :label="$t('labels.contents.fields.meta.robots')"
      :tooltip="$t('labels.contents.fields.meta.robotsDescription')"
      :disabled="isGenerating"
      @update:model-value="updateValue('title', $event)"
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
        :label="$t('labels.contents.fields.meta.ogTitle')"
        :placeholder="$t('labels.contents.fields.meta.ogTitlePlaceholder')"
        :disabled="isGenerating"
        @update:model-value="updateValue('ogTitle', $event)"
      />
      <TextField
        v-model="localValue.ogDescription"
        :name="item.key + '-ogDescription'"
        :label="$t('labels.contents.fields.meta.ogDescription')"
        :placeholder="$t('labels.contents.fields.meta.ogDescriptionPlaceholder')"
        :disabled="isGenerating"
        auto-size
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