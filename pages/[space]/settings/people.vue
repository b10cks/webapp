<script setup lang="ts">
import CreateInviteDialog from '~/components/invites/CreateInviteDialog.vue'
import InvitesList from '~/components/invites/InvitesList.vue'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)

const { useSpaceInvitesQuery, useDeleteSpaceInviteMutation, useResendSpaceInviteMutation } =
  useInvites()
const { data: invites, isPending } = useSpaceInvitesQuery(spaceId)
const { mutate: deleteInvite } = useDeleteSpaceInviteMutation()
const { mutate: resendInvite } = useResendSpaceInviteMutation()

const inviteDialogOpen = ref(false)

const handleDeleteInvite = (inviteId: string) => {
  deleteInvite({ spaceId: spaceId.value, inviteId })
}

const handleResendInvite = (inviteId: string) => {
  resendInvite({ spaceId: spaceId.value, inviteId })
}
</script>

<template>
  <div>
    <div class="grow bg-background">
      <div class="content-grid">
        <ContentHeader header="People & Invites">
          <Button
            variant="primary"
            @click="inviteDialogOpen = true"
          >
            <Icon
              name="lucide:plus"
              class="mr-2 h-4 w-4"
            />
            Send Invite
          </Button>
        </ContentHeader>

        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Pending Invites</h3>
              <span
                v-if="invites && invites.length > 0"
                class="text-muted-foreground text-sm"
              >
                {{ invites.length }} invite{{ invites.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <div
              v-if="isPending"
              class="space-y-2"
            >
              <div class="h-16 animate-pulse rounded-lg border border-muted bg-muted/50" />
              <div class="h-16 animate-pulse rounded-lg border border-muted bg-muted/50" />
            </div>

            <InvitesList
              v-else
              :invites="invites || []"
              resource-type="space"
              :space-id="spaceId"
              :is-loading="isPending"
              @delete="handleDeleteInvite"
              @resend="handleResendInvite"
            />
          </div>
        </div>
      </div>
    </div>

    <CreateInviteDialog
      v-model:open="inviteDialogOpen"
      :space-id="spaceId"
      resource-type="space"
    />
  </div>
</template>
