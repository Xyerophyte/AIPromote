import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser, requireVerified } from '@/lib/auth-helpers'
import { withErrorHandling } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional(),
})

const OrganizationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
})

// GET /api/organizations - Get user's organizations
async function getOrganizationsHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  const { searchParams } = new URL(request.url)
  const query = OrganizationQuerySchema.parse(Object.fromEntries(searchParams))

  const where: any = { userId: user.id }
  
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ]
  }

  const [organizations, totalCount] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            contentPieces: true,
            scheduledPosts: true,
            socialAccounts: true
          }
        }
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.organization.count({ where })
  ])

  return NextResponse.json({
    success: true,
    data: {
      organizations,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / query.limit)
      }
    }
  })
}

// POST /api/organizations - Create new organization
async function createOrganizationHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  requireVerified(user)

  const body = CreateOrganizationSchema.parse(await request.json())

  const organization = await prisma.organization.create({
    data: {
      ...body,
      userId: user.id
    },
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
  }, { status: 201 })
}

export const GET = withRateLimit(
  withErrorHandling(getOrganizationsHandler),
  CommonRateLimiters.api
)

export const POST = withRateLimit(
  withErrorHandling(createOrganizationHandler),
  CommonRateLimiters.api
)
