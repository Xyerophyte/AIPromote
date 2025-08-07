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

    const body = await request.json()

    // Validate required fields
    const { platform, contentType, context, variations, optimization } = body

    if (!platform || !contentType) {
      return NextResponse.json(
        { error: 'Platform and content type are required' },
        { status: 400 }
      )
    }

    // Call backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/v1/content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.id}`, // Use user ID as auth token for now
      },
      body: JSON.stringify({
        organizationId: session.user.id, // Use user ID as org ID for now
        platform,
        contentType,
        context: context || {},
        variations: variations || { count: 3, diversityLevel: 'medium' },
        optimization: optimization || { 
          seo: true, 
          engagement: true, 
          conversion: false, 
          brandSafety: true 
        },
        ...body
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Content generation failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
