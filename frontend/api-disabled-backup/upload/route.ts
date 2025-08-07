import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const organizationId = formData.get('organizationId') as string || session.user.id
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create new FormData for backend
    const backendFormData = new FormData()
    const blob = new Blob([buffer], { type: file.type })
    backendFormData.append('file', blob, file.name)
    backendFormData.append('userId', session.user.id)
    backendFormData.append('organizationId', organizationId)

    // Call backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user.id}`,
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      return NextResponse.json(
        { error: errorData.error || 'Upload failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
