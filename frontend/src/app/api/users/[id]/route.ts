import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser, requireRole } from '@/lib/auth-helpers'
import { withErrorHandling, NotFoundError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

// GET /api/users/[id] - Get user by ID
async function getUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getAuthenticatedUser(request)
  const { id } = params

  // Users can only access their own profile unless they're admin
  if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
    requireRole(currentUser, 'ADMIN')
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      plan: true,
      verified: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return NextResponse.json({
    success: true,
    data: user
  })
}

// PATCH /api/users/[id] - Update user
async function updateUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getAuthenticatedUser(request)
  const { id } = params

  // Users can only update their own profile unless they're admin
  if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
    requireRole(currentUser, 'ADMIN')
  }

  const body = UpdateUserSchema.parse(await request.json())

  const updatedUser = await prisma.user.update({
    where: { id },
    data: body,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      plan: true,
      verified: true,
      updatedAt: true
    }
  })

  return NextResponse.json({
    success: true,
    data: updatedUser
  })
}

export const GET = withRateLimit(
  withErrorHandling(getUserHandler),
  CommonRateLimiters.api
)

export const PATCH = withRateLimit(
  withErrorHandling(updateUserHandler),
  CommonRateLimiters.api
)
