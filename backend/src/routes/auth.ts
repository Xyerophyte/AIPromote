import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'

// Mock user database - In production, replace with actual database
const users = new Map<string, any>()
const resetTokens = new Map<string, any>()

export async function authRoutes(fastify: FastifyInstance) {
  // User registration
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body as any

      // Check if user already exists
      if (users.has(email)) {
        return reply.code(409).send({
          error: 'User already exists'
        })
      }

      // Create new user
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password, // Already hashed from frontend
        name,
        role: 'USER',
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      users.set(email, user)

      // Return user without password
      const { password: _, ...userResponse } = user
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

      const user = users.get(email)
      if (!user) {
        return reply.code(401).send({
          error: 'Invalid credentials'
        })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials'
        })
      }

      // Return user without password
      const { password: _, ...userResponse } = user
      return reply.send(userResponse)
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

      let user = users.get(email)
      
      if (user) {
        // Update existing user
        user.name = name || user.name
        user.image = image || user.image
        user.updatedAt = new Date()
        user.emailVerified = new Date() // OAuth users are considered verified
      } else {
        // Create new user
        user = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          name,
          image,
          role: 'USER',
          emailVerified: new Date(), // OAuth users are considered verified
          createdAt: new Date(),
          updatedAt: new Date()
        }
        users.set(email, user)
      }

      // Return user without password
      const { password: _, ...userResponse } = user
      return reply.send(userResponse)
    } catch (error) {
      fastify.log.error('OAuth error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })

  // Forgot password
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const { email, resetToken, resetTokenExpiry } = request.body as any

      const user = users.get(email)
      if (!user) {
        // Don't reveal if user exists
        return reply.code(404).send({
          error: 'User not found'
        })
      }

      // Store reset token
      resetTokens.set(resetToken, {
        email,
        expiry: resetTokenExpiry,
        used: false
      })

      // Update user with reset token (in production, store in database)
      user.resetToken = resetToken
      user.resetTokenExpiry = resetTokenExpiry
      user.updatedAt = new Date()

      return reply.send({
        message: 'Reset token stored successfully'
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

      const tokenData = resetTokens.get(token)
      if (!tokenData || tokenData.used) {
        return reply.code(400).send({
          error: 'Invalid or expired token'
        })
      }

      // Check if token is expired
      if (new Date() > new Date(tokenData.expiry)) {
        resetTokens.delete(token)
        return reply.code(400).send({
          error: 'Token has expired'
        })
      }

      const user = users.get(tokenData.email)
      if (!user) {
        return reply.code(404).send({
          error: 'User not found'
        })
      }

      // Update user password
      user.password = password // Already hashed from frontend
      user.resetToken = null
      user.resetTokenExpiry = null
      user.updatedAt = new Date()

      // Mark token as used
      tokenData.used = true

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

      // Find user by ID
      for (const [email, user] of users.entries()) {
        if (user.id === id) {
          const { password: _, ...userResponse } = user
          return reply.send(userResponse)
        }
      }

      return reply.code(404).send({
        error: 'User not found'
      })
    } catch (error) {
      fastify.log.error('Get user error:', error)
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })
}
