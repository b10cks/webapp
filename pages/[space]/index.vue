<script setup lang="ts">
import SpaceDashboard from '~/components/SpaceDashboard.vue'
import ContentHeader from '~/components/ui/ContentHeader.vue'

const { useCurrentSpaceQuery } = useSpaces()
const { data: currentSpace } = useCurrentSpaceQuery()
const { formatDateTime } = useFormat()
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="w-full bg-background">
        <div class="content-grid">
          <div v-if="currentSpace">
            <ContentHeader
              :header="currentSpace.name"
              :description="formatDateTime(currentSpace.updated_at)"
            />
            <SpaceDashboard :space-id="currentSpace.id" />
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>
