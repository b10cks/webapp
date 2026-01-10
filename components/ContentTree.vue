<script setup lang="ts">
import type { TreeItemToggleEvent} from 'reka-ui';
import { TreeItem, TreeRoot } from 'reka-ui'
import RenamableTitle from '~/components/ui/RenamableTitle.vue'
import { Button } from '~/components/ui/button'
import CreateContentDialog from '~/components/content/CreateContentDialog.vue'
import type { ContentResource } from '~/types/contents'
import { SimpleTooltip } from '~/components/ui/tooltip'

const props = defineProps<{
  title?: string
  spaceId: string
}>()

const route = useRoute()
const router = useRouter()

const { alert } = useAlertDialog()
const { useSpacesQuery } = useSpaces()
const { data: spaces } = useSpacesQuery()
const { useContentMenuQuery, getChildren, getRootItems } = useContentMenu(props.spaceId)
const { useUpdateContentMutation, useDeleteContentMutation } = useContent(props.spaceId)

const { mutate: updateContent } = useUpdateContentMutation()
const { mutate: deleteContent } = useDeleteContentMutation()

const { settings } = useSpaceSettings(props.spaceId)

const { isLoading, error, data } = useContentMenuQuery()
const rootItems = computed(() => getRootItems(data.value) || [])

const selectedItemId = ref<string | null>(null)
const currentlyEditingId = ref<string | null>(null)
const showCreateDialog = ref(false)
const createParentId = ref<string | null>(null)

const selectedSpace = computed(() => {
  return spaces.value?.find(space => space.id === props.spaceId) || null
})

function handleRename(newName: string, contentId: string) {
  if (contentId && newName) {
    updateContent({ id: contentId, payload: { name: newName } })
  }
  currentlyEditingId.value = null
}

function handleEditStart(contentId: string) {
  currentlyEditingId.value = contentId
}

function handleEditCancel() {
  currentlyEditingId.value = null
}

const handleSelect = (contentId: string) => {
  let name = route.name
  if (name === 'space-content') {
    name = 'space-content-contentId'
  }
  selectedItemId.value = contentId
  router.push({
    ...route,
    name,
    hash: '',
    params: {
      space: route.params.space,
      contentId
    }
  })
}

const handleToggle = (e: TreeItemToggleEvent<ContentResource>) => {
  if (e.detail.originalEvent instanceof PointerEvent) {
    e.preventDefault()
  }
}

const toggleExpanded = (contentId: string) => {
  const expanded = settings.value.content.expanded || []
  const index = expanded.indexOf(contentId)
  if (index > -1) {
    expanded.splice(index, 1)
  } else {
    expanded.push(contentId)
  }
  settings.value.content.expanded = expanded
}

// Set the current item based on the route
const setCurrentItemFromRoute = () => {
  if (route.params.contentId) {
    selectedItemId.value = route.params.contentId as string
  }
}

// Watch for route changes to update selection
watch(() => route.params.contentId, () => {
  setCurrentItemFromRoute()
}, { immediate: true })

// Refresh content menu on component mount
onMounted(() => {
  setCurrentItemFromRoute()
})

const initCreate = (parentId: string | null) => {
  createParentId.value = parentId
  showCreateDialog.value = true
}

const initDelete = async (item: ContentResource) => {
  if (!await alert.confirm('Are you sure you want to delete this item?')) {
    return
  }
  deleteContent(item.id)
}

</script>

<template>
  <aside>
    <div
      v-if="isLoading"
      class="flex justify-center items-center py-4"
    >
      <span class="text-sm text-muted">Loading...</span>
    </div>

    <div
      v-else-if="error"
      class="py-4 px-2 text-destructive text-sm"
    >
      {{ error }}
    </div>

    <TreeRoot
      v-slot="{ flattenItems }"
      v-model:expanded="settings.content.expanded"
      class="list-none select-none w-full p-2"
      :items="rootItems"
      :get-children="(item) => getChildren(data, item.id)"
      :get-key="({id}) => id"
    >
      <h2
        v-if="title && !isLoading"
        class="font-semibold text-sm text-primary px-2 pt-1 pb-3"
      >
        {{ title }}
      </h2>

      <div
        v-if="selectedSpace"
        class="flex items-center gap-2 ml-2 font-semibold py-1"
      >
        <Icon
          name="lucide:globe"
          class="text-primary shrink-0"
        />
        <span class="truncate">{{ selectedSpace.name }}</span>
        <Button
          class="ml-auto"
          variant="ghost"
          size="xs"
          @click="initCreate(null)"
        >
          <Icon name="lucide:plus"/>
        </Button>
      </div>

      <TreeItem
        v-for="item in flattenItems"
        v-slot="{ isExpanded }"
        :key="item._id"
        :style="{ 'padding-left': `${item.level - 0.5}rem` }"
        v-bind="item.bind"
        :class="[
          'group relative flex items-center py-1 pl-0 pr-2 my-0.5 rounded-md outline-none gap-2',
          'hover:bg-border transition-colors duration-200',
          'cursor-pointer font-semibold',
          item.value.id === selectedItemId ? 'bg-border text-primary' : ''
        ]"
        @select="handleSelect(item.value.id)"
        @toggle="(e) => handleToggle(e)"
      >
        <button
          v-if="item.value.children"
          class="w-3 h-4"
          @click.stop.prevent="toggleExpanded(item.value.id)"
        >
          <Icon
            name="lucide:chevron-right"
            :class="['transition-transform duration-200', isExpanded && 'rotate-90']"
          />
        </button>
        <span
          v-else
          class="size-3"
        />

        <Icon
          :name="`lucide:${item.value.icon}`"
          class="shrink-0"
          :style="{ color: item.value.color }"
        />

        <RenamableTitle
          :name="item.value.name"
          class="truncate w-full text-left"
          @update="handleRename($event, item.value.id)"
          @edit-start="handleEditStart(item.value.id)"
          @cancel="handleEditCancel"
        />

        <div class="ml-auto flex items-center gap-2">
          <div
            v-if="!item.value.pat"
            class="w-2 h-2 rounded-full bg-text-muted"
            title="Draft"
          />
          <SimpleTooltip
            v-else
            :tooltip="item.value.pat"
          >
            <div
              class="w-2 h-2 rounded-full bg-success"
            />
          </SimpleTooltip>
        </div>

        <div
          class="bg-border absolute right-6 overflow-clip group-hover:w-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1"
        >
          <button
            v-if="item.value.type !== 'single'"
            class="transform cursor-pointer hover:text-primary flex items-center"
            @click="initCreate(item.value.id)"
          >
            <Icon name="lucide:plus"/>
          </button>
          <button
            type="button"
            title="Delete item"
            class="transform cursor-pointer hover:text-red-500 flex items-center"
            @click.stop="initDelete(item.value)"
          >
            <Icon name="lucide:trash-2"/>
          </button>
        </div>
      </TreeItem>
    </TreeRoot>

    <CreateContentDialog
      v-model:open="showCreateDialog"
      :space-id="props.spaceId"
      :parent-id="createParentId"
    />
  </aside>
</template>