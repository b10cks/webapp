<script setup lang="ts">

import { Button } from '~/components/ui/button'
import { InputField } from '~/components/ui/form'

import Logo from '~/assets/logo.svg'
import Markdown from '~/components/Markdown.vue'

const { login } = useAuth()

const formData = ref<{
  firstname: string,
  lastname: string,
  email: string,
  password: string
}>({
  firstname: '',
  lastname: '',
  email: '',
  password: ''
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
            v-text="$t('labels.login.signupHeader')"
          />
          <Markdown :content="$t('labels.login.signupDescription')"/>
        </div>
        <form
          class="grid gap-6"
          @submit.prevent="login(formData)"
        >
          <InputField
            v-model="formData.firstname"
            type="firstname"
            name="firstname"
            :label="$t('labels.login.fields.firstnameLabel')"
            :placeholder="$t('labels.login.fields.firstnamePlaceholder')"
            required
          />
          <InputField
            v-model="formData.lastname"
            type="lastname"
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
            disabled
            variant="primary"
          >{{ $t('actions.signup') }}</Button>
          <Markdown :content="$t('labels.login.login')"/>
        </form>
      </div>
    </NuxtLayout>
  </div>

</template>