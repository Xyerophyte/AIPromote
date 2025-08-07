import { KVCache, CacheKeys } from './kv'
import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  message?: string
}

export class RateLimiter {
  private options: Required<RateLimitOptions>

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options,
    }
  }

  async checkLimit(identifier: string, endpoint: string = 'default'): Promise<RateLimitResult> {
    const key = CacheKeys.rateLimit(identifier, endpoint)
    const windowStart = Date.now()
    const windowEnd = windowStart + this.options.windowMs

    try {
      // Get current count
      const currentCount = await KVCache.get<number>(key) || 0

      if (currentCount >= this.options.max) {
        return {
          success: false,
          limit: this.options.max,
          remaining: 0,
          reset: new Date(windowEnd),
          message: this.options.message,
        }
      }

      // Increment count
      const newCount = await KVCache.incr(key)
      
      // Set expiration on first request
      if (newCount === 1) {
        await KVCache.expire(key, Math.ceil(this.options.windowMs / 1000))
      }

      return {
        success: true,
        limit: this.options.max,
        remaining: Math.max(0, this.options.max - newCount),
        reset: new Date(windowEnd),
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return {
        success: true,
        limit: this.options.max,
        remaining: this.options.max - 1,
        reset: new Date(windowEnd),
      }
    }
  }

  createMiddleware() {
    return async (request: NextRequest) => {
      const identifier = this.getIdentifier(request)
      const endpoint = this.getEndpoint(request)
      
      const result = await this.checkLimit(identifier, endpoint)

      if (!result.success) {
        const response = NextResponse.json(
          { 
            error: result.message,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset.toISOString(),
          },
          { status: 429 }
        )

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset.getTime() / 1000).toString())
        response.headers.set('Retry-After', Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString())

        return response
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset.getTime() / 1000).toString())

      return response
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get user ID from session/token
    const userId = request.headers.get('x-user-id')
    if (userId) {
      return `user:${userId}`
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0].trim() || request.ip || 'unknown'
    return `ip:${ip}`
  }

  private getEndpoint(request: NextRequest): string {
    const url = new URL(request.url)
    return url.pathname.replace(/\/$/, '') || '/'
  }
}

// Predefined rate limiters for common use cases
export const CommonRateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
  }),

  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Password reset rate limiting
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset requests, please try again later.',
  }),

  // File upload rate limiting
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads, please try again later.',
  }),

  // Email sending rate limiting
  email: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour
    message: 'Too many emails sent, please try again later.',
  }),
} as const

// Utility function to apply rate limiting to API routes
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse> | NextResponse,
  rateLimiter: RateLimiter = CommonRateLimiters.api
) {
  return async (request: T): Promise<NextResponse> => {
    const middleware = rateLimiter.createMiddleware()
    const rateLimitResponse = await middleware(request)

    // If rate limit exceeded, return the rate limit response
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse
    }

    // Otherwise, proceed with the original handler
    return await handler(request)
  }
}
