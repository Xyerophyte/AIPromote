import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, Platform } from '@prisma/client';
import { TwitterService } from '../services/twitter-api';
import { LinkedInService } from '../services/linkedin-api';
import { SocialMediaPublisher } from '../services/social-media-publisher';
import { AnalyticsCollector } from '../services/analytics-collector';
import { encrypt, generateToken, verifyWebhookSignature } from '../utils/encryption';
import { z } from 'zod';

// Request schemas
const connectAccountSchema = z.object({
  platform: z.enum(['TWITTER', 'LINKEDIN']),
  organizationId: z.string(),
});

const schedulePostSchema = z.object({
  contentPieceId: z.string(),
  socialAccountId: z.string(),
  scheduledAt: z.string().transform((val) => new Date(val)),
});

const crossPostSchema = z.object({
  contentPieceId: z.string(),
  platformSchedules: z.array(z.object({
    platform: z.enum(['TWITTER', 'LINKEDIN']),
    socialAccountId: z.string(),
    scheduledAt: z.string().transform((val) => new Date(val)),
  })),
});

const webhookSchema = z.object({
  platform: z.enum(['TWITTER', 'LINKEDIN']),
  event: z.string(),
  data: z.any(),
});

export async function socialMediaRoutes(fastify: FastifyInstance) {
  const prisma: PrismaClient = fastify.prisma;
  const publisher = new SocialMediaPublisher(prisma);
  const analyticsCollector = new AnalyticsCollector(prisma);

  // Store OAuth states temporarily (in production, use Redis)
  const oauthStates = new Map<string, { 
    organizationId: string; 
    platform: Platform; 
    codeVerifier?: string; 
    createdAt: Date 
  }>();

  // Clean up expired OAuth states
  setInterval(() => {
    const now = Date.now();
    for (const [state, data] of oauthStates.entries()) {
      if (now - data.createdAt.getTime() > 10 * 60 * 1000) { // 10 minutes
        oauthStates.delete(state);
      }
    }
  }, 5 * 60 * 1000); // Clean every 5 minutes

  /**
   * Get connected social accounts for an organization
   */
  fastify.get('/accounts/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };

      const socialAccounts = await prisma.socialAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          platform: true,
          handle: true,
          displayName: true,
          profileUrl: true,
          followersCount: true,
          followingCount: true,
          postsCount: true,
          lastSyncAt: true,
          errorMessage: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      reply.send({
        success: true,
        data: socialAccounts,
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Initiate OAuth connection for a platform
   */
  fastify.post('/connect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { platform, organizationId } = connectAccountSchema.parse(request.body);
      
      // Verify organization exists and user has access
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        // TODO: Add user authorization check
      });

      if (!organization) {
        return reply.status(404).send({
          success: false,
          error: 'Organization not found',
        });
      }

      const state = generateToken(32);
      let authUrl: string;
      let codeVerifier: string | undefined;

      if (platform === 'TWITTER') {
        const authData = TwitterService.generateAuthUrl();
        authUrl = authData.url;
        codeVerifier = authData.codeVerifier;
      } else if (platform === 'LINKEDIN') {
        authUrl = LinkedInService.generateAuthUrl(state);
      } else {
        return reply.status(400).send({
          success: false,
          error: 'Unsupported platform',
        });
      }

      // Store OAuth state
      oauthStates.set(state, {
        organizationId,
        platform: platform as Platform,
        codeVerifier,
        createdAt: new Date(),
      });

      reply.send({
        success: true,
        data: {
          authUrl,
          state,
        },
      });
    } catch (error: any) {
      reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Twitter OAuth callback
   */
  fastify.get('/twitter/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, state } = request.query as { code?: string; state?: string };

      if (!code || !state) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameters',
        });
      }

      const oauthData = oauthStates.get(state);
      if (!oauthData || oauthData.platform !== 'TWITTER') {
        return reply.status(400).send({
          success: false,
          error: 'Invalid OAuth state',
        });
      }

      // Exchange code for tokens
      const tokens = await TwitterService.exchangeCodeForTokens(code, oauthData.codeVerifier!);

      // Get user profile
      const twitterService = new TwitterService({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      const profile = await twitterService.getUserProfile();

      // Save social account
      const socialAccount = await prisma.socialAccount.create({
        data: {
          organizationId: oauthData.organizationId,
          platform: Platform.TWITTER,
          handle: profile.username || 'unknown',
          displayName: profile.name || 'Unknown User',
          profileUrl: profile.username ? `https://twitter.com/${profile.username}` : null,
          accountId: profile.id,
          accessTokenEncrypted: encrypt(tokens.accessToken),
          refreshTokenEncrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
          expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
          followersCount: profile.public_metrics?.followers_count || 0,
          followingCount: profile.public_metrics?.following_count || 0,
          postsCount: profile.public_metrics?.tweet_count || 0,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      oauthStates.delete(state);

      // Redirect to frontend with success
      reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social?connected=twitter&account=${socialAccount.id}`);
    } catch (error: any) {
      console.error('Twitter OAuth callback error:', error);
      reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social?error=${encodeURIComponent(error.message)}`);
    }
  });

  /**
   * LinkedIn OAuth callback
   */
  fastify.get('/linkedin/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, state } = request.query as { code?: string; state?: string };

      if (!code || !state) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameters',
        });
      }

      const oauthData = oauthStates.get(state);
      if (!oauthData || oauthData.platform !== 'LINKEDIN') {
        return reply.status(400).send({
          success: false,
          error: 'Invalid OAuth state',
        });
      }

      // Exchange code for tokens
      const tokens = await LinkedInService.exchangeCodeForTokens(code, state);

      // Get user profile
      const linkedinService = new LinkedInService({
        accessToken: tokens.accessToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      });
      const profile = await linkedinService.getProfile();

      // Save social account
      const socialAccount = await prisma.socialAccount.create({
        data: {
          organizationId: oauthData.organizationId,
          platform: Platform.LINKEDIN,
          handle: profile.vanityName || profile.id,
          displayName: `${profile.firstName} ${profile.lastName}`,
          profileUrl: profile.vanityName ? `https://www.linkedin.com/in/${profile.vanityName}` : null,
          accountId: profile.id,
          accessTokenEncrypted: encrypt(tokens.accessToken),
          refreshTokenEncrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
          expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      oauthStates.delete(state);

      // Redirect to frontend with success
      reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social?connected=linkedin&account=${socialAccount.id}`);
    } catch (error: any) {
      console.error('LinkedIn OAuth callback error:', error);
      reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social?error=${encodeURIComponent(error.message)}`);
    }
  });

  /**
   * Disconnect a social account
   */
  fastify.delete('/accounts/:accountId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { accountId } = request.params as { accountId: string };

      await prisma.socialAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      reply.send({
        success: true,
        message: 'Social account disconnected successfully',
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Schedule a post for publishing
   */
  fastify.post('/schedule', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { contentPieceId, socialAccountId, scheduledAt } = schedulePostSchema.parse(request.body);

      // Get content piece and social account
      const [contentPiece, socialAccount] = await Promise.all([
        prisma.contentPiece.findUnique({
          where: { id: contentPieceId },
          include: { organization: true },
        }),
        prisma.socialAccount.findUnique({
          where: { id: socialAccountId },
        }),
      ]);

      if (!contentPiece) {
        return reply.status(404).send({
          success: false,
          error: 'Content piece not found',
        });
      }

      if (!socialAccount) {
        return reply.status(404).send({
          success: false,
          error: 'Social account not found',
        });
      }

      const scheduledPostId = await publisher.schedulePost({
        platform: socialAccount.platform,
        content: contentPiece.body,
        scheduledAt,
        socialAccountId,
        contentPieceId,
        organizationId: contentPiece.organizationId,
      });

      reply.send({
        success: true,
        data: { scheduledPostId },
      });
    } catch (error: any) {
      reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Cross-post content to multiple platforms
   */
  fastify.post('/cross-post', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { contentPieceId, platformSchedules } = crossPostSchema.parse(request.body);

      const scheduledPostIds = await publisher.crossPost(contentPieceId, platformSchedules.map(schedule => ({
        platform: schedule.platform as Platform,
        socialAccountId: schedule.socialAccountId,
        scheduledAt: schedule.scheduledAt,
      })));

      reply.send({
        success: true,
        data: { scheduledPostIds },
      });
    } catch (error: any) {
      reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Get scheduled posts for an organization
   */
  fastify.get('/scheduled/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { status, platform, limit, offset } = request.query as {
        status?: string;
        platform?: string;
        limit?: string;
        offset?: string;
      };

      const scheduledPosts = await publisher.getScheduledPosts(organizationId, {
        status: status as any,
        platform: platform as Platform,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      reply.send({
        success: true,
        data: scheduledPosts,
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Cancel a scheduled post
   */
  fastify.delete('/scheduled/:postId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { postId } = request.params as { postId: string };

      await publisher.cancelScheduledPost(postId);

      reply.send({
        success: true,
        message: 'Scheduled post cancelled successfully',
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Get analytics summary for an organization
   */
  fastify.get('/analytics/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { platform, startDate, endDate, metricType } = request.query as {
        platform?: string;
        startDate?: string;
        endDate?: string;
        metricType?: string;
      };

      const analytics = await analyticsCollector.getAnalyticsSummary(organizationId, {
        platform: platform as Platform,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        metricType: metricType as any,
      });

      reply.send({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Get top performing posts
   */
  fastify.get('/analytics/:organizationId/top-posts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { platform, limit, metric, startDate, endDate } = request.query as {
        platform?: string;
        limit?: string;
        metric?: string;
        startDate?: string;
        endDate?: string;
      };

      const topPosts = await analyticsCollector.getTopPerformingPosts(organizationId, {
        platform: platform as Platform,
        limit: limit ? parseInt(limit) : undefined,
        metric: metric as any,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      reply.send({
        success: true,
        data: topPosts,
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Manually trigger analytics collection
   */
  fastify.post('/analytics/:organizationId/collect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { platform, forceRefresh } = request.body as {
        platform?: string;
        forceRefresh?: boolean;
      };

      await analyticsCollector.collectOrganizationAnalytics({
        organizationId,
        platform: platform as Platform,
        forceRefresh,
      });

      reply.send({
        success: true,
        message: 'Analytics collection started',
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Webhook endpoint for social media platforms
   */
  fastify.post('/webhooks/:platform', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { platform } = request.params as { platform: string };
      const signature = request.headers['x-hub-signature-256'] as string;
      const payload = JSON.stringify(request.body);

      // Verify webhook signature
      if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      const { event, data } = webhookSchema.parse(request.body);

      console.log(`Received ${platform} webhook:`, { event, data });

      // Handle different webhook events
      switch (event) {
        case 'post_published':
          // Handle successful post publication
          break;
        case 'post_failed':
          // Handle failed post publication
          break;
        case 'account_deauthorized':
          // Handle account deauthorization
          await prisma.socialAccount.updateMany({
            where: {
              platform: platform.toUpperCase() as Platform,
              accountId: data.accountId,
            },
            data: {
              isActive: false,
              errorMessage: 'Account deauthorized',
            },
          });
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      reply.send({ success: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Refresh expired tokens
   */
  fastify.post('/refresh-tokens', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await publisher.refreshSocialTokens();

      reply.send({
        success: true,
        message: 'Token refresh completed',
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
