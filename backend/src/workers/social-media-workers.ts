import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { 
  createPublishingWorker,
  createAnalyticsWorker,
  PublishingJob,
  AnalyticsCollectionJob
} from '../config/redis';
import { SocialMediaPublisher } from '../services/social-media-publisher';
import { AnalyticsCollector } from '../services/analytics-collector';
import cron from 'node-cron';

export class SocialMediaWorkers {
  private prisma: PrismaClient;
  private publisher: SocialMediaPublisher;
  private analyticsCollector: AnalyticsCollector;
  private workers: any[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.publisher = new SocialMediaPublisher(prisma);
    this.analyticsCollector = new AnalyticsCollector(prisma);
  }

  /**
   * Start all social media workers
   */
  async startWorkers(): Promise<void> {
    console.log('🚀 Starting social media workers...');

    // Start publishing worker
    const publishingWorker = createPublishingWorker(this.processPublishingJob.bind(this));
    this.workers.push(publishingWorker);

    // Start analytics worker
    const analyticsWorker = createAnalyticsWorker(this.processAnalyticsJob.bind(this));
    this.workers.push(analyticsWorker);

    // Set up error handlers
    this.setupWorkerErrorHandlers();

    // Set up scheduled jobs
    this.setupScheduledJobs();

    console.log('✅ Social media workers started successfully');
  }

  /**
   * Stop all workers gracefully
   */
  async stopWorkers(): Promise<void> {
    console.log('🛑 Stopping social media workers...');
    
    await Promise.all(this.workers.map(worker => worker.close()));
    this.workers = [];
    
    console.log('✅ Social media workers stopped successfully');
  }

  /**
   * Process publishing jobs
   */
  private async processPublishingJob(job: Job<PublishingJob>): Promise<void> {
    const { scheduledPostId, organizationId, contentPieceId, socialAccountId, retryCount } = job.data;
    
    console.log(`Processing publishing job for scheduled post: ${scheduledPostId}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // Publish the post
      const result = await this.publisher.publishPost(scheduledPostId);

      await job.updateProgress(50);

      if (result.success) {
        console.log(`✅ Successfully published post: ${scheduledPostId}`);
        
        // Schedule analytics collection for 1 hour later
        await job.updateProgress(80);
        
        setTimeout(async () => {
          try {
            await this.analyticsCollector.collectPostAnalytics(scheduledPostId);
          } catch (error: any) {
            console.error('Failed to collect analytics after publishing:', error);
          }
        }, 60 * 60 * 1000); // 1 hour delay

        await job.updateProgress(100);
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
    } catch (error: any) {
      console.error(`❌ Publishing job failed for ${scheduledPostId}:`, error);
      
      // Log the error to database
      await this.logJobError('publishing', scheduledPostId, error.message, job.data);
      
      throw error; // Re-throw to trigger retry logic
    }
  }

  /**
   * Process analytics collection jobs
   */
  private async processAnalyticsJob(job: Job<AnalyticsCollectionJob>): Promise<void> {
    const { organizationId, scheduledPostId, contentPieceId, platform, timeRange } = job.data;
    
    console.log(`Processing analytics job for organization: ${organizationId}`);

    try {
      await job.updateProgress(20);

      if (scheduledPostId) {
        // Collect analytics for a specific post
        await this.analyticsCollector.collectPostAnalytics(scheduledPostId, true);
        console.log(`✅ Collected analytics for post: ${scheduledPostId}`);
      } else {
        // Collect analytics for entire organization
        await this.analyticsCollector.collectOrganizationAnalytics({
          organizationId,
          platform,
          startDate: timeRange.start,
          endDate: timeRange.end,
          forceRefresh: true,
        });
        console.log(`✅ Collected analytics for organization: ${organizationId}`);
      }

      await job.updateProgress(100);
    } catch (error: any) {
      console.error(`❌ Analytics job failed:`, error);
      
      // Log the error to database
      await this.logJobError('analytics', organizationId, error.message, job.data);
      
      throw error;
    }
  }

  /**
   * Set up error handlers for workers
   */
  private setupWorkerErrorHandlers(): void {
    this.workers.forEach((worker, index) => {
      worker.on('error', (error: Error) => {
        console.error(`Worker ${index} error:`, error);
      });

      worker.on('failed', (job: Job, error: Error) => {
        console.error(`Job ${job.id} failed:`, error);
      });

      worker.on('completed', (job: Job) => {
        console.log(`✅ Job ${job.id} completed successfully`);
      });

      worker.on('stalled', (jobId: string) => {
        console.warn(`⚠️  Job ${jobId} stalled`);
      });
    });
  }

  /**
   * Set up scheduled jobs using cron
   */
  private setupScheduledJobs(): void {
    // Token refresh job - every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('🔄 Running scheduled token refresh...');
      try {
        await this.publisher.refreshSocialTokens();
        console.log('✅ Token refresh completed');
      } catch (error: any) {
        console.error('❌ Token refresh failed:', error);
      }
    });

    // Analytics collection job - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('📊 Running scheduled analytics collection...');
      try {
        await this.scheduleAnalyticsForAllOrganizations();
        console.log('✅ Scheduled analytics collection for all organizations');
      } catch (error: any) {
        console.error('❌ Failed to schedule analytics collection:', error);
      }
    });

    // Cleanup job - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Running daily cleanup...');
      try {
        await this.cleanupExpiredJobs();
        await this.cleanupOldAnalytics();
        console.log('✅ Daily cleanup completed');
      } catch (error: any) {
        console.error('❌ Daily cleanup failed:', error);
      }
    });

    console.log('⏰ Scheduled jobs set up successfully');
  }

  /**
   * Schedule analytics collection for all active organizations
   */
  private async scheduleAnalyticsForAllOrganizations(): Promise<void> {
    try {
      const organizations = await this.prisma.organization.findMany({
        where: {
          socialAccounts: {
            some: {
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      for (const org of organizations) {
        await this.analyticsCollector.scheduleAnalyticsCollection(org.id, {
          interval: 'daily',
          delay: Math.random() * 30 * 60 * 1000, // Random delay up to 30 minutes
        });
      }

      console.log(`Scheduled analytics collection for ${organizations.length} organizations`);
    } catch (error: any) {
      console.error('Error scheduling analytics for organizations:', error);
      throw error;
    }
  }

  /**
   * Clean up expired jobs and old data
   */
  private async cleanupExpiredJobs(): Promise<void> {
    try {
      // Cancel expired scheduled posts
      const expiredPosts = await this.prisma.scheduledPost.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
      });

      for (const post of expiredPosts) {
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'CANCELLED',
            errorMessage: 'Expired - not published within 24 hours',
          },
        });
      }

      console.log(`Cleaned up ${expiredPosts.length} expired scheduled posts`);
    } catch (error: any) {
      console.error('Error cleaning up expired jobs:', error);
    }
  }

  /**
   * Clean up old analytics data
   */
  private async cleanupOldAnalytics(): Promise<void> {
    try {
      // Keep analytics for last 6 months only
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const deletedCount = await this.prisma.analytics.deleteMany({
        where: {
          collectedAt: {
            lt: sixMonthsAgo,
          },
        },
      });

      console.log(`Cleaned up ${deletedCount.count} old analytics records`);
    } catch (error: any) {
      console.error('Error cleaning up old analytics:', error);
    }
  }

  /**
   * Log job errors to database for monitoring
   */
  private async logJobError(
    jobType: string,
    entityId: string,
    errorMessage: string,
    jobData: any
  ): Promise<void> {
    try {
      // In a production system, you might want to create a separate error log table
      console.error(`Job Error [${jobType}]:`, {
        entityId,
        errorMessage,
        jobData,
        timestamp: new Date().toISOString(),
      });

      // For now, we'll just log to console, but you could store in database:
      // await this.prisma.jobError.create({
      //   data: {
      //     jobType,
      //     entityId,
      //     errorMessage,
      //     jobData: JSON.stringify(jobData),
      //     occurredAt: new Date(),
      //   },
      // });
    } catch (logError: any) {
      console.error('Failed to log job error:', logError);
    }
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(): Promise<any> {
    try {
      const stats = {
        workers: this.workers.length,
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
      };

      // Get job counts from Redis (implementation depends on your Redis setup)
      // This is a simplified version - you'd want to implement proper queue monitoring
      
      return stats;
    } catch (error: any) {
      console.error('Error getting worker stats:', error);
      return null;
    }
  }

  /**
   * Health check for workers
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const details = {
        workersRunning: this.workers.length > 0,
        workersCount: this.workers.length,
        redisConnected: true, // You'd implement actual Redis connection check
        databaseConnected: true, // You'd implement actual database connection check
      };

      const healthy = details.workersRunning && details.redisConnected && details.databaseConnected;

      return { healthy, details };
    } catch (error: any) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  }
}
