<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { Progress } from '~/components/ui/progress'
import { Button } from '~/components/ui/button'

const enableAI = ref(true)
const tokensUsed = ref(250000)
const tokensTotal = ref(1000000)
const usagePercentage = computed(() => Math.round((tokensUsed.value / tokensTotal.value) * 100))

const saveSettings = () => {
  toast.success('AI settings saved successfully')
}
</script>

<template>
  <Card variant="outline">
    <CardHeader>
      <CardTitle>{{ $t('labels.settings.ai.title') }}</CardTitle>
      <CardDescription>{{ $t('labels.settings.ai.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label
            :for="'enable-ai'"
            class="text-sm font-medium"
          >
            {{ $t('labels.settings.ai.enableAIFeatures') }}
          </Label>
          <Switch
            id="enable-ai"
            v-model:checked="enableAI"
            aria-label="Enable AI Features"
          />
        </div>
        <p class="text-xs text-muted">
          {{ $t('labels.settings.ai.featuresDescription') }}
        </p>
      </div>

      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium">{{ $t('labels.settings.ai.usage') }}</h4>
          <p class="text-xs text-muted">{{ $t('labels.settings.ai.usageDescription') }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span>{{ tokensUsed.toLocaleString() }} {{ $t('labels.settings.ai.of') }} {{ tokensTotal.toLocaleString() }} {{
                $t('labels.settings.ai.tokensUsed')
              }}</span>
            <span class="text-muted">{{ usagePercentage }}%</span>
          </div>
          <Progress
            :model-value="usagePercentage"
            class="h-2"
          />
        </div>
        <p class="text-sm text-muted">
          {{ $t('labels.settings.ai.resetInfo', { date: 'April 30, 2025' }) }}
          <Button
            variant="link"
            class="h-auto p-0 text-xs"
          >
            {{ $t('labels.settings.ai.upgradePlan') }}
          </Button>
        </p>
      </div>
    </CardContent>
    <CardFooter>
      <Button @click="saveSettings">{{ $t('actions.saveChanges') }}</Button>
    </CardFooter>
  </Card>
</template>