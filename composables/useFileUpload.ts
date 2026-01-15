import { ref } from 'vue'

import { useApiClient } from '~/composables/useApiClient'

interface UploadOptions {
  url: string
  fieldName?: string // default: 'file'
  headers?: Record<string, string>
  onProgress?: (progress: number) => void
}

export function useFileUpload() {
  const isUploading = ref(false)
  const error = ref<string | null>(null)
  const { client: apiClient } = useApiClient()

  const upload = async (file: File, options: UploadOptions): Promise<any> => {
    isUploading.value = true
    error.value = null
    const formData = new FormData()
    formData.append(options.fieldName || 'file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          options.onProgress(percentComplete)
        }
      })
      xhr.addEventListener('load', () => {
        isUploading.value = false
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (e) {
            error.value = 'Failed to parse server response'
            reject(error.value)
          }
        } else {
          error.value = `Upload failed: ${xhr.statusText}`
          reject(error.value)
        }
      })
      xhr.addEventListener('error', () => {
        isUploading.value = false
        error.value = 'Network error occurred during upload'
        reject(error.value)
      })
      xhr.addEventListener('abort', () => {
        isUploading.value = false
        error.value = 'Upload was aborted'
        reject(error.value)
      })
      xhr.open('POST', options.url)
      // Set headers
      const authToken = apiClient.getAuthHeaders()['Authorization']?.replace('Bearer ', '') || ''
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
        xhr.setRequestHeader('accept', 'application/json')
      }
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value)
        })
      }
      xhr.send(formData)
    })
  }

  return {
    isUploading,
    error,
    upload,
  }
}
