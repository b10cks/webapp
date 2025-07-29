<script setup lang="ts">
import { toast } from 'vue-sonner'
import {  PreviewBridge } from '~/utils/preview-bridge'
import type {FieldUpdateEvent} from '~/utils/preview-bridge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { PulseDot } from '~/components/ui/pulse-dot'
import { SimpleTooltip } from '~/components/ui/tooltip'

const { t } = useI18n()
const props = defineProps<{
  spaceId: string
  contentId: string
  fullSlug?: string
  updatedAt?: string
  content?: never // Content for live updates
  itemId?: string | null // Currently selected item in the editor
}>()

const { useSpaceQuery } = useSpaces()
const { data: currentSpace } = useSpaceQuery(props.spaceId)
const { settings } = useSpaceSettings(props.spaceId)

const emit = defineEmits<{
  (e: 'selectItem', itemId: string): void
  (e: 'updateField', payload: FieldUpdateEvent): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeKey = ref<string>()
const loading = ref<boolean>(true)
const isConnected = ref<boolean>(false)
const mode = ref<'desktop' | 'mobile'>('desktop')
let previewBridge: PreviewBridge = undefined

const baseSrc = computed(() => {
  const env = settings.value.content.environment
  if (!env?.url) return false

  if (env.url.endsWith('/')) {
    env.url = env.url.slice(0, -1)
  }

  return `${env.url}${props.fullSlug}`
})

const src = computed(() => {
  const timestamp = props.updatedAt ? new Date(props.updatedAt).getTime() : Date.now()

  return baseSrc?.value ? `${baseSrc.value}?b10cks_mode=draft&b10cks_id=${props.contentId}&b10cks_ts=${timestamp}` : null
})


// Initialize connection with the iframe
const setupConnection = async () => {
  if (!iframeRef.value || !baseSrc.value) return

  previewBridge = new PreviewBridge(iframeRef.value)
  previewBridge.on('SELECT_UPDATE', ({ selectedItem }) => {
    emit('selectItem', selectedItem)
  })
  previewBridge.on('FIELD_UPDATE', (payload) => {
    emit('updateField', payload)
  })
  isConnected.value = true
}

onMounted(() => {
  if (!loading.value) {
    setupConnection()
  }
})

watch(loading, (isLoading) => {
  if (!isLoading) {
    setupConnection()
  }
})

watchEffect(() => {
  if (isConnected.value && props.content) {
    previewBridge.updateContent(props.content)
  }
})

watchEffect(() => {
  if (isConnected.value && props.itemId !== undefined) {
    previewBridge.updateSelectedItem(props.itemId)
  }
})

const switchEnvironment = (env: SpaceEnvironment) => {
  loading.value = true
  settings.value.content.environment = env
  isConnected.value = false
}

const openExternal = () => {
  window.open(src.value, '_blank')
}

const refresh = () => {
  loading.value = true
  isConnected.value = false
  iframeKey.value = Math.random().toString(36).substring(2, 9)
}

const updateItem = (item: never) => {
  if (previewBridge) {
    previewBridge.updateContent(JSON.parse(JSON.stringify(item)))
  }
}
const updateHover = (itemId: string | null) => {
  if (previewBridge) {
    previewBridge.updateHover(itemId)
  }
}

const copyLink = () => {
  navigator.clipboard.writeText(src.value)
    .then(() => toast.message(t('notifications.preview.copied') as string))
}

// Expose the refresh method to parent components
defineExpose({
  refresh,
  updateItem,
  updateHover,
})

onBeforeUnmount(() => previewBridge && previewBridge.destroy())

const handleLoad = () => {
  loading.value = false
}

</script>

<template>
  <div class="flex flex-col grow w-full bg-elevated">
    <div
      :class="['flex flex-col grow bg-elevated', mode === 'mobile' ? 'rounded-xl overflow-hidden mx-auto w-sm my-4 shadow-2xl' : 'w-full']"
    >
      <div class="flex h-12 border-b bg-background border-b-input w-full p-3 gap-3 items-center">
        <Icon
          name="lucide:refresh-cw"
          :class="['cursor-pointer shrink-0', src || 'invisible', loading && 'animate-spin']"
          @click="refresh"
        />
        <SimpleTooltip :tooltip="$t('labels.preview.liveEdit')">
          <PulseDot
            :variant="isConnected ? 'success' : 'default'"
            :live="isConnected"
            size="sm"
          />
        </SimpleTooltip>
        <p class="text-sm truncate">{{ baseSrc || 'about:blank' }}</p>
        <div class="ml-auto flex gap-3 items-center">
          <icon
            name="lucide:external-link"
            :class="['cursor-pointer', src || 'invisible']"
            @click="openExternal"
          />
          <icon
            name="lucide:link"
            :class="['cursor-pointer', src || 'invisible']"
            @click="copyLink"
          />
          <div class="h-6 w-px bg-elevated"/>
          <Icon
            name="lucide:monitor-smartphone"
            class="cursor-pointer"
            @click="mode === 'desktop' ? mode = 'mobile' : mode = 'desktop'"
          />
          <DropdownMenu>
            <DropdownMenuTrigger class="flex">
              <Icon
                name="lucide:cog"
                class="cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup :model-value="selectedEnvironment?.url">
                <DropdownMenuRadioItem
                  v-for="env in currentSpace?.settings.environments"
                  :key="env.url"
                  :value="env.url"
                  class="grid"
                  @select="switchEnvironment(env)"
                >
                  <span class="text-primary font-semibold">{{ env.name }}</span>
                  <span class="text-xs text-primary/60">{{ env.url }}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <iframe
        v-if="baseSrc"
        ref="iframeRef"
        :key="iframeKey"
        :src="src"
        :title="fullSlug"
        class="w-full grow bg-white"
        @load="handleLoad()"
      />
      <div
        v-else
        class="flex items-center justify-center grow"
      >
        <p class="text-sm text-muted">
          {{ $t('messages.preview.noContent') }}
        </p>
      </div>
    </div>
  </div>
</template>