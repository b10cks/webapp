<script setup lang="ts">

import type { CleanTranslation } from 'nuxt-i18n-micro-types/src'

withDefaults(defineProps<{
  header: CleanTranslation,
  description?: CleanTranslation
}>(), {
  description: null,
})

</script>

<template>
  <div class="pt-8">
    <h1 class="text-2xl font-bold text-primary">{{ header }}</h1>
    <slot>
      <p v-if="description">
        {{ description }}
      </p>
    </slot>
  </div>
</template>