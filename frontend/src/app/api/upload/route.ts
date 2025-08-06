import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import pdfParse from 'pdf-parse'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'aipromote-assets'

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    if (file.type === 'application/pdf') {
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'misc'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Generate unique file key
    const fileKey = generateFileKey(file.name, type)
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
      ServerSideEncryption: 'AES256',
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        type: type,
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
    if (file.type === 'application/pdf' || file.type.includes('document') || file.type.includes('text')) {
      extractedText = await extractTextFromFile(file)
    }

    // TODO: Save file metadata to database
    // const fileRecord = await prisma.asset.create({
    //   data: {
    //     type: type,
    //     s3Key: fileKey,
    //     mime: file.type,
    //     size: file.size,
    //     startupId: startupId, // Get from auth context
    //   }
    // })

    return NextResponse.json({
      success: true,
      url: fileUrl,
      key: fileKey,
      extractedText,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get('key')

    if (!fileKey) {
      return NextResponse.json(
        { error: 'No file key provided' },
        { status: 400 }
      )
    }

    // Delete from S3
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }

    await s3Client.send(new PutObjectCommand(deleteParams))

    // TODO: Delete from database
    // await prisma.asset.delete({
    //   where: { s3Key: fileKey }
    // })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
