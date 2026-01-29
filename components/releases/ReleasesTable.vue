<script setup lang="ts">
import ReleaseBadge from '~/components/releases/ReleaseBadge.vue'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { SimpleTooltip } from '~/components/ui/tooltip'
import type { Release } from '~/types/releases'

const spaceId = inject<string>('spaceId') || ''
const { getReleaseState } = useReleases(spaceId)

const props = defineProps<{
  releases: Release[]
  isLoading?: boolean
  onEdit?: (release: Release) => void
  onDelete?: (release: Release) => void
  onCommit?: (release: Release) => void
  onCancel?: (release: Release) => void
}>()

const emit = defineEmits<{
  edit: [release: Release]
  delete: [release: Release]
  commit: [release: Release]
  cancel: [release: Release]
}>()

const getVersionsLabel = (count: number) => {
  return `${count} ${count === 1 ? 'version' : 'versions'}`
}

const handleEdit = (release: Release) => {
  emit('edit', release)
  props.onEdit?.(release)
}

const handleDelete = (release: Release) => {
  emit('delete', release)
  props.onDelete?.(release)
}

const handleCommit = (release: Release) => {
  emit('commit', release)
  props.onCommit?.(release)
}

const handleCancel = (release: Release) => {
  emit('cancel', release)
  props.onCancel?.(release)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isDraft = (release: Release) => getReleaseState(release) === 'draft'
const isScheduled = (release: Release) => getReleaseState(release) === 'scheduled'
const isPublished = (release: Release) => getReleaseState(release) === 'published'
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Publish Date</TableHead>
          <TableHead class="text-right">Versions</TableHead>
          <TableHead class="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty
          v-if="releases.length === 0"
          :colspan="5"
        >
          No releases yet. Create your first release to get started.
        </TableEmpty>

        <TableRow
          v-for="release in releases"
          :key="release.id"
        >
          <TableCell class="font-medium">
            <div>
              <p class="font-semibold">{{ release.name }}</p>
              <p
                v-if="release.description"
                class="line-clamp-1 text-sm text-muted"
              >
                {{ release.description }}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <ReleaseBadge :release="release" />
          </TableCell>
          <TableCell class="text-sm">
            {{ formatDate(release.publish_at) }}
          </TableCell>
          <TableCell class="text-right text-sm">
            <SimpleTooltip :tooltip="getVersionsLabel(release.versions_count)">
              <span class="cursor-help">{{ release.versions_count }}</span>
            </SimpleTooltip>
          </TableCell>
          <TableCell class="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Icon
                    name="lucide:more-horizontal"
                    class="h-4 w-4"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem
                  v-if="isDraft(release)"
                  @click="handleEdit(release)"
                >
                  <Icon
                    name="lucide:pencil"
                    class="mr-2 h-4 w-4"
                  />
                  <span>Edit</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  v-if="isDraft(release)"
                  @click="handleCommit(release)"
                >
                  <Icon
                    name="lucide:check"
                    class="mr-2 h-4 w-4"
                  />
                  <span>Commit</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  v-if="isScheduled(release) || isPublished(release)"
                  @click="handleCancel(release)"
                >
                  <Icon
                    name="lucide:x"
                    class="mr-2 h-4 w-4"
                  />
                  <span>Cancel</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  @click="handleDelete(release)"
                  class="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                >
                  <Icon
                    name="lucide:trash-2"
                    class="mr-2 h-4 w-4"
                  />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
