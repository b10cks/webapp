<script setup lang="ts">
import { NuxtLink } from '#components'
import { useClipboard } from '@vueuse/core'
import type { Translation } from 'nuxt-i18n-micro-types/src'
import { SelectTrigger } from 'reka-ui'
import type { SpaceQueryParams } from '~/api/resources/spaces'
import AppHeader from '~/components/AppHeader.vue'
import TeamSelector from '~/components/TeamSelector.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem } from '~/components/ui/select'
import { useAlertDialog } from '~/composables/useAlertDialog'

const { $t } = useI18n()
const { useSpacesQuery, useArchiveSpaceMutation } = useSpaces()
const { formatRelativeTime } = useFormat()
const route = useRoute()
const router = useRouter()

const { selectedTeam } = useGlobalTeam()
const sort = computed({
  get() {
    return (route.query.sort as string) || '-updated_at'
  },
  set(value: string) {
    router.replace({
      query: {
        ...route.query,
        sort: value,
      },
    })
  },
})
const archived = computed({
  get() {
    return route.query.archived === 'true'
  },
  set(value: boolean) {
    router.replace({
      query: {
        ...route.query,
        archived: value ? 'true' : undefined,
      },
    })
  },
})

const spaceFilter = computed<SpaceQueryParams>(() => {
  return {
    archived: archived.value || undefined,
    sort: sort.value || '-updated_at',
  }
})

const { data: spaces } = useSpacesQuery(spaceFilter)

interface Action {
  icon?: string
  label: Translation
  action?: (space: SpaceResource) => void
}

const { alert } = useAlertDialog()
const archiveMutation = useArchiveSpaceMutation()

const handleArchive = async (space: SpaceResource) => {
  const confirmed = await alert.confirm(`Are you sure you want to archive "${space.name}"?`, {
    title: 'Archive Space',
    confirmLabel: 'Archive',
    cancelLabel: 'Cancel',
  })
  if (confirmed) {
    archiveMutation.mutate(space.id)
  }
}

const actions: Array<Action | string> = [
  {
    icon: 'lucide:home',
    label: $t('actions.open'),
    action: (s) => {
      router.push({ name: 'space', params: { space: s.id } })
    },
  },
  {
    icon: 'lucide:external-link',
    label: $t('actions.newTab'),
    action: (s) => {
      window.open(s.id, '_blank')
    },
  },
  {
    icon: 'lucide:copy',
    label: $t('actions.copyLink'),
    action: (s) => {
      const url = new URL(
        window.location.origin + router.resolve({ name: 'space', params: { space: s.id } }).href
      )
      console.log(url.toString())
      useClipboard().copy(url.toString())
    },
  },
  {
    icon: 'lucide:cog',
    label: $t('actions.settings'),
    action: (s) => {
      router.push({ name: 'space-settings', params: { space: s.id } })
    },
  },
  '-',
  {
    icon: 'lucide:archive',
    label: $t('actions.archive'),
    action: handleArchive,
  },
]

const getSortLabel = (sort: string) => {
  return $t(sort.replace(/^[+-]?(\w*)/, 'labels.sort.$1') + (sort.startsWith('-') ? 'Desc' : 'Asc'))
}

const teamRelatedSpaces = computed(() => {
  return spaces.value?.filter((space) => space.team_id === selectedTeam.value?.id) || []
})

const formatLastUpdated = (space: SpaceResource) => {
  const contentTs = space.content_updated_at ? Date.parse(space.content_updated_at) : 0
  const updatedTs = space.updated_at ? Date.parse(space.updated_at) : 0
  const date = (contentTs >= updatedTs ? space.content_updated_at : space.updated_at) ?? null

  return date ? formatRelativeTime(date) : ''
}
</script>

<template>
  <div>
    <NuxtLayout name="start">
      <AppHeader>
        <div class="flex items-start">
          <TeamSelector size="sm" />
        </div>
        <template #headerActions>
          <div class="flex items-center gap-3">
            <template v-if="selectedTeam">
              <Button size="sm">
                <Icon name="lucide:users" />
                <span>{{ selectedTeam.user_count }}</span>
              </Button>
              <Button
                size="sm"
                disabled
              >
                {{ $t('actions.inviteMember') }}
              </Button>
            </template>
            <Button
              :as="NuxtLink"
              size="sm"
              variant="primary"
              :to="{ name: 'spaces-new' }"
            >
              {{ $t('actions.createNewSpace') }}
            </Button>
          </div>
        </template>
      </AppHeader>
      <div class="flex w-full grow bg-background pt-14">
        <aside class="w-56 shrink-0 bg-surface">
          <div class="flex flex-col gap-4 p-3">
            <div />
            <hr class="border-border" />
            <div class="flex flex-col gap-px text-sm">
              <h4 class="mb-2 font-semibold text-primary">
                {{ $t('labels.spaces.title') }}
              </h4>
              <NuxtLink
                class="flex items-center gap-1 rounded-md p-2 font-medium"
                :class="[spaceFilter.archived ? '' : 'bg-secondary text-primary']"
                :to="{ name: 'index', query: { ...route.query, archived: undefined } }"
              >
                <Icon name="lucide:layout-grid" />
                <span>All</span>
              </NuxtLink>
              <NuxtLink
                class="flex items-center gap-1 rounded-md p-2 font-medium"
                :class="[spaceFilter.archived ? 'bg-secondary text-primary' : '']"
                :to="{ name: 'index', query: { ...route.query, archived: 'true' } }"
              >
                <Icon name="lucide:trash-2" />
                <span>Archived</span>
              </NuxtLink>
            </div>
          </div>
        </aside>
        <main class="content-grid">
          <div class="flex flex-col gap-8">
            <ContentHeader :header="(selectedTeam?.name ?? '') + ' ' + $t('labels.spaces.title')">
              <Select v-model="sort">
                <SelectTrigger class="flex items-center gap-2">
                  <span class="truncate">
                    {{ getSortLabel(sort) }}
                  </span>
                  <Icon name="lucide:chevron-down" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+name">{{ $t('labels.sort.nameAsc') }}</SelectItem>
                  <SelectItem value="-name">{{ $t('labels.sort.nameDesc') }}</SelectItem>
                  <SelectItem value="+created_at">{{ $t('labels.sort.created_atAsc') }}</SelectItem>
                  <SelectItem value="-created_at">{{
                    $t('labels.sort.created_atDesc')
                  }}</SelectItem>
                  <SelectItem value="+updated_at">{{ $t('labels.sort.updated_atAsc') }}</SelectItem>
                  <SelectItem value="-updated_at">{{
                    $t('labels.sort.updated_atDesc')
                  }}</SelectItem>
                </SelectContent>
              </Select>
            </ContentHeader>
            <div class="flex gap-8">
              <div class="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <NuxtLink
                  v-for="space in teamRelatedSpaces"
                  :key="space.id"
                  :to="{ name: 'space', params: { space: space.id } }"
                  class="group flex flex-col gap-2"
                >
                  <DropdownMenu v-slot="{ open }">
                    <div
                      :class="{ '-translate-y-2': open }"
                      class="relative grid min-h-36 place-items-center justify-center overflow-clip rounded-lg bg-input p-4 shadow-lg transition-transform duration-500 ease-micro-bounce group-hover:-translate-y-2"
                    >
                      <NuxtImg
                        v-if="space.icon"
                        :src="space.icon"
                        :alt="space.name"
                        class="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                      />
                      <NuxtImg
                        v-if="space.icon"
                        :src="space.icon"
                        :alt="space.name"
                        class="relative z-10 size-16"
                      />
                    </div>
                    <div class="flex items-center">
                      <div>
                        <h4 class="font-semibold text-primary">{{ space.name }}</h4>
                        <p class="text-sm text-muted">
                          {{
                            $t('labels.fields.lastUpdated', { timeAgo: formatLastUpdated(space) })
                          }}
                        </p>
                      </div>
                      <div class="ml-auto grid">
                        <div
                          class="grid-area-stack flex items-center group-hover:hidden"
                          :class="[open ? 'hidden' : '']"
                        >
                          <Badge size="xs">Free</Badge>
                        </div>
                        <DropdownMenuTrigger class="grid-area-stack">
                          <Button
                            variant="outline"
                            size="icon"
                            class="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            :class="[open ? 'opacity-100' : '']"
                            @click.prevent
                          >
                            <Icon name="lucide:ellipsis" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <template
                            v-for="(action, i) in actions"
                            :key="`menu-${i}`"
                          >
                            <DropdownMenuSeparator v-if="action === '-'" />
                            <DropdownMenuItem
                              v-else
                              @select="action.action ? action.action(space) : () => {}"
                            >
                              <Icon
                                v-if="action.icon"
                                :name="action.icon"
                              />
                              <span>{{ action.label }}</span>
                            </DropdownMenuItem>
                          </template>
                        </DropdownMenuContent>
                      </div>
                    </div>
                  </DropdownMenu>
                </NuxtLink>
              </div>
            </div>
          </div>
        </main>
      </div>
    </NuxtLayout>
  </div>
</template>
