<script setup lang="ts">
import { Button } from '~/components/ui/button'
import SplitButton from '~/components/ui/button/SplitButton.vue'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { SimpleTooltip } from '~/components/ui/tooltip'
import type { ContentResource } from '~/types/contents'
import PublishDialog from './PublishDialog.vue'

const route = useRoute()
const router = useRouter()
const props = defineProps<{
  spaceId: string
  content: ContentResource
  disabled?: boolean
}>()

const {
  useCreateContentMutation,
  useUpdateContentMutation,
  usePublishContentMutation,
  useScheduleContentMutation,
  useUnpublishContentMutation,
} = useContent(props.spaceId)

const { useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(props.spaceId)

const { mutate: createContent } = useCreateContentMutation()
const { mutate: updateContent } = useUpdateContentMutation()
const { mutate: publishContent, isPending: isPublishing } = usePublishContentMutation()
const { mutate: scheduleContent, isPending: isScheduling } = useScheduleContentMutation()
const { mutate: unpublishContent } = useUnpublishContentMutation()

const isLocalization = computed(() => route.name === 'space-content-contentId-localization')
const isVersions = computed(() => route.name === 'space-content-contentId-versions')
const publishDialogOpen = ref(false)
const publishType = ref<'now' | 'schedule'>('now')

const save = async () => {
  if (props.content.id) {
    await updateContent({ id: props.content.id, payload: props.content })
  } else {
    await createContent(props.content)
  }
}

const isPublished = computed(() => props.content.published_at !== null)

const publishDirectly = async () => {
  await publishContent({ id: props.content.id, payload: props.content })
}

const publishWithMessage = () => {
  publishType.value = 'now'
  publishDialogOpen.value = true
}

const schedulePublish = () => {
  publishType.value = 'schedule'
  publishDialogOpen.value = true
}

const handlePublish = async (payload: { message?: string; published_at?: string | null }) => {
  const publishPayload = {
    ...props.content,
    ...payload,
  }
  await publishContent({ id: props.content.id, payload: publishPayload })
  publishDialogOpen.value = false
}

const handleSchedule = async (payload: { message?: string; scheduled_at?: string | null }) => {
  const schedulePayload = {
    ...props.content,
    message: payload.message,
    scheduled_at: payload.scheduled_at,
  }
  await scheduleContent({ id: props.content.id, payload: schedulePayload })
  publishDialogOpen.value = false
}

const unpublish = async () => {
  await unpublishContent({ id: props.content.id, payload: props.content })
}

const switchLocalization = () => {
  router.push({
    ...route,
    hash: undefined,
    name: isLocalization.value ? 'space-content-contentId' : 'space-content-contentId-localization',
  })
}

const switchVersions = () => {
  router.push({
    ...route,
    hash: undefined,
    name: isVersions.value ? 'space-content-contentId' : 'space-content-contentId-versions',
  })
}

const canPublish = computed(() => {
  return !!props.content.id && !isPublished.value
})

const hasLocalization = computed(() => {
  return space.value?.settings?.languages?.length > 0
})
</script>

<template>
  <div class="flex gap-3">
    <SimpleTooltip
      :tooltip="
        hasLocalization
          ? $t('labels.contents.localization.available')
          : $t('labels.contents.localization.notAvailable')
      "
    >
      <Button
        :variant="isLocalization ? 'primary' : 'default'"
        size="icon"
        :disabled="!hasLocalization"
        @click="switchLocalization"
      >
        <Icon name="lucide:globe" />
      </Button>
    </SimpleTooltip>
    <Button
      :variant="isVersions ? 'primary' : 'default'"
      size="icon"
      @click="switchVersions"
    >
      <Icon name="lucide:history" />
    </Button>
    <Button
      :disabled="disabled"
      @click="save"
      >Save
    </Button>
    <SplitButton
      variant="accent"
      :primary-action="publishDirectly"
      :disabled="disabled || !canPublish"
      :loading="isPublishing || isScheduling"
    >
      <span>{{ $t('actions.content.publish') }}</span>
      <template #menu>
        <DropdownMenuLabel>Publish</DropdownMenuLabel>
        <DropdownMenuItem
          :disabled="disabled || !canPublish"
          @select="publishWithMessage"
        >
          <Icon name="lucide:send" />
          <span>{{ $t('actions.content.publishWithMessage') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          :disabled="disabled || !canPublish"
          @select="schedulePublish"
        >
          <Icon name="lucide:clock-fading" />
          <span>{{ $t('actions.content.schedule') }}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          :disabled="!isPublished"
          @select="unpublish"
        >
          <Icon name="lucide:eye-off" />
          <span>{{ $t('actions.content.unpublish') }}</span>
        </DropdownMenuItem>
      </template>
    </SplitButton>

    <!-- Publish Dialog -->
    <PublishDialog
      :open="publishDialogOpen"
      :content="content"
      :loading="isPublishing || isScheduling"
      :publish-type="publishType"
      @update:open="publishDialogOpen = $event"
      @publish="handlePublish"
      @schedule="handleSchedule"
    />
  </div>
</template>
