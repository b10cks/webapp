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
import { useFileUpload } from '~/composables/useFileUpload'

const route = useRoute()
const spaceId = route.params.space as string

const { useUpdateSpaceMutation, useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(spaceId)
const { mutate: updateSpace, isPending: isUpdating } = useUpdateSpaceMutation()

const spaceName = ref('')
const spaceIcon = ref<string | null>(null)
const iconInputRef = ref<HTMLInputElement | null>(null)
const uploadProgress = ref(0)
const { upload, isUploading: fileUploadIsUploading, error } = useFileUpload()

// Set initial values when space data is loaded
watch(() => space.value, (newSpace) => {
  if (newSpace) {
    spaceName.value = newSpace.name
    spaceIcon.value = newSpace.icon || null
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

// Update space icon locally after upload
const updateSpaceIcon = (url: string) => {
  if (space.value) {
    spaceIcon.value = url
  }
}

const handleIconFile = async (file: File) => {
  if (!file) return
  uploadProgress.value = 0
  try {
    const response = await upload(file, {
      url: `/mgmt/v1/spaces/${spaceId}/icon`,
      fieldName: 'icon',
      onProgress: (p) => (uploadProgress.value = p),
    })
    if (response?.data?.icon) {
      updateSpaceIcon(response.data.icon)
      toast.success('Icon uploaded successfully')
    } else {
      toast.error('Upload succeeded but no icon returned')
    }
  } catch (e) {
    toast.error(e.message || 'Failed to upload icon')
  }
}

const handleUploadIcon = () => {
  iconInputRef.value?.click()
}

const onIconInputChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    handleIconFile(files[0])
  }
}

const onDropIcon = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleIconFile(e.dataTransfer.files[0])
  }
}

const onDragOverIcon = (e: DragEvent) => {
  e.preventDefault()
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
            name="space-icon"
            :label="$t('labels.settings.space.icon')"
            :description="$t('labels.settings.space.iconDescription')"
          >
            <div
              class="flex items-center gap-4"
              @drop="onDropIcon"
              @dragover="onDragOverIcon"
            >
              <div
                v-if="space?.icon"
                class="h-16 w-16 rounded-sm flex items-center justify-center bg-surface cursor-pointer"
                @click="handleUploadIcon"
              >
                <NuxtImg
                  :src="spaceIcon"
                  alt="Space icon"
                  class="h-14 w-14"
                />
              </div>
              <div
                v-else
                class="h-16 w-16 rounded-md border border-dashed border-muted flex items-center justify-center bg-surface cursor-pointer"
                @click="handleUploadIcon"
              >
                <Icon
                  name="lucide:image"
                  class="h-8 w-8 text-muted"
                />
              </div>
              <input
                ref="iconInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onIconInputChange"
              >
              <span
                v-if="fileUploadIsUploading"
                class="ml-2 text-muted text-xs"
              >{{ uploadProgress }}%</span>
            </div>
          </FormField>
        </div>

        <InputField
          :label="$t('labels.settings.space.spaceId')"
          :description="$t('labels.settings.space.spaceIdDescription')"
          name="space-id"
          :model-value="space.id"
          readonly
          :actions="['copy']"
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