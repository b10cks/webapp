<script setup lang="ts">
import ContentHeader from '~/components/ui/ContentHeader.vue'
// import RedirectDialog from '~/components/redirects/RedirectDialog.vue'
import RedirectsTable from '~/components/redirects/RedirectsTable.vue'
import { Button } from '~/components/ui/button'

const route = useRoute()
const spaceId = computed(() => route.params.space as string)

</script>

<template>
  <div>
    <NuxtLayout>
      <div class="bg-background w-full">
        <div class="content-grid">
          <ContentHeader
            :header="$t('labels.redirects.title')"
            :description="$t('labels.redirects.description')"
          >
            <template #actions>
              <Button
                variant="primary"
                @click="handleAddRedirect"
              >
                <Icon name="lucide:plus"/>
                {{ $t('actions.redirects.add') }}
              </Button>
            </template>
          </ContentHeader>
          <RedirectsTable :space-id="spaceId"/>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>