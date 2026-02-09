<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
import AppSidebar from '~/components/AppSidebar.vue'

const { useCurrentSpaceQuery } = useSpaces()
const { data: currentSpace } = useCurrentSpaceQuery()

const route = useRoute()
const spaceId = computed(() => (route.params?.space as string) || null)
const { isAuthenticated, isReady } = useAuth()

useSeoMeta({
  titleTemplate: (title) => {
    return [title, currentSpace.value?.name, 'b10cks'].filter((e) => e).join(' – ')
  },
})

if (import.meta.client) {
  watch(
    [isReady, isAuthenticated],
    ([ready, authenticated]) => {
      if (!ready || authenticated) return
      navigateTo({
        name: 'login',
        query: { return: route.fullPath },
      })
    },
    { immediate: true }
  )
}

provide('spaceId', spaceId)
</script>

<template>
  <div class="flex min-h-svh w-full flex-col pt-14">
    <AppHeader>
      <template #default>
        <div id="appHeader" />
      </template>
      <template #actions>
        <div id="appActions" />
      </template>
    </AppHeader>
    <div class="flex w-full grow">
      <AppSidebar />
      <main class="flex w-full grow">
        <slot />
      </main>
    </div>
  </div>
</template>
