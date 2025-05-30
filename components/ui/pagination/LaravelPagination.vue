<script setup lang="ts">
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev
} from '~/components/ui/pagination'
import { Button } from '~/components/ui/button'

const props = withDefaults(defineProps<{
  meta: LaravelMeta | null
  siblingCount?: number
  showEdges?: boolean
}>(), {
  siblingCount: 1,
  showEdges: true
})

const modelValue = defineModel<number>()

const totalItems = computed(() => props.meta?.total || 0)
const itemsPerPage = computed(() => props.meta?.per_page || 10)

const handlePageChange = (page: number) => {
  modelValue.value = page
  // emit('update:modelValue', page)
}
</script>

<template>
  <Pagination
    v-model="modelValue"
    :items-per-page="itemsPerPage"
    :total="totalItems"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
  >
    <PaginationList
      v-slot="{ items }"
      class="flex items-center gap-1"
    >
      <PaginationFirst v-if="showEdges"/>
      <PaginationPrev/>
      <template v-for="(item, index) in items">
        <PaginationListItem
          v-if="item.type === 'page'"
          :key="index"
          :value="item.value"
          as-child
          @click="handlePageChange(item.value)"
        >
          <Button
            class="w-9 h-9"
            :variant="item.value === modelValue ? 'primary' : 'default'"
          >
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          :key="item.type"
          :index="index"
        />
      </template>
      <PaginationNext/>
      <PaginationLast v-if="showEdges"/>
    </PaginationList>
  </Pagination>
</template>