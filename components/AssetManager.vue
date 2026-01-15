<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import AssetFolderTree from '~/components/assets/AssetFolderTree.vue'
import AssetGrid from '~/components/assets/AssetGrid.vue'
import AssetTagTree from '~/components/assets/AssetTagTree.vue'
import { ScrollArea } from '~/components/ui/scroll-area'

const tabs = {
  folders: {
    icon: 'lucide:folder',
    label: 'Folders',
  },
  tags: {
    icon: 'lucide:tag',
    label: 'Tags',
  },
}

const selectedFolder = defineModel<string | null>('folderId', {
  default: null,
})

defineProps<{
  spaceId: string
}>()

const selectedTag = ref<string | null>(null)
const mode = ref<'folders' | 'tags'>('folders')

watch(mode, (newMode) => {
  if (newMode === 'folders') {
    selectedTag.value = null
  } else {
    selectedFolder.value = null
  }
})
</script>

<template>
  <div class="flex w-full">
    <div class="w-xs overflow-hidden shrink-0 p-2 h-[calc(100vh-3.5rem)] flex flex-col sticky top-14">
      <TabsRoot
        v-model="mode"
        default-value="folders"
      >
        <TabsList class="bg-input flex items-center gap-1 rounded-xl p-1 mb-4 w-full">
          <TabsTrigger
            v-for="({ icon, label }, key) in tabs"
            :key="key"
            :value="key"
            class="grow justify-center flex items-center gap-2 transition-colors text-sm font-semibold  hover:text-primary data-[state=active]:text-primary data-[state=active]:bg-gray-900 rounded-lg px-2 py-1"
          >
            <Icon :name="icon"/>
            <span>{{ label }}</span>
          </TabsTrigger>
        </TabsList>
        <ScrollArea class="flex-1 overflow-y-auto">
          <TabsContent value="folders">
            <AssetFolderTree
              v-model="selectedFolder"
              :space-id="spaceId"
            />
          </TabsContent>
          <TabsContent value="tags">
            <AssetTagTree
              v-model="selectedTag"
              :space-id="spaceId"
            />
          </TabsContent>
        </ScrollArea>
      </TabsRoot>
    </div>
    <div class="bg-background grow p-6">
      <AssetGrid
        v-model:folder-id="selectedFolder"
        v-model:tag-id="selectedTag"
        :space-id="spaceId"
      />
    </div>
  </div>
</template>