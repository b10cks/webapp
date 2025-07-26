<script setup lang="ts">
import { useBlocks } from '~/composables/useBlocks'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import BlockMenu from '~/components/BlockMenu.vue'
import BlockEdit from '~/components/BlockEdit.vue'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)
const blockId = computed(() => route.params.block as string)

const { useBlockQuery, useUpdateBlockMutation } = useBlocks(spaceId)
const { isLoading, data: block } = useBlockQuery(blockId)

const { mutate: updateBlock } = useUpdateBlockMutation()

useSeoMeta({
  title: computed(() => block.value?.name)
})

const submit = async (b: BlockResource) => {
  updateBlock({
    id: b.id,
    payload: { ...b }
  })
}
</script>

<template>
  <div>
    <NuxtLayout>
      <BlockMenu :space-id="spaceId"/>
      <ScrollArea class="flex grow bg-background">
        <div v-if="isLoading">
          Loading ...
        </div>
        <div
          v-if="block"
          class="max-w-xl mx-auto w-full gap-6 flex-col flex pb-6"
        >
          <ContentHeader :header="block.name"/>
          <BlockEdit
            v-slot="{ editBlock }"
            :block="block"
            :space-id="spaceId"
            show-schema
            @submit="submit"
          >
            <div class="flex">
              <Button
                type="button"
                variant="primary"
                class="ml-auto"
                @click="submit(editBlock)"
              >{{ $t('actions.blocks.save') }}
              </Button>
            </div>
          </BlockEdit>
        </div>
      </ScrollArea>
    </NuxtLayout>
  </div>
</template>