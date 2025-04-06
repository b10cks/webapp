<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import { AlertDialogProvider } from '@/composables/useAlertDialog'
import Command from '~/components/Command.vue'
import { useDark } from '@vueuse/core'

useDark()
const commandOpen = ref(false)

provide('commandOpen', commandOpen)

</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <AlertDialogProvider>
      <NuxtPage />
    </AlertDialogProvider>
    <ClientOnly>
      <Toaster rich-colors/>
      <Command/>
    </ClientOnly>
  </div>
</template>