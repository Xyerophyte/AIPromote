// Example: How to integrate usage tracking into existing API routes
import { FastifyInstance } from 'fastify';
import { usageTrackingService } from '../services/usage-tracking';
import { UsageMetricType } from '@prisma/client';

export async function exampleUsageIntegration(fastify: FastifyInstance) {
  
  // Example 1: Content Generation Routes
  // Apply usage limiting middleware to content generation
  fastify.register(async function contentRoutes(fastify) {
    // Add usage limit check before content generation
    fastify.addHook('preHandler', 
      usageTrackingService.createUsageLimitMiddleware('POSTS_GENERATED', 1)
    );
    
    fastify.post('/content/generate', async (request: any, reply) => {
      try {
        // Your existing content generation logic
        const content = await generateContent(request.body);
        
        // Track usage after successful generation
        await request.trackUsage(1); // Provided by the middleware
        
        return { content, success: true };
      } catch (error) {
        reply.status(500).send({ error: 'Content generation failed' });
      }
    });
    
    // Bulk generation with dynamic quantity
    fastify.post('/content/generate-batch', async (request: any, reply) => {
      try {
        const { posts } = request.body;
        const quantity = posts.length;
        
        // Check if user can generate this many posts
        const usageCheck = await usageTrackingService.checkUsageLimit(
          request.user.id,
          'POSTS_GENERATED',
          quantity
        );
        
        if (!usageCheck.allowed) {
          return reply.status(429).send({
            error: 'Usage limit exceeded',
            details: {
              requested: quantity,
              current: usageCheck.current,
              limit: usageCheck.limit,
              remaining: usageCheck.remaining
            }
          });
        }
        
        // Generate batch content
        const generatedPosts = await generateBatchContent(posts);
        
        // Track actual usage
        await usageTrackingService.trackUsage(
          request.user.id,
          'POSTS_GENERATED',
          generatedPosts.length
        );
        
        return { posts: generatedPosts };
      } catch (error) {
        reply.status(500).send({ error: 'Batch generation failed' });
      }
    });
  });
  
  // Example 2: AI Strategy Routes
  fastify.register(async function strategyRoutes(fastify) {
    // Strategy generation endpoint with usage tracking
    fastify.post('/ai-strategy/generate', {
      preHandler: [
        fastify.authenticate,
        usageTrackingService.createUsageLimitMiddleware('STRATEGIES_GENERATED', 1)
      ]
    }, async (request: any, reply) => {
      try {
        const strategy = await generateStrategy(request.body);
        
        // Track strategy creation
        await request.trackUsage();
        
        return { strategy };
      } catch (error) {
        reply.status(500).send({ error: 'Strategy generation failed' });
      }
    });
  });
  
  // Example 3: Organization Management
  fastify.register(async function organizationRoutes(fastify) {
    fastify.post('/organizations', {
      preHandler: [
        fastify.authenticate,
        usageTrackingService.createUsageLimitMiddleware('ORGANIZATIONS_CREATED', 1)
      ]
    }, async (request: any, reply) => {
      try {
        const organization = await createOrganization(request.body, request.user.id);
        
        // Track organization creation
        await request.trackUsage();
        
        return { organization };
      } catch (error) {
        reply.status(500).send({ error: 'Organization creation failed' });
      }
    });
  });
  
  // Example 4: Feature Access Control
  fastify.register(async function premiumRoutes(fastify) {
    // Advanced analytics - requires Growth or Scale plan
    fastify.get('/analytics/advanced', {
      preHandler: [fastify.authenticate]
    }, async (request: any, reply) => {
      const hasAccess = await usageTrackingService.checkFeatureAccess(
        request.user.id,
        'advancedAnalytics'
      );
      
      if (!hasAccess) {
        return reply.status(403).send({
          error: 'Advanced analytics requires Growth or Scale plan',
          upgradeUrl: '/billing/plans'
        });
      }
      
      const analytics = await getAdvancedAnalytics(request.user.id);
      return { analytics };
    });
    
    // Custom integrations - requires Scale plan
    fastify.post('/integrations/custom', {
      preHandler: [fastify.authenticate]
    }, async (request: any, reply) => {
      const hasAccess = await usageTrackingService.checkFeatureAccess(
        request.user.id,
        'customIntegrations'
      );
      
      if (!hasAccess) {
        return reply.status(403).send({
          error: 'Custom integrations require Scale plan',
          upgradeUrl: '/billing/plans'
        });
      }
      
      const integration = await createCustomIntegration(request.body);
      return { integration };
    });
  });
  
  // Example 5: Usage-aware Response
  fastify.register(async function usageAwareRoutes(fastify) {
    fastify.get('/content/suggestions', {
      preHandler: [fastify.authenticate]
    }, async (request: any, reply) => {
      // Get user's current usage status
      const usage = await usageTrackingService.getUserUsage(request.user.id);
      
      const suggestions = await getContentSuggestions(request.user.id);
      
      // Include usage information in response
      return {
        suggestions,
        usage: {
          postsRemaining: Math.max(0, (usage.limits.postsPerMonth || 0) - usage.usage.postsGenerated),
          planName: usage.plan?.displayName,
          resetDate: usage.resetDate,
          isNearLimit: usage.usage.postsGenerated >= (usage.limits.postsPerMonth || 0) * 0.8
        }
      };
    });
  });
  
  // Example 6: Conditional Feature Availability
  fastify.register(async function conditionalRoutes(fastify) {
    fastify.get('/features/available', {
      preHandler: [fastify.authenticate]
    }, async (request: any, reply) => {
      const userId = request.user.id;
      const usage = await usageTrackingService.getUserUsage(userId);
      
      // Check feature availability
      const features = {
        canCreatePosts: usage.usage.postsGenerated < (usage.limits.postsPerMonth || 0),
        canCreateStrategy: usage.usage.strategiesGenerated < (usage.limits.strategies || 0),
        canCreateOrganization: usage.usage.organizationsCreated < (usage.limits.organizations || 1),
        hasAdvancedAnalytics: await usageTrackingService.checkFeatureAccess(userId, 'advancedAnalytics'),
        hasAutoScheduling: await usageTrackingService.checkFeatureAccess(userId, 'autoScheduling'),
        hasPrioritySupport: await usageTrackingService.checkFeatureAccess(userId, 'prioritySupport'),
        hasCustomIntegrations: await usageTrackingService.checkFeatureAccess(userId, 'customIntegrations'),
      };
      
      return { features, usage: usage.usage, limits: usage.limits };
    });
  });
}

// Mock functions for demonstration
async function generateContent(data: any) {
  // Your content generation logic
  return { id: '1', content: 'Generated content...' };
}

async function generateBatchContent(posts: any[]) {
  // Your batch content generation logic
  return posts.map((post, index) => ({ id: index + 1, ...post }));
}

async function generateStrategy(data: any) {
  // Your strategy generation logic
  return { id: '1', strategy: 'Generated strategy...' };
}

async function createOrganization(data: any, userId: string) {
  // Your organization creation logic
  return { id: '1', name: data.name, userId };
}

async function getAdvancedAnalytics(userId: string) {
  // Your advanced analytics logic
  return { userId, analytics: 'Advanced analytics data...' };
}

async function createCustomIntegration(data: any) {
  // Your custom integration logic
  return { id: '1', type: data.type, config: data.config };
}

async function getContentSuggestions(userId: string) {
  // Your content suggestions logic
  return [
    { id: '1', title: 'Suggestion 1' },
    { id: '2', title: 'Suggestion 2' },
  ];
}

// Usage tracking patterns summary:

/* 
1. MIDDLEWARE APPROACH:
   - Use createUsageLimitMiddleware for automatic checking and tracking
   - Best for single-action endpoints

2. MANUAL CHECKING:
   - Use checkUsageLimit for complex scenarios
   - Use trackUsage for manual tracking after success

3. FEATURE ACCESS:
   - Use checkFeatureAccess for plan-based feature gates
   - Return appropriate upgrade prompts

4. USAGE-AWARE RESPONSES:
   - Include usage information in API responses
   - Help frontend show usage meters and warnings

5. BULK OPERATIONS:
   - Check limits before processing
   - Track actual processed quantities
*/
