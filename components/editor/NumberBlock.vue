<script setup lang="ts">

import { InputField } from '~/components/ui/form'

defineProps<{
  item: SchemaType & { key: string }
}>()

</script>

<template>
  <div>
    <InputField
      :label="item.name || item.key"
      :description="item.description"
    />
  </div>
</template>