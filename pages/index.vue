<script setup lang="ts">

import type { Translation } from 'nuxt-i18n-micro-types/src'
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

const { $t } = useI18n()
const { useSpacesQuery, useArchiveSpaceMutation } = useSpaces()
const { formatDateTime } = useFormat()
const router = useRouter()

const { selectedTeam } = useGlobalTeam()
const spaceFilter = ref<SpaceQueryParams>({})

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
  { icon: 'lucide:copy', label: $t('actions.copyLink') },
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

const teamRelatedSpaces = computed(() => {
  return spaces.value?.filter(space => space.team_id === selectedTeam.value?.id) || []
})

</script>

<template>
  <div class="min-h-svh flex w-full flex-col">
    <AppHeader>
      <div class="flex items-start">
        <TeamSelector
          size="sm"
          class="w-md"
        />
      </div>
      <template #headerActions>
        <div class="flex items-center gap-3">
          <template v-if="selectedTeam">
            <Button size="sm">
              <Icon
                name="lucide:users"
              />
              {{ selectedTeam.user_count }}
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
      <aside class="w-56 bg-surface flex-shrink-0">
        <div class="flex flex-col gap-4 p-3">
          <div/>
          <hr class="border-border" >
          <div class="flex flex-col gap-2">
            <div class="font-semibold text-sm text-primary">
              Spaces
            </div>
            <Button
              class="justify-start"
              @click="spaceFilter.archived = undefined"
            >
              <Icon
                name="lucide:layout-grid"
                class="mr-2"
              />
              All
            </Button>
            <Button
              class="justify-start"
              @click="spaceFilter.archived = true"
            >
              <Icon
                name="lucide:trash-2"
                class="mr-2"
              />
              Archived
            </Button>
          </div>
        </div>
      </aside>
      <main class="content-grid">
        <div class="flex flex-col gap-8">
          <ContentHeader
            header="Welcome to b10cks"
            description="Create and share your blocks with the world. Start by creating a new space or exploring existing ones."
          />
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
                    <p class="text-sm text-muted">{{ formatDateTime(space.updated_at) }}</p>
                  </div>
                  <div class="ml-auto grid">
                    <div
                      class="group-hover:hidden grid-area-stack flex items-center"
                    >
                      <Badge
                        size="xs"
                      >Free
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger class="grid-area-stack">
                        <Button
                          variant="outline"
                          size="icon"
                          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          @click.prevent="() => {}"
                        >
                          <Icon name="lucide:ellipsis"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
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
                              v-if="false && action.icon"
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
  </div>
</template>