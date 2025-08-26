<script setup lang="ts">
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import EditorComponent from './EditorComponent.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import AddDropdown from '~/components/editor/AddDropdown.vue'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  item: BlocksSchema & { key: string }
  modelValue?: Array<Record<string, unknown>> | null
  spaceId: string
}>()

const { useBlocksQuery, getBlockBySlug } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 1000 })

const ulid = useUlid()
const route = useRoute()
const router = useRouter()
const handlebars = useHandlebars()

const { copyItem: globalCopyItem, cutItem: globalCutItem, pasteItem: globalPasteItem, getClipboardItem } = useGlobalClipboard()

const emit = defineEmits<{
  'update:modelValue': [value: Array<Record<string, unknown>>]
}>()

const blockItems = computed({
  get: () => props.modelValue || [],
  set: (newValue) => {
    if (newValue === props.modelValue) return

    emit('update:modelValue', [...newValue])
  }
})

const accordionContainer = ref<HTMLElement | null>(null)
const hasClipboardItem = ref(false)

const checkClipboard = async () => {
  const item = await getClipboardItem()
  hasClipboardItem.value = !!item
}

onMounted(() => {
  checkClipboard()
  window.addEventListener('focus', checkClipboard)
})

onUnmounted(() => {
  window.removeEventListener('focus', checkClipboard)
})

const addItem = (slug: string, index: number = -1) => {
  const newItem = { block: slug, id: ulid() }
  const updatedItems = [...blockItems.value]

  if (index === -1) {
    updatedItems.push(newItem)
  } else {
    updatedItems.splice(index, 0, newItem)
  }

  emit('update:modelValue', updatedItems)
}

const deleteItem = (index: number) => {
  const updatedItems = [...blockItems.value]
  updatedItems.splice(index, 1)
  blockItems.value = updatedItems
}

const copyItem = async (index: number) => {
  const itemToCopy = { ...blockItems.value[index] }
  const block = getBlockBySlug(blocks, itemToCopy.block as string)
  await globalCopyItem(itemToCopy, props.spaceId, block?.name || itemToCopy.block as string)
  checkClipboard()
}

const cutItem = async (index: number) => {
  const itemToCut = { ...blockItems.value[index] }
  const block = getBlockBySlug(blocks, itemToCut.block as string)
  await globalCutItem(itemToCut, props.spaceId, block?.name || itemToCut.block as string)
  deleteItem(index)
  checkClipboard()
}

const pasteItem = async (event?: ClipboardEvent, insertIndex?: number) => {
  // Prevent event bubbling to parent components
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  const pastedItem = await globalPasteItem()
  if (pastedItem) {
    const updatedItems = [...blockItems.value]
    const index = insertIndex ?? updatedItems.length
    updatedItems.splice(index, 0, pastedItem)
    emit('update:modelValue', updatedItems)
    checkClipboard()
  }
}

const setupSortable = () => {
  nextTick(() => {
    if (!accordionContainer.value) return

    useSortable(accordionContainer.value, blockItems.value, {
      handle: '[draggable]',
      animation: 150,
      onEnd: () => {
        emit('update:modelValue', blockItems.value)
      }
    })
  })
}

watch(() => blockItems.value.length, () => {
  setupSortable()
}, { immediate: true })

const updateContent = (index: number, newContent: Record<string, unknown>) => {
  if (newContent === blockItems.value[index]) return

  const updatedItems = [...blockItems.value]
  updatedItems[index] = newContent
  blockItems.value = updatedItems
}

function blockTitle(block: BlockResource | null): string {
  if (!block) return 'Untitled'
  return block.name || block.slug || block.key || 'Untitled'
}

function guessTitle(content: Record<string, unknown>, block: BlockResource | null): string {
  if (!content) return 'Untitled'
  if (block?.preview_template) {
    try {
      return handlebars.render(block.preview_template, content)
    } catch (_) { /* empty */ }
  }

  const keys = Object.keys(content)
  if (keys.length > 0 && typeof content[keys[0]] === 'string') {
    return content[keys[0]]
  }

  if (content.block) {
    const block = getBlockBySlug(blocks, content.block)
    return block?.name || 'Untitled Block'
  }

  return 'Untitled'
}

const navigateToItem = (itemId: string) => {
  router.push({
    ...route,
    hash: `#${itemId}`
  })
}
</script>

<template>
  <div class="grid gap-2">
    <div class="text-sm font-semibold text-primary">{{ item.name || item.key || 'Untitled' }}</div>
    <div class="bg-surface border border-border rounded-lg px-2">
      <AccordionRoot
        ref="accordionContainer"
        type="multiple"
        class="relative pt-2"
        @paste="pasteItem"
      >
        <AccordionItem
          v-for="(content, i) in blockItems"
          :key="i"
          :value="`content-${i}`"
          class="relative p-2 rounded-lg bg-background mb-2 border border-border"
        >
          <AccordionHeader class="group">
            <AccordionTrigger
              class="flex items-center gap-2 w-full"
            >
              <Icon
                name="lucide:grip-vertical"
                class="shrink-0 cursor-ns-resize opacity-0 group-hover:opacity-100"
                :draggable="true"
              />
              <div class="grow grid text-left leading-none">
                <h4 class="font-semibold text-primary">{{
                    guessTitle(content, getBlockBySlug(blocks, content.block as string))
                  }}</h4>
                <div class="flex text-sm text-muted ">
                  {{ blockTitle(getBlockBySlug(blocks, content.block as string)) }}
                </div>
              </div>
              <div class="ml-auto flex opacity-0 group-hover:opacity-100 gap-2 items-center">
                <button
                  v-if="content.id"
                  type="button"
                  title="Edit nested content"
                  class="transform cursor-pointer hover:text-primary flex items-center"
                  @click.stop="navigateToItem(content.id as string)"
                >
                  <Icon name="lucide:edit-3"/>
                </button>
                <button
                  type="button"
                  title="Copy item"
                  class="transform cursor-pointer hover:text-primary flex items-center"
                  @click.stop="copyItem(i)"
                >
                  <Icon name="lucide:copy"/>
                </button>
                <button
                  type="button"
                  title="Cut item"
                  class="transform cursor-pointer hover:text-primary flex items-center"
                  @click.stop="cutItem(i)"
                >
                  <Icon name="lucide:scissors"/>
                </button>
                <button
                  type="button"
                  title="Delete item"
                  class="transform cursor-pointer hover:text-red-500 flex items-center"
                  @click.stop="deleteItem(i)"
                >
                  <Icon name="lucide:trash-2"/>
                </button>
              </div>
            </AccordionTrigger>
            <AddDropdown
              :item="item"
              :space-id="spaceId"
              class="absolute inset-x-0 -top-1.5 w-full"
              @select="(slug: string) => addItem(slug, i)"
            >
              <div class="border-t-2 border-t-accent flex opacity-0 hover:opacity-100 transition-opacity">
                <button
                  class="cursor-pointer mx-auto w-4 h-4 rounded-full bg-accent transform -translate-y-1/2 text-accent-foreground"
                >
                  <Icon name="lucide:plus"/>
                </button>
              </div>
            </AddDropdown>
          </AccordionHeader>
          <AccordionContent>
            <div class="grid gap-4 items-start p-1 pt-2 mt-2 border-t-2 border-surface">
              <EditorComponent
                :model-value="content"
                :block-slug="content.block as string"
                :space-id="spaceId"
                is-child
                @update:model-value="updateContent(i, $event)"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Add item dropdown at the end -->
        <AddDropdown
          :item="item"
          :space-id="spaceId"
          class="absolute inset-x-0 -mt-1"
          @select="(slug: string) => addItem(slug, blockItems.length)"
        >
          <div class="border-t-2 border-t-accent flex opacity-0 hover:opacity-100 transition-opacity">
            <button
              class="cursor-pointer mx-auto w-4 h-4 rounded-full bg-accent transform -translate-y-1/2 text-accent-foreground"
            >
              <Icon name="lucide:plus"/>
            </button>
          </div>
        </AddDropdown>
        <div
          v-if="hasClipboardItem"
          class="flex justify-center mt-2 pb-2"
        >
          <Button
            type="button"
            title="Paste item"
            variant="ghost"
            size="xs"
            class="relative z-10"
            @click="pasteItem()"
          >
            <Icon
              name="lucide:clipboard-paste"
              size="0.75rem"
            />
            <span>Paste</span>
          </Button>
        </div>
      </AccordionRoot>
    </div>
  </div>
</template>