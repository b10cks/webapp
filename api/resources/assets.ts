import { BaseResource } from './base-resource'
import type { ApiClient } from '../client'
import type { ApiResponse, BaseQueryParams } from '~/types'

export interface AssetsQueryParams extends BaseQueryParams {
  q?: string
  tags?: string | string[]
  extension?: string
  folder?: string
  filename?: string
  created_at?: string
  updated_at?: string
  mime_type?: string
}

export class Assets extends BaseResource<
  AssetResource,
  UploadAssetPayload,
  UpdateAssetPayload,
  AssetsQueryParams
> {
  protected basePath: string

  constructor(client: ApiClient, spaceId: string) {
    super(client)
    this.basePath = `/mgmt/v1/spaces/${spaceId}/assets`
  }

  public async upload(
    payload: UploadAssetPayload,
    onProgress?: (progress: number) => void
  ): Promise<unknown> {
    const formData = new FormData()
    formData.append('file', payload.file)

    if (payload.folder_id) {
      formData.append('folder_id', payload.folder_id)
    }
    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', JSON.stringify(payload.tags))
    }
    if (payload.metadata) {
      formData.append('metadata', JSON.stringify(payload.metadata))
    }
    if (payload.data) {
      formData.append('data', JSON.stringify(payload.data))
    }

    // If progress tracking is needed, use XMLHttpRequest
    if (onProgress && typeof window !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            onProgress(percentComplete)
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (_) {
              reject(new Error('Failed to parse server response'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
          }
        })
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'))
        })
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'))
        })

        xhr.open('POST', this.basePath)

        const auth = this.client.getAuthHeaders()
        if (auth.Authorization) {
          xhr.setRequestHeader('Authorization', auth.Authorization)
        }

        xhr.send(formData)
      })
    }

    return this.client.post<ApiResponse<AssetResource>>(
      this.basePath,
      formData,
      {
        headers: {
          // Remove Content-Type header so browser can set it with boundary
          'Content-Type': undefined
        }
      }
    )
  }
}