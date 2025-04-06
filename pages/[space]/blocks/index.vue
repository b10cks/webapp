<script setup lang="ts">

import BlockMenu from '~/components/BlockMenu.vue'
import BlockTagsTable from '~/components/BlockTagsTable.vue'
import BlockTable from '~/components/BlockTable.vue'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)

const mode = computed<'list' | 'tags'>({
  get: () => (route.query.mode as 'list' | 'tags') || 'list',
  set: v => {
    const query = { ...route.query, mode: v, folder: undefined, tag: undefined }
    useRouter().replace({ query })
  }
})

const folder = computed<string | undefined>({
  get: () => route.query.folder as string | undefined,
  set: v => {
    const query = { ...route.query, folder: v }
    useRouter().replace({ query })
  }
})

const component = computed(() => {
  if (mode.value === 'list') {
    return BlockTable
  } else if (mode.value === 'tags') {
    return BlockTagsTable
  }
  return null
})
</script>

<template>
  <div>
    <NuxtLayout>
      <BlockMenu
        v-model:mode="mode"
        v-model:selected-folder="folder"
        :space-id="spaceId"
      />
      <div class="flex grow bg-background">
        <component
          :is="component"
          :space-id="spaceId"
          :mode="mode"
          :folder="folder"
          class="flex grow max-w-7xl mx-auto w-full gap-6 flex-col"
        />
      </div>
    </NuxtLayout>
  </div>
</template>