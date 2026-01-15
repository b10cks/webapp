import type { NitroFetchOptions } from 'nitropack'

interface AuthHandler {
  handleUnauthorized: (endpoint: string, options: any) => Promise<any>
}

export class ApiClient {
  private readonly baseURL: string
  private readonly defaultHeaders: Record<string, string>
  private authToken?: string
  private authHandler?: AuthHandler

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

  private get headers(): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
    }
  }

  public getAuthHeaders(): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
  }

  public async request<T>(endpoint: string, options: NitroFetchOptions<any> = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`

    const makeRequest = async (headers: Record<string, string>) => {
      return $fetch<T>(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })
    }

    try {
      return await makeRequest(this.headers)
    } catch (error: any) {
      if (error?.response?.status === 401 && this.authHandler) {
        try {
          const retryInfo = await this.authHandler.handleUnauthorized(endpoint, options)

          if (retryInfo.token) {
            const authHeaders: Record<string, string> = {
              ...this.defaultHeaders,
              Authorization: `Bearer ${retryInfo.token}`,
            }
            if (options.headers) {
              Object.assign(authHeaders, options.headers)
            }
            return await makeRequest(authHeaders)
          }

          // If no token is returned, authentication handler failed
          console.error(
            'Token refresh failed: Error: Authentication failed - No token returned from auth handler'
          )
          throw new Error('Token refresh failed: Error: Authentication failed')
        } catch (authError: any) {
          // Re-throw authentication errors with context
          console.error(
            'Token refresh failed: Error: Authentication failed',
            authError?.message || authError
          )
          throw authError
        }
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
