import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError } from './auth-helpers'

// Re-export AuthError for convenience
export { AuthError }

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests', public retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ServiceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message)
    this.name = 'ServiceError'
  }
}

/**
 * Handle errors and return appropriate Next.js response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation error',
      details: error.errors
    }, { status: 400 })
  }

  // Custom validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.details
    }, { status: 400 })
  }

  // Authentication errors
  if (error instanceof AuthError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: error.statusCode })
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 404 })
  }

  // Conflict errors
  if (error instanceof ConflictError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 409 })
  }

  // Rate limit errors
  if (error instanceof RateLimitError) {
    const response = NextResponse.json({
      success: false,
      error: error.message
    }, { status: 429 })

    if (error.retryAfter) {
      response.headers.set('Retry-After', error.retryAfter.toString())
    }

    return response
  }

  // Service errors (custom status codes)
  if (error instanceof ServiceError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: error.statusCode })
  }

  // Generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error'
    
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 })
  }

  // Unknown errors
  return NextResponse.json({
    success: false,
    error: 'Unknown error occurred'
  }, { status: 500 })
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
