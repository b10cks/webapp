<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  <div class="flex h-full w-14 flex-col overflow-hidden border-r border-r-border p-3">
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div class="relative flex w-full min-w-0 flex-col gap-2">
        <SimpleTooltip
          v-for="m in menu"
          :key="m.label"
          :tooltip="m.label"
          side="right"
        >
          <NuxtLink
            :to="buildLink(m.route)"
            class="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 ease-butter hover:bg-border"
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
    <div class="flex flex-col items-center gap-2">
      <div class="flex flex-col items-center border-t-2 border-t-border pt-3">
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
            <DropdownMenuSeparator />
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
                    size="0.75rem"
                  />
                  <Icon
                    v-else
                    name="lucide:sun"
                    size="0.75rem"
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
            <DropdownMenuSeparator />
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
