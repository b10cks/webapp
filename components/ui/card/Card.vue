<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { cardVariants, type CardVariants } from '~/components/ui/card/index'

const props = defineProps<{
  variant?: CardVariants['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(cardVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
