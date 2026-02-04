<script setup lang="ts">
const route = useRoute()
const { isAuthenticated } = useAuth()

if (import.meta.client) {
  if (!isAuthenticated.value) {
    navigateTo({
      name: 'login',
      query: { return: route.fullPath },
    })
  }
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
