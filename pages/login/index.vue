<script setup lang="ts">

import { Button } from '~/components/ui/button'
import { InputField } from '~/components/ui/form'

import Logo from '~/assets/logo.svg'
import Markdown from '~/components/Markdown.vue'

const { login, error } = useAuth()
const route = useRoute()

const formData = ref<{
  email: string,
  password: string
}>({
  email: '',
  password: ''
})

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
            class="w-8 h-8 text-primary"
          />
          <h1
            class="text-2xl font-script mb-6 text-primary font-semibold"
            v-text="$t('labels.login.header')"
          />
        </div>
        <form
          class="grid gap-6"
          @submit.prevent="login(formData)"
        >
          <div
            v-if="error"
            class="animate-in fade-in-0 slide-in-from-top-1 duration-300 flex items-center gap-2 rounded-md p-2 border border-destructive bg-destructive-background text-destructive-foreground"
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
          <Markdown :content="$t('labels.login.signup')"/>
        </form>
      </div>
    </NuxtLayout>
  </div>

</template>