<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeaderCombined } from '~/components/ui/dialog'
import { InputField } from '~/components/ui/form'
import type { CreateInvitePayload } from '~/types/invites'

const open = defineModel<boolean>('open')

const props = defineProps<{
  spaceId?: string
  teamId?: string
  resourceType: 'space' | 'team'
}>()

const { useCreateSpaceInviteMutation, useCreateTeamInviteMutation } = useInvites()
const createSpaceInviteMutation = useCreateSpaceInviteMutation()
const createTeamInviteMutation = useCreateTeamInviteMutation()

const formData = ref<CreateInvitePayload>({
  email: '',
  role: 'member',
  message: '',
  expires_in_days: 7,
})

const isLoading = computed(() => {
  return props.resourceType === 'space'
    ? createSpaceInviteMutation.isPending.value
    : createTeamInviteMutation.isPending.value
})

const handleSendInvite = async () => {
  if (props.resourceType === 'space' && props.spaceId) {
    createSpaceInviteMutation.mutate({ spaceId: props.spaceId, payload: formData.value })
  } else if (props.resourceType === 'team' && props.teamId) {
    createTeamInviteMutation.mutate({ teamId: props.teamId, payload: formData.value })
  }

  if (!isLoading.value) {
    open.value = false
    formData.value = {
      email: '',
      role: 'member',
      message: '',
      expires_in_days: 7,
    }
  }
}

const roles = ['member', 'editor', 'admin', 'owner'] as const
</script>

<template>
  <Dialog
    :open="open"
    @update:open="open = $event"
  >
    <DialogContent>
      <DialogHeaderCombined :title="`Invite to ${resourceType}`" />
      
      <form class="grid gap-4" @submit.prevent="handleSendInvite">
        <InputField
          v-model="formData.email"
          type="email"
          name="email"
          label="Email"
          placeholder="user@example.com"
          required
        />

        <div class="grid gap-2">
          <label class="text-sm font-medium">Role</label>
          <select
            v-model="formData.role"
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option
              v-for="role in roles"
              :key="role"
              :value="role"
            >
              {{ role.charAt(0).toUpperCase() + role.slice(1) }}
            </option>
          </select>
        </div>

        <InputField
          v-model="formData.message"
          as="textarea"
          name="message"
          label="Message (Optional)"
          placeholder="Add a personal message..."
          rows="3"
        />

        <div class="grid gap-2">
          <label class="text-sm font-medium">Expires in</label>
          <select
            v-model.number="formData.expires_in_days"
            class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option :value="1">1 day</option>
            <option :value="7">7 days</option>
            <option :value="14">14 days</option>
            <option :value="30">30 days</option>
            <option :value="90">90 days</option>
          </select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="open = false"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            :disabled="isLoading || !formData.email"
          >
            <Icon
              v-if="isLoading"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isLoading ? 'Sending...' : 'Send Invite' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
