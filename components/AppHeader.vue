<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

import Logo from '~/assets/logo.svg'

const { useSpacesQuery } = useSpaces()
const { data: spaces } = useSpacesQuery()

const router = useRouter()
const commandOpen = inject('commandOpen')

const selectedSpaceId = computed({
  get: () => useRoute().params?.space,
  set: (space: string) => {
    useRouter().push({
      name: 'space',
      params: {
        space,
      },
    })
  },
})

const selectedSpace = computed(() => {
  return spaces.value?.find((space) => space.id === selectedSpaceId.value) || null
})
</script>

<template>
  <div
    class="fixed top-0 z-20 flex h-14 w-full items-center gap-3 border-b border-border bg-surface p-3 select-none"
  >
    <div class="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          class="flex cursor-pointer gap-2 rounded-lg bg-secondary p-2 transition-colors duration-200 hover:bg-elevated data-[state=open]:bg-elevated"
        >
          <Logo
            alt="b10cks"
            class="size-4 text-primary"
          />
          <Icon
            name="lucide:chevron-down"
            class="-mr-1"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="min-w-56"
          align="start"
        >
          <DropdownMenuGroup>
            <DropdownMenuItem @select="router.push('/')">{{
              $t('actions.toDashboard')
            }}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel v-if="selectedSpace">{{ selectedSpace.name }} </DropdownMenuLabel>
            <DropdownMenuItem
              v-if="selectedSpace"
              @select="router.push(`/${selectedSpaceId}`)"
              >Space Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem @select="commandOpen = true">
              {{ $t('actions.quickActions') }}
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{{ $t('actions.spaces.switch') }}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  v-for="{ id, name } in spaces"
                  :key="id"
                  :value="id"
                  :class="[
                    'w-full cursor-pointer',
                    id === selectedSpaceId ? 'bg-blue-600 text-primary' : '',
                  ]"
                  @select="selectedSpaceId = id"
                >
                  {{ name }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="router.push('/spaces/new')">
                  {{ $t('actions.spaces.add') }}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              {{ $t('actions.user.account') }}
            </DropdownMenuItem>
            <DropdownMenuItem @select="useAuth().logout()">
              {{ $t('actions.logout') }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <slot>
      <div id="appHeader" />
    </slot>
    <div
      id="appHeaderActions"
      class="ml-auto"
    >
      <slot name="headerActions" />
    </div>
  </div>
</template>
