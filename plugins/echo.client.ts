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
  const apiBaseUrl = runTimeConfig.public.apiBaseUrl || ''

  // Get fresh token from localStorage
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    const authStorage = localStorage.getItem('auth')
    if (!authStorage) return null
    try {
      const auth = JSON.parse(authStorage)
      return auth?.accessToken || null
    } catch {
      return null
    }
  }

  // Ensure we have a valid configuration
  if (!echoConfig || !echoConfig.broadcaster) {
    console.warn('[Echo] Configuration is missing or invalid')
    return {
      provide: {
        echo: null,
      },
    }
  }

  const authEndpoint = `${apiBaseUrl}/auth/v1/broadcast`

  // Configure Echo with custom authorizer for JWT authentication
  const echoOptions = {
    ...echoConfig,
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (
          error: boolean | Error,
          authData?: { auth: string; channel_data?: string }
        ) => void
      ) => {
        const token = getAuthToken()

        if (!token) {
          console.warn('[Echo] No auth token available for channel:', channel.name)
          callback(new Error('No authentication token available'))
          return
        }

        fetch(authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                throw new Error(`Authentication failed: ${response.status}`)
              }
              throw new Error(`Auth request failed: ${response.status}`)
            }

            const data = await response.json()

            if (!data.auth) {
              throw new Error('Invalid auth response: missing auth token')
            }

            callback(false, {
              auth: data.auth,
              channel_data: data.channel_data,
            })
          })
          .catch((error) => {
            console.error('[Echo] Authorization failed for channel:', channel.name, error)
            callback(error instanceof Error ? error : new Error('Authorization failed'))
          })
      },
    }),
  }

  window.Pusher = Pusher
  // @ts-expect-error - Echo configuration types are complex and runtime config is dynamic
  window.Echo = new Echo(echoOptions)

  console.log('[Echo] Initialized with JWT authorizer')

  return {
    provide: {
      echo: window.Echo,
    },
  }
})
