<script setup lang="ts">

import { Checkbox } from '~/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'

const props = defineProps<{
  folder: AssetFolderResource,
  selected?: boolean,
  draggable?: boolean
}>()

const emit = defineEmits<{
  select: [folder: AssetFolderResource, selected: boolean],
  click: [folder: AssetFolderResource]
  create: [folder: AssetFolderResource]
  edit: [folder: AssetFolderResource]
  move: [folder: AssetFolderResource]
  delete: [folder: AssetFolderResource]
}>()

function handleSelect(event: Event) {
  event.stopPropagation()
  emit('select', props.folder, !props.selected)
}

function handleClick(event?: MouseEvent) {
  if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
    emit('select', props.folder, !props.selected)
  } else {
    emit('click', props.folder)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault() // Prevent scrolling
    handleSelect(event)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    handleClick()
  }
}

function onDragStart(event: DragEvent) {
  if (!event.dataTransfer) return

  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'folder',
    id: props.folder.id,
    selected: props.selected
  }))

  event.dataTransfer.effectAllowed = 'move'
}

</script>

<template>
  <div
    class="group gap-2 bg-background rounded-md p-3 flex items-center cursor-pointer focus:bg-input transition-all duration-200 relative focus:outline-2 focus:outline-offset-2 focus:outline-blue-300"
    :class="{ 'outline-2 outline-accent': selected }"
    :aria-label="folder.name"
    :aria-selected="selected"
    role="option"
    tabindex="0"
    :draggable="draggable !== false"
    @keydown="handleKeyDown"
    @dragstart="onDragStart"
  >
    <Checkbox
      :model-value="selected"
      :aria-label="`Select folder ${folder.name}`"
      @click.stop="handleSelect"
    />

    <div
      class="flex flex-1 gap-3 items-center"
      @click="handleClick"
    >
      <div class="bg-surface rounded-md p-2 h-12 w-12 flex items-center justify-center shadow">
        <Icon
          :name="`lucide:${folder.icon}`"
          :style="{ color: folder.color || 'inherit' }"
        />
      </div>
      <div class="flex-1 group-hover:text-primary">
        <h4 class="font-semibold text-primary">{{ folder.name }}</h4>
        <div class="text-sm">{{ folder.children_count }} Folder, {{ folder.assets_count }} Asset</div>
      </div>
    </div>
    <DropdownMenu class="ml-auto">
      <DropdownMenuTrigger class="hover:text-primary transition-colors">
        <Icon
          name="lucide:ellipsis-vertical"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @select="handleClick">
          <Icon name="lucide:eye"/>
          <span>View</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="$emit('edit', folder)">
          <Icon name="lucide:edit"/>
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="$emit('create', folder)">
          <Icon name="lucide:folder-plus"/>
          <span>{{ $t('labels.assets.createFolder') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="$emit('move', folder)">
          <Icon name="lucide:folder-input"/>
          <span>Move</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          class="text-destructive"
          @select="$emit('delete', folder)"
        >
          <Icon name="lucide:trash-2"/>
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>