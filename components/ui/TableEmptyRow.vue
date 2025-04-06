<script setup lang="ts">

import { TableCell, TableRow } from '~/components/ui/table'

const { $t } = useI18n()


const props = withDefaults(defineProps<{
  colspan?: number
  icon?: string
  label?: string
}>(), {
  colspan: 3,
  icon: 'lucide:text-select',
  label: undefined
})

const labelText = computed(() => {
  return props.label || $t('labels.noResults')
})

</script>

<template>
  <TableRow>
    <TableCell
      :colspan="colspan"
      class="py-6 text-center bg-surface"
    >
      <div class="flex flex-col items-center justify-center gap-2 ">
        <Icon
          :name="icon"
          size="3rem"
          class="text-muted"
        />
        <div class="text-muted font-semibold">{{ labelText }}</div>
        <slot name="actions"/>
      </div>
    </TableCell>
  </TableRow>
</template>


