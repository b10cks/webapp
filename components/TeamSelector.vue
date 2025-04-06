<script setup lang="ts">
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '~/lib/utils'

const {
  selectedTeam,
  selectedTeamId,
  teamOptions,
  isLoading,
  selectTeam,
} = useGlobalTeam()

withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

// Size classes
const sizeClasses = {
  sm: 'h-8 text-sm',
  md: 'h-10',
  lg: 'h-12 text-lg'
}

const handleSelect = (value: string) => {
  if (value === 'clear') {
    selectTeam(null)
  } else {
    selectTeam(value)
  }
}

const getTeamIcon = (team: any) => {
  if (team.icon) return team.icon
  return team.type === 'department' ? 'lucide:building-2' : 'lucide:users'
}
</script>

<template>
  <Select
    :model-value="selectedTeamId || undefined"
    :disabled="isLoading"
    @update:model-value="handleSelect"
  >
    <SelectTrigger
      :class="cn(
        'justify-between',
        sizeClasses[size]
      )"
    >
      <SelectValue>
        <div
          v-if="isLoading"
          class="flex items-center gap-2"
        >
          <Icon
            name="lucide:loader-2"
            class="shrink-0 animate-spin"
          />
          <span>{{ $t('labels.teams.loading') }}</span>
        </div>
        <div
          v-else-if="selectedTeam"
          class="flex items-center gap-2 min-w-0 pr-2"
        >
          <Icon
            :name="getTeamIcon(selectedTeam)"
            class="shrink-0"
            :style="{ color: selectedTeam.color }"
          />
          <span class="truncate">{{ selectedTeam.name }}</span>
          <Badge
            v-if="selectedTeam.type"
            variant="surface"
            size="sm"
          >
            {{ selectedTeam.type }}
          </Badge>
        </div>
        <div
          v-else
          class="flex items-center gap-2"
        >
          <Icon
            name="lucide:users"
            class="shrink-0"
          />
          <span>{{ $t('labels.teams.selectPlaceholder') }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="team in teamOptions"
        :key="team.value"
        :value="team.value"
        class="cursor-pointer"
      >
        <div class="flex items-center justify-between gap-2 w-full">
          <div class="flex items-center gap-2 min-w-0">
            <Icon
              :name="getTeamIcon(team)"
              class="shrink-0"
              :style="{ color: team.color }"
            />
            <span
              class="truncate"
              :style="{ color: team.color }"
            >{{ team.label }}
            </span>
          </div>
          <Badge
            v-if="team.type"
            variant="surface"
            size="sm"
          >
            {{ team.type }}
          </Badge>
        </div>
      </SelectItem>
      <SelectItem
        v-if="!teamOptions.length && !isLoading"
        value=""
        disabled
        class="text-center text-muted-foreground"
      >
        {{ $t('labels.teams.empty') }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>