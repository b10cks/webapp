import type { NitroFetchOptions } from 'nitropack'

import { getXsrfHeaders } from '~/lib/csrf'

interface AuthHandler {
  handleUnauthorized: (endpoint: string, options: any) => Promise<{ retry?: boolean } | void>
}

export class ApiClient {
  private readonly baseURL: string
  private readonly defaultHeaders: Record<string, string>
  private authToken?: string
  private authHandler?: AuthHandler
  private csrfReady: boolean = false

  constructor(
    options: {
      baseURL?: string
      authToken?: string
      defaultHeaders?: Record<string, string>
    } = {}
  ) {
    this.baseURL = options.baseURL || ''
    this.authToken = options.authToken
    this.defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    }
  }

  public setAuthToken(token?: string): void {
    this.authToken = token
  }

  public setAuthHandler(handler: AuthHandler): void {
    this.authHandler = handler
  }

  public getAuthHeaders(): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
  }

  private resolveUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
  }

  public async ensureCsrfCookie(): Promise<void> {
    if (!import.meta.client || this.csrfReady) return

    const url = this.resolveUrl('/auth/v1/csrf-cookie')
    await $fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
    this.csrfReady = true
  }

  public async request<T>(endpoint: string, options: NitroFetchOptions<any> = {}): Promise<T> {
    const url = this.resolveUrl(endpoint)
    const method = (options.method || 'GET').toString().toUpperCase()

    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      await this.ensureCsrfCookie()
    }

    const makeRequest = async (headers: Record<string, string>) => {
      return $fetch<T>(url, {
        ...options,
        credentials: options.credentials || 'include',
        headers: {
          ...headers,
          ...options.headers,
        },
      })
    }

    try {
      const csrfHeaders =
        method === 'GET' || method === 'HEAD' || method === 'OPTIONS' ? {} : getXsrfHeaders()
      return await makeRequest({
        ...this.defaultHeaders,
        ...csrfHeaders,
      })
    } catch (error: any) {
      if (error?.response?.status === 401 && this.authHandler) {
        const retryInfo = await this.authHandler.handleUnauthorized(endpoint, options)

        if (retryInfo?.retry) {
          return await makeRequest({
            ...this.defaultHeaders,
            ...getXsrfHeaders(),
          })
        }

        throw error
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

  public post<T>(endpoint: string, data?: any, options: NitroFetchOptions<any> = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, ...options })
  }

  public put<T>(endpoint: string, data?: any, options: NitroFetchOptions<any> = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, ...options })
  }

  public patch<T>(endpoint: string, data?: any, options: NitroFetchOptions<any> = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data, ...options })
  }

  public delete<T>(endpoint: string, options: NitroFetchOptions<any> = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options })
  }
}
