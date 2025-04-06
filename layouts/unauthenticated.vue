<script setup lang="ts">

import Markdown from '~/components/Markdown.vue'
import GradientText from '~/components/ui/GradientText.vue'
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2">
    <div class="relative hidden lg:flex flex-col items-center justify-between bg-surface p-4">
      <div class="w-full text-foreground">
        <Markdown
          class="text-sm"
          :content="$t('labels.login.marketing.demo')"
        />
      </div>
      <div class="grid gap-6 max-w-md">
        <GradientText
          class="text-primary text-3xl font-bold"
          :content="$t('labels.login.marketing.header')"
          :colors="['var(--color-green-500)', 'var(--color-blue-500)', 'var(--color-purple-500)']"
        />
        <Markdown
          class="prose ul-checked text-foreground"
          :content="$t('labels.login.marketing.description')"
        />
        <Markdown
          class="text-sm text-foreground"
          :content="$t('labels.login.marketing.asFeatured')"
        />
      </div>
      <div/>
    </div>
    <div class="flex flex-col items-center justify-between p-8 bg-background">
      <div/>
      <slot/>
      <div>
        <Markdown
          class="text-sm max-w-sm text-center text-balance text-foreground"
          :content="$t('labels.login.marketing.footer')"
        />
      </div>
    </div>
  </div>
</template>