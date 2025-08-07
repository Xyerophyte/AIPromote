import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser, requireVerified } from '@/lib/auth-helpers'
import { withErrorHandling, ValidationError, AuthError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

async function uploadHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  requireVerified(user)
  
  // Handle multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    throw new ValidationError('No file provided')
  }

  // Validate file size (50MB limit)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    throw new ValidationError('File size exceeds 50MB limit')
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'video/mp4', 'video/quicktime',
    'text/plain', 'text/csv',
    'application/json'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type '${file.type}' is not supported`)
  }

  // Get additional form fields
  const organizationId = formData.get('organizationId') as string
  
  if (organizationId) {
    // Verify user owns the organization
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
        userId: user.id
      }
    })
    
    if (!organization) {
      throw new AuthError('Organization not found or access denied', 404)
    }
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // TODO: Import and use s3FileService from shared location
  // const result = await s3FileService.uploadFile(
  //   buffer,
  //   file.name,
  //   file.type,
  //   user.id,
  //   organizationId,
  //   {
  //     optimize: file.type.startsWith('image/'),
  //     generateThumbnails: file.type.startsWith('image/')
  //   }
  // )

  // Placeholder implementation
  const result = {
    id: `file_${Date.now()}`,
    filename: file.name,
    mimetype: file.type,
    size: file.size,
    userId: user.id,
    organizationId,
    url: `https://placeholder.com/${file.name}`,
    uploadedAt: new Date().toISOString(),
  }

  // Store file metadata in database
  await prisma.mediaAsset.create({
    data: {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      url: result.url,
      userId: user.id,
      organizationId: organizationId || undefined,
      metadata: {
        originalName: file.name,
        uploadedAt: result.uploadedAt
      }
    }
  })

  return NextResponse.json({
    success: true,
    data: result
  })
}

export const POST = withRateLimit(
  withErrorHandling(uploadHandler),
  CommonRateLimiters.upload
)
