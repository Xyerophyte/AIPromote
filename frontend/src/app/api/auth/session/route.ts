import { NextRequest, NextResponse } from 'next/server'

// Simple session endpoint to prevent 404 errors
export async function GET(request: NextRequest) {
  // Return a mock session for development
  const mockSession = {
    user: {
      id: 'dev-user',
      email: 'dev@example.com',
      name: 'Development User'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  }

  return NextResponse.json(mockSession, { status: 200 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Session endpoint' }, { status: 200 })
}
