<script setup lang="ts">

import type { BadgeVariants } from '~/components/ui/badge'
import { Badge } from '~/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import type { ContentResource } from '~/types/contents'

const props = defineProps<{
  content: ContentResource
}>()

const spaceId = inject('spaceId')

const { useContentMenuQuery, buildBreadcrumbs } = useContentMenu(spaceId.value)
const { data: contentMenu } = useContentMenuQuery()
const { settings } = useSpaceSettings(spaceId.value)
const breadcrumbs = computed(() => props.content && buildBreadcrumbs(contentMenu.value, props.content.id))

watch(breadcrumbs, (crumbs) => {
  const path = crumbs.map(({ id }) => id)
  settings.value.content.expanded = [...settings.value.content.expanded, ...path]
})

const status = computed<{ color: string, label: string }>(() => {
  if (props.content?.published_at) {
    return {
      color: 'success',
      label: 'published'
    }
  }

  return {
    color: 'default',
    label: 'draft'
  }
})
</script>

<template>
  <div class="flex items-center gap-3">
    <div v-if="content">
      <h1 class="flex items-center gap-3">
        <span class="text-lg font-semibold text-primary">{{ content?.name }}</span>
        <Badge
          size="sm"
          :variant="status.color as BadgeVariants['variant']"
        >
          {{ $t(`labels.contents.status.${status.label}`) }}
        </Badge>
      </h1>
      <div class="flex items-center gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem
              v-for="(item, index) in breadcrumbs"
              :key="index"
            >
              <BreadcrumbLink :to="{ name: 'space-content-contentId', params: { space: spaceId, contentId: item.id }}">
                {{ item.name }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1"/>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  </div>
</template>