import { put, del, list, type BlobCommandOptions } from '@vercel/blob'

export interface UploadOptions extends BlobCommandOptions {
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
}

export interface FileMetadata {
  url: string
  pathname: string
  contentType?: string
  contentDisposition?: string
  size: number
}

export class VercelBlobStorage {
  /**
   * Upload a file to Vercel Blob storage
   */
  static async uploadFile(
    filename: string,
    data: Buffer | ReadableStream | string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    try {
      const blob = await put(filename, data, {
        access: 'public',
        addRandomSuffix: true,
        cacheControlMaxAge: 60 * 60 * 24 * 30, // 30 days
        ...options,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        size: blob.size,
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from Vercel Blob storage
   */
  static async deleteFile(url: string): Promise<void> {
    try {
      await del(url)
    } catch (error) {
      console.error('File deletion error:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List files with optional filtering
   */
  static async listFiles(options: {
    prefix?: string
    limit?: number
    cursor?: string
  } = {}) {
    try {
      return await list(options)
    } catch (error) {
      console.error('File listing error:', error)
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload an image with optimization
   */
  static async uploadImage(
    filename: string,
    data: Buffer | ReadableStream,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const imageOptions: UploadOptions = {
      ...options,
      contentType: options.contentType || 'image/jpeg',
      cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year for images
    }

    return this.uploadFile(filename, data, imageOptions)
  }

  /**
   * Upload a PDF document
   */
  static async uploadPDF(
    filename: string,
    data: Buffer | ReadableStream,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const pdfOptions: UploadOptions = {
      ...options,
      contentType: 'application/pdf',
      contentDisposition: `attachment; filename="${filename}"`,
    }

    return this.uploadFile(filename, data, pdfOptions)
  }

  /**
   * Generate a signed URL for private file access
   */
  static generateSignedUrl(pathname: string, expiresIn: number = 3600): string {
    // For Vercel Blob, all files are public by default
    // This is a placeholder for future private file support
    return pathname
  }

  /**
   * Get file metadata without downloading
   */
  static async getFileMetadata(url: string): Promise<FileMetadata | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        return null
      }

      return {
        url,
        pathname: new URL(url).pathname,
        contentType: response.headers.get('content-type') || undefined,
        contentDisposition: response.headers.get('content-disposition') || undefined,
        size: parseInt(response.headers.get('content-length') || '0', 10),
      }
    } catch (error) {
      console.error('Get file metadata error:', error)
      return null
    }
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    file: File,
    allowedTypes: string[] = [],
    maxSize: number = 10 * 1024 * 1024 // 10MB default
  ): { isValid: boolean; error?: string } {
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      }
    }

    return { isValid: true }
  }
}

// Common file type groups
export const FileTypes = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  TEXT: ['text/plain', 'text/csv'],
} as const

// File size limits
export const FileSizeLimits = {
  SMALL: 1024 * 1024, // 1MB
  MEDIUM: 5 * 1024 * 1024, // 5MB
  LARGE: 10 * 1024 * 1024, // 10MB
  XLARGE: 50 * 1024 * 1024, // 50MB
} as const
