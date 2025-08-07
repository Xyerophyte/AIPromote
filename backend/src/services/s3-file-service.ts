import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import crypto from 'crypto'
import path from 'path'
import { ValidationError } from '../utils/errors'

const prisma = new PrismaClient()

interface FileUploadOptions {
  bucket?: string
  folder?: string
  allowedTypes?: string[]
  maxFileSize?: number
  optimize?: boolean
  generateThumbnails?: boolean
}

interface UploadResult {
  id: string
  originalName: string
  fileName: string
  url: string
  thumbnailUrl?: string
  size: number
  mimeType: string
  dimensions?: {
    width: number
    height: number
  }
}

export class S3FileService {
  private s3: S3Client
  private defaultBucket: string

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    
    this.defaultBucket = process.env.S3_BUCKET || 'aipromotapp-assets'
  }

  /**
   * Upload a file to S3 with optional optimization
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    originalName: string,
    mimeType: string,
    userId: string,
    organizationId: string,
    options: FileUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        bucket = this.defaultBucket,
        folder = 'uploads',
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'],
        maxFileSize = 10 * 1024 * 1024, // 10MB
        optimize = true,
        generateThumbnails = true,
      } = options

      // Validate file type
      if (!allowedTypes.includes(mimeType)) {
        throw new ValidationError('File type not allowed', 'mimeType', mimeType)
      }

      // Validate file size
      if (file.length > maxFileSize) {
        throw new ValidationError('File too large', 'size', file.length)
      }

      const fileExtension = path.extname(originalName).toLowerCase()
      const fileId = crypto.randomUUID()
      const fileName = `${fileId}${fileExtension}`
      const filePath = `${folder}/${fileName}`

      let processedFile = file
      let dimensions: { width: number; height: number } | undefined
      let thumbnailUrl: string | undefined

      // Optimize images
      if (optimize && mimeType.startsWith('image/')) {
        const sharpImage = sharp(file)
        const metadata = await sharpImage.metadata()
        
        if (metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height }
        }

        // Optimize the image
        processedFile = await sharpImage
          .jpeg({ quality: 85, progressive: true })
          .png({ quality: 85, progressive: true })
          .webp({ quality: 85 })
          .toBuffer()

        // Generate thumbnail
        if (generateThumbnails) {
          const thumbnailBuffer = await sharp(file)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer()

          const thumbnailPath = `thumbnails/${fileId}_thumb.jpg`
          
          await this.uploadToS3(thumbnailBuffer, thumbnailPath, 'image/jpeg', bucket)
          thumbnailUrl = `https://${bucket}.s3.amazonaws.com/${thumbnailPath}`
        }
      }

      // Upload to S3
      await this.uploadToS3(processedFile, filePath, mimeType, bucket)
      const fileUrl = `https://${bucket}.s3.amazonaws.com/${filePath}`

      // Save to database
      const asset = await prisma.asset.create({
        data: {
          id: fileId,
          organizationId,
          fileName: originalName,
          filePath,
          fileSize: processedFile.length,
          mimeType,
          url: fileUrl,
          thumbnailUrl,
          dimensions: dimensions ? JSON.stringify(dimensions) : null,
          uploadedBy: userId,
          status: 'ACTIVE',
          metadata: {
            originalSize: file.length,
            optimized: optimize && mimeType.startsWith('image/'),
          }
        }
      })

      return {
        id: asset.id,
        originalName,
        fileName: asset.fileName,
        url: fileUrl,
        thumbnailUrl,
        size: processedFile.length,
        mimeType,
        dimensions,
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  /**
   * Upload buffer directly to S3
   */
  private async uploadToS3(
    buffer: Buffer | Uint8Array,
    key: string,
    mimeType: string,
    bucket: string
  ): Promise<void> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000', // 1 year
      },
    })

    await upload.done()
  }

  /**
   * Get file from S3
   */
  async getFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: fileId }
      })

      if (!asset) {
        return null
      }

      const command = new GetObjectCommand({
        Bucket: this.defaultBucket,
        Key: asset.filePath,
      })

      const response = await this.s3.send(command)
      
      if (!response.Body) {
        return null
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray())
      return {
        buffer,
        mimeType: asset.mimeType,
      }
    } catch (error) {
      console.error('Get file error:', error)
      return null
    }
  }

  /**
   * Delete file from S3 and database
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: fileId }
      })

      if (!asset) {
        return false
      }

      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.defaultBucket,
        Key: asset.filePath,
      })

      await this.s3.send(deleteCommand)

      // Delete thumbnail if exists
      if (asset.thumbnailUrl) {
        const thumbnailKey = asset.thumbnailUrl.split('/').pop()
        if (thumbnailKey) {
          const deleteThumbnailCommand = new DeleteObjectCommand({
            Bucket: this.defaultBucket,
            Key: `thumbnails/${thumbnailKey}`,
          })
          await this.s3.send(deleteThumbnailCommand)
        }
      }

      // Mark as deleted in database
      await prisma.asset.update({
        where: { id: fileId },
        data: {
          status: 'DELETED',
          deletedBy: userId,
          deletedAt: new Date(),
        }
      })

      return true
    } catch (error) {
      console.error('Delete file error:', error)
      return false
    }
  }

  /**
   * Get organization's assets
   */
  async getOrganizationAssets(
    organizationId: string,
    options: {
      type?: string
      limit?: number
      offset?: number
      search?: string
    } = {}
  ) {
    const { type, limit = 20, offset = 0, search } = options

    const where: any = {
      organizationId,
      status: 'ACTIVE',
    }

    if (type) {
      where.mimeType = { startsWith: type }
    }

    if (search) {
      where.fileName = { contains: search, mode: 'insensitive' }
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        fileName: true,
        url: true,
        thumbnailUrl: true,
        mimeType: true,
        fileSize: true,
        dimensions: true,
        createdAt: true,
        uploadedBy: true,
      }
    })

    const total = await prisma.asset.count({ where })

    return {
      assets: assets.map(asset => ({
        ...asset,
        dimensions: asset.dimensions ? JSON.parse(asset.dimensions) : null,
      })),
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Process and optimize existing image
   */
  async optimizeImage(fileId: string): Promise<boolean> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: fileId }
      })

      if (!asset || !asset.mimeType.startsWith('image/')) {
        return false
      }

      // Get original file
      const fileData = await this.getFile(fileId)
      if (!fileData) {
        return false
      }

      // Optimize
      const optimized = await sharp(fileData.buffer)
        .jpeg({ quality: 85, progressive: true })
        .png({ quality: 85, progressive: true })
        .webp({ quality: 85 })
        .toBuffer()

      // Upload optimized version
      await this.uploadToS3(optimized, asset.filePath, asset.mimeType, this.defaultBucket)

      // Update database
      await prisma.asset.update({
        where: { id: fileId },
        data: {
          fileSize: optimized.length,
          metadata: {
            ...asset.metadata as any,
            optimized: true,
            optimizedAt: new Date(),
          }
        }
      })

      return true
    } catch (error) {
      console.error('Image optimization error:', error)
      return false
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  async generateSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: fileId }
      })

      if (!asset) {
        return null
      }

      // For now, return the public URL
      // In production, you'd use getSignedUrl from @aws-sdk/s3-request-presigner
      return asset.url
    } catch (error) {
      console.error('Generate signed URL error:', error)
      return null
    }
  }

  /**
   * Parse PDF document and extract text
   */
  async parsePdf(fileId: string): Promise<{ text: string; pageCount: number } | null> {
    try {
      const fileData = await this.getFile(fileId)
      if (!fileData || fileData.mimeType !== 'application/pdf') {
        return null
      }

      // This would require pdf-parse library
      // const pdf = require('pdf-parse')
      // const data = await pdf(fileData.buffer)
      
      // For now, return mock data
      return {
        text: "PDF parsing not implemented in this example",
        pageCount: 1
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      return null
    }
  }
}

export const s3FileService = new S3FileService()
