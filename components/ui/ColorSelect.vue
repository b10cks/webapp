<script setup lang="ts">

import { Select, SelectContent, SelectGroup } from '~/components/ui/select'
import { SelectTrigger, SelectItem } from 'reka-ui'
import colors from './colors.json'

const selectedColor = defineModel<string | null>()

</script>

<template>
  <Select v-model="selectedColor">
    <SelectTrigger class="cursor-pointer flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm font-semibold shadow-sm ring-offset-background data-[placeholder]:text-muted focus:outline-none focus:ring-1 focus:ring-ring hover:bg-input disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start gap-2">
      <span
        class="h-4 w-4 rounded"
        :style="`background-color: ${selectedColor}`"
      />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <div class="grid grid-cols-8">
          <SelectItem
            v-for="{ value, label } in colors"
            :key="value"
            class="relative flex items-center rounded-sm p-2 text-sm outline-none focus:bg-accent focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            :value="value"
            :title="label"
          >
            <div
              class="h-4 w-4 rounded"
              :style="`background-color: ${value}`"
            />
          </SelectItem>
        </div>
      </SelectGroup>
    </SelectContent>
  </Select>

</template>