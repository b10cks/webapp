<script setup lang="ts">
import { TreeItem, TreeRoot } from 'reka-ui'
import { Button } from '~/components/ui/button'
import IconGrid from '~/components/ui/IconGrid.vue'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'

const route = useRoute()
const { useAssetTagsQuery } = useAssetTags(route.params.spaceId as string)
const { data: tags } = useAssetTagsQuery({
  per_page: 500,
  sort: '+name'
})

const selectedTagId = defineModel<string>()

const showNewTag = ref(false)
const newTag = ref<UpsertAssetTagPayload>({
  name: '',
  color: null,
  icon: 'tag'
})

</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    class="list-none select-none w-full"
    :items="tags"
    :get-key="(item) => item?.id"
    :get-children="() => undefined"
  >
    <div class="flex">
      <h2 class="font-semibold text-sm text-primary px-2 pt-1 pb-3">
        {{ $t('labels.assetTags.title') }}
      </h2>
      <Button
        class="ml-auto"
        variant="ghost"
        size="xs"
        @click="showNewTag = !showNewTag"
      >
        <Icon name="lucide:plus"/>
      </Button>
    </div>
    <div
      v-if="showNewTag"
      class="flex gap-2"
    >
      <IconGrid v-model="newTag.icon"/>
      <Input v-model="newTag.name"/>
      <Button
        variant="secondary"
        @click="create"
      >
        <Icon name="lucide:plus"/>
      </Button>
    </div>
    <TreeItem
      v-for="item in flattenItems"
      :key="item._id"
      :style="{ 'padding-left': `${item.level - 0.5}rem` }"
      v-bind="item.bind"
      :class="[
          'flex items-center py-2 px-2 my-0.5 rounded-md outline-none gap-2',
          'hover:bg-input transition-colors duration-200',
          'cursor-pointer font-semibold',
          item.value.id === selectedTagId ? 'bg-input text-primary' : ''
        ]"
      @select="selectedTagId = item.value.id"
    >
      <Icon
        v-if="item.value.icon"
        :name="`lucide:${item.value.icon}`"
        :style="{ color: item.value.color }"
      />
      <div class="truncate">
        {{ item.value.name }}
      </div>
      <Badge>{{ item.value.count || 0 }}</Badge>
    </TreeItem>
  </TreeRoot>
</template>