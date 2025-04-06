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

  window.Pusher = Pusher
  window.Echo = new Echo(runTimeConfig.public.echo)

  return {
    provide: {
      echo: window.Echo,
    }
  }
})