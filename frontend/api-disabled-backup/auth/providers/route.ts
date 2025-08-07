import { NextRequest, NextResponse } from 'next/server'

// Mock providers endpoint for development
export async function GET(request: NextRequest) {
  const mockProviders = {
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      signinUrl: 'http://localhost:3002/api/auth/signin/credentials',
      callbackUrl: 'http://localhost:3002/api/auth/callback/credentials',
    }
  }

  console.log('🔧 Mock providers endpoint called')
  
  return NextResponse.json(mockProviders, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
