<script setup lang="ts">
import ContentVersionHistory from '~/components/Content/VersionHistory.vue'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/content/ContentHeader.vue'

// Extract route parameters
const route = useRoute()
const router = useRouter()
const spaceId = computed<string>(() => route.params.space as string)
const contentId = computed<string>(() => route.params.contentId as string)

// Fetch content data for breadcrumbs and title
const { useContentQuery } = useContent(spaceId.value)
const { data: content, isLoading: isLoadingContent } = useContentQuery(contentId.value)

// Navigate back to content edit page
const navigateToContent = () => {
  router.push({
    name: 'space-content-contentId',
    params: {
      space: spaceId.value,
      contentId: contentId.value
    }
  })
}

// Document title
useSeoMeta({
  title: computed(() => content.value?.name ? `History: ${content.value.name}` : 'Version History')
})
</script>

<template>
  <div class="flex flex-col h-full w-full bg-background">
    <div
      v-if="isLoadingContent"
      class="flex items-center justify-center h-20"
    >
      <Icon
        name="lucide:loader"
        class="animate-spin h-6 w-6 mr-2"
      />
      <span>Loading content details...</span>
    </div>

    <div
      v-else-if="content"
      class="flex flex-col h-full"
    >
      <!-- Main content section -->
      <div class="flex-1 overflow-hidden">
        <ContentVersionHistory
          :space-id="spaceId"
          :content="content"
        />
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center h-full p-8"
    >
      <Icon
        name="lucide:file-question"
        class="h-16 w-16 text-muted mb-4"
      />
      <h2 class="text-xl font-bold mb-2">Content not found</h2>
      <p class="text-muted mb-6">The requested content could not be found or you don't have permission to view it.</p>
      <Button @click="router.push(`/${spaceId}/content`)">
        Return to content list
      </Button>
    </div>
  </div>

  <!-- Teleport content header to AppHeader slot -->
  <Teleport to="#appHeader">
    <ContentHeader
      v-if="content"
      :content="content"
    />
  </Teleport>

  <!-- Teleport actions to appHeaderActions slot -->
  <Teleport to="#appHeaderActions">
    <div
      v-if="content"
      class="flex items-center gap-3"
    >
      <Button @click="navigateToContent">
        <Icon
          name="lucide:arrow-left"
          class="mr-2 h-4 w-4"
        />
        Back to Editor
      </Button>
    </div>
  </Teleport>
</template>