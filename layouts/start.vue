<script setup lang="ts">
const route = useRoute()
const { isAuthenticated, isReady } = useAuth()

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

useSeoMeta({
  titleTemplate: (title) => {
    return [title, 'b10cks'].filter((e) => e).join(' – ')
  },
})
</script>

<template>
  <div class="flex min-h-svh w-full flex-col">
    <slot />
  </div>
</template>
