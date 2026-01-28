<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import Markdown from '~/components/Markdown.vue'
import { Button } from '~/components/ui/button'
import { InputField } from '~/components/ui/form'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()
const { usePublicInviteQuery } = useInvites()

const inviteId = computed(() => route.query.invite_id as string | undefined)
const inviteToken = computed(() => route.query.invite_token as string | undefined)

// Fetch public invite details if token is provided
const { data: publicInvite } = usePublicInviteQuery(computed(() => inviteToken.value || ''))

const formData = ref<{
  firstname: string
  lastname: string
  email: string
  password: string
  invite_id?: string
}>({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  invite_id: inviteId.value,
})

const emailMismatch = computed(() => {
  if (!publicInvite.value?.email_hash || !formData.value.email) {
    return false
  }
  // Compare email hashes (would need to be done server-side properly)
  return false
})

const handleSignup = async () => {
  await login({
    ...formData.value,
    password_confirmation: formData.value.password,
    invite_id: formData.value.invite_id || undefined,
  })

  // After successful registration, redirect to invite acceptance if invite_id exists
  if (inviteId.value) {
    router.push(`/invites/${inviteId.value}`)
  }
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
          <h1
            class="font-script mb-6 text-2xl font-semibold text-primary"
            v-text="$t('labels.login.signupHeader')"
          />
          <Markdown :content="$t('labels.login.signupDescription')" />

          <!-- Invite Info Banner -->
          <div
            v-if="publicInvite"
            class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          >
            <p class="font-semibold">You've been invited!</p>
            <p class="mt-1">
              <span class="font-medium">{{ publicInvite.inviter.firstname }}</span>
              has invited you to join
              <span class="font-medium">{{
                publicInvite.space?.name || publicInvite.team?.name || 'their team'
              }}</span>
            </p>
            <p
              v-if="emailMismatch"
              class="mt-2 text-xs opacity-75"
            >
              Note: You're registering with a different email than the invite.
            </p>
          </div>
        </div>

        <form
          class="grid gap-6"
          @submit.prevent="handleSignup"
        >
          <InputField
            v-model="formData.firstname"
            type="text"
            name="firstname"
            :label="$t('labels.login.fields.firstnameLabel')"
            :placeholder="$t('labels.login.fields.firstnamePlaceholder')"
            required
          />
          <InputField
            v-model="formData.lastname"
            type="text"
            name="lastname"
            :label="$t('labels.login.fields.lastnameLabel')"
            :placeholder="$t('labels.login.fields.lastnamePlaceholder')"
            required
          />
          <InputField
            v-model="formData.email"
            type="email"
            name="email"
            :label="$t('labels.login.fields.emailLabel')"
            :placeholder="$t('labels.login.fields.emailPlaceholder')"
            required
          />
          <div class="grid gap-3">
            <InputField
              v-model="formData.password"
              type="password"
              name="password"
              :label="$t('labels.login.fields.passwordLabel')"
              :placeholder="$t('labels.login.fields.passwordPlaceholder')"
              required
            />
          </div>
          <Button
            variant="primary"
          >{{ $t('actions.signup') }}</Button
          >
          <Markdown :content="$t('labels.login.login')" />
        </form>
      </div>
    </NuxtLayout>
  </div>
</template>
