import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import pdfParse from 'pdf-parse'
import type { FileUploadRequest, FileDeleteRequest, FileUploadResponse } from '../../types/routes'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'aipromote-assets'

// Helper function to extract text from different file types
async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer)
      return pdfData.text
    }
    
    // For other document types, we could add more extraction logic here
    // For now, return null for non-PDF files
    return null
  } catch (error) {
    console.error('Text extraction error:', error)
    return null
  }
}

// Helper function to generate a unique file key
function generateFileKey(fileName: string, type: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split('.').pop()
  return `${type}/${timestamp}-${randomId}.${extension}`
}

const plugin: FastifyPluginAsync = async (fastify) => {
  // Register multipart support for file uploads
  await fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    }
  })

  // Upload endpoint
  fastify.post('/upload', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' })
      }

      const buffer = await data.toBuffer()
      const type = data.fields.type?.value || 'misc'

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      if (buffer.length > maxSize) {
        return reply.status(400).send({ 
          error: 'File too large. Maximum size is 50MB' 
        })
      }

      // Generate unique file key
      const fileKey = generateFileKey(data.filename, type.toString())
      
      // Upload to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: data.mimetype,
        ServerSideEncryption: 'AES256' as const,
        Metadata: {
          originalName: data.filename,
          uploadedAt: new Date().toISOString(),
          type: type.toString(),
        },
      }

      const upload = new Upload({
        client: s3Client,
        params: uploadParams,
      })

      await upload.done()

      // Generate the S3 URL
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`

      // Extract text content if applicable
      let extractedText: string | null = null
      if (data.mimetype === 'application/pdf' || 
          data.mimetype.includes('document') || 
          data.mimetype.includes('text')) {
        extractedText = await extractTextFromFile(buffer, data.mimetype)
      }

      return {
        success: true,
        url: fileUrl,
        key: fileKey,
        extractedText,
        metadata: {
          name: data.filename,
          size: buffer.length,
          type: data.mimetype,
        }
      }

    } catch (error) {
      fastify.log.error('Upload error:', error)
      return reply.status(500).send({ error: 'Upload failed' })
    }
  })

  // Delete endpoint
  fastify.delete('/upload', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { key } = request.query as { key?: string }

      if (!key) {
        return reply.status(400).send({ error: 'No file key provided' })
      }

      // Delete from S3
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: key,
      }

      await s3Client.send(new DeleteObjectCommand(deleteParams))

      return { success: true }

    } catch (error) {
      fastify.log.error('Delete error:', error)
      return reply.status(500).send({ error: 'Delete failed' })
    }
  })
}

export default plugin
