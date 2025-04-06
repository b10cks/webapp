<script setup lang="ts">
import { TabsList, TabsRoot, TabsTrigger, TreeItem, TreeRoot } from 'reka-ui'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import CreateBlockFolderDialog from '~/components/blocks/CreateBlockFolderDialog.vue'
import type { BlockFolderResource } from '~/api/resources/block-folders'

const mode = defineModel<'list' | 'tags'>('mode', {
  default: 'list'
})

const selectedFolder = defineModel<string>('selectedFolder')

const props = defineProps<{
  spaceId: string
}>()

const { $t } = useI18n()
const { alert } = useAlertDialog()

const { useBlocksQuery } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 500 })

const { useFolderStructure, useDeleteBlockFolderMutation } = useBlockFolders(props.spaceId)
const { rootFolders, getChildrenOfFolder } = useFolderStructure()
const { mutate: deleteBlockFolder } = useDeleteBlockFolderMutation()

const { useBlockTagsQuery } = useBlockTags(props.spaceId)
const { data: blockTags } = useBlockTagsQuery({ per_page: 500 })

const showCreateFolderDialog = ref(false)

function handleSelectFolder(folder?: BlockFolderResource) {
  selectedFolder.value = folder ? folder?.id : undefined
  mode.value = 'list'
}

const initDeleteFolder = async (folder: BlockFolderResource) => {
  const confirmed = await alert.confirm(
    `Are you sure you want to delete the folder "${folder.name}"?`,
    {
      title: 'Delete Block',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }
  )

  if (confirmed) {
    deleteBlockFolder(folder.id)
    if (selectedFolder.value === folder.id) {
      selectedFolder.value = folder.parent_id || null
    }
  }
}

const tabs = computed(() => ({
  list: {
    icon: 'lucide:blocks',
    label: $t('labels.blocks.title'),
    count: blocks.value?.data.length || 0
  },
  tags: {
    icon: 'lucide:tag',
    label: $t('labels.blockTags.title'),
    count: blockTags.value?.data.length || 0
  },
}))

</script>

<template>
  <div class="min-w-2xs p-2">
    <TabsRoot
      v-model="mode"
      default-value="list"
    >
      <TabsList class="bg-input flex flex-col rounded-md p-1 mb-6 w-full">
        <TabsTrigger
          v-for="({ icon, label, count }, key) in tabs"
          :key="key"
          :value="key"
          class="w-full flex items-center gap-2 cursor-pointer transition-colors text-sm font-semibold hover:text-primary data-[state=active]:text-primary data-[state=active]:bg-gray-900 rounded-md p-2"
        >
          <Icon :name="icon"/>
          <span>{{ label }}</span>
          <Badge
            class="ml-auto"
            size="xs"
            variant="outline"
          >{{ count }}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <ScrollArea class="overflow-y-scroll grow">
        <TreeRoot
          v-slot="{ flattenItems }"
          class="list-none select-none w-full"
          :items="rootFolders"
          :get-key="(item) => item?.id"
          :get-children="(folder) => getChildrenOfFolder(folder?.id)"
        >
          <div class="flex px-1 mb-2 items-center">
            <h2 class="font-semibold text-sm text-primary">
              {{ $t('labels.blockFolders.title') }}
            </h2>
            <Button
              class="ml-auto"
              size="xs"
              @click="showCreateFolderDialog = true"
            >
              <Icon name="lucide:plus"/>
            </Button>
          </div>
          <div
            :class="[
              'group relative flex items-center py-1 pl-2 pr-2 my-0.5 rounded-md outline-none gap-2',
              'hover:bg-input transition-colors duration-200',
              'cursor-pointer font-semibold',
             !selectedFolder && mode === 'list' ? 'bg-input text-primary' : '']"
            @click="handleSelectFolder()"
            @keydown.enter="handleSelectFolder()"
          >
            <Icon name="lucide:folder"/>
            <span>{{ $t('labels.blockFolders.allBlocks') }}</span>
          </div>
          <TreeItem
            v-for="item in flattenItems"
            :key="item._id"
            :style="{ 'padding-left': `${item.level - 0.5}rem` }"
            :class="[
              'group relative flex items-center py-1 pl-0 pr-2 my-0.5 rounded-md outline-none gap-2',
              'hover:bg-input transition-colors duration-200',
              'cursor-pointer font-semibold',
              item.value.id === selectedFolder ? 'bg-input text-primary' : ''
            ]"
            @select="handleSelectFolder(item.value)"
          >
            <Icon
              v-if="item.value.icon"
              :name="`lucide:${item.value.icon}`"
              :style="{ color: item.value.color }"
            />
            <div class="truncate">
              {{ item.value.name }}
            </div>
            <div
              class="bg-border absolute right-2 overflow-clip group-hover:w-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1"
            >
              <button
                type="button"
                title="Delete block"
                class="transform cursor-pointer hover:text-red-500 flex items-center p-1"
                @click.stop="initDeleteFolder(item.value)"
              >
                <Icon
                  name="lucide:trash-2"
                  size="14"
                />
              </button>
            </div>
          </TreeItem>
        </TreeRoot>
      </ScrollArea>
    </TabsRoot>

    <CreateBlockFolderDialog
      v-model:open="showCreateFolderDialog"
      :space-id="spaceId"
    />
  </div>
</template>