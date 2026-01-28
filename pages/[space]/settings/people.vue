<script setup lang="ts">
import CreateInviteDialog from '~/components/invites/CreateInviteDialog.vue'
import SpaceInvitesList from '~/components/invites/SpaceInvitesList.vue'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)

const { useSpaceInvitesQuery, useDeleteSpaceInviteMutation, useResendSpaceInviteMutation } =
  useInvites()
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
        <ContentHeader header="Invites">
          <template #actions>
            <Button
              variant="primary"
              @click="inviteDialogOpen = true"
            >
              <Icon name="lucide:plus" />
              Send Invite
            </Button>
          </template>
        </ContentHeader>

        <div class="space-y-6">
          <SpaceInvitesList
            :space-id="spaceId"
            @delete="handleDeleteInvite"
            @resend="handleResendInvite"
          />
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
