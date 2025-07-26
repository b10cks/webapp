<script setup lang="ts">

import { FormField, TextField } from '~/components/ui/form'
import { Textarea } from '~/components/ui/textarea'

const value = defineModel<string>()

defineProps<{
  item: MarkdownSchema & { key: string }
}>()

</script>

<template>
  <TextField
    v-model="value"
    :name="item.key"
    :label="item.name || item.key"
    :description="item.description"
  />
</template>