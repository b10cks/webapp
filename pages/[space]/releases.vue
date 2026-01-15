<script setup lang="ts">
import ContentHeader from '~/components/ui/ContentHeader.vue'
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="w-full bg-background">
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
