<script setup lang="ts">

import { Checkbox } from '~/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'

const { formatFileSize } = useFormat()
const { getFileIcon, getFileType } = useFileUtils()

export interface AssetItemProps {
  asset: AssetResource
  selected?: boolean
  draggable?: boolean
  size?: number
  mode?: 'manage' | 'select'
  showExtension?: boolean
  showCheckbox?: boolean
}

const props = withDefaults(defineProps<AssetItemProps>(), {
  selected: false,
  draggable: false,
  size: 284,
  mode: 'manage',
  showExtension: true,
  showCheckbox: true,
})

const emit = defineEmits<{
  select: [asset: AssetResource, selected?: boolean]
  view: [asset: AssetResource]
  delete: [asset: AssetResource]
  move: [asset: AssetResource]
}>()

const isSelectMode = computed(() => props.mode === 'select')
const isManageMode = computed(() => props.mode === 'manage')
const enableDragAndDrop = computed(() => props.draggable && isManageMode.value)
const displayCheckbox = computed(() => props.showCheckbox && isManageMode.value)

function handleSelect(event: Event) {
  event.stopPropagation()

  if (isSelectMode.value) {
    emit('select', props.asset)
  } else {
    emit('select', props.asset, !props.selected)
  }
}

function handleView(event: Event) {
  if (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Enter') {
    return
  }
  event.stopPropagation()

  if (isSelectMode.value) {
    emit('select', props.asset)
  } else {
    emit('view', props.asset)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault() // Prevent scrolling
    if (isSelectMode.value) {
      handleView(event)
    } else {
      handleSelect(event)
    }
  } else if (event.key === 'Enter') {
    handleView(event)
  }
}

// Handle drag functionality
function onDragStart(event: DragEvent) {
  if (!event.dataTransfer || !enableDragAndDrop.value) return

  // Set the drag data with the asset ID and type
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'asset',
    id: props.asset.id,
    selected: props.selected
  }))

  // Set a drag image/effect
  event.dataTransfer.effectAllowed = 'move'
}

</script>

<template>
  <div
    class="p-1 group relative rounded-lg bg-background transition-all shadow-lg hover:bg-input focus:bg-input focus:outline-2  focus:outline-blue-300"
    :class="{ 'outline-2 outline-accent rotate-1': selected }"
    :aria-selected="selected"
    role="option"
    tabindex="0"
    :draggable="enableDragAndDrop"
    @keydown="handleKeyDown"
    @dragstart="onDragStart"
  >
    <div
      class="relative cursor-pointer aspect-square overflow-hidden rounded-t-[0.325rem] checkerboard"
      @click="handleView"
    >
      <NuxtImg
        v-if="getFileType(asset.mime_type) === 'image'"
        :src="asset.full_path"
        :alt="asset.data?.alt || asset.filename"
        :width="size"
        :height="size"
        :modifiers="{ crop: 'fill' }"
        class="h-full w-full object-cover pointer-events-none"
      />
      <div
        v-else
        class="flex h-full items-center justify-center"
      >
        <Icon
          :name="getFileIcon(getFileType(asset.mime_type))"
          size="3rem"
        />
      </div>

      <div
        v-if="isSelectMode"
        class="absolute inset-0 bg-accent/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center"
      >
        <Icon
          name="lucide:check"
          size="2rem"
          class="text-accent bg-background rounded-full p-1 border-2 border-accent"
        />
      </div>
    </div>
    <div class="flex p-2 items-center gap-2">
      <div class="flex-1 min-w-0">
        <div class="truncate font-semibold">
          {{ asset.filename }}
        </div>
        <div class="text-sm text-muted">
          {{ asset.extension }} • {{ formatFileSize(asset.size) }}
        </div>
      </div>
      <DropdownMenu class="ml-auto">
        <DropdownMenuTrigger class="hover:text-primary transition-colors">
          <Icon
            name="lucide:ellipsis-vertical"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @select="handleView">
            <Icon name="lucide:pencil"/>
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem @select="$emit('move', asset)">
            <Icon name="lucide:folder-input"/>
            <span>Move</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            class="text-destructive"
            @select="$emit('delete', asset)"
          >
            <Icon name="lucide:trash-2"/>
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div
      v-if="displayCheckbox"
      class="absolute top-2 left-2"
    >
      <Checkbox
        :model-value="selected"
        :aria-label="`Select ${asset.filename}`"
        @click.stop="handleSelect"
      />
    </div>
  </div>
</template>