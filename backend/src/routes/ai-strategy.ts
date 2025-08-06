import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiStrategyService } from '../services/ai-strategy';
import { toneAnalysisService } from '../services/tone-analysis';
import { contentPillarService } from '../services/content-pillars';
import { audienceAnalysisService } from '../services/audience-analysis';
import { brandSafetyService } from '../services/brand-safety';
import { AIProviderError, StrategyGenerationError, ValidationError } from '../utils/errors';

// Request schemas
const GenerateStrategySchema = z.object({
  organizationId: z.string(),
  preferences: z.object({
    tone: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    focusAreas: z.array(z.string()).optional(),
    brandSafety: z.boolean().optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const CompareStrategiesSchema = z.object({
  strategy1Id: z.string(),
  strategy2Id: z.string(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const ToneAnalysisSchema = z.object({
  content: z.string(),
  context: z.object({
    platform: z.string().optional(),
    contentType: z.string().optional(),
    targetAudience: z.string().optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const BrandVoiceGenerationSchema = z.object({
  organizationId: z.string(),
  existingContent: z.array(z.string()).optional(),
  desiredTone: z.string().optional(),
  brandPersonality: z.array(z.string()).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const ContentPillarAnalysisSchema = z.object({
  organizationId: z.string(),
  existingContent: z.array(z.object({
    platform: z.string(),
    content: z.string(),
    engagement: z.number().optional(),
    impressions: z.number().optional(),
  })).optional(),
  competitors: z.array(z.object({
    name: z.string(),
    contentExamples: z.array(z.string()),
  })).optional(),
  preferences: z.object({
    pillarsCount: z.number().min(3).max(7).optional(),
    focusAreas: z.array(z.string()).optional(),
    avoidTopics: z.array(z.string()).optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const AudienceAnalysisSchema = z.object({
  organizationId: z.string(),
  existingCustomerData: z.object({
    demographics: z.object({
      age: z.object({ min: z.number(), max: z.number() }).optional(),
      locations: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      jobTitles: z.array(z.string()).optional(),
      companySize: z.array(z.string()).optional(),
    }).optional(),
    behaviors: z.object({
      platforms: z.array(z.string()).optional(),
      contentTypes: z.array(z.string()).optional(),
      engagementTimes: z.array(z.string()).optional(),
    }).optional(),
    feedback: z.array(z.string()).optional(),
  }).optional(),
  competitorAudience: z.array(z.object({
    competitor: z.string(),
    audienceInsights: z.array(z.string()),
  })).optional(),
  marketResearch: z.object({
    industryTrends: z.array(z.string()).optional(),
    painPoints: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

const ContentSafetyCheckSchema = z.object({
  content: z.string(),
  platform: z.string().optional(),
  contentType: z.string().optional(),
  targetAudience: z.string().optional(),
  metadata: z.object({
    title: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
  }).optional(),
  organizationId: z.string(),
});

async function aiStrategyRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  // Helper function to get organization data
  async function getOrganizationData(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        founders: true,
      }
    });

    if (!organization) {
      throw new ValidationError('Organization not found', 'organizationId', organizationId);
    }

    return {
      id: organization.id,
      name: organization.name,
      url: organization.url,
      stage: organization.stage,
      pricing: organization.pricing,
      description: organization.description,
      tagline: organization.tagline,
      category: organization.category,
      markets: organization.markets,
      languages: organization.languages,
      founders: organization.founders.map(f => ({
        id: f.id,
        name: f.name,
        role: f.role,
        bio: f.bio,
        linkedinUrl: f.linkedinUrl,
        twitterHandle: f.twitterHandle,
      }))
    };
  }

  // Generate AI Strategy
  fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = GenerateStrategySchema.parse(request.body);
      
      const organizationData = await getOrganizationData(body.organizationId);
      
      // Get previous strategies for context
      const previousStrategies = await prisma.aIStrategy.findMany({
        where: { organizationId: body.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          positioning: true,
          audienceSegments: true,
          contentPillars: true,
          channelPlan: true,
        }
      });

      const strategy = await aiStrategyService.generateStrategy({
        organization: organizationData,
        preferences: body.preferences,
        previousStrategies: previousStrategies.length > 0 ? previousStrategies : undefined,
      }, body.provider);

      // Save to database
      const savedStrategy = await prisma.aIStrategy.create({
        data: {
          organizationId: body.organizationId,
          version: previousStrategies.length + 1,
          status: 'PROPOSED',
          positioning: strategy.positioning,
          audienceSegments: strategy.audienceSegments,
          contentPillars: strategy.contentPillars,
          channelPlan: strategy.channelPlan,
          cadence: strategy.cadence,
          calendarSkeleton: strategy.calendarSkeleton,
          generatedBy: strategy.generatedBy,
          confidence: strategy.confidence,
        }
      });

      reply.status(201).send({
        success: true,
        data: {
          id: savedStrategy.id,
          ...strategy,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else if (error instanceof ValidationError || error instanceof StrategyGenerationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else if (error instanceof AIProviderError) {
        reply.status(502).send({
          success: false,
          error: 'AI provider error',
          details: error.message,
          retryable: error.retryable
        });
      } else {
        console.error('Strategy generation error:', error);
        reply.status(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  // Compare strategies
  fastify.post('/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CompareStrategiesSchema.parse(request.body);

      const [strategy1, strategy2] = await Promise.all([
        prisma.aIStrategy.findUnique({ where: { id: body.strategy1Id } }),
        prisma.aIStrategy.findUnique({ where: { id: body.strategy2Id } })
      ]);

      if (!strategy1 || !strategy2) {
        return reply.status(404).send({
          success: false,
          error: 'One or more strategies not found'
        });
      }

      const comparison = await aiStrategyService.compareStrategies(
        {
          positioning: strategy1.positioning,
          audienceSegments: strategy1.audienceSegments,
          contentPillars: strategy1.contentPillars,
          channelPlan: strategy1.channelPlan,
        },
        {
          positioning: strategy2.positioning,
          audienceSegments: strategy2.audienceSegments,
          contentPillars: strategy2.contentPillars,
          channelPlan: strategy2.channelPlan,
        },
        body.provider
      );

      reply.send({
        success: true,
        data: comparison
      });
    } catch (error) {
      console.error('Strategy comparison error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to compare strategies'
      });
    }
  });

  // Analyze tone
  fastify.post('/tone/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ToneAnalysisSchema.parse(request.body);

      const analysis = await toneAnalysisService.analyzeTone({
        content: body.content,
        context: body.context,
      }, body.provider);

      reply.send({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Tone analysis error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to analyze tone'
      });
    }
  });

  // Generate brand voice
  fastify.post('/brand-voice/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = BrandVoiceGenerationSchema.parse(request.body);
      
      const organizationData = await getOrganizationData(body.organizationId);

      const brandVoice = await toneAnalysisService.generateBrandVoice({
        organizationData: {
          name: organizationData.name,
          description: organizationData.description,
          category: organizationData.category,
          targetMarkets: organizationData.markets,
          founders: organizationData.founders.map(f => ({
            name: f.name,
            role: f.role,
            bio: f.bio,
          }))
        },
        existingContent: body.existingContent,
        desiredTone: body.desiredTone,
        brandPersonality: body.brandPersonality,
      }, body.provider);

      reply.send({
        success: true,
        data: brandVoice
      });
    } catch (error) {
      console.error('Brand voice generation error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to generate brand voice'
      });
    }
  });

  // Identify content pillars
  fastify.post('/content-pillars/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ContentPillarAnalysisSchema.parse(request.body);
      
      const organizationData = await getOrganizationData(body.organizationId);

      const pillarAnalysis = await contentPillarService.identifyPillars({
        organization: organizationData,
        existingContent: body.existingContent,
        competitors: body.competitors,
        preferences: body.preferences,
      }, body.provider);

      reply.send({
        success: true,
        data: pillarAnalysis
      });
    } catch (error) {
      console.error('Content pillar analysis error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to analyze content pillars'
      });
    }
  });

  // Analyze target audience
  fastify.post('/audience/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = AudienceAnalysisSchema.parse(request.body);
      
      const organizationData = await getOrganizationData(body.organizationId);

      const audienceAnalysis = await audienceAnalysisService.analyzeAudience({
        organization: organizationData,
        existingCustomerData: body.existingCustomerData,
        competitorAudience: body.competitorAudience,
        marketResearch: body.marketResearch,
      }, body.provider);

      reply.send({
        success: true,
        data: audienceAnalysis
      });
    } catch (error) {
      console.error('Audience analysis error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to analyze audience'
      });
    }
  });

  // Check content safety
  fastify.post('/safety/check', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ContentSafetyCheckSchema.parse(request.body);

      // Get brand safety rules for the organization
      const brandRules = await prisma.brandRule.findUnique({
        where: { organizationId: body.organizationId }
      });

      if (!brandRules) {
        return reply.status(404).send({
          success: false,
          error: 'Brand safety rules not found for this organization'
        });
      }

      // Convert Prisma model to expected format
      const safetyRules = {
        id: brandRules.id,
        organizationId: brandRules.organizationId,
        name: 'Brand Safety Rules',
        description: 'Organization brand safety and compliance rules',
        rules: {
          content: {
            allowedTopics: brandRules.allowedPhrases,
            forbiddenTopics: brandRules.forbiddenPhrases,
            allowedPhrases: brandRules.allowedPhrases,
            forbiddenPhrases: brandRules.forbiddenPhrases,
            sensitiveTerms: brandRules.claimsToAvoid,
          },
          tone: {
            allowedTones: [brandRules.tone || 'professional'],
            forbiddenTones: [],
            brandVoice: brandRules.voice || 'professional',
            formality: 'neutral' as const,
          },
          legal: {
            claimsToAvoid: brandRules.claimsToAvoid,
            requiredDisclosures: brandRules.legalDisclaimer ? [brandRules.legalDisclaimer] : [],
            complianceNotes: brandRules.complianceNotes ? [brandRules.complianceNotes] : [],
            industryRegulations: [],
          },
          social: {
            platformSpecificRules: {},
            targetAudienceConsiderations: [],
          },
          quality: {
            minimumReadabilityScore: 60,
            maxSentenceLength: 25,
            requiredElements: [],
            prohibitedElements: [],
          },
        },
        severity: {
          content: 'error' as const,
          tone: 'warning' as const,
          legal: 'error' as const,
          social: 'warning' as const,
          quality: 'info' as const,
        },
        autoApprove: {
          enabled: brandRules.approvalMode === 'AUTO',
          conditions: [],
          excludeConditions: [],
        },
        createdAt: brandRules.createdAt,
        updatedAt: brandRules.updatedAt,
      };

      const safetyCheck = await brandSafetyService.checkContentSafety({
        content: body.content,
        platform: body.platform,
        contentType: body.contentType,
        targetAudience: body.targetAudience,
        metadata: body.metadata,
      }, safetyRules);

      reply.send({
        success: true,
        data: safetyCheck
      });
    } catch (error) {
      console.error('Content safety check error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to check content safety'
      });
    }
  });

  // Get strategy versions
  fastify.get('/strategies/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        organizationId: z.string(),
      }).parse(request.params);

      const strategies = await prisma.aIStrategy.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          generatedBy: true,
          confidence: true,
          acceptedAt: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      reply.send({
        success: true,
        data: strategies
      });
    } catch (error) {
      console.error('Get strategies error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get strategies'
      });
    }
  });

  // Accept/activate a strategy
  fastify.patch('/strategies/:id/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        id: z.string(),
      }).parse(request.params);

      const strategy = await prisma.aIStrategy.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE',
          acceptedAt: new Date(),
        }
      });

      // Archive other strategies for the same organization
      await prisma.aIStrategy.updateMany({
        where: {
          organizationId: strategy.organizationId,
          id: { not: params.id },
          status: 'ACTIVE',
        },
        data: { status: 'ARCHIVED' }
      });

      reply.send({
        success: true,
        data: strategy
      });
    } catch (error) {
      console.error('Accept strategy error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to accept strategy'
      });
    }
  });
}

export { aiStrategyRoutes };
