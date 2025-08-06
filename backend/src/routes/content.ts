import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { contentGenerationService } from '../services/content-generation';
import { contentTemplatesService } from '../services/content-templates';
import { contentApprovalService } from '../services/content-approval';
import { contentLibraryService } from '../services/content-library';
import { hashtagResearchService } from '../services/hashtag-research';
import { mediaAttachmentService } from '../services/media-attachment';
import { ValidationError } from '../utils/errors';

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
});

const ApplyTemplateSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()),
  platform: z.string(),
  customizations: z.object({
    tone: z.string().optional(),
    style: z.object({
      useEmojis: z.boolean().optional(),
      useHashtags: z.boolean().optional(),
      useMentions: z.boolean().optional(),
      lineBreaksStyle: z.enum(['minimal', 'moderate', 'heavy']).optional(),
      capitalizationStyle: z.enum(['sentence', 'title', 'all_caps', 'mixed']).optional(),
    }).optional(),
  }).optional(),
});

const CreateApprovalRequestSchema = z.object({
  contentPieceId: z.string(),
  workflowId: z.string(),
  organizationId: z.string(),
  submitterId: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  deadline: z.string().transform((str) => new Date(str)).optional(),
  metadata: z.object({
    platform: z.string(),
    contentType: z.string(),
    requestReason: z.string().optional(),
    urgencyJustification: z.string().optional(),
  }),
});

const HashtagResearchSchema = z.object({
  organizationId: z.string(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']),
  content: z.string().optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  contentType: z.string().optional(),
  campaignType: z.enum(['awareness', 'engagement', 'conversion', 'growth']).optional(),
  competitors: z.array(z.string()).optional(),
  preferences: z.object({
    includeNiche: z.boolean().default(true),
    includeTrending: z.boolean().default(true),
    includeBranded: z.boolean().default(true),
    includeLocationBased: z.boolean().default(false),
    maxHashtagLength: z.number().optional(),
    minHashtagLength: z.number().optional(),
    excludeOverused: z.boolean().default(true),
  }).optional(),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

export async function contentRoutes(fastify: FastifyInstance) {
  // Content Generation Routes
  
  // Generate content using AI
  fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = GenerateContentSchema.parse(request.body);
      
      const generatedContent = await contentGenerationService.generateContent(body, body.provider);
      
      reply.status(201).send({
        success: true,
        data: generatedContent
      });
    } catch (error) {
      console.error('Content generation error:', error);
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else if (error instanceof ValidationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else {
        reply.status(500).send({
          success: false,
          error: 'Failed to generate content'
        });
      }
    }
  });

  // Generate content variations
  fastify.post('/variations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        originalContent: z.string(),
        platform: z.string(),
        variationTypes: z.array(z.string()),
        count: z.number().min(1).max(10).default(3),
        provider: z.enum(['openai', 'anthropic']).default('openai'),
      }).parse(request.body);

      const variations = await contentGenerationService.generateVariations(
        body.originalContent,
        body.platform,
        body.variationTypes,
        body.count,
        body.provider
      );

      reply.send({
        success: true,
        data: variations
      });
    } catch (error) {
      console.error('Content variations error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to generate variations'
      });
    }
  });

  // Validate content for platform
  fastify.post('/validate/:platform', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        platform: z.string(),
      }).parse(request.params);

      const body = z.object({
        content: z.string(),
      }).parse(request.body);

      const validation = contentGenerationService.validateContentForPlatform(
        body.content,
        params.platform
      );

      reply.send({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Content validation error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to validate content'
      });
    }
  });

  // Template Routes

  // Get templates
  fastify.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        category: z.string().optional(),
        platform: z.string().optional(),
        contentType: z.string().optional(),
        organizationId: z.string().optional(),
        isPublic: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      }).parse(request.query);

      const templates = await contentTemplatesService.getTemplates(query);

      reply.send({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Get templates error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get templates'
      });
    }
  });

  // Get template by ID
  fastify.get('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        id: z.string(),
      }).parse(request.params);

      const template = await contentTemplatesService.getTemplateById(params.id);
      
      if (!template) {
        return reply.status(404).send({
          success: false,
          error: 'Template not found'
        });
      }

      reply.send({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Get template error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get template'
      });
    }
  });

  // Apply template to generate content
  fastify.post('/templates/apply', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ApplyTemplateSchema.parse(request.body);

      const result = await contentTemplatesService.applyTemplate(body);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Apply template error:', error);
      if (error instanceof ValidationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else {
        reply.status(500).send({
          success: false,
          error: 'Failed to apply template'
        });
      }
    }
  });

  // Search templates
  fastify.get('/templates/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        q: z.string(),
        category: z.string().optional(),
        platform: z.string().optional(),
        organizationId: z.string().optional(),
      }).parse(request.query);

      const results = await contentTemplatesService.searchTemplates(query.q, {
        category: query.category,
        platform: query.platform,
        organizationId: query.organizationId,
      });

      reply.send({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Search templates error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search templates'
      });
    }
  });

  // Content Approval Routes

  // Create approval request
  fastify.post('/approval/request', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateApprovalRequestSchema.parse(request.body);

      const approvalRequest = await contentApprovalService.createApprovalRequest(body);

      reply.status(201).send({
        success: true,
        data: approvalRequest
      });
    } catch (error) {
      console.error('Create approval request error:', error);
      if (error instanceof ValidationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else {
        reply.status(500).send({
          success: false,
          error: 'Failed to create approval request'
        });
      }
    }
  });

  // Get approval requests
  fastify.get('/approval/requests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        organizationId: z.string(),
        status: z.string().optional(),
        assignedTo: z.string().optional(),
        priority: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }).parse(request.query);

      const results = await contentApprovalService.getApprovalRequests({
        organizationId: query.organizationId,
        status: query.status as any,
        assignedTo: query.assignedTo,
        priority: query.priority as any,
        page: query.page,
        limit: query.limit,
      });

      reply.send({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Get approval requests error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get approval requests'
      });
    }
  });

  // Content Library Routes

  // Search content library
  fastify.get('/library/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        organizationId: z.string(),
        q: z.string().optional(),
        type: z.array(z.string()).optional(),
        status: z.array(z.string()).optional(),
        platform: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        author: z.array(z.string()).optional(),
        sortBy: z.enum(['created', 'updated', 'title', 'performance', 'usage', 'relevance']).default('created'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).parse(request.query);

      const results = await contentLibraryService.searchItems({
        query: query.q,
        type: query.type,
        status: query.status,
        platform: query.platform,
        tags: query.tags,
        author: query.author,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit,
      });

      reply.send({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Search library error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search library'
      });
    }
  });

  // Get library analytics
  fastify.get('/library/analytics/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        organizationId: z.string(),
      }).parse(request.params);

      const query = z.object({
        start: z.string().transform((str) => new Date(str)).optional(),
        end: z.string().transform((str) => new Date(str)).optional(),
      }).parse(request.query);

      const dateRange = query.start && query.end ? { start: query.start, end: query.end } : undefined;
      const analytics = await contentLibraryService.getAnalytics(params.organizationId, dateRange);

      reply.send({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get library analytics error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get analytics'
      });
    }
  });

  // Hashtag Research Routes

  // Research hashtags
  fastify.post('/hashtags/research', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = HashtagResearchSchema.parse(request.body);

      const research = await hashtagResearchService.researchHashtags(body, body.provider);

      reply.send({
        success: true,
        data: research
      });
    } catch (error) {
      console.error('Hashtag research error:', error);
      if (error instanceof ValidationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else {
        reply.status(500).send({
          success: false,
          error: 'Failed to research hashtags'
        });
      }
    }
  });

  // Get hashtag analytics
  fastify.get('/hashtags/analytics/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        organizationId: z.string(),
      }).parse(request.params);

      const query = z.object({
        platform: z.string().optional(),
        start: z.string().transform((str) => new Date(str)).optional(),
        end: z.string().transform((str) => new Date(str)).optional(),
      }).parse(request.query);

      const dateRange = query.start && query.end ? { start: query.start, end: query.end } : undefined;
      const analytics = await hashtagResearchService.getHashtagAnalytics(
        params.organizationId,
        query.platform,
        dateRange
      );

      reply.send({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get hashtag analytics error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get hashtag analytics'
      });
    }
  });

  // Get trending hashtags
  fastify.get('/hashtags/trending', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        platform: z.string(),
        category: z.string().optional(),
        location: z.string().optional(),
        timeframe: z.enum(['24h', '7d', '30d']).default('24h'),
      }).parse(request.query);

      const trending = await hashtagResearchService.getTrendingHashtags(
        query.platform,
        query.category,
        query.location,
        query.timeframe
      );

      reply.send({
        success: true,
        data: trending
      });
    } catch (error) {
      console.error('Get trending hashtags error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get trending hashtags'
      });
    }
  });

  // Suggest hashtags for content
  fastify.post('/hashtags/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        content: z.string(),
        platform: z.string(),
        organizationId: z.string(),
        count: z.number().min(1).max(30).default(10),
        includePerformanceData: z.boolean().default(false),
      }).parse(request.body);

      const suggestions = await hashtagResearchService.suggestHashtagsForContent(
        body.content,
        body.platform,
        body.organizationId,
        {
          count: body.count,
          includePerformanceData: body.includePerformanceData,
        }
      );

      reply.send({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Suggest hashtags error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to suggest hashtags'
      });
    }
  });

  // Media Routes

  // Upload media
  fastify.post('/media/upload', {
    preHandler: async (request, reply) => {
      // Add multipart support here if needed
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // In a real implementation, you'd handle multipart file upload here
      // For now, this is a placeholder
      reply.status(501).send({
        success: false,
        error: 'Media upload not implemented in this example'
      });
    } catch (error) {
      console.error('Media upload error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to upload media'
      });
    }
  });

  // Validate media for platform
  fastify.post('/media/:mediaId/validate/:platform/:contentType', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        mediaId: z.string(),
        platform: z.string(),
        contentType: z.string(),
      }).parse(request.params);

      const validation = await mediaAttachmentService.validateForPlatform(
        params.mediaId,
        params.platform,
        params.contentType
      );

      reply.send({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Media validation error:', error);
      if (error instanceof ValidationError) {
        reply.status(400).send({
          success: false,
          error: error.message
        });
      } else {
        reply.status(500).send({
          success: false,
          error: 'Failed to validate media'
        });
      }
    }
  });

  // Platform information routes

  // Get platform rules
  fastify.get('/platforms/:platform/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        platform: z.string(),
      }).parse(request.params);

      const rules = contentGenerationService.getPlatformRules(params.platform);
      
      if (!rules) {
        return reply.status(404).send({
          success: false,
          error: 'Platform not supported'
        });
      }

      reply.send({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Get platform rules error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get platform rules'
      });
    }
  });

  // Get all supported platforms
  fastify.get('/platforms', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const platforms = contentGenerationService.getAllPlatforms();

      reply.send({
        success: true,
        data: platforms
      });
    } catch (error) {
      console.error('Get platforms error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get platforms'
      });
    }
  });

  // Get template categories
  fastify.get('/templates/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = contentTemplatesService.getTemplateCategories();

      reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get template categories error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get template categories'
      });
    }
  });
}

export { contentRoutes };
