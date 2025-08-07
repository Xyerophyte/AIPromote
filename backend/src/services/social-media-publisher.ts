import { PrismaClient, Platform, PostStatus } from '@prisma/client';
import { TwitterService } from './twitter-api';
import { LinkedInService } from './linkedin-api';
import { FacebookService } from './facebook-api';
import { BufferService } from './buffer-api';
import { HootsuiteService } from './hootsuite-api';
import { addPublishingJob, PublishingJob } from '../config/redis';
import { encrypt, decrypt } from '../utils/encryption';

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

export interface SocialMediaPost {
  platform: Platform;
  content: string;
  mediaUrls?: string[];
  scheduledAt: Date;
  socialAccountId: string;
  contentPieceId: string;
  organizationId: string;
}

export class SocialMediaPublisher {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Schedule a post for publishing
   */
  async schedulePost(postData: SocialMediaPost): Promise<string> {
    try {
      // Generate idempotency key
      const idempotencyKey = `${postData.socialAccountId}-${postData.contentPieceId}-${Date.now()}`;
      
      // Create scheduled post record
      const scheduledPost = await this.prisma.scheduledPost.create({
        data: {
          organizationId: postData.organizationId,
          contentPieceId: postData.contentPieceId,
          socialAccountId: postData.socialAccountId,
          scheduledAt: postData.scheduledAt,
          status: PostStatus.SCHEDULED,
          idempotencyKey,
          attemptCount: 0,
          maxAttempts: 3,
        },
      });

      // Calculate delay for job scheduling
      const delay = Math.max(0, postData.scheduledAt.getTime() - Date.now());

      // Add job to publishing queue
      await addPublishingJob({
        scheduledPostId: scheduledPost.id,
        organizationId: postData.organizationId,
        contentPieceId: postData.contentPieceId,
        socialAccountId: postData.socialAccountId,
        retryCount: 0,
      }, {
        delay,
        jobId: scheduledPost.id,
      });

      return scheduledPost.id;
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      throw new Error(`Failed to schedule post: ${error.message}`);
    }
  }

  /**
   * Publish a scheduled post immediately
   */
  async publishPost(scheduledPostId: string): Promise<PublishResult> {
    try {
      // Get scheduled post with all required relations
      const scheduledPost = await this.prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        include: {
          contentPiece: {
            include: {
              organization: true,
            },
          },
          socialAccount: true,
        },
      });

      if (!scheduledPost) {
        throw new Error('Scheduled post not found');
      }

      if (scheduledPost.status === PostStatus.PUBLISHED) {
        return {
          success: true,
          platformPostId: scheduledPost.platformPostId || undefined,
          platformUrl: scheduledPost.platformUrl || undefined,
        };
      }

      // Update status to publishing
      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: PostStatus.PUBLISHING,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });

      let result: PublishResult;

      try {
        // Publish based on platform
        switch (scheduledPost.socialAccount.platform) {
          case Platform.TWITTER:
            result = await this.publishToTwitter(scheduledPost);
            break;
          case Platform.LINKEDIN:
            result = await this.publishToLinkedIn(scheduledPost);
            break;
          case Platform.FACEBOOK:
            result = await this.publishToFacebook(scheduledPost);
            break;
          case Platform.INSTAGRAM:
            result = await this.publishToInstagram(scheduledPost);
            break;
          default:
            // Try Buffer or Hootsuite as fallback
            result = await this.publishViaThirdParty(scheduledPost);
            break;
        }

        // Update post status based on result
        if (result.success) {
          await this.prisma.scheduledPost.update({
            where: { id: scheduledPostId },
            data: {
              status: PostStatus.PUBLISHED,
              publishedAt: new Date(),
              platformPostId: result.platformPostId,
              platformUrl: result.platformUrl,
              errorMessage: null,
            },
          });

          // Update content piece status
          await this.prisma.contentPiece.update({
            where: { id: scheduledPost.contentPieceId },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
          });
        } else {
          await this.handlePublishingError(scheduledPostId, result.error || 'Unknown error');
        }

        return result;
      } catch (publishError: any) {
        await this.handlePublishingError(scheduledPostId, publishError.message);
        return {
          success: false,
          error: publishError.message,
        };
      }
    } catch (error: any) {
      console.error('Error publishing post:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish to Twitter/X
   */
  private async publishToTwitter(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create Twitter service with decrypted credentials
      const twitterService = await TwitterService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted,
        scheduledPost.socialAccount.refreshTokenEncrypted
      );

      // Prepare post data
      const postData = {
        text: scheduledPost.contentPiece.body,
        // TODO: Handle media uploads if needed
        mediaIds: [], // Will be implemented when media handling is added
      };

      // Post to Twitter
      const result = await twitterService.postTweet(postData);

      if (!result.data) {
        throw new Error('No data returned from Twitter API');
      }

      return {
        success: true,
        platformPostId: result.data.id,
        platformUrl: `https://twitter.com/${scheduledPost.socialAccount.handle}/status/${result.data.id}`,
      };
    } catch (error: any) {
      console.error('Error publishing to Twitter:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create LinkedIn service with decrypted credentials
      const linkedinService = await LinkedInService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted,
        scheduledPost.socialAccount.refreshTokenEncrypted,
        scheduledPost.socialAccount.expiresAt
      );

      // Prepare post data
      const postData = {
        text: scheduledPost.contentPiece.body,
        visibility: 'PUBLIC' as const,
        // TODO: Handle media uploads and article URLs if needed
      };

      // Post to LinkedIn
      const result = await linkedinService.postContent(postData);

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://www.linkedin.com/feed/update/${result.urn}/`,
      };
    } catch (error: any) {
      console.error('Error publishing to LinkedIn:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish to Facebook
   */
  private async publishToFacebook(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create Facebook service with decrypted credentials
      const facebookService = await FacebookService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted,
        scheduledPost.socialAccount.pageId,
        scheduledPost.socialAccount.instagramAccountId,
        scheduledPost.socialAccount.expiresAt
      );

      // Prepare post data
      const postData = {
        message: scheduledPost.contentPiece.body,
        photoUrl: scheduledPost.contentPiece.mediaUrls?.[0], // Use first media URL if available
        published: true,
      };

      // Post to Facebook
      const result = await facebookService.postToFacebook(postData);

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://www.facebook.com/${scheduledPost.socialAccount.pageId}/posts/${result.postId}`,
      };
    } catch (error: any) {
      console.error('Error publishing to Facebook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create Facebook service (handles Instagram too)
      const facebookService = await FacebookService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted,
        scheduledPost.socialAccount.pageId,
        scheduledPost.socialAccount.instagramAccountId,
        scheduledPost.socialAccount.expiresAt
      );

      // Prepare post data
      const postData = {
        imageUrl: scheduledPost.contentPiece.mediaUrls?.[0], // Instagram requires media
        caption: scheduledPost.contentPiece.body,
        mediaType: 'IMAGE' as const,
      };

      if (!postData.imageUrl) {
        throw new Error('Instagram posts require at least one image');
      }

      // Post to Instagram
      const result = await facebookService.postToInstagram(postData);

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://www.instagram.com/p/${result.id}/`,
      };
    } catch (error: any) {
      console.error('Error publishing to Instagram:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish via third-party services (Buffer/Hootsuite)
   */
  private async publishViaThirdParty(scheduledPost: any): Promise<PublishResult> {
    try {
      // Try Buffer first
      if (scheduledPost.socialAccount.thirdPartyService === 'BUFFER') {
        return await this.publishViaBuffer(scheduledPost);
      }
      
      // Try Hootsuite
      if (scheduledPost.socialAccount.thirdPartyService === 'HOOTSUITE') {
        return await this.publishViaHootsuite(scheduledPost);
      }

      throw new Error('No supported third-party service configured for this account');
    } catch (error: any) {
      console.error('Error publishing via third-party:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish via Buffer
   */
  private async publishViaBuffer(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create Buffer service with decrypted credentials
      const bufferService = await BufferService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted
      );

      // Prepare post data
      const postData = {
        text: scheduledPost.contentPiece.body,
        profileIds: [scheduledPost.socialAccount.profileId || scheduledPost.socialAccount.accountId],
        now: true, // Publish immediately
        media: scheduledPost.contentPiece.mediaUrls?.[0] ? {
          photo: scheduledPost.contentPiece.mediaUrls[0],
        } : undefined,
      };

      // Post via Buffer
      const result = await bufferService.createUpdate(postData);

      if (!result.success || !result.updates || result.updates.length === 0) {
        throw new Error('Buffer API did not return successful result');
      }

      const update = result.updates[0];
      return {
        success: true,
        platformPostId: update.id,
        platformUrl: update.serviceUpdateId ? `https://buffer.com/app/profile/${update.profileId}/buffer/${update.id}` : undefined,
      };
    } catch (error: any) {
      console.error('Error publishing via Buffer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish via Hootsuite
   */
  private async publishViaHootsuite(scheduledPost: any): Promise<PublishResult> {
    try {
      // Create Hootsuite service with decrypted credentials
      const hootsuiteService = await HootsuiteService.createWithEncryptedCredentials(
        scheduledPost.socialAccount.accessTokenEncrypted,
        scheduledPost.socialAccount.refreshTokenEncrypted,
        scheduledPost.socialAccount.expiresAt
      );

      // Prepare message data
      const messageData = {
        text: scheduledPost.contentPiece.body,
        media: scheduledPost.contentPiece.mediaUrls?.map(url => ({
          id: '', // Would need to upload media first
          type: 'photo' as const,
          url,
        })),
      };

      // Send message immediately
      const result = await hootsuiteService.sendMessageNow(
        [scheduledPost.socialAccount.profileId || scheduledPost.socialAccount.accountId],
        messageData
      );

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://hootsuite.com/dashboard/messages/${result.id}`,
      };
    } catch (error: any) {
      console.error('Error publishing via Hootsuite:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle publishing errors with retry logic
   */
  private async handlePublishingError(scheduledPostId: string, error: string): Promise<void> {
    const scheduledPost = await this.prisma.scheduledPost.findUnique({
      where: { id: scheduledPostId },
    });

    if (!scheduledPost) {
      return;
    }

    const shouldRetry = scheduledPost.attemptCount < scheduledPost.maxAttempts;

    if (shouldRetry) {
      // Calculate exponential backoff delay
      const backoffDelay = Math.pow(2, scheduledPost.attemptCount) * 60000; // Start with 1 minute

      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: PostStatus.RETRYING,
          errorMessage: error,
        },
      });

      // Schedule retry
      await addPublishingJob({
        scheduledPostId,
        organizationId: scheduledPost.organizationId,
        contentPieceId: scheduledPost.contentPieceId,
        socialAccountId: scheduledPost.socialAccountId,
        retryCount: scheduledPost.attemptCount,
      }, {
        delay: backoffDelay,
        jobId: `${scheduledPostId}-retry-${scheduledPost.attemptCount}`,
      });
    } else {
      // Mark as failed
      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: PostStatus.FAILED,
          errorMessage: error,
        },
      });

      // Update content piece status
      await this.prisma.contentPiece.update({
        where: { id: scheduledPost.contentPieceId },
        data: {
          status: 'FAILED',
        },
      });
    }
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(scheduledPostId: string): Promise<void> {
    try {
      await this.prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: PostStatus.CANCELLED,
        },
      });

      // TODO: Remove job from queue if possible
      console.log(`Scheduled post ${scheduledPostId} cancelled`);
    } catch (error: any) {
      console.error('Error cancelling scheduled post:', error);
      throw new Error(`Failed to cancel scheduled post: ${error.message}`);
    }
  }

  /**
   * Get scheduled posts for an organization
   */
  async getScheduledPosts(organizationId: string, options: {
    status?: PostStatus;
    platform?: Platform;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const where: any = { organizationId };
      
      if (options.status) {
        where.status = options.status;
      }

      if (options.platform) {
        where.socialAccount = {
          platform: options.platform,
        };
      }

      return await this.prisma.scheduledPost.findMany({
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
          socialAccount: {
            select: {
              id: true,
              platform: true,
              handle: true,
              displayName: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });
    } catch (error: any) {
      console.error('Error fetching scheduled posts:', error);
      throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
    }
  }

  /**
   * Cross-post content to multiple platforms
   */
  async crossPost(
    contentPieceId: string,
    platformSchedules: Array<{
      platform: Platform;
      socialAccountId: string;
      scheduledAt: Date;
    }>
  ): Promise<string[]> {
    try {
      const contentPiece = await this.prisma.contentPiece.findUnique({
        where: { id: contentPieceId },
        include: { organization: true },
      });

      if (!contentPiece) {
        throw new Error('Content piece not found');
      }

      const scheduledPostIds: string[] = [];

      for (const schedule of platformSchedules) {
        const postData: SocialMediaPost = {
          platform: schedule.platform,
          content: contentPiece.body,
          scheduledAt: schedule.scheduledAt,
          socialAccountId: schedule.socialAccountId,
          contentPieceId: contentPiece.id,
          organizationId: contentPiece.organizationId,
        };

        const scheduledPostId = await this.schedulePost(postData);
        scheduledPostIds.push(scheduledPostId);
      }

      return scheduledPostIds;
    } catch (error: any) {
      console.error('Error cross-posting content:', error);
      throw new Error(`Failed to cross-post content: ${error.message}`);
    }
  }

  /**
   * Refresh expired social media tokens
   */
  async refreshSocialTokens(): Promise<void> {
    try {
      // Find accounts with tokens expiring soon (within 24 hours)
      const expiringAccounts = await this.prisma.socialAccount.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            gte: new Date(), // Not already expired
          },
          refreshTokenEncrypted: {
            not: null,
          },
        },
      });

      for (const account of expiringAccounts) {
        try {
          let newTokens;
          
          if (account.platform === Platform.TWITTER) {
            const refreshToken = decrypt(account.refreshTokenEncrypted!);
            newTokens = await TwitterService.refreshAccessToken(refreshToken);
          } else if (account.platform === Platform.LINKEDIN) {
            const refreshToken = decrypt(account.refreshTokenEncrypted!);
            newTokens = await LinkedInService.refreshAccessToken(refreshToken);
          } else {
            continue; // Skip unsupported platforms
          }

          // Update account with new tokens
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessTokenEncrypted: encrypt(newTokens.accessToken),
              refreshTokenEncrypted: newTokens.refreshToken ? encrypt(newTokens.refreshToken) : null,
              expiresAt: newTokens.expiresIn 
                ? new Date(Date.now() + newTokens.expiresIn * 1000)
                : null,
              lastSyncAt: new Date(),
              errorMessage: null,
            },
          });

          console.log(`Refreshed tokens for ${account.platform} account: ${account.handle}`);
        } catch (error: any) {
          console.error(`Failed to refresh tokens for ${account.platform} account ${account.handle}:`, error);
          
          // Mark account as having an error
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              errorMessage: `Token refresh failed: ${error.message}`,
              lastSyncAt: new Date(),
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Error refreshing social tokens:', error);
    }
  }
}
