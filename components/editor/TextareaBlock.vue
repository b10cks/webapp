<script setup lang="ts">

import { FormField } from '~/components/ui/form'
import { Textarea } from '~/components/ui/textarea'

const value = defineModel<string>()

defineProps<{
  item: TextareaSchema & { key: string }
}>()

</script>

<template>
  <FormField
    name="item.key"
    :label="item.name || item.key"
    :description="item.description"
  >
    <Textarea
      v-model="value"
    />
  </FormField>
</template>