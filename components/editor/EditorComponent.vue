<script setup lang="ts">

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import FieldEditor from '~/components/editor/FieldEditor.vue'
import ContentBreadcrumbs from '~/components/editor/ContentBreadcrumbs.vue'
import { useContentTree } from '~/composables/useContentTree'
import { useGlobalClipboard } from '~/composables/useGlobalClipboard'
import type { ContentBlock } from '~/types/contents'
import { useElementHover } from '@vueuse/core'
import { Button } from '~/components/ui/button'

interface EditorPage {
  header: string
  items: string[]
}

interface BlockResource {
  id: string
  name: string
  slug: string
  editor: EditorPage[]
  schema?: Record<string, unknown>
}

interface ContentItem {
  item: Record<string, unknown> & {
    block?: string
  }
}

interface Breadcrumb {
  id: string
  label: string
}

type HoverUpdateFunction = (data: string | null) => void
type PreviewUpdateFunction = (data: Record<string, unknown>) => void

const content = defineModel<Record<string, unknown>>()
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const isHovered = useElementHover(containerRef)

const props = withDefaults(defineProps<{
  blockId?: string | null
  blockSlug?: string | null
  spaceId: string
  isChild?: boolean
  rootId?: string
  itemId?: string | null
}>(), {
  blockId: null,
  blockSlug: null,
  rootId: undefined,
  isChild: false,
  itemId: null
})

const emit = defineEmits<{
  (e: 'navigate', itemId: string | null): void
}>()

const hoverRegistry = inject<Map<string, boolean>>('hoverRegistry', new Map())
const componentId = computed((): string => (content.value?.id || props.itemId || '') as string)

provide('hoverRegistry', hoverRegistry)

const updateHoverItem = inject<HoverUpdateFunction>('updateHoverItem')

const updateRegistry = (isComponentHovered: boolean): void => {
  hoverRegistry.set(componentId.value, isComponentHovered)
  let innermostId: string | null = null
  for (const [id, hovered] of hoverRegistry.entries()) {
    if (hovered) {
      innermostId = id
    }
  }
  if (updateHoverItem) {
    updateHoverItem(innermostId)
  }
}

watch(isHovered, (hovered: boolean) => {
  updateRegistry(hovered)
}, { immediate: true })

onBeforeUnmount(() => {
  hoverRegistry.delete(componentId.value)
})

// Initialize on mount
onMounted(() => {
  updateRegistry(isHovered.value)
})

const { useBlocksQuery, getBlockById, getBlockBySlug } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 1000 })

const rootBlock = inject<ContentBlock>('rootBlock')
const updatePreviewItem = inject<PreviewUpdateFunction>('updatePreviewItem')

const contentTree = useContentTree(content, rootBlock)
const currentItem = computed((): ContentItem | null => props.itemId ? contentTree.findItemById(props.itemId) : null)
const breadcrumbs = computed((): Breadcrumb[] => props.itemId ? contentTree.buildBreadcrumbs(props.itemId) : [])
const id = computed((): string => props.itemId || rootBlock?.slug || '')

const currentBlock = computed((): BlockResource | null => {
  if (!currentItem.value) {
    if (props.blockSlug) {
      return getBlockBySlug(blocks.value, props.blockSlug)
    }
    return getBlockById(blocks.value, props.blockId)
  }

  if (currentItem.value.item.block) {
    return getBlockBySlug(blocks.value, currentItem.value.item.block)
  }

  return null
})

const handleBreadcrumbNavigation = (itemId: string | null): void => {
  emit('navigate', itemId)
}

const updateSubItem = (updatedValue: unknown): void => {
  if (!props.itemId || !currentItem.value || !updatePreviewItem) return

  updatePreviewItem(updatedValue as Record<string, unknown>)
  contentTree.updateItem(props.itemId, updatedValue)
}

const updateItem = (updatedValue: unknown): void => {
  if (!updatePreviewItem) return
  
  updatePreviewItem({ 
    id: props.rootId, 
    ...(updatedValue as Record<string, unknown>) 
  })
}
</script>

<template>
  <div
    ref="containerRef"
    class="flex flex-col w-full"
  >
    <ContentBreadcrumbs
      v-if="breadcrumbs.length > 0"
      :breadcrumbs="breadcrumbs"
      @navigate="handleBreadcrumbNavigation"
    />
    <h2
      v-if="!isChild"
      class="text-xl font-bold mb-2 text-primary"
    >
      {{ currentBlock?.name || currentBlock?.slug }}
    </h2>
    <TabsRoot
      :key="`${id}-tabs`"
      :default-value="`${id}-page-0`"
    >
      <TabsList
        v-if="currentBlock?.editor?.length > 1"
        class="bg-input flex items-center gap-1 rounded-xl p-1 mb-4 w-full"
      >
        <TabsTrigger
          v-for="(page, i) in currentBlock.editor"
          :key="i"
          :value="`${id}-page-${i}`"
          class="transition-colors text-sm font-semibold hover:text-primary data-[state=active]:text-primary data-[state=active]:bg-background rounded-lg px-2 py-1"
        >
          {{ page.header }}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        v-for="(page, i) in currentBlock?.editor"
        :key="i"
        :value="`${id}-page-${i}`"
      >
        <div class="grid gap-4 items-start">
          <template v-if="currentItem">
            <FieldEditor
              v-for="item in page?.items"
              :key="item"
              v-model="currentItem.item"
              :item="currentBlock?.schema?.[item]"
              :space-id="spaceId"
              @update:model-value="updateSubItem"
            />
          </template>
          <template v-else>
            <FieldEditor
              v-for="item in page?.items"
              :key="item"
              v-model="content"
              :item="currentBlock?.schema?.[item]"
              :space-id="spaceId"
              @update:model-value="updateItem"
            />
          </template>
        </div>
      </TabsContent>
    </TabsRoot>
  </div>
</template>