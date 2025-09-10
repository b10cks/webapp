export default defineNuxtPlugin(async () => {
  const { api } = await import('~/api')
  
  if (import.meta.client) {
    const { useAuth } = await import('~/composables/useAuth')
    const auth = useAuth()
    
    api.setAuthHandler({
      handleUnauthorized: auth.handleUnauthorized
    })
  }
})