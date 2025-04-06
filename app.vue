<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import { AlertDialogProvider } from '@/composables/useAlertDialog'
import { Command } from '~/components/ui/command'

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
      <Toaster
        theme="dark"
        rich-colors
      />
      <Command/>
    </ClientOnly>
  </div>
</template>