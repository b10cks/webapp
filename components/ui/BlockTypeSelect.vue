<script setup lang="ts">
import { SelectGroup, SelectTrigger, } from 'reka-ui'
import BlockType from '~/components/ui/BlockType.vue'
import { Select, SelectContent, SelectItem } from '~/components/ui/select'

defineProps<{
  types: string[]
}>()

const value = defineModel<string>()

</script>

<template>
  <Select v-model="value">
    <SelectTrigger class="flex items-center gap-2 bg-input rounded-md px-2">
      <BlockType :type="value"/>
      <Icon name="lucide:chevron-down"/>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="type in types"
          :key="type"
          :value="type"
          class="py-1 px-1"
        >
          <div class="flex items-center gap-2">
            <BlockType :type="type"/>
            <p>{{ $t(`labels.blocks.fieldTypes.${type}.label`) }}</p>
          </div>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>