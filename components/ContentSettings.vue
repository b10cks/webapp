<script setup lang="ts">

import { CheckboxField, InputField } from '~/components/ui/form'

const content = defineModel<ContentResource>()

</script>

<template>
  <div>
    <h2
      v-if="content.block"
      class="text-xl font-bold mb-2 text-primary"
    >{{ content.block.name || content.block.slug }}</h2>
    <div class="flex flex-col gap-6">
      <InputField
        v-model="content.name"
        :label="$t('labels.contents.fields.name')"
        name="name"
      />
      <InputField
        v-model="content.slug"
        :label="$t('labels.contents.fields.slug')"
        name="slug"
      />
      <CheckboxField
        v-model="content.settings.disablePreview"
        :label="$t('labels.contents.settings.disablePreview')"
        name="disablePreview"
        :description="$t('labels.contents.settings.disablePreviewDescription')"
      />
    </div>
  </div>
</template>

<style scoped>

</style>