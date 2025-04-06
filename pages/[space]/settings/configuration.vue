<script setup lang="ts">
// Imports for child components will be handled by Vue's auto-import feature
import EditorSettings from '~/components/space-settings/EditorSettings.vue'
import I18nSettings from '~/components/space-settings/I18nSettings.vue'
import AccssTokenSettings from '~/components/space-settings/AccssTokenSettings.vue'
import AssetLibrarySettings from '~/components/space-settings/AssetLibrarySettings.vue'
import AiSettings from '~/components/space-settings/AiSettings.vue'
import ContentHeader from '~/components/ui/ContentHeader.vue'

const route = useRoute()
const spaceId = route.params.space as string

const { useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(spaceId)

</script>

<template>
  <div class="content-grid gap-6 pb-6">
    <ContentHeader
      :header="$t('labels.settings.configuration.title')"
      :description="$t('labels.settings.configuration.description')"
    />
    <EditorSettings
      v-if="space"
      :space="space"
    />
    <I18nSettings
      v-if="space"
      :space="space"
    />
    <AccssTokenSettings
      v-if="space"
      :space="space"
    />
    <AssetLibrarySettings
      v-if="space"
      :space="space"
    />
    <AiSettings
      v-if="space"
      :space="space"
    />
  </div>
</template>