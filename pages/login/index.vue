<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import Markdown from '~/components/Markdown.vue'
import TwoFactorVerifyDialog from '~/components/TwoFactorVerifyDialog.vue'
import { Button } from '~/components/ui/button'
import { InputField } from '~/components/ui/form'

const { login, error, requiresTwoFactor, verifyTwoFactorAndLogin, cancelTwoFactorLogin } = useAuth()
const { t } = useI18n()
const route = useRoute()

useSeoMeta({
  title: computed(() => t('labels.login.pageTitle')),
})

const formData = ref<{
  email: string
  password: string
}>({
  email: '',
  password: '',
})

const twoFactorDialogOpen = ref(false)

watch(requiresTwoFactor, (value) => {
  twoFactorDialogOpen.value = value
})

const handleVerify = async (code: string): Promise<boolean> => {
  return await verifyTwoFactorAndLogin(code)
}

const handleCancel = () => {
  cancelTwoFactorLogin()
}

// Handle session expired message
onMounted(() => {
  if (route.query.message === 'session_expired') {
    error.value = 'Your session has expired. Please log in again.'
  }
})
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
            v-text="$t('labels.login.header')"
          />
        </div>
        <form
          class="grid gap-6"
          @submit.prevent="login(formData)"
        >
          <TwoFactorVerifyDialog
            v-model:open="twoFactorDialogOpen"
            :on-verify="handleVerify"
            :on-cancel="handleCancel"
          />
          <div
            v-if="error && !requiresTwoFactor"
            class="animate-in fade-in-0 slide-in-from-top-1 flex items-center gap-2 rounded-md border border-destructive bg-destructive-background p-2 text-destructive-foreground duration-300"
          >
            <Icon
              name="lucide:alert-circle"
              class="h-4 w-4"
            />
            <div>
              {{ error }}
            </div>
          </div>
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
            <div class="text-right">
              <NuxtLink to="/login/password">{{ $t('labels.login.forgotPassword') }}</NuxtLink>
            </div>
          </div>
          <Button variant="primary">{{ $t('actions.login') }}</Button>
          <Markdown :content="$t('labels.login.signup')" />
        </form>
      </div>
    </NuxtLayout>
  </div>
</template>
