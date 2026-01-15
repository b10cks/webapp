import type Echo from 'laravel-echo'

import { useNuxtApp } from '#app'

export const useEcho = (): Echo<'reverb'> => {
  const { $echo } = useNuxtApp()

  return $echo as Echo<'reverb'>
}
