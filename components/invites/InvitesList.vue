<script setup lang="ts">
import { Button } from '~/components/ui/button'
import type { InviteResource } from '~/types/invites'
import { InviteStatus } from '~/types/invites.d'

const props = defineProps<{
  spaceId?: string
  teamId?: string
  resourceType: 'space' | 'team'
  invites: InviteResource[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  delete: [inviteId: string]
  resend: [inviteId: string]
}>()

const getStatusBadgeColor = (status: InviteStatus) => {
  switch (status) {
    case InviteStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case InviteStatus.ACCEPTED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case InviteStatus.EXPIRED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const getExpiresInDays = (expiresAt: string) => {
  const now = new Date()
  const expires = new Date(expiresAt)
  const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return days
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="!invites || invites.length === 0"
      class="py-8 text-center"
    >
      <Icon
        name="lucide:inbox"
        class="text-muted-foreground mx-auto mb-2 h-12 w-12"
      />
      <p class="text-muted-foreground">No invites yet</p>
      <p class="text-muted-foreground text-sm">Start by sending an invite to someone</p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="invite in invites"
        :key="invite.id"
        class="flex items-center justify-between rounded-lg border border-muted p-4 transition-colors hover:bg-muted/50"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ invite.email }}</p>
              <p class="text-muted-foreground text-xs">
                Role: <span class="capitalize">{{ invite.role }}</span>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                :class="[
                  'rounded-full px-2 py-1 text-xs font-medium',
                  getStatusBadgeColor(invite.status),
                ]"
              >
                {{ invite.status.charAt(0).toUpperCase() + invite.status.slice(1) }}
              </span>
            </div>
          </div>

          <p class="text-muted-foreground mt-2 text-xs">
            <span v-if="invite.status === InviteStatus.ACCEPTED">
              Accepted on {{ new Date(invite.accepted_at).toLocaleDateString() }}
            </span>
            <span v-else> Expires in {{ getExpiresInDays(invite.expires_at) }} days </span>
          </p>

          <p
            v-if="invite.message"
            class="text-muted-foreground mt-1 text-xs italic"
          >
            "{{ invite.message }}"
          </p>
        </div>

        <div class="ml-4 flex shrink-0 items-center gap-2">
          <Button
            v-if="invite.status === InviteStatus.PENDING"
            size="sm"
            variant="ghost"
            @click="emit('resend', invite.id)"
          >
            <Icon
              name="lucide:send"
              class="h-4 w-4"
            />
          </Button>
          <Button
            v-if="invite.status !== InviteStatus.ACCEPTED"
            size="sm"
            variant="ghost"
            class="text-destructive hover:text-destructive"
            @click="emit('delete', invite.id)"
          >
            <Icon
              name="lucide:trash-2"
              class="h-4 w-4"
            />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
