<script setup lang="ts">

import type { HTMLAttributes } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

const emit = defineEmits<{
  (e: 'select', blockSlug: string): void
}>()

const props = defineProps<{
  item: BlocksSchema
  spaceId: string
  class?: HTMLAttributes['class']
}>()

const type = ref<string>()
const isOpen = ref(false)

const { useBlocksQuery } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 1000 })

const possibleBlocks = computed(() => {
  return blocks.value.data.filter((block: BlockResource) => {
    const isValidType = ['nestable', 'universal'].includes(block.type)
    const hasValidTag = !props.item.restrict_blocks || props.item.tag_whitelist?.length == 0 || !block.tags?.length || block.tags.some(t => props.item.tag_whitelist.includes(t))
    const isWhitelisted = !props.item.restrict_blocks || props.item.block_whitelist?.length == 0 || props.item.block_whitelist?.includes(block.slug)

    return isValidType && hasValidTag && isWhitelisted
  })
})

const select = (blockSlug: string) => {
  emit('select', blockSlug)
}

const autofill = (newIsOpen) => {
  if (newIsOpen && possibleBlocks.value.length === 1) {
    type.value = possibleBlocks.value[0].slug
    select(type.value)
    isOpen.value = false
  }
}

</script>

<template>
  <DropdownMenu
    v-model:open="isOpen"
    @update:open="autofill"
  >
    <DropdownMenuTrigger :class="props.class">
      <slot/>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuRadioGroup v-model="type">
        <DropdownMenuItem
          v-for="block in possibleBlocks"
          :key="block.slug"
          :value="block.slug"
          @select="select(block.slug)"
        >
          <Icon
            v-if="block.icon"
            :name="`lucide:${block.icon}`"
            :style="{ color: block.color }"
          />
          <div class="pl-2 truncate">
            {{ block.name }}
          </div>
        </DropdownMenuItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>