import { PrismaClient, Platform, MetricType } from '@prisma/client';
import { TwitterService } from './twitter-api';
import { LinkedInService } from './linkedin-api';
import { FacebookService } from './facebook-api';
import { BufferService } from './buffer-api';
import { HootsuiteService } from './hootsuite-api';
import { addAnalyticsJob } from '../config/redis';
import { AnalyticsService } from './analytics-service';
import { CompetitorAnalysisService } from './competitor-analysis';
import { ReportGenerator } from './report-generator';

export interface PlatformAnalytics {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  clicks?: number;
  reach?: number;
  engagementRate?: number;
  ctr?: number;
}

export interface AnalyticsCollectionOptions {
  organizationId: string;
  platform?: Platform;
  startDate?: Date;
  endDate?: Date;
  forceRefresh?: boolean;
}

export class AnalyticsCollector {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Collect analytics for all published posts of an organization
   */
  async collectOrganizationAnalytics(options: AnalyticsCollectionOptions): Promise<void> {
    try {
      const where: any = {
        organizationId: options.organizationId,
        status: 'PUBLISHED',
        publishedAt: { not: null },
      };

      if (options.platform) {
        where.socialAccount = { platform: options.platform };
      }

      if (options.startDate || options.endDate) {
        where.publishedAt = {};
        if (options.startDate) {
          where.publishedAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.publishedAt.lte = options.endDate;
        }
      }

      const scheduledPosts = await this.prisma.scheduledPost.findMany({
        where,
        include: {
          contentPiece: true,
          socialAccount: true,
        },
      });

      console.log(`Collecting analytics for ${scheduledPosts.length} posts`);

      for (const post of scheduledPosts) {
        try {
          await this.collectPostAnalytics(post.id, options.forceRefresh);
        } catch (error: any) {
          console.error(`Failed to collect analytics for post ${post.id}:`, error);
          // Continue with other posts
        }
      }
    } catch (error: any) {
      console.error('Error collecting organization analytics:', error);
      throw new Error(`Failed to collect organization analytics: ${error.message}`);
    }
  }

  /**
   * Collect analytics for a specific post
   */
  async collectPostAnalytics(scheduledPostId: string, forceRefresh: boolean = false): Promise<void> {
    try {
      const scheduledPost = await this.prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        include: {
          contentPiece: true,
          socialAccount: true,
        },
      });

      if (!scheduledPost || !scheduledPost.platformPostId) {
        console.warn(`Scheduled post ${scheduledPostId} not found or not published`);
        return;
      }

      // Check if analytics already exist and are recent (unless forcing refresh)
      if (!forceRefresh) {
        const existingAnalytics = await this.prisma.analytics.findFirst({
          where: {
            scheduledPostId: scheduledPost.id,
            collectedAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
            },
          },
        });

        if (existingAnalytics) {
          console.log(`Recent analytics found for post ${scheduledPostId}, skipping`);
          return;
        }
      }

      let platformAnalytics: PlatformAnalytics;

      // Collect analytics based on platform
      switch (scheduledPost.socialAccount.platform) {
        case Platform.TWITTER:
          platformAnalytics = await this.collectTwitterAnalytics(
            scheduledPost.socialAccount,
            scheduledPost.platformPostId
          );
          break;
        case Platform.LINKEDIN:
          platformAnalytics = await this.collectLinkedInAnalytics(
            scheduledPost.socialAccount,
            scheduledPost.platformPostId
          );
          break;
        case Platform.FACEBOOK:
          platformAnalytics = await this.collectFacebookAnalytics(
            scheduledPost.socialAccount,
            scheduledPost.platformPostId
          );
          break;
        case Platform.INSTAGRAM:
          platformAnalytics = await this.collectInstagramAnalytics(
            scheduledPost.socialAccount,
            scheduledPost.platformPostId
          );
          break;
        default:
          // Try third-party services
          platformAnalytics = await this.collectThirdPartyAnalytics(
            scheduledPost.socialAccount,
            scheduledPost.platformPostId
          );
          break;
      }

      // Store analytics in database
      await this.storeAnalytics(scheduledPost, platformAnalytics);

      console.log(`Collected analytics for ${scheduledPost.socialAccount.platform} post: ${scheduledPost.platformPostId}`);
    } catch (error: any) {
      console.error(`Error collecting post analytics for ${scheduledPostId}:`, error);
      throw error;
    }
  }

  /**
   * Collect Twitter analytics
   */
  private async collectTwitterAnalytics(
    socialAccount: any,
    tweetId: string
  ): Promise<PlatformAnalytics> {
    try {
      const twitterService = await TwitterService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted,
        socialAccount.refreshTokenEncrypted
      );

      const analytics = await twitterService.getTweetAnalytics(tweetId);

      return {
        impressions: analytics.impressions,
        likes: analytics.publicMetrics.likeCount,
        comments: analytics.publicMetrics.replyCount,
        shares: analytics.publicMetrics.retweetCount + analytics.publicMetrics.quoteCount,
        saves: analytics.publicMetrics.bookmarkCount || 0,
        clicks: analytics.nonPublicMetrics?.urlLinkClicks || 0,
        reach: analytics.nonPublicMetrics?.impressionCount || analytics.impressions,
        engagementRate: this.calculateEngagementRate(
          analytics.publicMetrics.likeCount +
          analytics.publicMetrics.replyCount +
          analytics.publicMetrics.retweetCount +
          analytics.publicMetrics.quoteCount +
          (analytics.publicMetrics.bookmarkCount || 0),
          analytics.impressions
        ),
        ctr: this.calculateCTR(
          analytics.nonPublicMetrics?.urlLinkClicks || 0,
          analytics.impressions
        ),
      };
    } catch (error: any) {
      console.error('Error collecting Twitter analytics:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Collect LinkedIn analytics
   */
  private async collectLinkedInAnalytics(
    socialAccount: any,
    postUrn: string
  ): Promise<PlatformAnalytics> {
    try {
      const linkedinService = await LinkedInService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted,
        socialAccount.refreshTokenEncrypted,
        socialAccount.expiresAt
      );

      const analytics = await linkedinService.getPostAnalytics(postUrn);

      return {
        impressions: analytics.impressions,
        likes: analytics.reactions,
        comments: analytics.comments,
        shares: analytics.shares,
        clicks: analytics.clicks,
        reach: analytics.reach,
        engagementRate: this.calculateEngagementRate(
          analytics.reactions + analytics.comments + analytics.shares,
          analytics.impressions
        ),
        ctr: this.calculateCTR(analytics.clicks, analytics.impressions),
      };
    } catch (error: any) {
      console.error('Error collecting LinkedIn analytics:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Store analytics in database
   */
  private async storeAnalytics(
    scheduledPost: any,
    platformAnalytics: PlatformAnalytics
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Store engagement metrics
      await this.prisma.analytics.create({
        data: {
          organizationId: scheduledPost.organizationId,
          contentPieceId: scheduledPost.contentPieceId,
          scheduledPostId: scheduledPost.id,
          socialAccountId: scheduledPost.socialAccountId,
          platform: scheduledPost.socialAccount.platform,
          metricType: MetricType.ENGAGEMENT,
          impressions: platformAnalytics.impressions,
          likes: platformAnalytics.likes,
          comments: platformAnalytics.comments,
          shares: platformAnalytics.shares,
          saves: platformAnalytics.saves || 0,
          clicks: platformAnalytics.clicks || 0,
          reach: platformAnalytics.reach || 0,
          periodStart: scheduledPost.publishedAt,
          periodEnd: now,
          collectedAt: now,
          engagementRate: platformAnalytics.engagementRate,
          ctr: platformAnalytics.ctr,
        },
      });

      // Store reach metrics if available
      if (platformAnalytics.reach && platformAnalytics.reach > 0) {
        await this.prisma.analytics.create({
          data: {
            organizationId: scheduledPost.organizationId,
            contentPieceId: scheduledPost.contentPieceId,
            scheduledPostId: scheduledPost.id,
            socialAccountId: scheduledPost.socialAccountId,
            platform: scheduledPost.socialAccount.platform,
            metricType: MetricType.REACH,
            impressions: platformAnalytics.impressions,
            reach: platformAnalytics.reach,
            periodStart: scheduledPost.publishedAt,
            periodEnd: now,
            collectedAt: now,
          },
        });
      }

      // Store conversion metrics if clicks are available
      if (platformAnalytics.clicks && platformAnalytics.clicks > 0) {
        await this.prisma.analytics.create({
          data: {
            organizationId: scheduledPost.organizationId,
            contentPieceId: scheduledPost.contentPieceId,
            scheduledPostId: scheduledPost.id,
            socialAccountId: scheduledPost.socialAccountId,
            platform: scheduledPost.socialAccount.platform,
            metricType: MetricType.CONVERSION,
            impressions: platformAnalytics.impressions,
            clicks: platformAnalytics.clicks,
            websiteClicks: platformAnalytics.clicks,
            periodStart: scheduledPost.publishedAt,
            periodEnd: now,
            collectedAt: now,
            ctr: platformAnalytics.ctr,
          },
        });
      }
    } catch (error: any) {
      console.error('Error storing analytics:', error);
      throw new Error(`Failed to store analytics: ${error.message}`);
    }
  }

  /**
   * Schedule analytics collection for an organization
   */
  async scheduleAnalyticsCollection(
    organizationId: string,
    options: {
      platform?: Platform;
      interval?: 'hourly' | 'daily' | 'weekly';
      delay?: number;
    } = {}
  ): Promise<void> {
    try {
      const collectionJob = {
        organizationId,
        platform: options.platform || 'ALL',
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        },
      };

      await addAnalyticsJob(collectionJob, {
        delay: options.delay || 0,
        repeat: this.getRepeatPattern(options.interval || 'daily'),
      });

      console.log(`Scheduled analytics collection for organization ${organizationId}`);
    } catch (error: any) {
      console.error('Error scheduling analytics collection:', error);
      throw new Error(`Failed to schedule analytics collection: ${error.message}`);
    }
  }

  /**
   * Get analytics summary for an organization
   */
  async getAnalyticsSummary(organizationId: string, options: {
    platform?: Platform;
    startDate?: Date;
    endDate?: Date;
    metricType?: MetricType;
  } = {}): Promise<any> {
    try {
      const where: any = { organizationId };

      if (options.platform) {
        where.platform = options.platform;
      }

      if (options.metricType) {
        where.metricType = options.metricType;
      }

      if (options.startDate || options.endDate) {
        where.collectedAt = {};
        if (options.startDate) {
          where.collectedAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.collectedAt.lte = options.endDate;
        }
      }

      const analytics = await this.prisma.analytics.aggregate({
        where,
        _sum: {
          impressions: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          clicks: true,
          reach: true,
          websiteClicks: true,
        },
        _avg: {
          engagementRate: true,
          ctr: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        totalPosts: analytics._count.id,
        totalImpressions: analytics._sum.impressions || 0,
        totalLikes: analytics._sum.likes || 0,
        totalComments: analytics._sum.comments || 0,
        totalShares: analytics._sum.shares || 0,
        totalSaves: analytics._sum.saves || 0,
        totalClicks: analytics._sum.clicks || 0,
        totalReach: analytics._sum.reach || 0,
        totalWebsiteClicks: analytics._sum.websiteClicks || 0,
        averageEngagementRate: analytics._avg.engagementRate || 0,
        averageCTR: analytics._avg.ctr || 0,
      };
    } catch (error: any) {
      console.error('Error getting analytics summary:', error);
      throw new Error(`Failed to get analytics summary: ${error.message}`);
    }
  }

  /**
   * Get top performing posts
   */
  async getTopPerformingPosts(organizationId: string, options: {
    platform?: Platform;
    limit?: number;
    metric?: 'likes' | 'comments' | 'shares' | 'impressions' | 'engagementRate';
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any[]> {
    try {
      const where: any = { organizationId };

      if (options.platform) {
        where.platform = options.platform;
      }

      if (options.startDate || options.endDate) {
        where.collectedAt = {};
        if (options.startDate) {
          where.collectedAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.collectedAt.lte = options.endDate;
        }
      }

      const orderBy: any = {};
      orderBy[options.metric || 'engagementRate'] = 'desc';

      const topPosts = await this.prisma.analytics.findMany({
        where,
        include: {
          contentPiece: {
            select: {
              id: true,
              title: true,
              body: true,
              platform: true,
              type: true,
            },
          },
          scheduledPost: {
            select: {
              id: true,
              platformPostId: true,
              platformUrl: true,
              publishedAt: true,
            },
          },
        },
        orderBy,
        take: options.limit || 10,
      });

      return topPosts;
    } catch (error: any) {
      console.error('Error getting top performing posts:', error);
      throw new Error(`Failed to get top performing posts: ${error.message}`);
    }
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(totalEngagements: number, impressions: number): number {
    if (impressions === 0) return 0;
    return (totalEngagements / impressions) * 100;
  }

  /**
   * Calculate click-through rate
   */
  private calculateCTR(clicks: number, impressions: number): number {
    if (impressions === 0) return 0;
    return (clicks / impressions) * 100;
  }

  /**
   * Get zero analytics for fallback
   */
  private getZeroAnalytics(): PlatformAnalytics {
    return {
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      reach: 0,
      engagementRate: 0,
      ctr: 0,
    };
  }

  /**
   * Collect Facebook analytics
   */
  private async collectFacebookAnalytics(
    socialAccount: any,
    postId: string
  ): Promise<PlatformAnalytics> {
    try {
      const facebookService = await FacebookService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted,
        socialAccount.pageId,
        socialAccount.instagramAccountId,
        socialAccount.expiresAt
      );

      const analytics = await facebookService.getFacebookPostAnalytics(postId);

      return {
        impressions: analytics.impressions,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        clicks: analytics.clicks,
        reach: analytics.reach,
        engagementRate: this.calculateEngagementRate(
          analytics.engagement,
          analytics.impressions
        ),
        ctr: this.calculateCTR(analytics.clicks, analytics.impressions),
      };
    } catch (error: any) {
      console.error('Error collecting Facebook analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Collect Instagram analytics
   */
  private async collectInstagramAnalytics(
    socialAccount: any,
    mediaId: string
  ): Promise<PlatformAnalytics> {
    try {
      const facebookService = await FacebookService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted,
        socialAccount.pageId,
        socialAccount.instagramAccountId,
        socialAccount.expiresAt
      );

      const analytics = await facebookService.getInstagramPostAnalytics(mediaId);

      return {
        impressions: analytics.impressions,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        clicks: analytics.clicks || 0,
        reach: analytics.reach,
        engagementRate: this.calculateEngagementRate(
          analytics.engagement,
          analytics.impressions
        ),
        ctr: 0, // Instagram doesn't typically provide CTR for regular posts
      };
    } catch (error: any) {
      console.error('Error collecting Instagram analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Collect analytics from third-party services
   */
  private async collectThirdPartyAnalytics(
    socialAccount: any,
    postId: string
  ): Promise<PlatformAnalytics> {
    try {
      // Try Buffer first
      if (socialAccount.thirdPartyService === 'BUFFER') {
        return await this.collectBufferAnalytics(socialAccount, postId);
      }
      
      // Try Hootsuite
      if (socialAccount.thirdPartyService === 'HOOTSUITE') {
        return await this.collectHootsuiteAnalytics(socialAccount, postId);
      }

      // If no third-party service is configured, return zero analytics
      console.warn(`No supported third-party service for analytics collection: ${socialAccount.platform}`);
      return this.getZeroAnalytics();
    } catch (error: any) {
      console.error('Error collecting third-party analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Collect Buffer analytics
   */
  private async collectBufferAnalytics(
    socialAccount: any,
    updateId: string
  ): Promise<PlatformAnalytics> {
    try {
      const bufferService = await BufferService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted
      );

      const analytics = await bufferService.getUpdateInteractions(updateId);

      return {
        impressions: analytics.reach || 0,
        likes: analytics.favorites || 0,
        comments: analytics.comments || 0,
        shares: analytics.retweets || analytics.shares || 0,
        clicks: analytics.clicks || 0,
        reach: analytics.reach || 0,
        engagementRate: analytics.engagementRate || this.calculateEngagementRate(
          (analytics.favorites || 0) + (analytics.comments || 0) + (analytics.retweets || 0),
          analytics.reach || 0
        ),
        ctr: this.calculateCTR(analytics.clicks || 0, analytics.reach || 0),
      };
    } catch (error: any) {
      console.error('Error collecting Buffer analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Collect Hootsuite analytics
   */
  private async collectHootsuiteAnalytics(
    socialAccount: any,
    messageId: string
  ): Promise<PlatformAnalytics> {
    try {
      const hootsuiteService = await HootsuiteService.createWithEncryptedCredentials(
        socialAccount.accessTokenEncrypted,
        socialAccount.refreshTokenEncrypted,
        socialAccount.expiresAt
      );

      const analytics = await hootsuiteService.getMessageAnalytics(messageId);

      return {
        impressions: analytics.impressions || 0,
        likes: analytics.likes || 0,
        comments: analytics.comments || 0,
        shares: analytics.shares || 0,
        clicks: analytics.clicks || 0,
        reach: analytics.reach || 0,
        engagementRate: this.calculateEngagementRate(
          (analytics.engagement || 0),
          analytics.impressions || 0
        ),
        ctr: this.calculateCTR(analytics.clicks || 0, analytics.impressions || 0),
      };
    } catch (error: any) {
      console.error('Error collecting Hootsuite analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Get repeat pattern for scheduling
   */
  private getRepeatPattern(interval: string): { pattern: string } {
    switch (interval) {
      case 'hourly':
        return { pattern: '0 * * * *' }; // Every hour
      case 'daily':
        return { pattern: '0 6 * * *' }; // Daily at 6 AM
      case 'weekly':
        return { pattern: '0 6 * * 1' }; // Weekly on Monday at 6 AM
      default:
        return { pattern: '0 6 * * *' }; // Default to daily
    }
  }
}
