import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { withErrorHandling, NotFoundError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
})

async function resetPasswordHandler(request: NextRequest) {
  const body = ResetPasswordSchema.parse(await request.json())

  const user = await prisma.user.findFirst({
    where: {
      resetToken: body.token,
      resetTokenExpiry: {
        gte: new Date()
      }
    }
  })

  if (!user) {
    throw new NotFoundError('Invalid or expired reset token')
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(body.password, 12)

  // Update user password and clear reset tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully'
  })
}

export const POST = withRateLimit(
  withErrorHandling(resetPasswordHandler),
  CommonRateLimiters.auth
)
