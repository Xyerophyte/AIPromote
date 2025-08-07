import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { withErrorHandling, ConflictError } from '@/lib/api-errors'
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

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
})

async function registerHandler(request: NextRequest) {
  const body = RegisterSchema.parse(await request.json())

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    throw new ConflictError('User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(body.password, 12)

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex')
  const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create new user
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      name: body.name,
      role: 'USER',
      plan: 'FREE',
      emailVerificationToken,
      emailVerificationExpiry,
      verified: false
    }
  })

  // Send verification email
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = createTransporter()
      if (!transporter) {
        console.error('Could not create email transporter')
      } else {
        const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${emailVerificationToken}`
        
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: body.email,
          subject: 'Verify your AIPromote account',
          html: `
            <h1>Welcome to AIPromote!</h1>
            <p>Hi ${body.name},</p>
            <p>Thank you for signing up for AIPromote. Please verify your email address by clicking the link below:</p>
            <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The AIPromote Team</p>
          `
        })
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
    }
  }

  // Return user without password
  const { password: _, emailVerificationToken: __, ...userResponse } = user
  return NextResponse.json({
    success: true,
    data: userResponse
  }, { status: 201 })
}

export const POST = withRateLimit(
  withErrorHandling(registerHandler),
  CommonRateLimiters.auth
)
