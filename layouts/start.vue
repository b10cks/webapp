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
</script>

<template>
  <div class="flex min-h-svh w-full flex-col">
    <slot />
  </div>
</template>
