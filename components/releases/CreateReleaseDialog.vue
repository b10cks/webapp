<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeaderCombined } from '~/components/ui/dialog'
import { DateTimeFormField, InputField, TextField } from '~/components/ui/form'
import type { CreateReleaseRequest } from '~/types/releases'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [payload: CreateReleaseRequest]
}>()

const form = ref<CreateReleaseRequest>({
  name: '',
  description: '',
  publish_at: new Date().toISOString().split('T')[0],
})

const isValid = computed(() => {
  return form.value.name.trim().length > 0 && form.value.publish_at
})

const handleCreate = () => {
  if (isValid.value) {
    const payload: CreateReleaseRequest = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() || undefined,
      publish_at: new Date(form.value.publish_at).toISOString(),
    }
    emit('create', payload)
    resetForm()
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    publish_at: new Date().toISOString().split('T')[0],
  }
}

const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen) {
    resetForm()
  }
  emit('update:open', newOpen)
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="handleOpenChange"
  >
    <DialogContent class="max-w-md">
      <DialogHeaderCombined
        title="Create Release"
        description="Create a new release and manage your content versions"
      />

      <div class="space-y-4">
        <InputField
          name="release-name"
          label="Name"
          v-model="form.name"
          placeholder="e.g., Version 1.0"
          :disabled="loading"
        />
        <TextField
          name="release-description"
          label="Description"
          v-model="form.description"
          placeholder="Describe this release..."
          class="min-h-20"
          :disabled="loading"
        />
        <DateTimeFormField
          name="release-publish-at"
          v-model="form.publish_at"
          label="Publish At"
          :disabled="loading"
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleOpenChange(false)"
          :disabled="loading"
        >
          Cancel
        </Button>
        <Button
          @click="handleCreate"
          :disabled="!isValid || loading"
          :class="{ 'cursor-not-allowed opacity-50': !isValid || loading }"
        >
          {{ loading ? 'Creating...' : 'Create Release' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
