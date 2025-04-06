<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { useAlertDialog } from '~/composables/useAlertDialog'
import AssetGrid from '~/components/assets/AssetGrid.vue'
import AssetDetailsDialog from '~/components/assets/AssetDetailsDialog.vue'

interface AssetValue {
  id: string
  type: 'asset'
  full_path: string
  extension: string
  mime_type: string
  size: number
  filename: string
  data: object
}

const props = defineProps<{
  modelValue?: AssetValue | null
  spaceId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AssetValue | null]
}>()

const { alert } = useAlertDialog()
const { $t } = useI18n()
const { getFileIcon, getFileType } = useFileUtils()

const localValue = ref<AssetValue | null>(null)
const showAssetPicker = ref(false)
const showAssetDetails = ref(false)

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue ? { ...newValue } : null
}, { immediate: true, deep: true })

const hasAsset = computed(() => !!localValue.value)
const isImage = computed(() => {
  if (!localValue.value) return false

  return getFileType(localValue.value.mime_type) === 'image'
})

const updateValue = () => {
  emit('update:modelValue', localValue.value)
}

const handleAssetSelect = (asset: AssetResource) => {
  localValue.value = {
    id: asset.id,
    type: 'asset',
    full_path: asset.full_path,
    extension: asset.extension,
    mime_type: asset.mime_type,
    size: asset.size,
    filename: asset.filename,
    data: {}
  }
  updateValue()
  showAssetPicker.value = false
}

const handleAssetReplace = () => {
  showAssetPicker.value = true
}

const handleAssetEdit = () => {
  showAssetDetails.value = true
}

const handleAssetDelete = async () => {
  const confirmed = await alert.confirm(
    $t('messages.assets.confirmDelete'),
    {
      title: $t('labels.assets.deleteAsset'),
      confirmLabel: $t('actions.delete'),
      cancelLabel: $t('actions.cancel')
    }
  )

  if (confirmed) {
    localValue.value = null
    updateValue()
  }
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="!hasAsset"
      class="border-2 border-dashed border-input rounded-lg p-8 text-center bg-surface/50 hover:bg-surface transition-colors cursor-pointer"
      @click="showAssetPicker = true"
    >
      <Icon
        name="lucide:image"
        size="2rem"
        class="mx-auto mb-3 text-muted"
      />
      <p class="text-sm font-medium text-primary mb-1">
        {{ $t('labels.assets.addAsset') }}
      </p>
      <p class="text-xs text-muted">
        {{ $t('labels.assets.addAssetDescription') }}
      </p>
    </div>

    <div
      v-else
      class="group relative border border-input rounded-lg overflow-hidden bg-surface"
    >
      <div class="flex items-center gap-3 p-2">
        <div class="flex-shrink-0">
          <div
            v-if="isImage"
            class="w-14 h-14 rounded border border-input overflow-hidden bg-background"
          >
            <NuxtImg
              :src="localValue.full_path"
              :alt="localValue.data?.altText || localValue.filename"
              width="56"
              height="56"
              :modifiers="{ crop: 'fill' }"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-12 h-12 rounded border border-input bg-background flex items-center justify-center"
          >
            <Icon
              :name="getFileIcon(getFileType(localValue.mime_type))"
              class="text-muted"
            />
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-primary truncate">
            {{ localValue.filename }}
          </p>
          <p class="text-sm text-muted">
            {{ $t('labels.assets.asset') }}
          </p>
        </div>

        <div class="ml-auto flex opacity-0 group-hover:opacity-100 gap-2 items-center">
          <button
            class="transform cursor-pointer hover:text-primary flex items-center"
            :title="$t('actions.assets.replace')"
            @click.stop="handleAssetReplace"
          >
            <Icon
              name="lucide:replace"
            />
          </button>
          <button
            class="transform cursor-pointer hover:text-primary flex items-center"
            :title="$t('actions.assets.edit')"
            @click.stop="handleAssetEdit"
          >
            <Icon
              name="lucide:pencil"
            />
          </button>
          <button
            class="transform cursor-pointer hover:text-red-500 flex items-center"
            :title="$t('actions.assets.delete')"
            @click.stop="handleAssetDelete"
          >
            <Icon
              name="lucide:trash-2"
            />
          </button>
        </div>
      </div>
    </div>

    <Dialog
      v-model:open="showAssetPicker"
      :modal="true"
    >
      <DialogContent class="!max-w-[90dvw] h-[90dvh] p-0">
        <DialogHeader>
          <DialogTitle>{{ $t('labels.assets.selectAsset') }}</DialogTitle>
        </DialogHeader>

        <div class="flex-1">
          <AssetGrid
            :space-id="spaceId"
            mode="select"
            @asset-select="handleAssetSelect"
          />
        </div>
      </DialogContent>
    </Dialog>

    <AssetDetailsDialog
      v-if="localValue && showAssetDetails"
      v-model:asset="localValue"
      :folder-id="null"
      :space-id="spaceId"
      mode="reduced"
      @close="showAssetDetails = false"
    />
  </div>
</template>