<script setup lang="ts">
import { FormField } from '~/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const value = defineModel<string>()

defineProps<{
  item: OptionSchema & { key: string }
}>()
</script>

<template>
  <FormField
    :name="item.key"
    :label="item.name || item.key"
  >
    <Select v-model="value">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem
            v-for="option in item.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.name || option.value }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </FormField>
</template>
