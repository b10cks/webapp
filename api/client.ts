import type { NitroFetchOptions } from 'nitropack'

export class ApiClient {
  private readonly baseURL: string
  private readonly defaultHeaders: Record<string, string>
  private authToken?: string

  constructor(options: {
    baseURL?: string
    authToken?: string
    defaultHeaders?: Record<string, string>
  } = {}) {
    this.baseURL = options.baseURL || ''
    if (import.meta.client) {
      this.authToken = localStorage.getItem('authToken') || undefined
    }
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    }
  }

  public setAuthToken(token?: string): void {
    this.authToken = token
  }

  private get headers(): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
    }
  }

  /**
   * Get just the auth headers - used for XMLHttpRequest uploads
   */
  public getAuthHeaders(): Record<string, string> {
    return this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}
  }

  public async request<T>(
    endpoint: string,
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`

    try {
      return await $fetch<T>(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })
    } catch (error: Error) {
      if (error?.response?.status === 401 && endpoint !== '/auth/v1/token') {
        // const auth = useAuth()
        // const route= useRoute()
        navigateTo({ name: 'login' })
        // await auth.logout(route.fullPath)
      }

      throw error
    }
  }

  public get<T>(
    endpoint: string,
    query: Record<string, unknown> = {},
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', query, ...options })
  }

  public post<T>(
    endpoint: string,
    data?: any,
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, ...options })
  }

  public put<T>(
    endpoint: string,
    data?: any,
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, ...options })
  }

  public patch<T>(
    endpoint: string,
    data?: any,
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data, ...options })
  }

  public delete<T>(
    endpoint: string,
    options: NitroFetchOptions<any> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options })
  }
}