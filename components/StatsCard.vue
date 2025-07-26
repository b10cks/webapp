<script setup lang="ts">

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

defineProps<{
  icon?: string
  title?: string
  description?: string
}>()

</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="text-sm ">{{ title }}</CardTitle>
      <Icon
        :name="icon"
        size="1.25rem"
        class="text-muted"
      />
    </CardHeader>
    <CardContent>
      <slot/>
      <p
        v-if="description"
        class="text-sm text-muted"
      >{{ description }}</p>
    </CardContent>
  </Card>
</template>