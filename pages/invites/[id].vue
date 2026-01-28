<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { InviteStatus } from '~/types/invites'

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()
const inviteId = computed(() => route.params.id as string)

const { useMyInviteQuery, useAcceptInviteMutation } = useInvites()
const { data: invite, isPending, error } = useMyInviteQuery(inviteId)
const { mutate: acceptInvite, isPending: isAccepting } = useAcceptInviteMutation()

const resourceName = computed(() => {
  if (invite.value?.space) {
    return `space "${invite.value.space.name}"`
  }
  if (invite.value?.team) {
    return `team "${invite.value.team.name}"`
  }
  return 'this resource'
})

const inviterName = computed(() => {
  if (invite.value?.inviter) {
    return `${invite.value.inviter.firstname} ${invite.value.inviter.lastname}`
  }
  return 'Someone'
})

const isExpired = computed(() => {
  return invite.value?.status === InviteStatus.EXPIRED
})

const isAccepted = computed(() => {
  return invite.value?.status === InviteStatus.ACCEPTED
})

const handleAccept = () => {
  if (invite.value?.id) {
    acceptInvite(
      { inviteId: invite.value.id, payload: { token: invite.value.id } },
      {
        onSuccess: (data) => {
          if (data.space_id) {
            router.push(`/${data.space_id}`)
          } else if (data.team_id) {
            router.push('/')
          }
        },
      }
    )
  }
}

// Redirect to login if not authenticated
onBeforeMount(() => {
  if (!isAuthenticated) {
    router.push({
      path: '/login',
      query: { redirect: `/invites/${inviteId.value}` },
    })
  }
})

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold">Join an Invite</h1>
        <p class="text-muted-foreground">You've been invited to join a team or space</p>
      </div>

      <!-- Loading State -->
      <div v-if="isPending" class="space-y-4">
        <div class="h-32 rounded-lg border border-muted bg-muted/50 animate-pulse" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex items-center gap-3 rounded-lg border border-destructive bg-destructive-background p-4 text-destructive-foreground"
      >
        <Icon
          name="lucide:alert-circle"
          class="h-5 w-5 shrink-0"
        />
        <div>
          <p class="font-semibold">Invalid or expired invite</p>
          <p class="text-sm mt-1">The invite you're trying to use is no longer valid.</p>
        </div>
      </div>

      <!-- Expired State -->
      <div
        v-else-if="isExpired"
        class="flex items-center gap-3 rounded-lg border border-warning bg-warning-background p-4 text-warning-foreground"
      >
        <Icon
          name="lucide:clock"
          class="h-5 w-5 shrink-0"
        />
        <div>
          <p class="font-semibold">Invite has expired</p>
          <p class="text-sm mt-1">Please contact the inviter to send you a new invite.</p>
        </div>
      </div>

      <!-- Already Accepted State -->
      <div
        v-else-if="isAccepted"
        class="flex items-center gap-3 rounded-lg border border-success bg-success-background p-4 text-success-foreground"
      >
        <Icon
          name="lucide:check-circle"
          class="h-5 w-5 shrink-0"
        />
        <div>
          <p class="font-semibold">Invite already accepted</p>
          <p class="text-sm mt-1">You've already accepted this invite.</p>
        </div>
      </div>

      <!-- Valid Invite State -->
      <form
        v-else-if="invite"
        class="space-y-6"
        @submit.prevent="handleAccept"
      >
        <div class="rounded-lg border border-muted p-4 space-y-4">
          <div>
            <p class="font-semibold text-foreground">{{ inviterName }}</p>
            <p class="text-sm text-muted-foreground mt-1">
              {{ invite.inviter?.email }}
            </p>
          </div>

          <div class="border-t border-muted pt-4">
            <p class="text-sm">
              You've been invited to join <span class="font-semibold">{{ resourceName }}</span>
            </p>
            <p v-if="invite.role" class="text-sm text-muted-foreground mt-2">
              Your role: <span class="font-semibold capitalize">{{ invite.role }}</span>
            </p>
            <p v-if="invite.message" class="text-sm text-foreground mt-3 italic border-l-2 border-muted pl-3">
              "{{ invite.message }}"
            </p>
          </div>

          <div class="border-t border-muted pt-3 text-xs text-muted-foreground">
            Expires: {{ new Date(invite.expires_at).toLocaleDateString() }}
          </div>
        </div>

        <div class="space-y-2">
          <Button
            type="submit"
            variant="primary"
            class="w-full"
            :disabled="isAccepting"
          >
            <Icon
              v-if="isAccepting"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isAccepting ? 'Accepting...' : 'Accept Invite' }}
          </Button>

          <Button
            type="button"
            variant="outline"
            class="w-full"
            @click="router.back()"
          >
            Decline
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
