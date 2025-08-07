import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  verified?: boolean
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Extract and verify JWT token from request
 */
export function verifyToken(request: NextRequest): AuthenticatedUser {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('No authentication token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified
    }
  } catch (error) {
    throw new AuthError('Invalid or expired token')
  }
}

/**
 * Get user from database and verify they exist
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  const user = verifyToken(request)
  
  // Verify user still exists and get latest data
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      verified: true,
    }
  })

  if (!dbUser) {
    throw new AuthError('User not found', 404)
  }

  return dbUser
}

/**
 * Require specific role(s)
 */
export function requireRole(user: AuthenticatedUser, roles: string | string[]): void {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403)
  }
}

/**
 * Require user to be verified
 */
export function requireVerified(user: AuthenticatedUser): void {
  if (!user.verified) {
    throw new AuthError('Email verification required', 403)
  }
}

/**
 * Generate JWT token
 */
export function generateToken(user: { id: string; email: string; role: string; verified?: boolean }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  )
}

/**
 * Get user ID from optional auth (for public endpoints that support auth)
 */
export function getOptionalUserId(request: NextRequest): string | null {
  try {
    const user = verifyToken(request)
    return user.id
  } catch {
    return null
  }
}
