<script setup lang="ts">
import CreateReleaseDialog from '~/components/releases/CreateReleaseDialog.vue'
import ReleasesTable from '~/components/releases/ReleasesTable.vue'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import type { CreateReleaseRequest, Release } from '~/types/releases'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)

const {
  useReleasesQuery,
  useCreateReleaseMutation,
  useCommitReleaseMutation,
  useCancelReleaseMutation,
  useDeleteReleaseMutation,
  usePublishReleaseMutation,
} = useReleases(spaceId)

const { data: releases, isLoading: isLoadingReleases } = useReleasesQuery()
const { mutate: createRelease, isPending: isCreating } = useCreateReleaseMutation()
const { mutate: commitRelease, isPending: isCommitting } = useCommitReleaseMutation()
const { mutate: cancelRelease, isPending: isCancelling } = useCancelReleaseMutation()
const { mutate: deleteRelease, isPending: isDeleting } = useDeleteReleaseMutation()
const { mutate: publishRelease, isPending: isPublishing } = usePublishReleaseMutation()

const { alert } = useAlertDialog()

const createDialogOpen = ref(false)

const handleCreateRelease = (payload: CreateReleaseRequest) => {
  createRelease(payload, {
    onSuccess: () => {
      createDialogOpen.value = false
    },
  })
}

const handleCommit = (releaseId: string) => {
  commitRelease(releaseId)
}

const handleCancelClick = async (release: Release) => {
  const confirmed = await alert.confirm(
    `Are you sure you want to cancel the release "${release.name}"?`,
    {
      title: 'Cancel Release',
      confirmLabel: 'Cancel Release',
      variant: 'destructive',
      onConfirm: () => {
        cancelRelease(release.id)
      },
    }
  )
}

const handleDeleteClick = async (release: Release) => {
  const confirmed = await alert.confirm(
    `Are you sure you want to delete the release "${release.name}"? This action cannot be undone.`,
    {
      title: 'Delete Release',
      confirmLabel: 'Delete Release',
      variant: 'destructive',
      onConfirm: () => {
        deleteRelease(release.id)
      },
    }
  )
}

const handlePublish = (releaseId: string) => {
  publishRelease(releaseId)
}

const isLoading = computed(
  () =>
    isLoadingReleases.value ||
    isCreating.value ||
    isCommitting.value ||
    isCancelling.value ||
    isDeleting.value ||
    isPublishing.value
)
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="w-full bg-background">
        <div class="content-grid">
          <div class="mb-6 flex items-center justify-between">
            <div>
              <ContentHeader
                :header="$t('labels.releases.title')"
                :description="$t('labels.releases.description')"
              />
            </div>
            <div>
              <Button
                variant="accent"
                @click="createDialogOpen = true"
                :disabled="isLoading"
              >
                <Icon
                  name="lucide:plus"
                  class="mr-2"
                />
                Create Release
              </Button>
            </div>
          </div>

          <ReleasesTable
            :releases="releases || []"
            :is-loading="isLoading"
            @commit="(release) => handleCommit(release.id)"
            @cancel="handleCancelClick"
            @delete="handleDeleteClick"
            @edit="(release) => {}"
          />
        </div>
      </div>
    </NuxtLayout>

    <CreateReleaseDialog
      :open="createDialogOpen"
      :loading="isCreating"
      @update:open="createDialogOpen = $event"
      @create="handleCreateRelease"
    />
  </div>
</template>
