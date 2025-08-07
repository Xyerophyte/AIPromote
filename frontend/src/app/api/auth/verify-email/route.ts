import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { withErrorHandling, NotFoundError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const VerifyEmailSchema = z.object({
  token: z.string().min(1)
})

async function verifyEmailHandler(request: NextRequest) {
  const body = VerifyEmailSchema.parse(await request.json())

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: body.token,
      emailVerificationExpiry: {
        gte: new Date()
      }
    }
  })

  if (!user) {
    throw new NotFoundError('Invalid or expired verification token')
  }

  // Verify the user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Email verified successfully'
  })
}

export const POST = withRateLimit(
  withErrorHandling(verifyEmailHandler),
  CommonRateLimiters.auth
)
