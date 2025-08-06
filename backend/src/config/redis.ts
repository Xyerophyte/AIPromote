import Redis from 'ioredis';
import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { config } from './config';

// Redis connection instance
export const redis = new Redis(config.redis.url, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Redis connection for BullMQ
export const redisConnection = {
  host: 'localhost',
  port: 6379,
  password: 'aipromotredis',
};

// Queue configurations
const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep only last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs for debugging
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 5,
  removeOnComplete: 10,
  removeOnFail: 50,
};

// ============================================
// QUEUE DEFINITIONS
// ============================================

// Content Generation Queue
export const contentGenerationQueue = new Queue('content-generation', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1, // High priority for content generation
  },
});

// Publishing Queue
export const publishingQueue = new Queue('publishing', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 2, // Very high priority for publishing
    delay: 0,    // Immediate execution
  },
});

// Analytics Collection Queue
export const analyticsQueue = new Queue('analytics', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 3, // Lower priority for analytics
    repeat: { pattern: '0 */6 * * *' }, // Every 6 hours
  },
});

// AI Strategy Generation Queue
export const strategyGenerationQueue = new Queue('strategy-generation', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1,
    attempts: 2, // Fewer retries for expensive AI operations
  },
});

// Email Notifications Queue
export const emailQueue = new Queue('email', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 4, // Lower priority
    attempts: 5,
  },
});

// ============================================
// JOB TYPE INTERFACES
// ============================================

export interface ContentGenerationJob {
  organizationId: string;
  pillarId?: string;
  platform: string;
  contentType: string;
  count?: number;
  scheduledFor?: Date;
  userId: string;
}

export interface PublishingJob {
  scheduledPostId: string;
  organizationId: string;
  contentPieceId: string;
  socialAccountId: string;
  retryCount?: number;
}

export interface AnalyticsCollectionJob {
  scheduledPostId?: string;
  contentPieceId?: string;
  organizationId: string;
  platform: string;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface StrategyGenerationJob {
  organizationId: string;
  userId: string;
  previousStrategyId?: string;
  regenerate?: boolean;
}

export interface EmailJob {
  to: string | string[];
  subject: string;
  template: string;
  data: any;
  priority?: 'high' | 'normal' | 'low';
}

// ============================================
// WORKER CREATION HELPERS
// ============================================

export function createContentGenerationWorker(
  processor: (job: Job<ContentGenerationJob>) => Promise<void>
) {
  return new Worker('content-generation', processor, {
    ...defaultWorkerOptions,
    concurrency: 3, // Limit AI operations
  });
}

export function createPublishingWorker(
  processor: (job: Job<PublishingJob>) => Promise<void>
) {
  return new Worker('publishing', processor, {
    ...defaultWorkerOptions,
    concurrency: 10, // Higher concurrency for API calls
  });
}

export function createAnalyticsWorker(
  processor: (job: Job<AnalyticsCollectionJob>) => Promise<void>
) {
  return new Worker('analytics', processor, {
    ...defaultWorkerOptions,
    concurrency: 5,
  });
}

export function createStrategyGenerationWorker(
  processor: (job: Job<StrategyGenerationJob>) => Promise<void>
) {
  return new Worker('strategy-generation', processor, {
    ...defaultWorkerOptions,
    concurrency: 2, // Very limited for expensive operations
  });
}

export function createEmailWorker(
  processor: (job: Job<EmailJob>) => Promise<void>
) {
  return new Worker('email', processor, {
    ...defaultWorkerOptions,
    concurrency: 10,
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function addContentGenerationJob(
  data: ContentGenerationJob,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  }
) {
  return contentGenerationQueue.add('generate-content', data, {
    delay: options?.delay,
    priority: options?.priority || 1,
    jobId: options?.jobId,
  });
}

export async function addPublishingJob(
  data: PublishingJob,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  }
) {
  return publishingQueue.add('publish-post', data, {
    delay: options?.delay,
    priority: options?.priority || 2,
    jobId: options?.jobId,
  });
}

export async function addAnalyticsJob(
  data: AnalyticsCollectionJob,
  options?: {
    delay?: number;
    repeat?: { pattern: string };
  }
) {
  return analyticsQueue.add('collect-analytics', data, {
    delay: options?.delay,
    repeat: options?.repeat,
  });
}

export async function addStrategyGenerationJob(
  data: StrategyGenerationJob,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  return strategyGenerationQueue.add('generate-strategy', data, {
    delay: options?.delay,
    priority: options?.priority || 1,
  });
}

export async function addEmailJob(
  data: EmailJob,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  const priority = data.priority === 'high' ? 1 : data.priority === 'low' ? 5 : 3;
  
  return emailQueue.add('send-email', data, {
    delay: options?.delay,
    priority: options?.priority || priority,
  });
}

// ============================================
// HEALTH CHECK & MONITORING
// ============================================

export async function getQueueHealth() {
  const queues = [
    { name: 'content-generation', queue: contentGenerationQueue },
    { name: 'publishing', queue: publishingQueue },
    { name: 'analytics', queue: analyticsQueue },
    { name: 'strategy-generation', queue: strategyGenerationQueue },
    { name: 'email', queue: emailQueue },
  ];

  const health = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      return {
        name,
        counts: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        },
      };
    })
  );

  return health;
}

export async function cleanUpQueues() {
  const queues = [
    contentGenerationQueue,
    publishingQueue,
    analyticsQueue,
    strategyGenerationQueue,
    emailQueue,
  ];

  await Promise.all(
    queues.map(async (queue) => {
      await queue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24 hours
      await queue.clean(7 * 24 * 60 * 60 * 1000, 200, 'failed'); // Clean failed jobs older than 7 days
    })
  );
}

// Graceful shutdown
export async function closeRedis() {
  await Promise.all([
    contentGenerationQueue.close(),
    publishingQueue.close(),
    analyticsQueue.close(),
    strategyGenerationQueue.close(),
    emailQueue.close(),
    redis.disconnect(),
  ]);
}

// Error handling
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready');
});

export default {
  redis,
  redisConnection,
  contentGenerationQueue,
  publishingQueue,
  analyticsQueue,
  strategyGenerationQueue,
  emailQueue,
  addContentGenerationJob,
  addPublishingJob,
  addAnalyticsJob,
  addStrategyGenerationJob,
  addEmailJob,
  getQueueHealth,
  cleanUpQueues,
  closeRedis,
};
