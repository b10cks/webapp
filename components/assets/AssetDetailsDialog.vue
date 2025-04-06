<script setup lang="ts">
import { toast } from 'vue-sonner'
import { deepClone } from '@vue/devtools-shared'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { InputField } from '~/components/ui/form'

const { formatFileSize, formatDateTime } = useFormat()
const { getFileIcon } = useFileUtils()
const props = withDefaults(defineProps<{
  asset: AssetResource
  mode?: 'normal' | 'reduced'
  folderId: string | null
  spaceId: string
}>(), {
  mode: 'normal'
})

const { useFolderStructure } = useAssetFolders(props.spaceId)
const { getBreadcrumbs } = useFolderStructure()
const { getFileType } = useFileUtils()

const { useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(props.spaceId)

const assetFields = computed(() => space.value?.settings?.asset_fields || [])

const assetCopy = ref<AssetResource | null>(null)
const imageContainer = ref<HTMLElement | null>(null)
const imageRef = useTemplateRef('imageRef')
const isDraggingFocus = ref(false)

watch(() => props.asset, (newAsset) => {
  if (newAsset) {
    assetCopy.value = deepClone(newAsset)
  } else {
    assetCopy.value = null
  }
}, { immediate: true })
const emit = defineEmits(['close', 'update:asset'])

const formatKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}
const copyAssetUrl = () => {
  navigator.clipboard.writeText(assetCopy.value.url)
    .then(() => {
      toast.success('URL copied to clipboard')
    })
    .catch(() => {
      toast.error('Failed to copy URL')
    })
}
const openAssetInNewWindow = () => {
  window.open(assetCopy.value.url, '_blank', 'noopener,noreferrer')
}
const toggleFocusPoint = () => {
  if (!assetCopy.value?.data.focus) {
    if (!assetCopy.value.data) {
      assetCopy.value.data = {}
    }
    assetCopy.value.data.focus = { x: 50, y: 50 }
  } else {
    assetCopy.value.data.focus = undefined
  }
}

const startDragging = (event: MouseEvent) => {
  if (!imageRef.value || !assetCopy.value) return
  event.preventDefault()
  isDraggingFocus.value = true

  updateFocusPointPosition(event)
}
const stopDragging = () => {
  isDraggingFocus.value = false
}

const updateFocusPointPosition = (event: MouseEvent) => {
  if (!isDraggingFocus.value || !imageRef.value || !assetCopy.value || !assetCopy.value.data) return
  const rect = (imageRef.value?.$el as HTMLElement)?.getBoundingClientRect()

  let x = ((event.clientX - rect.left) / rect.width) * 100
  let y = ((event.clientY - rect.top) / rect.height) * 100

  x = Math.max(0, Math.min(100, x))
  y = Math.max(0, Math.min(100, y))

  assetCopy.value.data.focus = {
    x: parseFloat(x.toFixed(2)),
    y: parseFloat(y.toFixed(2))
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopDragging)
  }
})
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', stopDragging)
  }
})

let lastUpdateTime = 0
const throttleTime = 16
const handleMouseMove = (event: MouseEvent) => {
  const now = Date.now()
  if (now - lastUpdateTime >= throttleTime) {
    updateFocusPointPosition(event)
    lastUpdateTime = now
  }
}
const handleFinish = async () => {
  emit('update:asset', assetCopy.value)
}

const onOpenChange = (open: boolean) => {
  if (!open) {
    emit('close')
  }
}
</script>
<template>
  <Dialog
    :open="!!asset"
    @update:open="onOpenChange"
  >
    <DialogContent
      v-if="asset && assetCopy"
      class="!max-w-11/12"
    >
      <DialogHeader>
        <p
          v-if="mode === 'normal'"
          class="text-sm"
        >/<span
          v-for="crumb in getBreadcrumbs(asset.folder_id)"
          :key="crumb.id"
        >{{ crumb.name }}/</span></p>
        <DialogTitle>{{ asset.filename }}</DialogTitle>
        <p>.{{ asset.extension }}</p>
      </DialogHeader>
      <div class="grid gap-6 py-4 md:grid-cols-12">
        <div class="flex flex-col items-center justify-center rounded-xl checkerboard p-4 md:col-span-8">
          <div
            v-if="getFileType(asset.mime_type) === 'image'"
            ref="imageContainer"
            class="relative w-full flex items-center justify-center"
          >
            <div class="relative inline-block">
              <NuxtImg
                ref="imageRef"
                :src="asset.full_path"
                :alt="assetCopy?.data?.altText || asset.filename"
                height="600"
                class="object-contain max-h-[calc(60svh)] max-w-full"
              />
              <div
                v-if="assetCopy.data?.focus"
                class="absolute w-5 h-5 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference"
                :style="{
                  left: `${assetCopy.data?.focus.x}%`,
                  top: `${assetCopy.data?.focus.y}%`
                }"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:crosshair"
                  size="1.25rem"
                  class=" text-primary"
                />
              </div>
              <div
                v-if="assetCopy.data?.focus"
                class="absolute inset-0 cursor-crosshair"
                @mousedown="startDragging"
              />
            </div>
          </div>
          <div
            v-else
            class="flex h-[300px] w-full flex-col items-center justify-center gap-4"
          >
            <Icon
              :name="getFileIcon(getFileType(asset.mime_type))"
              size="3rem"
            />
            <div class="text-center">
              <p class="font-semibold">{{ asset.filename }}</p>
              <p class="text-sm text-muted">{{ formatFileSize(asset.size) }}</p>
            </div>
          </div>
          <div
            class="flex gap-2 mt-4 w-full"
            aria-label="Asset actions"
          >
            <Button
              variant="outline"
              size="icon"
              class="flex items-center gap-2"
              @click="openAssetInNewWindow"
            >
              <Icon
                name="lucide:external-link"
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="flex items-center gap-2"
              @click="copyAssetUrl"
            >
              <Icon
                name="lucide:link"
              />
            </Button>
            <Button
              v-if="getFileType(asset.mime_type) === 'image'"
              variant="outline"
              class="flex items-center gap-2"
              @click="toggleFocusPoint"
            >
              <Icon
                :name="assetCopy.data.focus ? 'lucide:x' : 'lucide:crosshair'"
              />
              <span>{{
                  assetCopy.data.focus ? $t('labels.assets.removeFocusPoint') : $t('labels.assets.setFocusPoint')
                }}</span>
            </Button>
          </div>
        </div>
        <div class="space-y-4 md:col-span-4">
          <div
            v-if="mode === 'normal'"
            class="text-sm rounded-lg bg-surface p-3"
          >
            <dl class="grid grid-cols-2 gap-2">
              <dt class="font-semibold">{{ $t('labels.assets.fields.type') }}:</dt>
              <dd class="truncate">{{ asset.mime_type || $t('labels.assets.unknown') }}</dd>
              <dt class="font-semibold">{{ $t('labels.assets.size') }}:</dt>
              <dd class="truncate">{{ formatFileSize(asset.size) }}</dd>
              <dt class="font-semibold">{{ $t('labels.assets.createdAt') }}:</dt>
              <dd class="truncate">{{ formatDateTime(asset.created_at) }}</dd>
              <dt class="font-semibold">{{ $t('labels.assets.updatedAt') }}:</dt>
              <dd class="truncate">{{ formatDateTime(asset.updated_at) }}</dd>
            </dl>

            <div
              v-if="asset.metadata && Object.keys(asset.metadata).length"
              class="mt-4 pt-4 border-t-2 border-background"
            >
              <dl class="grid grid-cols-2 gap-2">
                <template
                  v-for="(value, key) in asset.metadata"
                  :key="key"
                >
                  <dt class="font-semibold">{{ $t(`labels.assets.metadata.${key}`, formatKey(key)) }}:</dt>
                  <dd class="break-words">{{ value }}</dd>
                </template>
              </dl>
            </div>
          </div>
          <div class="grid gap-4">
            <InputField
              v-model="assetCopy.filename"
              name="filename"
              :label="$t('labels.assets.fields.name')"
              required
            />
           <InputField
              v-for="field in assetFields"
              :key="field.key"
              v-model="assetCopy.data[field.key]"
              :label="field.label"
              :name="field.key"
              :required="field.required"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          @click="onOpenChange(false)"
        >
          {{ $t('alertDialog.cancel') }}
        </Button>
        <Button @click="handleFinish">{{ $t('actions.saveClose') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>