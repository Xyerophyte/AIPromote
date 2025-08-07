import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser, requireVerified } from '@/lib/auth-helpers'
import { withErrorHandling, AuthError } from '@/lib/api-errors'
import { withRateLimit, RateLimiter } from '@/lib/rate-limit'
import { openAIService } from '@/lib/services/openai'
import { kvService } from '@/lib/services/kv'

const prisma = new PrismaClient()

// Content generation rate limiter (more restrictive due to AI costs)
const contentRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 content generations per hour
  message: 'Content generation limit exceeded. Please try again later.',
})

// Request schemas
const GenerateContentSchema = z.object({
  organizationId: z.string(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']),
  contentType: z.enum(['POST', 'THREAD', 'STORY', 'REEL', 'SHORT', 'CAROUSEL', 'POLL']),
  pillarId: z.string().optional(),
  seriesId: z.string().optional(),
  prompt: z.string().optional(),
  context: z.object({
    targetAudience: z.string().optional(),
    tone: z.string().optional(),
    objective: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    contentIdeas: z.array(z.string()).optional(),
    referencePosts: z.array(z.string()).optional(),
  }).optional(),
  variations: z.object({
    count: z.number().min(1).max(10).default(3),
    diversityLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  optimization: z.object({
    seo: z.boolean().default(true),
    engagement: z.boolean().default(true),
    conversion: z.boolean().default(false),
    brandSafety: z.boolean().default(true),
  }),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
})

async function generateContentHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  requireVerified(user)
  
  const body = GenerateContentSchema.parse(await request.json())
  
  // Verify user owns the organization
  const organization = await prisma.organization.findUnique({
    where: {
      id: body.organizationId,
      userId: user.id
    }
  })
  
  if (!organization) {
    throw new AuthError('Organization not found or access denied', 404)
  }
  
  // Generate content using OpenAI service (only OpenAI supported for now)
  if (body.provider !== 'openai') {
    throw new AuthError('Only OpenAI provider is currently supported', 400)
  }

  const generatedContent = await openAIService.generateContent({
    ...body,
    userId: user.id,
  })
  
  // Store the generated content in database
  await prisma.contentPiece.create({
    data: {
      organizationId: body.organizationId,
      title: `Generated ${body.contentType} for ${body.platform}`,
      content: JSON.stringify(generatedContent),
      platform: body.platform,
      contentType: body.contentType,
      status: 'DRAFT',
      pillarId: body.pillarId,
      seriesId: body.seriesId,
    }
  })
  
  return NextResponse.json({
    success: true,
    data: generatedContent
  }, { status: 201 })
}

export const POST = withRateLimit(
  withErrorHandling(generateContentHandler),
  contentRateLimiter
)
