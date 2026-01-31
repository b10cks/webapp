<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { InputField } from '~/components/ui/form'

const { useChangePasswordMutation } = useUser()
const { mutate: changePassword, isPending: isChanging } = useChangePasswordMutation()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref<string | null>(null)

const handleChangePassword = async () => {
  passwordError.value = null

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }

  await changePassword({
    old_password: oldPassword.value,
    new_password: newPassword.value,
  })

  // Reset form on success
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="content-grid gap-6 pb-6">
    <ContentHeader
      :header="$t('labels.account.security.title')"
      :description="$t('labels.account.security.description')"
    />

    <Card variant="outline">
      <CardHeader>
        <CardTitle>{{ $t('labels.account.security.changePassword') }}</CardTitle>
        <CardDescription>{{ $t('labels.account.security.changePasswordDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6">
        <InputField
          v-model="oldPassword"
          type="password"
          :label="$t('labels.account.security.oldPassword')"
          :placeholder="$t('labels.account.security.oldPasswordPlaceholder')"
          name="old-password"
          required
        />

        <InputField
          v-model="newPassword"
          type="password"
          :label="$t('labels.account.security.newPassword')"
          :placeholder="$t('labels.account.security.newPasswordPlaceholder')"
          name="new-password"
          required
        />

        <InputField
          v-model="confirmPassword"
          type="password"
          :label="$t('labels.account.security.confirmPassword')"
          :placeholder="$t('labels.account.security.confirmPasswordPlaceholder')"
          name="confirm-password"
          required
          :error="passwordError"
        />
      </CardContent>
      <CardFooter>
        <Button
          variant="primary"
          :disabled="isChanging || !oldPassword || !newPassword || !confirmPassword"
          @click="handleChangePassword"
        >
          <Icon
            v-if="isChanging"
            name="lucide:loader"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ $t('labels.account.security.changePasswordButton') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
