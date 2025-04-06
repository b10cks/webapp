<script setup lang="ts">

interface NavItem {
  title: string
  name: string
  icon: string
  disabled?: boolean
}

const items: NavItem[] = [
  {
    title: 'labels.settings.general.title',
    name: 'space-settings',
    icon: 'lucide:settings'
  },
  {
    title: 'labels.settings.configuration.title',
    name: 'space-settings-configuration',
    icon: 'lucide:sliders'
  },
  {
    title: 'labels.settings.people.title',
    name: 'space-settings-people',
    icon: 'lucide:users'
  }
]

const route = useRoute()
const spaceId = computed<string>(() => route.params.space as string)

provide('spaceId', spaceId)

</script>

<template>
  <div>
    <NuxtLayout>
      <div class="flex h-full w-full bg-background">
        <aside class="xl:w-1/5 p-6">
          <nav class="flex flex-col space-y-1 sticky top-20">
            <NuxtLink
              v-for="item in items"
              :key="item.href"
              :to="{ name: item.name, params: { space: $route.params.space } }"
              exact-active-class="bg-secondary text-primary"
              :class="[
              'flex items-center gap-2 px-4 py-2 rounded-md',
              'hover:bg-secondary transition-colors duration-200',
              'cursor-pointer font-semibold whitespace-nowrap',
            ]"
            >
              <Icon
                :name="item.icon"
                class="shrink-0"
              />
              <span>{{ $t(item.title) }}</span>
            </NuxtLink>
          </nav>
        </aside>
        <div class="flex-1">
          <NuxtPage/>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>