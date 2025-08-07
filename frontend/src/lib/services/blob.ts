import { put, del, head, list, type PutBlobResult, type ListBlobResult } from '@vercel/blob'
import { NextRequest } from 'next/server'

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN is required')
}

export interface UploadOptions {
  pathname?: string
  contentType?: string
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
  multipart?: boolean
}

export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export interface UploadResult {
  success: boolean
  url?: string
  pathname?: string
  size?: number
  error?: string
}

export interface FileMetadata {
  filename: string
  contentType: string
  size: number
  uploadedAt: string
  organizationId?: string
  userId?: string
  category?: string
}

class BlobService {
  private readonly defaultValidation: FileValidationOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.mp4', '.webm', '.mov',
      '.mp3', '.wav', '.ogg',
      '.pdf', '.txt', '.csv', '.json',
      '.xls', '.xlsx'
    ]
  }

  private validateFile(
    file: File | Buffer,
    filename: string,
    contentType: string,
    validation?: FileValidationOptions
  ): { valid: boolean; error?: string } {
    const options = { ...this.defaultValidation, ...validation }

    // Check file size
    const size = file instanceof File ? file.size : file.length
    if (options.maxSize && size > options.maxSize) {
      return {
        valid: false,
        error: `File size ${Math.round(size / 1024 / 1024)}MB exceeds maximum allowed size ${Math.round(options.maxSize / 1024 / 1024)}MB`
      }
    }

    // Check content type
    if (options.allowedTypes && !options.allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `File type ${contentType} is not allowed`
      }
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
      if (!options.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension ${extension} is not allowed`
        }
      }
    }

    return { valid: true }
  }

  private generatePathname(
    filename: string,
    userId?: string,
    organizationId?: string,
    category?: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const randomId = Math.random().toString(36).substring(2, 8)
    
    let path = ''
    if (organizationId) {
      path += `organizations/${organizationId}/`
    } else if (userId) {
      path += `users/${userId}/`
    }
    
    if (category) {
      path += `${category}/`
    }
    
    path += `${timestamp}/${randomId}_${filename}`
    
    return path
  }

  // Upload file from File object or Buffer
  async uploadFile(
    data: File | Buffer,
    filename: string,
    options?: UploadOptions & FileValidationOptions & {
      userId?: string
      organizationId?: string
      category?: string
    }
  ): Promise<UploadResult> {
    try {
      const contentType = data instanceof File 
        ? data.type 
        : options?.contentType || 'application/octet-stream'

      // Validate file
      const validation = this.validateFile(data, filename, contentType, options)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate pathname
      const pathname = options?.pathname || this.generatePathname(
        filename,
        options?.userId,
        options?.organizationId,
        options?.category
      )

      // Convert File to Buffer if necessary
      const buffer = data instanceof File ? Buffer.from(await data.arrayBuffer()) : data

      // Upload to Vercel Blob
      const result = await put(pathname, buffer, {
        contentType,
        addRandomSuffix: options?.addRandomSuffix,
        cacheControlMaxAge: options?.cacheControlMaxAge,
        multipart: options?.multipart,
        access: 'public', // or 'private' based on requirements
      })

      return {
        success: true,
        url: result.url,
        pathname: result.pathname,
        size: buffer.length
      }
    } catch (error) {
      console.error('Blob upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // Upload from form data
  async uploadFromFormData(
    formData: FormData,
    fieldName: string = 'file',
    options?: UploadOptions & FileValidationOptions & {
      userId?: string
      organizationId?: string
      category?: string
    }
  ): Promise<UploadResult> {
    try {
      const file = formData.get(fieldName) as File
      if (!file) {
        return { success: false, error: 'No file found in form data' }
      }

      return this.uploadFile(file, file.name, options)
    } catch (error) {
      console.error('Form data upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // Upload from URL
  async uploadFromUrl(
    url: string,
    filename?: string,
    options?: UploadOptions & FileValidationOptions & {
      userId?: string
      organizationId?: string
      category?: string
    }
  ): Promise<UploadResult> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        return { success: false, error: `Failed to fetch file from URL: ${response.statusText}` }
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const finalFilename = filename || url.split('/').pop()?.split('?')[0] || 'download'

      return this.uploadFile(buffer, finalFilename, { ...options, contentType })
    } catch (error) {
      console.error('URL upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // Upload avatar/profile image
  async uploadAvatar(
    data: File | Buffer,
    userId: string,
    filename: string = 'avatar'
  ): Promise<UploadResult> {
    return this.uploadFile(data, filename, {
      userId,
      category: 'avatars',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 2 * 1024 * 1024, // 2MB
      cacheControlMaxAge: 3600, // 1 hour
    })
  }

  // Upload content media (for social posts)
  async uploadContentMedia(
    data: File | Buffer,
    organizationId: string,
    filename: string,
    type: 'image' | 'video' | 'document' = 'image'
  ): Promise<UploadResult> {
    const typeConfigs = {
      image: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
      },
      video: {
        allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        maxSize: 50 * 1024 * 1024, // 50MB
      },
      document: {
        allowedTypes: ['application/pdf', 'text/plain', 'application/json'],
        maxSize: 10 * 1024 * 1024, // 10MB
      }
    }

    return this.uploadFile(data, filename, {
      organizationId,
      category: `content-media/${type}`,
      ...typeConfigs[type],
      cacheControlMaxAge: 86400, // 24 hours
    })
  }

  // Delete file
  async deleteFile(pathname: string): Promise<{ success: boolean; error?: string }> {
    try {
      await del(pathname)
      return { success: true }
    } catch (error) {
      console.error('Blob delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  // Get file info
  async getFileInfo(pathname: string): Promise<{
    success: boolean
    metadata?: {
      pathname: string
      contentType: string
      size: number
      uploadedAt: Date
    }
    error?: string
  }> {
    try {
      const result = await head(pathname)
      return {
        success: true,
        metadata: {
          pathname: result.pathname,
          contentType: result.contentType,
          size: result.size,
          uploadedAt: result.uploadedAt
        }
      }
    } catch (error) {
      console.error('Blob head error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info'
      }
    }
  }

  // List files
  async listFiles(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{
    success: boolean
    files?: Array<{
      pathname: string
      size: number
      uploadedAt: Date
    }>
    cursor?: string
    hasMore?: boolean
    error?: string
  }> {
    try {
      const result = await list({
        prefix: options?.prefix,
        limit: options?.limit,
        cursor: options?.cursor,
      })

      return {
        success: true,
        files: result.blobs.map(blob => ({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        })),
        cursor: result.cursor,
        hasMore: result.hasMore
      }
    } catch (error) {
      console.error('Blob list error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files'
      }
    }
  }

  // List user files
  async listUserFiles(userId: string, options?: {
    category?: string
    limit?: number
    cursor?: string
  }): Promise<{
    success: boolean
    files?: Array<{
      pathname: string
      size: number
      uploadedAt: Date
    }>
    cursor?: string
    hasMore?: boolean
    error?: string
  }> {
    const prefix = options?.category 
      ? `users/${userId}/${options.category}/`
      : `users/${userId}/`

    return this.listFiles({
      prefix,
      limit: options?.limit,
      cursor: options?.cursor
    })
  }

  // List organization files
  async listOrganizationFiles(organizationId: string, options?: {
    category?: string
    limit?: number
    cursor?: string
  }): Promise<{
    success: boolean
    files?: Array<{
      pathname: string
      size: number
      uploadedAt: Date
    }>
    cursor?: string
    hasMore?: boolean
    error?: string
  }> {
    const prefix = options?.category 
      ? `organizations/${organizationId}/${options.category}/`
      : `organizations/${organizationId}/`

    return this.listFiles({
      prefix,
      limit: options?.limit,
      cursor: options?.cursor
    })
  }

  // Cleanup old files
  async cleanupOldFiles(
    olderThanDays: number = 30,
    prefix?: string
  ): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      let deletedCount = 0
      let cursor: string | undefined

      do {
        const result = await this.listFiles({ prefix, limit: 100, cursor })
        
        if (!result.success || !result.files) {
          break
        }

        const filesToDelete = result.files.filter(file => file.uploadedAt < cutoffDate)
        
        for (const file of filesToDelete) {
          const deleteResult = await this.deleteFile(file.pathname)
          if (deleteResult.success) {
            deletedCount++
          }
        }

        cursor = result.cursor
      } while (cursor)

      return { success: true, deletedCount }
    } catch (error) {
      console.error('Cleanup error:', error)
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      }
    }
  }

  // Generate signed URL for temporary access
  generateSignedUrl(pathname: string, expiresIn: number = 3600): string {
    // Note: Vercel Blob currently uses public URLs
    // For private access, you'd implement your own signed URL logic
    // This is a placeholder implementation
    const baseUrl = `https://blob.vercel-storage.com`
    return `${baseUrl}/${pathname}?expires=${Date.now() + expiresIn * 1000}`
  }

  // Validate file type by content (magic bytes)
  private async validateFileContent(buffer: Buffer): Promise<{ 
    isValid: boolean 
    detectedType?: string 
    error?: string 
  }> {
    try {
      const first4Bytes = buffer.subarray(0, 4)
      const first2Bytes = buffer.subarray(0, 2)

      // Common file signatures (magic bytes)
      const signatures = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'application/pdf': [0x25, 0x50, 0x44, 0x46],
        'video/mp4': [0x66, 0x74, 0x79, 0x70], // at offset 4
      }

      for (const [type, signature] of Object.entries(signatures)) {
        const matches = signature.every((byte, index) => first4Bytes[index] === byte)
        if (matches) {
          return { isValid: true, detectedType: type }
        }
      }

      // If no specific signature found, consider it valid but unknown
      return { isValid: true, detectedType: 'application/octet-stream' }
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Content validation failed' 
      }
    }
  }

  // Get storage usage for user/organization
  async getStorageUsage(prefix: string): Promise<{
    success: boolean
    totalSize?: number
    fileCount?: number
    error?: string
  }> {
    try {
      let totalSize = 0
      let fileCount = 0
      let cursor: string | undefined

      do {
        const result = await this.listFiles({ prefix, limit: 1000, cursor })
        
        if (!result.success || !result.files) {
          break
        }

        for (const file of result.files) {
          totalSize += file.size
          fileCount++
        }

        cursor = result.cursor
      } while (cursor)

      return { success: true, totalSize, fileCount }
    } catch (error) {
      console.error('Storage usage error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage usage'
      }
    }
  }
}

export const blobService = new BlobService()
export default blobService
