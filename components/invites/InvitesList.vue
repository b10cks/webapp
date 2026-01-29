<script setup lang="ts">
import UsersIcon from '~/assets/images/users.svg?component'
import SearchFilter from '~/components/SearchFilter.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import SortSelect from '~/components/ui/SortSelect.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortableHead,
} from '~/components/ui/table'
import TableLoadingRow from '~/components/ui/TableLoadingRow.vue'
import TablePaginationFooter from '~/components/ui/TablePaginationFooter.vue'
import { SimpleTooltip } from '~/components/ui/tooltip'
import type { LaravelMeta } from '~/types'
import type { InviteResource } from '~/types/invites'
import { InviteStatus } from '~/types/invites.d'
import TableEmptyRow from '../ui/TableEmptyRow.vue'

const props = withDefaults(
  defineProps<{
    invites: InviteResource[]
    isLoading: boolean
    meta?: LaravelMeta
    currentPage: number
    perPage: number
    sortBy?: { column: string; direction: 'asc' | 'desc' }
  }>(),
  {
    sortBy: () => ({
      column: 'created_at',
      direction: 'desc' as const,
    }),
  }
)

const emit = defineEmits<{
  delete: [inviteId: string]
  resend: [inviteId: string]
  'update:currentPage': [page: number]
  'update:perPage': [perPage: number]
  'update:sortBy': [sort: { column: string; direction: 'asc' | 'desc' }]
  'update:filters': [filters: Record<string, unknown>]
}>()

const { alert } = useAlertDialog()
const { formatDateTime, formatRelativeTime } = useFormat()

const inviteStatusOptions = [
  { value: InviteStatus.PENDING, label: 'Pending' },
  { value: InviteStatus.ACCEPTED, label: 'Accepted' },
  { value: InviteStatus.EXPIRED, label: 'Expired' },
]

const inviteFilters = computed(() => [
  {
    id: 'email',
    label: 'Email',
    operators: [
      { value: 'like' as const, label: 'Contains' },
      { value: '^like' as const, label: 'Starts with' },
      { value: 'like$' as const, label: 'Ends with' },
      { value: 'eq' as const, label: 'Equals' },
    ],
  },
  {
    id: 'role',
    label: 'Role',
    operators: [{ value: 'eq' as const, label: 'Equals' }],
    items: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    operators: [{ value: 'eq' as const, label: 'Equals' }],
    items: inviteStatusOptions,
  },
])

const sortOptions = [
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'created_at', label: 'Created At' },
  { value: 'expires_at', label: 'Expires At' },
  { value: 'accepted_at', label: 'Accepted At' },
]

const filters = ref<Record<string, unknown>>({})
const selectedInvites = ref<Map<string, InviteResource>>(new Map())

const getStatusVariant = (
  status: InviteStatus
): 'warning' | 'success' | 'destructive' | 'outline' => {
  switch (status) {
    case InviteStatus.PENDING:
      return 'warning'
    case InviteStatus.ACCEPTED:
      return 'success'
    case InviteStatus.EXPIRED:
      return 'destructive'
    default:
      return 'outline'
  }
}

const getExpiresInDays = (expiresAt: string) => {
  const now = new Date()
  const expires = new Date(expiresAt)
  const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return days
}

const handleDelete = async (invite: InviteResource, force: boolean = false) => {
  const confirmed =
    force ||
    (await alert.confirm(`Are you sure you want to delete the invite for ${invite.email}?`, {
      title: 'Delete Invite',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    }))
  if (confirmed) {
    emit('delete', invite.id)
  }
}

const handleResend = (invite: InviteResource) => {
  emit('resend', invite.id)
}

const selectionCount = computed(() => selectedInvites.value.size)
const isAllSelected = computed(() => {
  return selectionCount.value > 0 && props.invites.length === selectionCount.value
})

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    props.invites.forEach((invite) => {
      selectedInvites.value.set(invite.id, invite)
    })
  } else {
    clearSelection()
  }
}

const handleInviteSelect = (invite: InviteResource, selected: boolean) => {
  if (selected) {
    selectedInvites.value.set(invite.id, invite)
  } else {
    selectedInvites.value.delete(invite.id)
  }
}

const clearSelection = () => {
  selectedInvites.value.clear()
}

const isInviteSelected = (invite: InviteResource) => {
  return selectedInvites.value.has(invite.id)
}

const handleBulkDelete = async () => {
  const confirmed = await alert.confirm(
    `Are you sure you want to delete ${selectionCount.value} invite(s)?`,
    {
      title: 'Delete Invites',
      confirmLabel: `Delete (${selectionCount.value})`,
      cancelLabel: 'Cancel',
      variant: 'destructive',
    }
  )
  if (confirmed) {
    const selectedIds = Array.from(selectedInvites.value.keys())
    for (const id of selectedIds) {
      emit('delete', id)
    }
    clearSelection()
  }
}

const handleBulkResend = async () => {
  const confirmed = await alert.confirm(
    `Are you sure you want to resend ${selectionCount.value} invite(s)?`,
    {
      title: 'Resend Invites',
      confirmLabel: `Resend (${selectionCount.value})`,
      cancelLabel: 'Cancel',
    }
  )
  if (confirmed) {
    const selectedIds = Array.from(selectedInvites.value.keys())
    for (const id of selectedIds) {
      emit('resend', id)
    }
    clearSelection()
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filters and Sort Controls -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-2 sm:flex-row">
        <SearchFilter
          :model-value="filters"
          :filterable-fields="inviteFilters"
          @update:model-value="(value) => emit('update:filters', value)"
        />
        <SortSelect
          :model-value="sortBy"
          :options="sortOptions"
          @update:model-value="(value) => emit('update:sortBy', value)"
        />
      </div>
    </div>

    <!-- Selection and Bulk Actions -->
    <div
      v-if="selectionCount > 0"
      class="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2">
        <Badge variant="primary">{{ selectionCount }} selected</Badge>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          variant="outline"
          @click="handleBulkResend"
        >
          <Icon
            name="lucide:send"
            class="mr-2 h-4 w-4"
          />
          Resend ({{ selectionCount }})
        </Button>
        <Button
          size="sm"
          variant="destructive"
          @click="handleBulkDelete"
        >
          <Icon
            name="lucide:trash-2"
            class="mr-2 h-4 w-4"
          />
          Delete ({{ selectionCount }})
        </Button>
        <Button
          size="sm"
          variant="ghost"
          @click="clearSelection"
        >
          Clear
        </Button>
      </div>
    </div>

    <!-- Invites Table -->
    <div class="rounded-lg border border-input">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12">
              <Checkbox
                :checked="isAllSelected"
                :indeterminate="selectionCount > 0 && !isAllSelected"
                @update:checked="handleSelectAll"
              />
            </TableHead>
            <TableSortableHead
              :model-value="sortBy"
              column="email"
              @update:model-value="(value) => emit('update:sortBy', value)"
            >
              Email
            </TableSortableHead>
            <TableSortableHead
              :model-value="sortBy"
              column="role"
              @update:model-value="(value) => emit('update:sortBy', value)"
            >
              Role
            </TableSortableHead>
            <TableHead column="status"> Status </TableHead>
            <TableSortableHead
              :model-value="sortBy"
              column="created_at"
              @update:model-value="(value) => emit('update:sortBy', value)"
            >
              Created
            </TableSortableHead>
            <TableHead class="hidden sm:table-cell">Details</TableHead>
            <TableHead class="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableLoadingRow
            v-if="isLoading"
            :colspan="7"
          />
          <TableEmptyRow
            v-else-if="!invites || invites.length === 0"
            :colspan="7"
            :icon="UsersIcon"
            :label="$t('labels.invites.empty')"
          />

          <template v-else>
            <TableRow
              v-for="invite in invites"
              :key="invite.id"
              :class="{ 'bg-muted/30': isInviteSelected(invite) }"
            >
              <TableCell class="w-12">
                <Checkbox
                  :checked="isInviteSelected(invite)"
                  @update:checked="(checked) => handleInviteSelect(invite, checked)"
                />
              </TableCell>

              <TableCell>
                {{ invite.email }}
              </TableCell>

              <TableCell>
                {{ invite.role }}
              </TableCell>

              <TableCell>
                <Badge
                  :variant="getStatusVariant(invite.status)"
                  size="sm"
                >
                  {{ invite.status }}
                </Badge>
              </TableCell>

              <TableCell class="text-muted-foreground text-sm">
                <SimpleTooltip :tooltip="formatDateTime(invite.created_at)">
                  {{ formatRelativeTime(invite.created_at) }}
                </SimpleTooltip>
              </TableCell>

              <TableCell class="hidden sm:table-cell">
                <SimpleTooltip
                  v-if="invite.status === InviteStatus.ACCEPTED"
                  :tooltip="formatDateTime(invite.accepted_at)"
                >
                  Accepted on {{ new Date(invite.accepted_at).toLocaleDateString() }}
                </SimpleTooltip>
                <SimpleTooltip
                  v-else
                  :tooltip="formatDateTime(invite.expires_at)"
                >
                  Expires in {{ getExpiresInDays(invite.expires_at) }} days
                </SimpleTooltip>
              </TableCell>

              <TableCell class="text-right">
                <div class="flex justify-end gap-1">
                  <Button
                    v-if="invite.status === InviteStatus.PENDING"
                    size="icon"
                    variant="ghost"
                    title="Resend invite"
                    @click="handleResend(invite)"
                  >
                    <Icon name="lucide:send" />
                  </Button>
                  <Button
                    v-if="invite.status !== InviteStatus.ACCEPTED"
                    size="icon"
                    variant="ghost"
                    title="Delete invite"
                    @click="handleDelete(invite)"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="text-destructive"
                    />
                  </Button>
                  <Button
                    v-if="invite.status === InviteStatus.ACCEPTED"
                    size="icon"
                    variant="ghost"
                    @click="handleDelete(invite, true)"
                  >
                    <Icon name="lucide:archive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
    <TablePaginationFooter
      v-if="meta"
      :meta="meta"
      :current-page="currentPage"
      :per-page="perPage"
      @update:current-page="(val) => emit('update:currentPage', val)"
      @update:per-page="(val) => emit('update:perPage', val)"
    />
  </div>
</template>
