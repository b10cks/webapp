<script setup lang="ts">

import { useDark, useToggle } from '@vueuse/core'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Switch } from '~/components/ui/switch'
import { Avatar } from '~/components/ui/avatar'
import { SimpleTooltip } from '~/components/ui/tooltip'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const { user, logout } = useAuth()

const spaceId = inject('spaceId')

const menu = [
  { icon: 'lucide:home', label: 'Home', route: 'space' },
  { icon: 'lucide:feather', label: 'Content', route: 'space-content' },
  { icon: 'lucide:blocks', label: 'Blocks', route: 'space-blocks' },
  { icon: 'lucide:images', label: 'Assets', route: 'space-assets' },
  { icon: 'lucide:database-zap', label: 'Data sets', route: 'space-datasources' },
  { icon: 'lucide:split', label: 'Redirects', route: 'space-redirects' },
  { icon: 'lucide:rocket', label: 'Releases', route: 'space-releases' },
  { icon: 'lucide:settings', label: 'Settings', route: 'space-settings' },
]

const buildLink = (name: string) => ({
  name,
  params: {
    space: spaceId.value,
  },
})

</script>

<template>
  <div class="flex h-full w-14 flex-col border-r border-r-border p-3">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto">
      <div class="relative flex w-full min-w-0 flex-col gap-2">
        <SimpleTooltip
          v-for="m in menu"
          :key="m.label"
          :tooltip="m.label"
          side="right"
        >
          <NuxtLink
            :to="buildLink(m.route)"
            class="flex items-center justify-center size-8 rounded-lg hover:bg-border transition-colors duration-200 ease-butter"
            active-class="text-primary bg-border"
          >
            <Icon
              :name="m.icon"
              size="1.25rem"
              stroke-width="5"
            />
          </NuxtLink>
        </SimpleTooltip>
      </div>
    </div>
    <div class="flex flex-col gap-2 items-center">
      <div class="flex flex-col pt-3 items-center border-t-2 border-t-border">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar
              v-if="user"
              :avatar="user.avatar"
              :name="`${user.firstname} ${user.lastname}`.trim()"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="min-w-48"
            align="start"
          >
            <DropdownMenuItem disabled>{{ user.email }}</DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem @select="toggleDark()">
              <span>{{ 'Dark mode' }}</span>
              <Switch
                :model-value="isDark"
                class="ml-auto"
              >
                <template #thumb>
                  <Icon
                    v-if="isDark"
                    name="lucide:moon"
                    size="0.625rem"
                  />
                  <Icon
                    v-else
                    name="lucide:sun"
                    size="0.625rem"
                  />
                </template>
              </Switch>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Settings</span>
              <Icon
                class="ml-auto"
                name="lucide:cog"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem @select="logout">
              <span>Logout</span>
              <Icon
                class="ml-auto"
                name="lucide:log-out"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>