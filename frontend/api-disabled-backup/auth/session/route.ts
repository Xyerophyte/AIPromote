import { NextRequest, NextResponse } from 'next/server'

// Mock session endpoint for development
export async function GET(request: NextRequest) {
  try {
    // Mock session data for development
    const mockSession = {
      user: {
        id: 'dev-user-1',
        email: 'demo@example.com',
        name: 'Development User',
        image: null,
        role: 'USER',
        emailVerified: new Date().toISOString(),
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }

    console.log('🔧 Mock session endpoint called, returning mock session data')
    
    return NextResponse.json(mockSession, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('❌ Session endpoint error:', error)
    
    return NextResponse.json(
      { 
        error: 'Session endpoint error',
        message: 'Failed to get session',
      }, 
      { status: 500 }
    )
  }
}

// Handle session updates
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Session updates not implemented in development mode' }, 
    { status: 200 }
  )
}

// Handle session deletion
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { message: 'Session deleted' }, 
    { status: 200 }
  )
}
