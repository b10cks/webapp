<script setup lang="ts">

import type { BlockFolderResource } from '~/api/resources/block-folders'
import IconNameField from '~/components/ui/IconNameField.vue'

const props = withDefaults(defineProps<{
  folder: BlockFolderResource
  isCreate?: boolean
}>(), {
  isCreate: false,
})

const editableFolder = ref<BlockFolderResource>({ ...props.folder })

</script>

<template>
  <div class="flex flex-col gap-6">
    <IconNameField
      v-model="editableFolder"
      :label="$t('labels.blocks.fields.name')"
      name="name"
    />
    <slot :folder="editableFolder"/>
  </div>
</template>