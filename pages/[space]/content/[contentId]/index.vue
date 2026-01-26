<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import ContentHeader from '~/components/content/ContentHeader.vue'
import HeaderActions from '~/components/content/HeaderActions.vue'
import ContentInfo from '~/components/ContentInfo.vue'
import ContentSettings from '~/components/ContentSettings.vue'
import EditorComponent from '~/components/editor/EditorComponent.vue'
import Preview from '~/components/Preview.vue'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { SimpleTooltip } from '~/components/ui/tooltip'
import { useGlobalClipboard } from '~/composables/useGlobalClipboard'
import type { ContentResource } from '~/types/contents'

const route = useRoute()
const router = useRouter()
const spaceId = computed<string>(() => route.params.space as string)
const contentId = computed<string>(() => route.params.contentId as string)

const { hasClipboardItem, clearClipboard } = useGlobalClipboard()

const { useContentQuery } = useContent(spaceId)
const { data: originalContent } = useContentQuery(contentId)

const content = ref<ContentResource | null>(null)
watch(
  originalContent,
  (newContent) => {
    if (newContent) {
      content.value = JSON.parse(JSON.stringify(newContent))
    }
  },
  { immediate: true }
)

const selectedItemId = computed({
  get: () => (route.hash ? route.hash.substring(1) : null),
  set: (newId) => {
    if (newId) {
      router.replace({ ...route, hash: `#${newId}` })
    } else {
      router.replace({ ...route, hash: '' })
    }
  },
})

const handleNavigate = (itemId: string | null) => {
  selectedItemId.value = itemId
}

const previewRef = useTemplateRef('previewRef')

const tabs = [
  { value: 'edit', icon: 'lucide:pencil', label: 'Edit' },
  { value: 'config', icon: 'lucide:wrench', label: 'Config' },
  { value: 'info', icon: 'lucide:badge-info', label: 'Info' },
]

// Update page title
useSeoMeta({
  title: computed(() => {
    return content.value?.name
  }),
})

const rootBlock = computed(() => {
  if (!content.value) return null

  const block = content.value.block
  if (block) {
    return block
  }

  return null
})

const updatePreviewItem = (item: Record<string, unknown>) => {
  if (previewRef.value) {
    previewRef.value.updateItem({ ...item })
  }
}

const findNestedObjectById = (data: unknown[], id: string): Record<string, unknown> | null => {
  for (const item of data) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>
      if (obj.id === id) return obj

      // Search in nested arrays
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && Array.isArray(obj[key])) {
          const result = findNestedObjectById(obj[key] as unknown[], id)
          if (result) return result
        }
      }
    }
  }
  return null
}

const updateField = (update: { itemId: string; field: string; value: unknown }) => {
  if (!content.value?.content || !Array.isArray(content.value.content)) return

  const target = findNestedObjectById(content.value.content, update.itemId)
  if (target) {
    target[update.field] = update.value
  }
}

provide('content', content)
provide('rootBlock', rootBlock)
provide('updatePreviewItem', updatePreviewItem)
provide('updateHoverItem', (id: string) => {
  if (previewRef.value) {
    previewRef.value.updateHover(id)
  }
})
</script>

<template>
  <div class="flex grow">
    <Preview
      ref="previewRef"
      :full-slug="content?.full_slug"
      :content-id="content?.id"
      :updated-at="content?.updated_at"
      :item-id="selectedItemId"
      :space-id="spaceId"
      @select-item="(itemId) => (selectedItemId = itemId)"
      @update-field="updateField"
    />
    <TabsRoot
      class="flex w-2xl"
      default-value="edit"
      orientation="vertical"
    >
      <ScrollArea
        v-if="content"
        class="max-h-[calc(100svh-3.5rem)] grow overflow-y-scroll"
      >
        <TabsContent
          value="edit"
          class="p-4 select-none"
        >
          <EditorComponent
            v-model="content.content"
            :root-id="content.id"
            :block-id="content.block.id"
            :space-id="spaceId"
            :item-id="selectedItemId"
            @navigate="handleNavigate"
          />
          <Button
            v-if="hasClipboardItem"
            title="Clear clipboard"
            size="xs"
            variant="ghost"
            class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2"
            @click="clearClipboard"
          >
            <Icon name="lucide:trash-2" />
            <span>Clear Clipboard</span>
          </Button>
        </TabsContent>
        <TabsContent
          value="info"
          class="p-4"
        >
          <ContentInfo :content="content" />
        </TabsContent>
        <TabsContent
          value="config"
          class="p-4"
        >
          <ContentSettings v-model="content" />
        </TabsContent>
      </ScrollArea>
      <div
        v-else
        class="grow"
      />
      <TabsList class="flex h-full w-14 shrink-0 flex-col border-l border-l-border p-3 select-none">
        <div class="flex min-h-0 flex-1 flex-col overflow-auto">
          <div class="relative flex w-full min-w-0 flex-col gap-2">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 ease-butter hover:bg-input data-[state=active]:bg-input data-[state=active]:text-primary data-[state=inactive]:cursor-pointer"
            >
              <SimpleTooltip
                :tooltip="tab.label"
                side="left"
                class="flex cursor-pointer"
              >
                <Icon
                  :name="tab.icon"
                  size="1.25rem"
                />
              </SimpleTooltip>
            </TabsTrigger>
          </div>
        </div>
      </TabsList>
    </TabsRoot>

    <Teleport to="#appHeader">
      <ContentHeader
        v-if="content"
        :content="content"
      />
    </Teleport>

    <Teleport to="#appHeaderActions">
      <HeaderActions
        v-if="content"
        :content="content"
        :space-id="spaceId"
      />
    </Teleport>
  </div>
</template>
