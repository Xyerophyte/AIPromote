import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { s3FileService } from '../services/s3-file-service'

interface UploadRequest extends FastifyRequest {
  body: {
    userId: string
    organizationId: string
  }
}

export async function uploadRoutes(fastify: FastifyInstance) {
  // Register multipart support for file uploads
  await fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1
    }
  })

  // File upload endpoint
  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the uploaded file
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ 
          success: false,
          error: 'No file provided' 
        })
      }

      const buffer = await data.toBuffer()
      
      // Get additional data from fields
      const userId = data.fields?.userId?.value as string || 'anonymous'
      const organizationId = data.fields?.organizationId?.value as string || userId

      // Upload file using S3 service
      const result = await s3FileService.uploadFile(
        buffer,
        data.filename,
        data.mimetype,
        userId,
        organizationId,
        {
          optimize: data.mimetype.startsWith('image/'),
          generateThumbnails: data.mimetype.startsWith('image/')
        }
      )

      return reply.send({
        success: true,
        data: result
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      
      if (error.code === 'FST_FILES_LIMIT') {
        return reply.status(400).send({
          success: false,
          error: 'Too many files. Only 1 file allowed per upload.'
        })
      }
      
      if (error.code === 'FST_FILE_TOO_LARGE') {
        return reply.status(400).send({
          success: false,
          error: 'File too large. Maximum size is 50MB.'
        })
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Upload failed'
      })
    }
  })

  // Get organization assets
  fastify.get('/assets/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.params as { organizationId: string }
      const query = request.query as { 
        type?: string
        limit?: string
        offset?: string
        search?: string
      }

      const options = {
        type: query.type,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
        search: query.search
      }

      const assets = await s3FileService.getOrganizationAssets(params.organizationId, options)

      return reply.send({
        success: true,
        data: assets
      })

    } catch (error: any) {
      console.error('Get assets error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get assets'
      })
    }
  })

  // Delete file
  fastify.delete('/assets/:fileId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.params as { fileId: string }
      const body = request.body as { userId: string }
      
      const userId = body.userId || 'anonymous'
      const success = await s3FileService.deleteFile(params.fileId, userId)

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        })
      }

      return reply.send({
        success: true,
        message: 'File deleted successfully'
      })

    } catch (error: any) {
      console.error('Delete file error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete file'
      })
    }
  })

  // Optimize image
  fastify.post('/assets/:fileId/optimize', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.params as { fileId: string }
      
      const success = await s3FileService.optimizeImage(params.fileId)

      if (!success) {
        return reply.status(400).send({
          success: false,
          error: 'Image optimization failed or file is not an image'
        })
      }

      return reply.send({
        success: true,
        message: 'Image optimized successfully'
      })

    } catch (error: any) {
      console.error('Optimize image error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to optimize image'
      })
    }
  })

  // Parse PDF
  fastify.post('/assets/:fileId/parse', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.params as { fileId: string }
      
      const result = await s3FileService.parsePdf(params.fileId)

      if (!result) {
        return reply.status(400).send({
          success: false,
          error: 'PDF parsing failed or file is not a PDF'
        })
      }

      return reply.send({
        success: true,
        data: result
      })

    } catch (error: any) {
      console.error('Parse PDF error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to parse PDF'
      })
    }
  })
}
