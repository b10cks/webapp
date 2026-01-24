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
  useUnpublishContentMutation,
} = useContent(props.spaceId)

const { useSpaceQuery } = useSpaces()
const { data: space } = useSpaceQuery(props.spaceId)

const { mutate: createContent } = useCreateContentMutation()
const { mutate: updateContent } = useUpdateContentMutation()
const { mutate: publishContent } = usePublishContentMutation()
const { mutate: unpublishContent } = useUnpublishContentMutation()

const isLocalization = computed(() => route.name == 'space-content-contentId-localization')
const isVersions = computed(() => route.name == 'space-content-contentId-history')

const save = async () => {
  if (props.content.id) {
    await updateContent({ id: props.content.id, payload: props.content })
  } else {
    await createContent(props.content)
  }

  // Refresh the preview after saving
  // if (previewRef.value) {
  //   previewRef.value.refresh()
  // }
}

const publish = async () => {
  await publishContent({ id: props.content.id, payload: props.content })

  // Refresh the preview after publishing
  // if (previewRef.value) {
  //   previewRef.value.refresh()
  // }
}
const unpublish = async () => {
  await unpublishContent({ id: props.content.id, payload: props.content })

  // Refresh the preview after unpublishing
  // if (previewRef.value) {
  //   previewRef.value.refresh()
  // }
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
  return !!props.content.id
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
      :primary-action="publish"
      variant="accent"
      :disabled="disabled && !canPublish"
    >
      <span>Publish</span>
      <template #menu>
        <DropdownMenuLabel> Publish </DropdownMenuLabel>
        <DropdownMenuItem @select="publish">
          <Icon name="lucide:send" />
          <span>Publish Now</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icon name="lucide:clock-fading" />
          <span>Schedule</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @select="unpublish">
          <Icon name="lucide:eye-off" />
          <span>Unpublish</span>
        </DropdownMenuItem>
      </template>
    </SplitButton>
  </div>
</template>
