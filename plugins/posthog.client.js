import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  if (import.meta.env.MODE === 'development') {
    return
  }

  const runtimeConfig = useRuntimeConfig()
  const posthogClient = posthog.init(runtimeConfig.public.posthog.key, {
    api_host: runtimeConfig.public.posthog.host,
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') posthog.debug()
    },
  })

  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      posthog.capture('$pageview', {
        current_url: to.fullPath,
      })
    })
  })

  return {
    provide: {
      posthog: () => posthogClient,
    },
  }
})