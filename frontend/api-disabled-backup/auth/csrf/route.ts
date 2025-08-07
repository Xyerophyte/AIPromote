import { NextRequest, NextResponse } from 'next/server'

// Mock CSRF token endpoint for development
export async function GET(request: NextRequest) {
  const mockCsrfToken = {
    csrfToken: `dev-csrf-token-${Date.now()}`
  }

  console.log('🔧 Mock CSRF endpoint called')
  
  return NextResponse.json(mockCsrfToken, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
