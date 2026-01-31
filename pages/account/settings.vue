<script setup lang="ts">
interface NavItem {
  title: string
  name: string
  icon: string
  disabled?: boolean
}

const items: NavItem[] = [
  {
    title: 'labels.account.profile.title',
    name: 'account-settings',
    icon: 'lucide:user',
  },
  {
    title: 'labels.account.invites.title',
    name: 'account-settings-invites',
    icon: 'lucide:mail',
  },
  {
    title: 'labels.account.security.title',
    name: 'account-settings-security',
    icon: 'lucide:shield',
  },
]
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="flex h-full w-full bg-background">
        <aside class="p-6 xl:w-1/5">
          <nav class="sticky top-20 flex flex-col space-y-1">
            <NuxtLink
              v-for="item in items"
              :key="item.name"
              :to="{ name: item.name }"
              exact-active-class="bg-secondary text-primary"
              :class="[
                'flex items-center gap-2 rounded-md px-4 py-2',
                'transition-colors duration-200 hover:bg-secondary',
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
          <NuxtPage />
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>
