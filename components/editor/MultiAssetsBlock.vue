<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { useAlertDialog } from '~/composables/useAlertDialog'
import AssetGrid from '~/components/assets/AssetGrid.vue'
import AssetDetailsDialog from '~/components/assets/AssetDetailsDialog.vue'
import { Button } from '~/components/ui/button'
import Label from '../ui/form/Label.vue'

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
  modelValue?: AssetValue[] | null
  item: MultiAssetSchema & { key: string }
  spaceId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AssetValue[] | null]
}>()

const { alert } = useAlertDialog()
const { $t } = useI18n()
const { getFileIcon, getFileType } = useFileUtils()

const localValue = ref<AssetValue[]>([])
const showAssetPicker = ref(false)
const showAssetDetails = ref(false)
const editingAsset = ref<AssetValue | null>(null)
const draggedIndex = ref<number | null>(null)

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue ? [...newValue] : []
}, { immediate: true, deep: true })

const hasAssets = computed(() => localValue.value.length > 0)
const canAddMore = computed(() => {
  if (!props.item.max) return true
  return localValue.value.length < props.item.max
})

const remainingSlots = computed(() => {
  if (!props.item.max) return null
  return props.item.max - localValue.value.length
})

const updateValue = () => {
  emit('update:modelValue', localValue.value.length > 0 ? localValue.value : null)
}

const handleAssetSelect = (asset: AssetResource) => {
  if (props.item.max && localValue.value.length >= props.item.max) {
    showAssetPicker.value = false
    return
  }

  const newAsset: AssetValue = {
    id: asset.id,
    type: 'asset',
    full_path: asset.full_path,
    extension: asset.extension,
    mime_type: asset.mime_type,
    size: asset.size,
    filename: asset.filename,
    data: {}
  }

  localValue.value.push(newAsset)
  updateValue()
  showAssetPicker.value = false
}

const handleAssetEdit = (asset: AssetValue) => {
  editingAsset.value = { ...asset }
  showAssetDetails.value = true
}

const handleAssetDelete = async (index: number) => {
  const asset = localValue.value[index]
  if (!asset) return

  const confirmed = await alert.confirm(
    $t('messages.assets.confirmDeleteFromCollection'),
    {
      title: $t('labels.assets.removeAsset'),
      confirmLabel: $t('actions.remove'),
      cancelLabel: $t('actions.cancel')
    }
  )

  if (confirmed) {
    localValue.value.splice(index, 1)
    updateValue()
  }
}

const handleAssetReplace = (index: number) => {
  replaceIndex.value = index
  showAssetPicker.value = true
}

const replaceIndex = ref<number | null>(null)

const handleAssetSelectForReplace = (asset: AssetResource) => {
  if (replaceIndex.value === null) {
    handleAssetSelect(asset)
  } else {
    localValue.value[replaceIndex.value] = {
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
    replaceIndex.value = null
  }
  showAssetPicker.value = false
}

const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleDrop = (e: DragEvent, targetIndex: number) => {
  if (draggedIndex.value === null) return
  e.preventDefault()

  const draggedAsset = localValue.value[draggedIndex.value]
  localValue.value.splice(draggedIndex.value, 1)
  localValue.value.splice(targetIndex, 0, draggedAsset)

  draggedIndex.value = null
  updateValue()
}

const isImage = (asset: AssetValue) => {
  return getFileType(asset.mime_type) === 'image'
}

const handleAssetDetailsUpdate = (updatedAsset: AssetValue) => {
  const index = localValue.value.findIndex(a => a.id === updatedAsset.id)
  if (index !== -1) {
    localValue.value[index] = { ...updatedAsset }
    updateValue()
  }
}

const closeAssetDetails = () => {
  showAssetDetails.value = false
  editingAsset.value = null
}
</script>

<template>
  <div class="space-y-3">
    <Label :label="item.name || item.key"/>
    <div
      v-if="!hasAssets"
      class="border border-dashed border-input rounded-lg gap-2 flex items-center p-4 bg-surface/50 hover:bg-surface transition-colors cursor-pointer"
      @click="showAssetPicker = true"
    >
      <Icon
        name="lucide:images"
        size="2rem"
      />
      <div class="flex-1">
        <p class="text-primary">
          {{ $t('labels.assets.addAsset') }}
        </p>
        <p class="text-sm text-muted">
          {{
            item.max ? $t('labels.assets.addAssetDescriptionWithLimit', { max: item.max }) : $t('labels.assets.addAssetDescription')
          }}
        </p>
      </div>
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="(asset, index) in localValue"
          :key="asset.id"
          class="group relative border border-input rounded-lg overflow-hidden bg-surface"
          draggable
          @dragstart="handleDragStart(index)"
          @dragover="handleDragOver"
          @drop="handleDrop($event, index)"
        >
          <div class="p-2 flex items-center gap-3">
            <div
              class="opacity-0 group-hover:opacity-100 cursor-ns-resize"
              :title="$t('actions.assets.reorder')"
            >
              <Icon
                name="lucide:grip-vertical"
                class="text-muted hover:text-primary"
              />
            </div>
            <div class="flex-shrink-0">
              <div
                v-if="isImage(asset)"
                class="w-14 h-14 rounded border border-input overflow-hidden bg-background"
              >
                <NuxtImg
                  :src="asset.full_path"
                  :alt="asset.data?.altText || asset.filename"
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
                  :name="getFileIcon(getFileType(asset.mime_type))"
                  class="text-muted"
                />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-primary truncate">
                {{ asset.filename }}
              </p>
              <p class="text-sm text-muted">
                {{ $t('labels.assets.asset') }}
              </p>
            </div>

            <div class="flex opacity-0 group-hover:opacity-100 gap-2 items-center">
              <button
                class="transform cursor-pointer hover:text-primary flex items-center"
                :title="$t('actions.assets.replace') as string"
                @click.stop="handleAssetReplace(index)"
              >
                <Icon name="lucide:replace"/>
              </button>
              <button
                class="transform cursor-pointer hover:text-primary flex items-center"
                :title="$t('actions.assets.edit') as string"
                @click.stop="handleAssetEdit(asset)"
              >
                <Icon name="lucide:pencil"/>
              </button>
              <button
                class="transform cursor-pointer hover:text-red-500 flex items-center"
                :title="$t('actions.assets.remove') as string"
                @click.stop="handleAssetDelete(index)"
              >
                <Icon name="lucide:trash-2"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        v-if="canAddMore"
        @click="showAssetPicker = true"
      >
        <Icon name="lucide:plus"/>
        <span>
          {{
            remainingSlots ? $t('actions.addMoreAmount', { remaining: remainingSlots }) : $t('actions.addMore')
          }}
        </span>
      </Button>
      <div
        v-if="item.max"
        class="text-xs text-muted text-center"
      >
        {{ $t('labels.assets.assetsCount', { current: localValue.length, max: item.max }) }}
      </div>
    </div>

    <Dialog
      v-model:open="showAssetPicker"
      :modal="true"
      @update:open="() => { replaceIndex = null }"
    >
      <DialogContent class="!max-w-[90dvw] h-[90dvh] p-0">
        <DialogHeader>
          <DialogTitle>
            {{ replaceIndex === null ? $t('labels.assets.selectAssets') : $t('labels.assets.replaceAsset') }}
          </DialogTitle>
        </DialogHeader>

        <div class="flex-1">
          <AssetGrid
            :space-id="spaceId"
            mode="select"
            @asset-select="handleAssetSelectForReplace"
          />
        </div>
      </DialogContent>
    </Dialog>

    <AssetDetailsDialog
      v-if="editingAsset && showAssetDetails"
      v-model:asset="editingAsset"
      :folder-id="null"
      :space-id="spaceId"
      mode="reduced"
      @close="closeAssetDetails"
      @update:asset="handleAssetDetailsUpdate"
    />
  </div>
</template>