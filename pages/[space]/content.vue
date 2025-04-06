<script setup lang="ts">

import useSpaceSettings from '~/composables/useSpaceSettings'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable'
import ContentTree from '~/components/ContentTree.vue'

const route = useRoute()
const { settings } = useSpaceSettings(route.params.space as string)

</script>

<template>
  <div>
    <NuxtLayout>
      <ResizablePanelGroup
        id="content-group-1"
        direction="horizontal"
        class="flex h-full w-full"
      >
        <ResizablePanel
          id="content-panel-1"
          class="shrink-0"
          :default-size="settings.content.treeWidth"
          @resize="size => settings.content.treeWidth = size"
        >
          <ContentTree
            title="Content Structure"
            :space-id="route.params.space as string"
          />
        </ResizablePanel>
        <ResizableHandle id="content-handle-1"/>
        <ResizablePanel
          id="content-panel-2"
          class="grow flex"
        >
          <NuxtPage/>
        </ResizablePanel>
      </ResizablePanelGroup>
    </NuxtLayout>
  </div>
</template>