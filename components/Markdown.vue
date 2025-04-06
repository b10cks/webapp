<script setup lang="ts">

import { marked } from 'marked'
import type { CleanTranslation } from 'nuxt-i18n-micro-types/src'

const props = defineProps<{ content: string | CleanTranslation }>()

const html = computed(() => {
  return marked.parse(props.content as string)
})

</script>

<template>
  <div
    class="prose"
    v-html="html"
  />
</template>
