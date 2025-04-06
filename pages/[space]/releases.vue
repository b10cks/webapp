<script setup lang="ts">

import ContentHeader from '~/components/ui/ContentHeader.vue'
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="bg-background w-full">
        <div class="content-grid">
          <ContentHeader
            :header="$t('labels.releases.title')"
            :description="$t('labels.releases.description')"
          />
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>