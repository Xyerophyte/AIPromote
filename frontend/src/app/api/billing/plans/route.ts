import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withErrorHandling } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

// GET /api/billing/plans - Get all active subscription plans
async function getPlansHandler(request: NextRequest) {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return NextResponse.json({
    success: true,
    data: { plans }
  })
}

export const GET = withRateLimit(
  withErrorHandling(getPlansHandler),
  CommonRateLimiters.api
)
