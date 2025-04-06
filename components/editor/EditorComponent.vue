<script setup lang="ts">

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import FieldEditor from '~/components/editor/FieldEditor.vue'
import ContentBreadcrumbs from '~/components/editor/ContentBreadcrumbs.vue'
import { useContentTree } from '~/composables/useContentTree'
import type { ContentBlock } from '~/types/contents'
import { useElementHover } from '@vueuse/core'

const content = defineModel<Record<string, unknown>>()
const containerRef = useTemplateRef('containerRef')
const isHovered = useElementHover(containerRef)

const props = withDefaults(defineProps<{
  blockId?: string
  blockSlug?: string
  spaceId: string
  isChild?: boolean
  itemId?: string | null
}>(), {
  blockId: null,
  blockSlug: null,
  isChild: false,
  itemId: null
})

const emit = defineEmits<{
  (e: 'navigate', itemId: string | null): void
}>()

const hoverRegistry = inject<Map<string, boolean>>('hoverRegistry', new Map())
const componentId = computed(() => content.value.id || props.itemId)

provide('hoverRegistry', hoverRegistry)

const updateHoverItem = inject<(data: never) => void>('updateHoverItem')

const updateRegistry = (isComponentHovered: boolean) => {
  hoverRegistry.set(componentId.value, isComponentHovered)
  let innermostId = null
  for (const [id, hovered] of hoverRegistry.entries()) {
    if (hovered) {
      innermostId = id
    }
  }
  if (updateHoverItem) {
    updateHoverItem(innermostId as never)
  }
}

watch(isHovered, (hovered) => {
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
const { data: blocks } = useBlocksQuery()

const rootBlock = inject<ContentBlock>('rootBlock')
const updatePreviewItem = inject<(data: never) => void>('updatePreviewItem')

watch(content, () => {
  console.log('Content updated:', content.value)
})

const contentTree = useContentTree(content, rootBlock)
const currentItem = computed(() => props.itemId ? contentTree.findItemById(props.itemId) : null)
const breadcrumbs = computed(() => props.itemId ? contentTree.buildBreadcrumbs(props.itemId) : [])
const id = computed(() => props.itemId || rootBlock.slug)

const currentBlock = computed(() => {
  if (!currentItem.value) {
    if (props.blockSlug) {
      return getBlockBySlug(blocks, props.blockSlug)
    }
    return getBlockById(blocks, props.blockId)
  }

  if (currentItem.value.item.block) {
    return getBlockBySlug(blocks, currentItem.value.item.block)
  }

  return null
})

const handleBreadcrumbNavigation = (itemId: string | null) => {
  emit('navigate', itemId)
}

const updateSubItem = (updatedValue: unknown) => {
  if (!props.itemId || !currentItem.value) return

  updatePreviewItem(updatedValue)
  contentTree.updateItem(props.itemId, updatedValue)
}
const updateItem = (updatedValue: unknown) => {
  updatePreviewItem(updatedValue)
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
              @update:m-odel-value="updateItem"
            />
          </template>
        </div>
      </TabsContent>
    </TabsRoot>
  </div>
</template>