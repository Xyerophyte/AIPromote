import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function authRoutes(fastify: FastifyInstance) {
  // User registration with email verification
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body as any

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.code(409).send({
          error: 'User already exists'
        })
      }

      // Hash password if not already hashed
      const hashedPassword = password.startsWith('$2') ? password : await bcrypt.hash(password, 12)

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Create new user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          role: 'USER',
          plan: 'free',
          emailVerificationToken,
          emailVerificationExpiry,
          verified: false
        }
      })

      // Send verification email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${emailVerificationToken}`
          
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify your AIPromote account',
            html: `
              <h1>Welcome to AIPromote!</h1>
              <p>Hi ${name},</p>
              <p>Thank you for signing up for AIPromote. Please verify your email address by clicking the link below:</p>
              <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
              <p>Best regards,<br>The AIPromote Team</p>
            `
          })
        } catch (emailError) {
          fastify.log.error('Failed to send verification email:', emailError)
        }
      }

      // Return user without password
      const { passwordHash: _, emailVerificationToken: __, ...userResponse } = user
      return reply.code(201).send(userResponse)
    } catch (error) {
      fastify.log.error('Registration error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // User signin
  fastify.post('/signin', async (request, reply) => {
    try {
      const { email, password } = request.body as any

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(401).send({
          error: 'Invalid credentials'
        })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash || '')
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials'
        })
      }

      // Generate JWT token
      const token = fastify.jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        { expiresIn: '24h' }
      )

      // Return user without password and include token
      const { passwordHash: _, ...userResponse } = user
      return reply.send({
        user: userResponse,
        token,
        expiresIn: '24h'
      })
    } catch (error) {
      fastify.log.error('Signin error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // OAuth user creation/update
  fastify.post('/oauth', async (request, reply) => {
    try {
      const { provider, providerId, email, name, image } = request.body as any

      let user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { email },
          data: {
            name: name || user.name,
            image: image || user.image,
            verified: true // OAuth users are considered verified
          }
        })
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name,
            image,
            role: 'USER',
            plan: 'free',
            verified: true // OAuth users are considered verified
          }
        })
      }

      // Return user without password
      const { passwordHash: _, ...userResponse } = user
      return reply.send(userResponse)
    } catch (error) {
      fastify.log.error('OAuth error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Email verification
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const { token } = request.body as any

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiry: {
            gte: new Date()
          }
        }
      })

      if (!user) {
        return reply.code(400).send({
          error: 'Invalid or expired verification token'
        })
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

      return reply.send({
        message: 'Email verified successfully'
      })
    } catch (error) {
      fastify.log.error('Email verification error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Forgot password
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const { email } = request.body as any

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        // Don't reveal if user exists - but still return success
        return reply.send({
          message: 'If an account exists, a password reset email will be sent'
        })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store reset token in database
      await prisma.user.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry
        }
      })

      // Send reset email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
          
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
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
          fastify.log.error('Failed to send reset email:', emailError)
        }
      }

      return reply.send({
        message: 'If an account exists, a password reset email will be sent'
      })
    } catch (error) {
      fastify.log.error('Forgot password error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Reset password
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const { token, password } = request.body as any

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gte: new Date()
          }
        }
      })

      if (!user) {
        return reply.code(400).send({
          error: 'Invalid or expired reset token'
        })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Update user password and clear reset tokens
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      })

      return reply.send({
        message: 'Password reset successfully'
      })
    } catch (error) {
      fastify.log.error('Reset password error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Get user by ID (for session management)
  fastify.get('/user/:id', async (request, reply) => {
    try {
      const { id } = request.params as any

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
        return reply.code(404).send({
          error: 'User not found'
        })
      }

      return reply.send(user)
    } catch (error) {
      fastify.log.error('Get user error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Resend verification email
  fastify.post('/resend-verification', async (request, reply) => {
    try {
      const { email } = request.body as any

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(404).send({
          error: 'User not found'
        })
      }

      if (user.verified) {
        return reply.code(400).send({
          error: 'Email already verified'
        })
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.user.update({
        where: { email },
        data: {
          emailVerificationToken,
          emailVerificationExpiry
        }
      })

      // Send verification email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${emailVerificationToken}`
          
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify your AIPromote account',
            html: `
              <h1>Email Verification</h1>
              <p>Hi ${user.name},</p>
              <p>Please verify your email address by clicking the link below:</p>
              <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The AIPromote Team</p>
            `
          })
        } catch (emailError) {
          fastify.log.error('Failed to send verification email:', emailError)
        }
      }

      return reply.send({
        message: 'Verification email sent'
      })
    } catch (error) {
      fastify.log.error('Resend verification error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })
}
