<script setup lang="ts">

import ContentsIcon from '~/assets/images/contents.svg?component'
import { Button } from '~/components/ui/button'

const route = useRoute()

const { useContentMenuQuery, getRootItems } = useContentMenu(route.params.spaceId as string)
const { data } = useContentMenuQuery()

const rootItems = computed(() => getRootItems(data.value) || [])

</script>

<template>
  <div class="flex-1 overflow-y-auto p-6 bg-background">
    <div
      v-if="rootItems.length === 0"
      class="text-center py-12"
    >
      <ContentsIcon
        class="mx-auto text-muted mb-6 w-32"
      />
      <h3 class="text-xl font-bold mb-2">No Content Found</h3>
      <p class="text-muted mb-6">Get started by creating your first content page</p>
      <Button>
        <Icon name="lucide:plus"/>
        <span>Create Content</span>
      </Button>
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold mb-6">Content Manager</h1>
      <p class="text-muted mb-4">
        Select an item from the content menu to edit or create new content.
      </p>
    </div>
  </div>
</template>
