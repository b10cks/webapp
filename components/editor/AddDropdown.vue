<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

const emit = defineEmits<{
  (e: 'select', blockSlug: string): void
  (e: 'paste'): void
}>()

const props = defineProps<{
  item: BlocksSchema
  hasClipboardItem: boolean
  spaceId: string
}>()

const type = ref<string>()
const isOpen = ref(false)

const { useBlocksQuery } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 1000 })

const possibleBlocks = computed(() => {
  return blocks.value.data.filter((block: BlockResource) => {
    const isValidType = ['nestable', 'universal'].includes(block.type)
    const hasValidTag =
      !props.item.restrict_blocks ||
      props.item.tag_whitelist?.length == 0 ||
      !block.tags?.length ||
      block.tags.some((t) => props.item.tag_whitelist.includes(t))
    const isWhitelisted =
      !props.item.restrict_blocks ||
      props.item.block_whitelist?.length == 0 ||
      props.item.block_whitelist?.includes(block.slug)

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
    <div class="flex opacity-0 transition-opacity hover:opacity-100">
      <div class="absolute inset-x-0 -mt-3 border-t-2 border-accent pt-4" />
      <div class="absolute inset-x-0 z-10 mx-auto -mt-6 flex transform justify-center gap-2">
        <DropdownMenuTrigger>
          <button
            class="flex size-6 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Icon name="lucide:plus" />
          </button>
        </DropdownMenuTrigger>
        <button
          v-if="hasClipboardItem"
          class="flex size-6 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground"
          @click="emit('paste')"
        >
          <Icon name="lucide:clipboard-paste" />
        </button>
      </div>
    </div>
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
          <div class="truncate pl-2">
            {{ block.name }}
          </div>
        </DropdownMenuItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
