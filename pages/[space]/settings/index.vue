<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import DangerZone from '~/components/space-settings/DangerZone.vue'
import ContentSettings from '~/components/space-settings/ContentSettings.vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import { FormField, InputField } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import ServerLocationSelect from '~/components/ServerLocationSelect.vue'

const route = useRoute()
const spaceId = route.params.space as string

const { useUpdateSpaceMutation, useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(spaceId)
const { mutate: updateSpace, isPending: isUpdating } = useUpdateSpaceMutation()

const spaceName = ref('')
const isUploading = ref(false)

// Set initial values when space data is loaded
watch(() => space.value, (newSpace) => {
  if (newSpace) {
    spaceName.value = newSpace.name
  }
}, { immediate: true })

const handleSave = async () => {
  try {
    await updateSpace({
      id: spaceId,
      payload: {
        name: spaceName.value
      }
    })
    toast.success('Space settings saved successfully')
  } catch (_) {
    toast.error('Failed to save space settings')
  }
}

const handleUploadIcon = () => {
  isUploading.value = true
  // Simulate upload process
  setTimeout(() => {
    isUploading.value = false
    toast.success('Icon uploaded successfully')
  }, 2000)
}
</script>

<template>
  <div class="content-grid gap-6 pb-6">
    <ContentHeader
      :header="$t('labels.settings.general.title')"
      :description="$t('labels.settings.general.description')"
    />

    <Card
      v-if="space"
      variant="outline"
    >
      <CardHeader>
        <CardTitle>{{ $t('labels.settings.space.title') }}</CardTitle>
        <CardDescription>{{ $t('labels.settings.space.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6">
        <InputField
          v-model="spaceName"
          :label="$t('labels.settings.space.name')"
          :placeholder="$t('labels.settings.space.namePlaceholder')"
          :description="$t('labels.settings.space.nameDescription')"
          name="space-name"
          required
        />

        <div class="space-y-2">
          <FormField
            :label="$t('labels.settings.space.icon')"
            :description="$t('labels.settings.space.iconDescription')"
          >
            <div class="flex items-center gap-4">
              <div
                v-if="space?.icon"
                class="h-16 w-16 rounded-md flex items-center justify-center bg-surface"
              >
                <img
                  :src="space.icon"
                  alt="Space icon"
                  class="h-12 w-12"
                >
              </div>
              <div
                v-else
                class="h-16 w-16 rounded-md border border-dashed border-muted flex items-center justify-center bg-surface"
              >
                <Icon
                  name="lucide:image"
                  class="h-8 w-8 text-muted"
                />
              </div>
              <Button
                :disabled="isUploading"
                @click="handleUploadIcon"
              >
                <Icon
                  v-if="isUploading"
                  name="lucide:loader"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{ isUploading ? $t('labels.settings.space.uploading') : $t('labels.settings.space.uploadIcon') }}
              </Button>
            </div>
          </FormField>
        </div>

        <InputField
          :label="$t('labels.settings.space.spaceId')"
          :description="$t('labels.settings.space.spaceIdDescription')"
          name="space-id"
          :model-value="space.id"
          disabled
        />

        <ServerLocationSelect
          :model-value="space.settings.region"
          disabled
        />
      </CardContent>
      <CardFooter>
        <Button
          variant="primary"
          :disabled="isUpdating"
          @click="handleSave"
        >
          <Icon
            v-if="isUpdating"
            name="lucide:loader"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ $t('actions.saveChanges') }}
        </Button>
      </CardFooter>
    </Card>

    <ContentSettings
      v-if="space"
      :space="space"
    />
    <DangerZone
      v-if="space"
      :space="space"
    />
  </div>
</template>