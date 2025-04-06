<script setup lang="ts">

import AssetManager from '~/components/AssetManager.vue'

const route = useRoute()

const spaceId = computed<string>(() => route.params.space as string)
const folderId = computed<string | undefined>({
  get: () => route.query.folder as string | undefined,
  set: v => {
    const query = { ...route.query, folder: v }
    useRouter().replace({ query })
  }
})

</script>

<template>
  <AssetManager
    v-model:folder-id="folderId"
    :space-id="spaceId"
  />
</template>