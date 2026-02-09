const XSRF_COOKIE_NAME = 'XSRF-TOKEN'

export const getXsrfToken = (): string | null => {
  if (!import.meta.client) return null

  const cookies = document.cookie ? document.cookie.split('; ') : []
  const entry = cookies.find((cookie) => cookie.startsWith(`${XSRF_COOKIE_NAME}=`))

  if (!entry) return null

  const value = entry.split('=').slice(1).join('=')
  return value ? decodeURIComponent(value) : null
}

export const getXsrfHeaders = (): Record<string, string> => {
  const token = getXsrfToken()
  return token ? { 'X-XSRF-TOKEN': token } : {}
}
