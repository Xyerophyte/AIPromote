import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

export function verifyAuth(request: NextRequest): AuthenticatedUser {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('No authentication token provided', 401)
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthenticatedUser
  } catch (error) {
    throw new AuthError('Invalid authentication token', 401)
  }
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

export function createErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Validation error',
        details: (error as any).errors 
      },
      { status: 400 }
    )
  }

  console.error('API Error:', error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
