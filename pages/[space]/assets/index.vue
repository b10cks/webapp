<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import AssetManager from '~/components/AssetManager.vue'

const route = useRoute()

const spaceId = computed<string>(() => route.params.space as string)
const folderId = useRouteQuery('folder', undefined) as Ref<string | undefined>
</script>

<template>
  <AssetManager
    v-model:folder-id="folderId"
    :space-id="spaceId"
  />
</template>
