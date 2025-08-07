import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { generateToken } from '@/lib/auth-helpers'
import { withErrorHandling, ConflictError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

async function signinHandler(request: NextRequest) {
  const body = SigninSchema.parse(await request.json())

  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (!user) {
    throw new ConflictError('Invalid credentials')
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(body.password, user.password)
  if (!isValidPassword) {
    throw new ConflictError('Invalid credentials')
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    verified: user.verified
  })

  // Return user without password and include token
  const { password: _, ...userResponse } = user
  return NextResponse.json({
    success: true,
    data: {
      user: userResponse,
      token,
      expiresIn: '24h'
    }
  })
}

export const POST = withRateLimit(
  withErrorHandling(signinHandler),
  CommonRateLimiters.auth
)
