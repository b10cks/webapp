<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import Preview from '~/components/Preview.vue'
import ContentInfo from '~/components/ContentInfo.vue'
import ContentSettings from '~/components/ContentSettings.vue'
import type { ContentResource } from '~/types/contents'
import HeaderActions from '~/components/content/HeaderActions.vue'
import { ScrollArea } from '~/components/ui/scroll-area'
import { SimpleTooltip } from '~/components/ui/tooltip'
import ContentHeader from '~/components/content/ContentHeader.vue'
import EditorComponent from '~/components/editor/EditorComponent.vue'

const route = useRoute()
const router = useRouter()
const spaceId = computed<string>(() => route.params.space as string)
const contentId = computed<string>(() => route.params.contentId as string)

const { useContentQuery } = useContent(spaceId)
const { useBlocksQuery } = useBlocks(spaceId)

const { data: originalContent } = useContentQuery(contentId)

const content = ref<ContentResource>(null)
watch(originalContent, (newContent) => {
  if (newContent) {
    content.value = JSON.parse(JSON.stringify(newContent))
  }
}, { immediate: true })

const selectedItemId = computed({
  get: () => route.hash ? route.hash.substring(1) : null,
  set: (newId) => {
    if (newId) {
      router.replace({ ...route, hash: `#${newId}` })
    } else {
      router.replace({ ...route, hash: '' })
    }
  }
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
  })
})

const rootBlock = computed(() => {
  if (!content.value) return null

  const block = content.value.block
  if (block) {
    return block
  }

  return null
})

const updatePreviewItem = (item: never) => {
  previewRef.value.updateItem({ ...item })
}

const findNestedObjectById = (data: Array<object> | object & { id: string }, id: string): unknown => {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findNestedObjectById(item, id)
      if (result) return result
    }
  } else if (data && typeof data === 'object') {
    if (data.id === id) return data
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const result = findNestedObjectById(data[key], id)
        if (result) return result
      }
    }
  }
  return null
}

const updateField = (update: FieldUpdateEvent) => {
  if (!content.value) return

  const target = findNestedObjectById(content.value.content, update.itemId)
  target[update.field] = update.value
}

// const updateField = ({ itemId, field, value }) => {
// console.log('Update field:', itemId, field, value)
// console.log('Content before update:', content.value)

// const block
// const temp = content.value.content
// }


provide('rootBlock', rootBlock)
provide('updatePreviewItem', updatePreviewItem)
provide('updateHoverItem', (id) => previewRef.value && previewRef.value.updateHover(id))

</script>

<template>
  <div class="flex grow">
    <Preview
      ref="previewRef"
      :full-slug="content?.full_slug"
      :item-id="selectedItemId"
      :space-id="spaceId"
      @select-item="(itemId) => selectedItemId = itemId"
      @update-field="updateField"
    />
    <TabsRoot
      class="flex w-2xl"
      default-value="edit"
      orientation="vertical"
    >
      <ScrollArea
        v-if="content"
        class="overflow-y-scroll grow max-h-[calc(100svh-3.5rem)]"
      >
        <TabsContent
          value="edit"
          class="p-4"
        >
          <EditorComponent
            v-model="content.content"
            :block-id="content.block.id"
            :space-id="spaceId"
            :item-id="selectedItemId"
            @navigate="handleNavigate"
          />
        </TabsContent>
        <TabsContent
          value="info"
          class="p-4"
        >
          <ContentInfo :content="content"/>
        </TabsContent>
        <TabsContent
          value="config"
          class="p-4"
        >
          <ContentSettings v-model="content"/>
        </TabsContent>
      </ScrollArea>
      <div
        v-else
        class="grow"
      />
      <TabsList class="flex h-full w-14 flex-col border-l border-l-border p-3 shrink-0">
        <div class="flex min-h-0 flex-1 flex-col overflow-auto">
          <div class="relative flex w-full min-w-0 flex-col gap-3">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="flex items-center justify-center size-8 rounded-lg hover:bg-input transition-colors duration-200 ease-butter data-[state=inactive]:cursor-pointer data-[state=active]:text-primary data-[state=active]:bg-input"
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
