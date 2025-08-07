<script setup lang="ts">

import { Dialog, DialogContent, DialogFooter, DialogHeaderCombined } from '~/components/ui/dialog'
import type { CreateContentPayload } from '~/types/contents'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '~/components/ui/select'
import { FormField, InputField } from '~/components/ui/form'
import { Button } from '~/components/ui/button'

const open = defineModel<boolean>('open')
const props = withDefaults(defineProps<{
  spaceId: string
  parentId?: string
}>(), {
  parentId: undefined,
})

const { useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(props.spaceId)

const { useBlocksQuery } = useBlocks(props.spaceId)
const { data: blocks } = useBlocksQuery({ per_page: 1000 })

const { useCreateContentMutation } = useContent(props.spaceId)
const { mutate: createContent } = useCreateContentMutation()

const content = ref<CreateContentPayload>({
  block_id: null,
  slug: '',
  name: ''
})

watch(space, () => {
  if (!content.value.block_id) {
    content.value.block_id = space.value?.settings.default_block
  }
}, { immediate: true })

const handleCreate = async (editContent: CreateContentPayload) => {
  await createContent({ ...editContent, parent_id: props.parentId })
  open.value = false
  content.value = {
    block_id: content.value.block_id,
    slug: '',
    name: ''
  }
}

const possibleBlocks = computed(() => {
  return blocks.value?.data.filter((b: BlockResource) => {
    return b.type === 'root' || b.type === 'universal' || (!props.parentId && b.type === 'single')
  }) || []
})

const currentBlock = computed(() => {
  return possibleBlocks.value?.find((b: BlockResource) => b.id === content.value?.block_id)
})

const createSlug = () => {
  if (content.value.slug?.trim()) return
  content.value.slug = content.value.name
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLocaleLowerCase()
    .replace(/--/g, '-')
}

</script>

<template>
  <Dialog
    :open="open"
    @update:open="open = $event"
  >
    <DialogContent>
      <form
        class="grid gap-4"
        @submit.prevent="handleCreate(content)"
      >
        <DialogHeaderCombined
          :title="$t('labels.contents.createContent')"
        />
        <div class="grid gap-6">
          <InputField
            v-model="content.name"
            :label="$t('labels.contents.fields.name')"
            name="slug"
            required
            auto-focus
            @blur="createSlug"
          />
          <InputField
            v-model="content.slug"
            :label="$t('labels.contents.fields.slug')"
            name="slug"
            required
          />
          <FormField
            name="block"
            :label="$t('labels.contents.fields.block')"
          >
            <template #default="{ id }">
              <Select
                :id="id"
                v-model="content.block_id"
              >
                <SelectTrigger>
                  <div
                    v-if="currentBlock"
                    class="flex items-center gap-2"
                  >
                    <Icon
                      v-if="currentBlock.icon"
                      :name="`lucide:${currentBlock.icon}`"
                      :style="{ color: currentBlock.color }"
                    />
                    <p>{{ currentBlock?.name }}</p>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="block in possibleBlocks"
                      :key="block.id"
                      :value="block.id"
                    >
                      <div class="flex gap-2 items-center">
                        <Icon
                          v-if="block.icon"
                          :name="`lucide:${block.icon}`"
                          :style="{ color: block.color }"
                        />
                        <div>
                          {{ block.name }}
                        </div>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </template>
          </FormField>
        </div>
        <DialogFooter>
          <Button
            type="button"
            @click="open = false"
          >
            {{ $t('actions.cancel') }}
          </Button>
          <Button
            variant="primary"
            type="submit"
          >
            {{ $t('actions.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>