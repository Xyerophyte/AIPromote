import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AuditLogData {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface FeatureFlagCheck {
  userId: string;
  flagName: string;
}

interface SystemHealthData {
  metric: string;
  value: number;
  unit?: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  details?: Record<string, any>;
  tags?: string[];
}

interface AdminNotificationData {
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  targetRoles?: string[];
  targetUsers?: string[];
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export class AdminService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
  }

  // ===========================================
  // AUDIT LOGGING
  // ===========================================

  async logAction(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      this.fastify.log.error('Failed to create audit log:', error);
    }
  }

  async getAuditTrail(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.resource) where.resource = filters.resource;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    return await this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    });
  }

  // ===========================================
  // FEATURE FLAGS
  // ===========================================

  async isFeatureEnabled({ userId, flagName }: FeatureFlagCheck): Promise<boolean> {
    try {
      const flag = await this.prisma.featureFlag.findUnique({
        where: { name: flagName }
      });

      if (!flag || !flag.enabled) {
        return false;
      }

      // Check if user is specifically targeted
      if (flag.targetUsers.includes(userId)) {
        return true;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        // Simple hash-based rollout
        const hash = this.simpleHash(userId + flagName);
        const userPercentile = hash % 100;
        return userPercentile < flag.rolloutPercentage;
      }

      return true;
    } catch (error) {
      this.fastify.log.error('Feature flag check failed:', error);
      return false;
    }
  }

  async createFeatureFlag(data: {
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage?: number;
    targetUsers?: string[];
    conditions?: Record<string, any>;
    createdBy: string;
  }) {
    return await this.prisma.featureFlag.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        rolloutPercentage: data.rolloutPercentage || 100,
        targetUsers: data.targetUsers || [],
        conditions: data.conditions,
        createdBy: data.createdBy
      }
    });
  }

  async updateFeatureFlag(flagId: string, updates: {
    enabled?: boolean;
    rolloutPercentage?: number;
    targetUsers?: string[];
    conditions?: Record<string, any>;
  }) {
    return await this.prisma.featureFlag.update({
      where: { id: flagId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  // ===========================================
  // SYSTEM HEALTH MONITORING
  // ===========================================

  async recordSystemMetric(data: SystemHealthData): Promise<void> {
    try {
      await this.prisma.systemHealthMetric.create({
        data: {
          metric: data.metric as any,
          value: data.value,
          unit: data.unit,
          status: data.status as any,
          details: data.details,
          tags: data.tags || []
        }
      });
    } catch (error) {
      this.fastify.log.error('Failed to record system metric:', error);
    }
  }

  async getSystemHealth(timeframe: string = '1h') {
    let startDate: Date;
    const now = new Date();

    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
    }

    const metrics = await this.prisma.systemHealthMetric.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group metrics by type and calculate aggregates
    const healthSummary: Record<string, {
      current: number;
      average: number;
      status: string;
      unit?: string;
    }> = {};

    for (const metric of metrics) {
      if (!healthSummary[metric.metric]) {
        healthSummary[metric.metric] = {
          current: metric.value,
          average: metric.value,
          status: metric.status,
          unit: metric.unit
        };
      }
    }

    return healthSummary;
  }

  async checkSystemHealth(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    checks: Record<string, any>;
  }> {
    const checks: Record<string, any> = {};
    let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    try {
      // Database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'HEALTHY', message: 'Database connected' };
    } catch (error) {
      checks.database = { status: 'CRITICAL', message: 'Database connection failed' };
      overallStatus = 'CRITICAL';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memUsedMB > 512) { // > 512MB
      checks.memory = { status: 'WARNING', value: memUsedMB, unit: 'MB' };
      if (overallStatus === 'HEALTHY') overallStatus = 'WARNING';
    } else {
      checks.memory = { status: 'HEALTHY', value: memUsedMB, unit: 'MB' };
    }

    // Queue sizes (example)
    try {
      const failedPostsCount = await this.prisma.scheduledPost.count({
        where: { 
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      if (failedPostsCount > 50) {
        checks.failedPosts = { status: 'CRITICAL', count: failedPostsCount };
        overallStatus = 'CRITICAL';
      } else if (failedPostsCount > 10) {
        checks.failedPosts = { status: 'WARNING', count: failedPostsCount };
        if (overallStatus === 'HEALTHY') overallStatus = 'WARNING';
      } else {
        checks.failedPosts = { status: 'HEALTHY', count: failedPostsCount };
      }
    } catch (error) {
      checks.failedPosts = { status: 'CRITICAL', message: 'Failed to check post status' };
      overallStatus = 'CRITICAL';
    }

    return { status: overallStatus, checks };
  }

  // ===========================================
  // ADMIN NOTIFICATIONS
  // ===========================================

  async createNotification(data: AdminNotificationData): Promise<void> {
    try {
      await this.prisma.adminNotification.create({
        data: {
          type: data.type as any,
          severity: data.severity as any,
          title: data.title,
          message: data.message,
          targetRoles: data.targetRoles || [],
          targetUsers: data.targetUsers || [],
          actionUrl: data.actionUrl,
          metadata: data.metadata,
          expiresAt: data.expiresAt
        }
      });
    } catch (error) {
      this.fastify.log.error('Failed to create admin notification:', error);
    }
  }

  async getNotificationsForUser(userId: string, role: string) {
    return await this.prisma.adminNotification.findMany({
      where: {
        OR: [
          { targetUsers: { has: userId } },
          { targetRoles: { has: role } }
        ],
        dismissed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id: notificationId }
    });

    if (notification && !notification.readBy.includes(userId)) {
      await this.prisma.adminNotification.update({
        where: { id: notificationId },
        data: {
          readBy: [...notification.readBy, userId],
          read: true
        }
      });
    }
  }

  // ===========================================
  // CONTENT MODERATION
  // ===========================================

  async queueForModeration(contentPieceId: string, reason?: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM') {
    const existing = await this.prisma.contentModerationQueue.findUnique({
      where: { contentPieceId }
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.contentModerationQueue.create({
      data: {
        contentPieceId,
        status: 'PENDING',
        priority: priority as any,
        reason,
        automatedFlags: {} // Could include AI-detected issues
      }
    });
  }

  async assignModeration(queueId: string, assignedTo: string) {
    return await this.prisma.contentModerationQueue.update({
      where: { id: queueId },
      data: {
        assignedTo,
        status: 'IN_REVIEW',
        updatedAt: new Date()
      }
    });
  }

  async completeModeration(queueId: string, moderatedBy: string, approved: boolean, note?: string) {
    const queue = await this.prisma.contentModerationQueue.update({
      where: { id: queueId },
      data: {
        moderatedBy,
        status: approved ? 'APPROVED' : 'REJECTED',
        moderationNote: note,
        moderatedAt: new Date()
      }
    });

    // Update the content piece status
    await this.prisma.contentPiece.update({
      where: { id: queue.contentPieceId },
      data: {
        status: approved ? 'APPROVED' : 'DRAFT'
      }
    });

    return queue;
  }

  // ===========================================
  // ANALYTICS AND REPORTING
  // ===========================================

  async getAdminAnalytics(timeframe: string = '30d') {
    let startDate: Date;
    const now = new Date();

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      userGrowth,
      contentCreated,
      postsPublished,
      activeSubscriptions,
      recentErrors
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      this.prisma.contentPiece.count({
        where: { createdAt: { gte: startDate } }
      }),
      this.prisma.scheduledPost.count({
        where: { 
          status: 'PUBLISHED',
          publishedAt: { gte: startDate }
        }
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' }
      }),
      this.prisma.auditLog.count({
        where: {
          action: { contains: 'ERROR' },
          createdAt: { gte: startDate }
        }
      })
    ]);

    return {
      timeframe,
      userGrowth,
      contentCreated,
      postsPublished,
      activeSubscriptions,
      recentErrors,
      generatedAt: now
    };
  }

  async getUserActivitySummary(userId: string) {
    const [user, organizations, subscriptions, usage, auditLogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          verified: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.organization.count({
        where: { userId }
      }),
      this.prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.usage.findMany({
        where: { userId },
        orderBy: { month: 'desc' },
        take: 6
      }),
      this.prisma.auditLog.count({
        where: { userId }
      })
    ]);

    return {
      user,
      organizations,
      subscriptions,
      usage,
      auditLogs
    };
  }

  // ===========================================
  // UTILITIES
  // ===========================================

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      return user?.role === 'ADMIN' || user?.role === 'MODERATOR';
    } catch (error) {
      return false;
    }
  }

  async validateAdminPermission(userId: string, requiredRole: 'ADMIN' | 'MODERATOR' = 'MODERATOR'): Promise<AdminUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) return null;

      if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
        return null;
      }

      if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
        return null;
      }

      return user as AdminUser;
    } catch (error) {
      return null;
    }
  }
}

// Factory function to create admin service instance
export function createAdminService(prisma: PrismaClient, fastify: FastifyInstance): AdminService {
  return new AdminService(prisma, fastify);
}
