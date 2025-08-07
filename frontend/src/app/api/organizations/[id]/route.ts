import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { withErrorHandling, NotFoundError, AuthError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional(),
})

async function verifyOrganizationOwnership(userId: string, organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { userId: true }
  })

  if (!organization) {
    throw new NotFoundError('Organization not found')
  }

  if (organization.userId !== userId) {
    throw new AuthError('You do not have permission to access this organization', 403)
  }
}

// GET /api/organizations/[id] - Get organization by ID
async function getOrganizationHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request)
  const { id } = params

  await verifyOrganizationOwnership(user.id, id)

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      contentPieces: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          platform: true,
          status: true,
          createdAt: true
        }
      },
      socialAccounts: {
        select: {
          id: true,
          platform: true,
          username: true,
          isActive: true
        }
      },
      _count: {
        select: {
          contentPieces: true,
          scheduledPosts: true,
          socialAccounts: true
        }
      }
    }
  })

  return NextResponse.json({
    success: true,
    data: organization
  })
}

// PATCH /api/organizations/[id] - Update organization
async function updateOrganizationHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request)
  const { id } = params

  await verifyOrganizationOwnership(user.id, id)

  const body = UpdateOrganizationSchema.parse(await request.json())

  const organization = await prisma.organization.update({
    where: { id },
    data: body,
    include: {
      _count: {
        select: {
          contentPieces: true,
          scheduledPosts: true,
          socialAccounts: true
        }
      }
    }
  })

  return NextResponse.json({
    success: true,
    data: organization
  })
}

// DELETE /api/organizations/[id] - Delete organization
async function deleteOrganizationHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request)
  const { id } = params

  await verifyOrganizationOwnership(user.id, id)

  // Note: In a production app, you might want to soft delete or archive
  // and handle cleanup of related resources
  await prisma.organization.delete({
    where: { id }
  })

  return NextResponse.json({
    success: true,
    message: 'Organization deleted successfully'
  })
}

export const GET = withRateLimit(
  withErrorHandling(getOrganizationHandler),
  CommonRateLimiters.api
)

export const PATCH = withRateLimit(
  withErrorHandling(updateOrganizationHandler),
  CommonRateLimiters.api
)

export const DELETE = withRateLimit(
  withErrorHandling(deleteOrganizationHandler),
  CommonRateLimiters.api
)
