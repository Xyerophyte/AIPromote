import { apiClient, ApiResponse } from './client'

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    [key: string]: any
  }
  uploadedBy: string
  createdAt: Date
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export type UploadProgressCallback = (progress: UploadProgress) => void

class UploadService {
  /**
   * Upload single file
   */
  async uploadFile(
    file: File, 
    options?: {
      folder?: string
      onProgress?: UploadProgressCallback
      generateThumbnail?: boolean
    }
  ): Promise<ApiResponse<UploadedFile>> {
    return new Promise((resolve) => {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options?.folder) {
        formData.append('folder', options.folder)
      }
      
      if (options?.generateThumbnail) {
        formData.append('generateThumbnail', 'true')
      }

      const xhr = new XMLHttpRequest()

      // Handle progress
      if (options?.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            options.onProgress!(progress)
          }
        })
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: response
            })
          } else {
            resolve({
              success: false,
              error: response.message || `HTTP ${xhr.status}`
            })
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse response'
          })
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Upload failed'
        })
      })

      // Send request
      xhr.open('POST', `${apiClient['baseURL']}/api/v1/upload`)
      
      // Add auth headers
      apiClient['getAuthHeaders']().then(headers => {
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value)
        })
        xhr.send(formData)
      })
    })
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[], 
    options?: {
      folder?: string
      onProgress?: UploadProgressCallback
      generateThumbnails?: boolean
    }
  ): Promise<ApiResponse<UploadedFile[]>> {
    const formData = new FormData()
    
    files.forEach((file, index) => {
      formData.append(`files`, file)
    })
    
    if (options?.folder) {
      formData.append('folder', options.folder)
    }
    
    if (options?.generateThumbnails) {
      formData.append('generateThumbnails', 'true')
    }

    return apiClient.request('/api/v1/upload/multiple', {
      method: 'POST',
      body: formData,
      requireAuth: true
    })
  }

  /**
   * Upload file from URL
   */
  async uploadFromUrl(
    url: string,
    options?: {
      filename?: string
      folder?: string
      generateThumbnail?: boolean
    }
  ): Promise<ApiResponse<UploadedFile>> {
    return apiClient.post('/api/v1/upload/from-url', {
      url,
      filename: options?.filename,
      folder: options?.folder,
      generateThumbnail: options?.generateThumbnail
    })
  }

  /**
   * Get uploaded file info
   */
  async getFile(id: string): Promise<ApiResponse<UploadedFile>> {
    return apiClient.get(`/api/v1/upload/${id}`)
  }

  /**
   * Get user's uploaded files
   */
  async getFiles(filters?: {
    folder?: string
    mimeType?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ files: UploadedFile[], total: number }>> {
    const params = new URLSearchParams()
    
    if (filters?.folder) params.append('folder', filters.folder)
    if (filters?.mimeType) params.append('mimeType', filters.mimeType)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/upload${query}`)
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/upload/${id}`)
  }

  /**
   * Update file metadata
   */
  async updateFile(id: string, data: {
    filename?: string
    metadata?: Record<string, any>
  }): Promise<ApiResponse<UploadedFile>> {
    return apiClient.patch(`/api/v1/upload/${id}`, data)
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(id: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): Promise<ApiResponse<{ thumbnailUrl: string }>> {
    return apiClient.post(`/api/v1/upload/${id}/thumbnail`, options)
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    maxWidth?: number
    maxHeight?: number
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check file size (default 10MB)
    const maxSize = options?.maxSize || 10 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    // Check file type
    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate presigned URL for direct S3 upload
   */
  async getPresignedUrl(data: {
    filename: string
    contentType: string
    folder?: string
  }): Promise<ApiResponse<{
    uploadUrl: string
    fileUrl: string
    key: string
  }>> {
    return apiClient.post('/api/v1/upload/presigned-url', data)
  }

  /**
   * Confirm file upload after direct S3 upload
   */
  async confirmUpload(data: {
    key: string
    filename: string
    size: number
    contentType: string
  }): Promise<ApiResponse<UploadedFile>> {
    return apiClient.post('/api/v1/upload/confirm', data)
  }
}

export const uploadService = new UploadService()

// Helper functions for common file operations
export const fileHelpers = {
  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Get file type category
   */
  getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
    
    if (documentTypes.includes(mimeType)) return 'document'
    return 'other'
  },

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  },

  /**
   * Check if file is a video
   */
  isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/')
  }
}
