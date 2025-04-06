<script setup lang="ts">

import AppHeader from '~/components/AppHeader.vue'
import AppSidebar from '~/components/AppSidebar.vue'

const { useCurrentSpaceQuery } = useSpaces()
const { data: currentSpace } = useCurrentSpaceQuery()

const route = useRoute()
const spaceId = computed(() => route.params?.space as string || null)

useSeoMeta({
  titleTemplate: (title) => {
    return [
      title,
      currentSpace.value?.name,
      'b10cks',
    ].filter(e => e)
      .join(' – ')
  },
})

provide('spaceId', spaceId)

</script>

<template>
  <div class="min-h-svh flex w-full flex-col pt-14">
    <AppHeader>
      <template #default>
        <div id="appHeader"/>
      </template>
      <template #actions>
        <div id="appActions"/>
      </template>
    </AppHeader>
    <div class="flex grow w-full">
      <AppSidebar/>
      <main class="flex grow w-full">
        <slot/>
      </main>
    </div>
  </div>
</template>