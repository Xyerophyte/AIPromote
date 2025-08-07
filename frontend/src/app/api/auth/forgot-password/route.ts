import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'
import { withErrorHandling } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()

// Email transporter setup - only create if needed
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const ForgotPasswordSchema = z.object({
  email: z.string().email()
})

async function forgotPasswordHandler(request: NextRequest) {
  const body = ForgotPasswordSchema.parse(await request.json())

  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  // Always return success to avoid email enumeration
  const successResponse = NextResponse.json({
    success: true,
    message: 'If an account exists, a password reset email will be sent'
  })

  if (!user) {
    return successResponse
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store reset token in database
  await prisma.user.update({
    where: { email: body.email },
    data: {
      resetToken,
      resetTokenExpiry
    }
  })

  // Send reset email
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = createTransporter()
      if (!transporter) {
        console.error('Could not create email transporter')
        return successResponse
      }

      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
      
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: body.email,
        subject: 'Reset your AIPromote password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The AIPromote Team</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
    }
  }

  return successResponse
}

export const POST = withRateLimit(
  withErrorHandling(forgotPasswordHandler),
  CommonRateLimiters.passwordReset
)
