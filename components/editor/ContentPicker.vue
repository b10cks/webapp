<template>
  <Dialog
    :open="open"
    @update:open="$emit('update:open', $event)"
  >
    <DialogContent class="max-w-3xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <ScrollArea class="h-[500px] pr-4">
        <TreeRoot
          v-slot="{ flattenItems }"
          class="list-none select-none w-full"
          :items="rootItems"
          :get-key="(item) => item?.id"
          :get-children="(item) => getChildren(contentMenu, item.id)"
        >
          <div class="space-y-1">
            <template
              v-for="item in flattenItems"
              :key="item._id"
            >
              <TreeItem
                v-slot="{ isExpanded }"
                :style="{ 'padding-left': `${item.level * 0.5}rem` }"
                v-bind="item.bind"
                :class="[
                  'group relative flex items-center pl-0 pr-2 my-0.5 rounded-md outline-none gap-2',
                  'hover:bg-border transition-colors duration-200',
                  'cursor-pointer font-semibold'
                ]"
              >
                <div class="flex items-center gap-2 flex-1">
                  <span
                    v-if="item.value.children"
                    class="w-3 h-4"
                  >
                    <Icon
                      name="lucide:chevron-right"
                      :class="['transition-transform duration-200', isExpanded && 'rotate-90']"
                    />
                  </span>
                  <span
                    v-else
                    class="size-3"
                  />
                  <button
                    class="cursor-pointer hover:text-primary flex items-center gap-2 grow"
                    tabindex="-1"
                    @click="selectContent(item.value.id)"
                  >
                    <Icon
                      :name="`lucide:${item.value.icon}`"
                      class="shrink-0"
                      :style="{ color: item.value.color }"
                    />
                    <span class="truncate">{{ item.value.name }}</span>
                  </button>
                </div>
                <Button
                  v-if="showElements"
                  variant="ghost"
                  size="sm"
                  class="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                  @click.stop="toggleElementsView(item.value.id)"
                >
                  <Icon
                    name="lucide:arrow-right"
                    class="w-3 h-3 text-accent-foreground"
                  />
                </Button>
              </TreeItem>

              <!-- Page Elements Section -->
              <div
                v-if="showElements && showElementsForContent === item.value.id"
                class="p-4 bg-surface rounded-md border space-y-2"
                :style="{ 'margin-left': `${(item.level + 1) * 1.5}rem` }"
              >
                <h4 class="font-semibold mb-3 text-sm text-primary flex items-center gap-2">
                  <Icon
                    name="lucide:hash"
                    class="w-4 h-4"
                  />
                  {{ $t('labels.content.pageElements') }}
                </h4>
                <div class="grid gap-2">
                  <div
                    v-for="element in getContentElements(item.value.id)"
                    :key="element.id"
                    class="flex items-center justify-between p-3 hover:bg-input rounded cursor-pointer border"
                    @click="selectContentWithAnchor(item.value.id, element.id)"
                  >
                    <div class="flex items-center gap-2">
                      <Icon
                        name="lucide:bookmark"
                        class="w-4 h-4 text-muted-foreground"
                      />
                      <span class="text-sm font-medium">{{ element.name }}</span>
                    </div>
                    <Icon
                      name="lucide:external-link"
                      class="w-4 h-4 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </TreeRoot>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { TreeItem, TreeRoot } from 'reka-ui'

interface ContentElement {
  id: string
  name: string
}

const props = defineProps<{
  open: boolean
  spaceId: string
  title?: string
  showElements?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'content-select': [contentId: string]
  'content-with-anchor-select': [contentId: string, anchorId: string]
}>()

const { $t } = useI18n()
const { useContentMenuQuery, getRootItems, getChildren } = useContentMenu(props.spaceId)
const { data: contentMenu } = useContentMenuQuery()

const rootItems = computed(() => getRootItems(contentMenu.value) || [])
const showElementsForContent = ref<string | null>(null)

// Get content elements for selected page (mock implementation)
const getContentElements = (contentId: string): ContentElement[] => {
  return [
    { id: 'header', name: $t('labels.content.elements.header') },
    { id: 'main-content', name: $t('labels.content.elements.mainContent') },
    { id: 'sidebar', name: $t('labels.content.elements.sidebar') },
    { id: 'footer', name: $t('labels.content.elements.footer') }
  ]
}

const selectContent = (contentId: string) => {
  emit('content-select', contentId)
}

const selectContentWithAnchor = (contentId: string, anchorId: string) => {
  emit('content-with-anchor-select', contentId, anchorId)
  showElementsForContent.value = null
}

const toggleElementsView = (contentId: string) => {
  showElementsForContent.value = showElementsForContent.value === contentId ? null : contentId
}
</script>