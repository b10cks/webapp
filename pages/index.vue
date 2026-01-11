<script setup lang="ts">

import type { Translation } from 'nuxt-i18n-micro-types/src'
import { SelectTrigger } from 'reka-ui'
import { useClipboard } from '@vueuse/core'
import { Badge } from '~/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import ContentHeader from '~/components/ui/ContentHeader.vue'
import AppHeader from '~/components/AppHeader.vue'
import { Button } from '~/components/ui/button'
import { NuxtLink } from '#components'
import TeamSelector from '~/components/TeamSelector.vue'
import { useAlertDialog } from '~/composables/useAlertDialog'
import type { SpaceQueryParams } from '~/api/resources/spaces'
import { Select, SelectContent, SelectItem } from '~/components/ui/select'

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
        sort: value
      }
    })
  }
})
const archived = computed({
  get() {
    return route.query.archived === 'true'
  },
  set(value: boolean) {
    router.replace({
      query: {
        ...route.query,
        archived: value ? 'true' : undefined
      }
    })
  }
})

const spaceFilter = computed<SpaceQueryParams>(() => {
  return {
    archived: archived.value || undefined,
    sort: sort.value || '-updated_at'
  }
})

const { data: spaces } = useSpacesQuery(spaceFilter)

interface Action {
  icon?: string,
  label: Translation
  action?: (space: SpaceResource) => void
}

const { alert } = useAlertDialog()
const archiveMutation = useArchiveSpaceMutation()

const handleArchive = async (space: SpaceResource) => {
  const confirmed = await alert.confirm(
    `Are you sure you want to archive "${space.name}"?`,
    { title: 'Archive Space', confirmLabel: 'Archive', cancelLabel: 'Cancel' }
  )
  if (confirmed) {
    archiveMutation.mutate(space.id)
  }
}

const actions: Array<Action | string> = [
  {
    icon: 'lucide:home', label: $t('actions.open'), action: (s) => {
      router.push({ name: 'space', params: { space: s.id } })
    }
  },
  {
    icon: 'lucide:external-link', label: $t('actions.newTab'), action: (s) => {
      window.open(s.id, '_blank')
    }
  },
  {
    icon: 'lucide:copy', label: $t('actions.copyLink'), action: (s) => {
      const url = new URL(window.location.origin + router.resolve({ name: 'space', params: { space: s.id } }).href)
      console.log(url.toString())
      useClipboard().copy(url.toString())
    }
  },
  {
    icon: 'lucide:cog', label: $t('actions.settings'), action: (s) => {
      router.push({ name: 'space-settings', params: { space: s.id } })
    }
  },
  '-',
  {
    icon: 'lucide:archive',
    label: $t('actions.archive'),
    action: handleArchive
  }
]

const getSortLabel = (sort: string) => {
  return $t(sort.replace(/^[+-]?(\w*)/, 'labels.sort.$1') + (sort.startsWith('-') ? 'Desc' : 'Asc'))
}

const teamRelatedSpaces = computed(() => {
  return spaces.value?.filter(space => space.team_id === selectedTeam.value?.id) || []
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
          <TeamSelector size="sm"/>
        </div>
        <template #headerActions>
          <div class="flex items-center gap-3">
            <template v-if="selectedTeam">
              <Button size="sm">
                <Icon name="lucide:users"/>
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
      <div class="grow w-full bg-background pt-14 flex">
        <aside class="w-56 bg-surface shrink-0">
          <div class="flex flex-col gap-4 p-3">
            <div/>
            <hr class="border-border">
            <div class="flex flex-col gap-px text-sm">
              <h4 class="font-semibold text-primary mb-2">
                {{ $t('labels.spaces.title') }}
              </h4>
              <NuxtLink
                class="flex items-center gap-1 font-medium rounded-md p-2"
                :class="[spaceFilter.archived ? '' : 'bg-secondary text-primary']"
                :to="{ name: 'index', query: { ...route.query, archived: undefined } }"
              >
                <Icon name="lucide:layout-grid"/>
                <span>All</span>
              </NuxtLink>
              <NuxtLink
                class="flex items-center gap-1 font-medium rounded-md p-2"
                :class="[spaceFilter.archived ? 'bg-secondary text-primary' : '']"
                :to="{ name: 'index', query: { ...route.query, archived: 'true' } }"
              >
                <Icon name="lucide:trash-2"/>
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
                  <Icon name="lucide:chevron-down"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+name">{{ $t('labels.sort.nameAsc') }}</SelectItem>
                  <SelectItem value="-name">{{ $t('labels.sort.nameDesc') }}</SelectItem>
                  <SelectItem value="+created_at">{{ $t('labels.sort.created_atAsc') }}</SelectItem>
                  <SelectItem value="-created_at">{{ $t('labels.sort.created_atDesc') }}</SelectItem>
                  <SelectItem value="+updated_at">{{ $t('labels.sort.updated_atAsc') }}</SelectItem>
                  <SelectItem value="-updated_at">{{ $t('labels.sort.updated_atDesc') }}</SelectItem>
                </SelectContent>
              </Select>
            </ContentHeader>
            <div class="flex gap-8">
              <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full gap-4">
                <NuxtLink
                  v-for="space in teamRelatedSpaces"
                  :key="space.id"
                  :to="{ name: 'space', params: { space: space.id } }"
                  class="group flex flex-col gap-2"
                >
                  <div
                    class="min-h-36 rounded-lg shadow-lg bg-input p-4 grid place-items-center transition-transform justify-center duration-500 group-hover:-translate-y-2 ease-micro-bounce relative overflow-clip"
                  >
                    <NuxtImg
                      v-if="space.icon"
                      :src="space.icon"
                      :alt="space.name"
                      class="absolute inset-0 blur-xl w-full h-full object-cover scale-110"
                    />
                    <NuxtImg
                      v-if="space.icon"
                      :src="space.icon"
                      :alt="space.name"
                      class="size-16 relative z-10"
                    />
                  </div>
                  <div class="flex items-center">
                    <div>
                      <h4 class="font-semibold text-primary">{{ space.name }}</h4>
                      <p class="text-sm text-muted">
                        {{ $t('labels.fields.lastUpdated', { timeAgo: formatLastUpdated(space) }) }}</p>
                    </div>
                    <div class="ml-auto grid">
                      <DropdownMenu v-slot="{ open }">
                        <div
                          class="group-hover:hidden grid-area-stack flex items-center"
                          :class="[open ? 'hidden' : '']"
                        >
                          <Badge size="xs">Free</Badge>
                        </div>
                        <DropdownMenuTrigger class="grid-area-stack">
                          <Button
                            variant="outline"
                            size="icon"
                            class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            :class="[open ? 'opacity-100' : '']"
                            @click.prevent
                          >
                            <Icon name="lucide:ellipsis"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <template
                            v-for="(action, i) in actions"
                            :key="`menu-${i}`"
                          >
                            <DropdownMenuSeparator v-if="action === '-'"/>
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
                      </DropdownMenu>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </main>
      </div>
    </NuxtLayout>
  </div>
</template>