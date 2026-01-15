import type { Broadcaster } from 'laravel-echo'

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Echo: Echo<keyof Broadcaster>
    Pusher: typeof Pusher
  }
}
export default defineNuxtPlugin(async (_nuxtApp) => {
  const runTimeConfig = useRuntimeConfig()
  const echoConfig = runTimeConfig.public.echo

  // Ensure we have a valid configuration
  if (!echoConfig || !echoConfig.broadcaster) {
    // @eslint-disable-next-line no-console
    console.warn('Echo configuration is missing or invalid')
    return {
      provide: {
        echo: null,
      },
    }
  }

  window.Pusher = Pusher
  // @ts-expect-error - Echo configuration types are complex and runtime config is dynamic
  window.Echo = new Echo(runTimeConfig.public.echo)

  return {
    provide: {
      echo: window.Echo,
    },
  }
})
