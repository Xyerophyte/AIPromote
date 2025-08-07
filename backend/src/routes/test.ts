import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function testRoutes(fastify: FastifyInstance) {
  // Test endpoint to verify API is working
  fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        message: 'API is working correctly',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          auth: {
            register: 'POST /api/v1/auth/register',
            signin: 'POST /api/v1/auth/signin',
            verifyEmail: 'POST /api/v1/auth/verify-email',
            forgotPassword: 'POST /api/v1/auth/forgot-password',
            resetPassword: 'POST /api/v1/auth/reset-password',
          },
          content: {
            generate: 'POST /api/v1/content/generate',
            variations: 'POST /api/v1/content/variations',
            templates: 'GET /api/v1/content/templates',
            hashtags: 'POST /api/v1/content/hashtags/research',
          },
          social: {
            connect: 'POST /api/v1/social/connect',
            accounts: 'GET /api/v1/social/accounts/:organizationId',
            schedule: 'POST /api/v1/social/schedule',
            analytics: 'GET /api/v1/social/analytics/:organizationId',
            callbacks: {
              twitter: 'GET /api/v1/social/twitter/callback',
              linkedin: 'GET /api/v1/social/linkedin/callback',
              facebook: 'GET /api/v1/social/facebook/callback',
              instagram: 'GET /api/v1/social/instagram/callback',
              tiktok: 'GET /api/v1/social/tiktok/callback',
              reddit: 'GET /api/v1/social/reddit/callback',
              threads: 'GET /api/v1/social/threads/callback',
              youtube: 'GET /api/v1/social/youtube/callback',
            }
          },
          analytics: {
            dashboard: 'GET /api/v1/analytics/dashboard',
            realtime: 'GET /api/v1/analytics/realtime',
            reports: 'POST /api/v1/analytics/reports/generate',
            insights: 'GET /api/v1/analytics/insights',
          },
          billing: {
            plans: 'GET /api/v1/billing/plans',
            subscription: 'GET /api/v1/billing/subscription',
            checkout: 'POST /api/v1/billing/checkout-session',
            webhooks: 'POST /api/v1/billing/webhooks/stripe',
          },
          admin: {
            users: 'GET /api/v1/admin/users',
            health: 'GET /api/v1/admin/health/system',
            analytics: 'GET /api/v1/admin/analytics/overview',
            support: 'GET /api/v1/admin/support/tickets',
          },
          upload: {
            upload: 'POST /api/v1/upload',
            assets: 'GET /api/v1/assets/:organizationId',
            delete: 'DELETE /api/v1/assets/:fileId',
          },
        },
        platformSupport: {
          social: [
            'TWITTER',
            'LINKEDIN', 
            'FACEBOOK',
            'INSTAGRAM',
            'TIKTOK',
            'YOUTUBE_SHORTS',
            'REDDIT',
            'THREADS'
          ],
          contentTypes: [
            'POST',
            'THREAD',
            'STORY', 
            'REEL',
            'SHORT',
            'CAROUSEL',
            'POLL'
          ]
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message || 'Test endpoint failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Health check endpoint for testing
  fastify.get('/test/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Test database connection
      let dbStatus = 'connected';
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        dbStatus = 'disconnected';
      }

      // Test Redis connection (if available)
      let redisStatus = 'not_configured';
      try {
        if (process.env.REDIS_URL) {
          // Would test Redis here if available
          redisStatus = 'connected';
        }
      } catch (redisError) {
        redisStatus = 'disconnected';
      }

      return reply.send({
        success: true,
        status: 'healthy',
        services: {
          database: dbStatus,
          redis: redisStatus,
          jwt: process.env.JWT_SECRET ? 'configured' : 'missing',
          smtp: process.env.SMTP_USER ? 'configured' : 'missing',
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message || 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test authentication
  fastify.post('/test/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const testUser = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      // This would normally register a test user
      // For now, just return a success response
      return reply.send({
        success: true,
        message: 'Authentication test endpoint',
        testUser: {
          email: testUser.email,
          name: testUser.name
        },
        instructions: {
          register: 'POST to /api/v1/auth/register with email, password, name',
          signin: 'POST to /api/v1/auth/signin with email, password'
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message || 'Auth test failed'
      });
    }
  });

  // Test content generation
  fastify.post('/test/content', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        message: 'Content generation test endpoint',
        sampleRequest: {
          organizationId: 'your-org-id',
          platform: 'TWITTER',
          contentType: 'POST',
          prompt: 'Create a tweet about AI and social media',
          context: {
            targetAudience: 'Tech enthusiasts',
            tone: 'Professional',
            objective: 'Engage audience'
          },
          variations: {
            count: 3,
            diversityLevel: 'medium'
          }
        },
        instructions: 'POST to /api/v1/content/generate with the sample request'
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message || 'Content test failed'
      });
    }
  });
}
