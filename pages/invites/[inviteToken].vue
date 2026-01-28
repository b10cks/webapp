<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import { Button } from '~/components/ui/button'
import { InviteStatus } from '~/types/invites'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()
const { usePublicInviteQuery, useAcceptInviteMutation } = useInvites()

const inviteToken = computed(() => route.params.inviteToken as string)
const { data: invite, isPending, error } = usePublicInviteQuery(inviteToken)
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

const emailMismatch = computed(() => {
  // This could be shown if user is logged in with different email
  // Will be handled when accepting the invite
  return false
})

const handleAccept = () => {
  if (invite.value?.id) {
    acceptInvite(
      { inviteId: invite.value.id, payload: { token: inviteToken.value } },
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

const handleLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: `/invites/${inviteToken.value}` },
  })
}

const handleRegister = () => {
  router.push({
    path: '/login/signup',
    query: { invite_id: invite.value?.id },
  })
}
</script>

<template>
  <div>
    <NuxtLayout name="unauthenticated">
      <div class="grid w-full max-w-md space-y-8">
        <div class="grid gap-4">
          <Logo
            alt="b10cks logo"
            class="h-8 w-8 text-primary"
          />
          <h1 class="font-script mb-6 text-2xl font-semibold text-primary">
            Join an Invite
          </h1>
        </div>

        <!-- Loading State -->
        <div v-if="isPending" class="grid gap-4">
          <div class="h-32 rounded-lg border border-muted bg-muted/50 animate-pulse" />
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex items-center gap-2 rounded-md border border-destructive bg-destructive-background p-4 text-destructive-foreground"
        >
          <Icon
            name="lucide:alert-circle"
            class="h-4 w-4 shrink-0"
          />
          <div class="text-sm">
            <p class="font-semibold">Invalid or expired invite</p>
            <p class="text-xs mt-1">The invite link you're trying to use is no longer valid.</p>
          </div>
        </div>

        <!-- Expired State -->
        <div
          v-else-if="isExpired"
          class="flex items-center gap-2 rounded-md border border-warning bg-warning-background p-4 text-warning-foreground"
        >
          <Icon
            name="lucide:clock"
            class="h-4 w-4 shrink-0"
          />
          <div class="text-sm">
            <p class="font-semibold">Invite has expired</p>
            <p class="text-xs mt-1">Please contact the inviter to send you a new invite.</p>
          </div>
        </div>

        <!-- Already Accepted State -->
        <div
          v-else-if="isAccepted"
          class="flex items-center gap-2 rounded-md border border-success bg-success-background p-4 text-success-foreground"
        >
          <Icon
            name="lucide:check-circle"
            class="h-4 w-4 shrink-0"
          />
          <div class="text-sm">
            <p class="font-semibold">Invite already accepted</p>
            <p class="text-xs mt-1">You've already accepted this invite. You can log in to access it.</p>
          </div>
        </div>

        <!-- Valid Invite State -->
        <form
          v-else-if="invite"
          class="grid gap-6"
          @submit.prevent="handleAccept"
        >
          <div class="rounded-lg border border-muted p-4 space-y-3">
            <div class="text-sm">
              <p class="font-semibold text-foreground">{{ inviterName }}</p>
              <p class="text-muted-foreground text-xs mt-1">
                {{ invite.inviter?.email }}
              </p>
            </div>

            <div class="border-t border-muted pt-3">
              <p class="text-sm text-muted-foreground">
                You've been invited to join {{ resourceName }}
              </p>
              <p v-if="invite.role" class="text-sm text-muted-foreground mt-2">
                Your role: <span class="font-semibold capitalize">{{ invite.role }}</span>
              </p>
              <p v-if="invite.message" class="text-sm text-foreground mt-3 italic">
                "{{ invite.message }}"
              </p>
            </div>

            <div class="border-t border-muted pt-3 text-xs text-muted-foreground">
              Expires: {{ new Date(invite.expires_at).toLocaleDateString() }}
            </div>
          </div>

          <div v-if="emailMismatch" class="rounded-md border border-warning bg-warning-background p-3">
            <p class="text-sm text-warning-foreground">
              <strong>Note:</strong> You're using a different email than the one in the invite.
              You can still accept it.
            </p>
          </div>

          <div class="grid gap-3">
            <Button
              type="submit"
              variant="primary"
              :disabled="isAccepting"
            >
              <Icon
                v-if="isAccepting"
                name="lucide:loader-2"
                class="h-4 w-4 mr-2 animate-spin"
              />
              {{ isAccepting ? 'Accepting...' : 'Accept Invite' }}
            </Button>

            <div class="text-center text-sm text-muted-foreground">
              Don't have an account?
              <button
                type="button"
                class="text-primary hover:underline"
                @click="handleRegister"
              >
                Sign up
              </button>
            </div>

            <div class="text-center text-sm text-muted-foreground">
              Already have an account?
              <button
                type="button"
                class="text-primary hover:underline"
                @click="handleLogin"
              >
                Log in
              </button>
            </div>
          </div>
        </form>
      </div>
    </NuxtLayout>
  </div>
</template>
