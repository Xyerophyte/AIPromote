import { prisma } from './database';
import { stripeService } from './stripe-service';
import { UsageMetricType } from '@prisma/client';

export interface PlanLimits {
  postsPerMonth?: number;
  strategies?: number;
  organizations?: number;
  analytics?: boolean;
  teamMembers?: number;
  autoScheduling?: boolean;
  advancedAnalytics?: boolean;
  prioritySupport?: boolean;
  customIntegrations?: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
  resetDate?: Date;
}

export class UsageTrackingService {
  
  /**
   * Track usage for a specific metric
   */
  async trackUsage(
    userId: string,
    metricType: UsageMetricType,
    quantity: number = 1,
    organizationId?: string
  ): Promise<void> {
    try {
      // Get user's subscription
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Record usage in Stripe
      await stripeService.recordUsage({
        subscriptionId: subscription.id,
        userId,
        metricType,
        quantity,
      });

      // Update monthly usage counter
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const updateData: any = {};
      switch (metricType) {
        case 'POSTS_GENERATED':
          updateData.postsGenerated = { increment: quantity };
          break;
        case 'POSTS_PUBLISHED':
          updateData.postsPublished = { increment: quantity };
          break;
        case 'STRATEGIES_GENERATED':
          updateData.strategiesGenerated = { increment: quantity };
          break;
        case 'ORGANIZATIONS_CREATED':
          updateData.organizationsCreated = { increment: quantity };
          break;
      }

      await prisma.usage.upsert({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
        update: updateData,
        create: {
          userId,
          month: currentMonth,
          ...Object.keys(updateData).reduce((acc, key) => {
            acc[key] = quantity;
            return acc;
          }, {} as any),
        },
      });

      console.log(`Usage tracked: ${metricType} +${quantity} for user ${userId}`);
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform an action based on their plan limits
   */
  async checkUsageLimit(
    userId: string,
    metricType: UsageMetricType,
    requestedQuantity: number = 1
  ): Promise<UsageCheckResult> {
    try {
      // Get user's subscription and plan
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
      });

      if (!subscription) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          remaining: 0,
        };
      }

      const planLimits = subscription.plan.limits as PlanLimits;

      // Get current month usage
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usage = await prisma.usage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      // Calculate reset date (end of current month)
      const resetDate = new Date(currentMonth);
      resetDate.setMonth(resetDate.getMonth() + 1);
      resetDate.setDate(0);
      resetDate.setHours(23, 59, 59, 999);

      // Check specific metric limits
      switch (metricType) {
        case 'POSTS_GENERATED':
        case 'POSTS_PUBLISHED':
          const postsLimit = planLimits.postsPerMonth;
          const currentPosts = usage?.postsGenerated || 0;
          
          if (postsLimit === undefined || postsLimit === null) {
            return { allowed: true, current: currentPosts, limit: null, remaining: null };
          }
          
          return {
            allowed: currentPosts + requestedQuantity <= postsLimit,
            current: currentPosts,
            limit: postsLimit,
            remaining: Math.max(0, postsLimit - currentPosts),
            resetDate,
          };

        case 'STRATEGIES_GENERATED':
          const strategiesLimit = planLimits.strategies;
          const currentStrategies = usage?.strategiesGenerated || 0;
          
          if (strategiesLimit === undefined || strategiesLimit === null) {
            return { allowed: true, current: currentStrategies, limit: null, remaining: null };
          }
          
          return {
            allowed: currentStrategies + requestedQuantity <= strategiesLimit,
            current: currentStrategies,
            limit: strategiesLimit,
            remaining: Math.max(0, strategiesLimit - currentStrategies),
            resetDate,
          };

        case 'ORGANIZATIONS_CREATED':
          const organizationsLimit = planLimits.organizations;
          const currentOrganizations = usage?.organizationsCreated || 0;
          
          if (organizationsLimit === undefined || organizationsLimit === null) {
            return { allowed: true, current: currentOrganizations, limit: null, remaining: null };
          }
          
          return {
            allowed: currentOrganizations + requestedQuantity <= organizationsLimit,
            current: currentOrganizations,
            limit: organizationsLimit,
            remaining: Math.max(0, organizationsLimit - currentOrganizations),
            resetDate,
          };

        default:
          return { allowed: true, current: 0, limit: null, remaining: null };
      }
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(userId: string, feature: keyof PlanLimits): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
      });

      if (!subscription) {
        return false;
      }

      const planLimits = subscription.plan.limits as PlanLimits;
      const featureValue = planLimits[feature];

      // For boolean features, return the boolean value (default to false)
      if (typeof featureValue === 'boolean') {
        return featureValue;
      }

      // For numeric features, return true if greater than 0
      if (typeof featureValue === 'number') {
        return featureValue > 0;
      }

      // If feature is not defined, default to false
      return false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get user's current usage for all metrics
   */
  async getUserUsage(userId: string): Promise<any> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usage = await prisma.usage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
      });

      const planLimits = subscription?.plan.limits as PlanLimits || {};

      return {
        usage: usage || {
          postsGenerated: 0,
          postsPublished: 0,
          strategiesGenerated: 0,
          organizationsCreated: 0,
        },
        limits: planLimits,
        plan: subscription?.plan,
        resetDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for analytics
   */
  async getUsageAnalytics(userId: string, months: number = 6): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const usageHistory = await prisma.usage.findMany({
        where: {
          userId,
          month: { gte: startDate },
        },
        orderBy: { month: 'asc' },
      });

      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
      });

      return {
        history: usageHistory,
        plan: subscription?.plan,
        totalMonths: months,
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      throw error;
    }
  }

  /**
   * Middleware function to check usage limits before API calls
   */
  createUsageLimitMiddleware(metricType: UsageMetricType, quantity: number = 1) {
    return async (request: any, reply: any, next: any) => {
      try {
        const userId = request.user?.id;
        
        if (!userId) {
          reply.status(401).send({ error: 'Authentication required' });
          return;
        }

        const usageCheck = await this.checkUsageLimit(userId, metricType, quantity);
        
        if (!usageCheck.allowed) {
          reply.status(429).send({
            error: 'Usage limit exceeded',
            details: {
              current: usageCheck.current,
              limit: usageCheck.limit,
              remaining: usageCheck.remaining,
              resetDate: usageCheck.resetDate,
            },
          });
          return;
        }

        // Add usage tracking to request context
        request.trackUsage = async (actualQuantity?: number) => {
          await this.trackUsage(userId, metricType, actualQuantity || quantity);
        };

        next();
      } catch (error) {
        console.error('Usage limit middleware error:', error);
        reply.status(500).send({ error: 'Failed to check usage limits' });
      }
    };
  }

  /**
   * Sync usage from existing data (for initial setup or corrections)
   */
  async syncUsageFromData(userId: string): Promise<void> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Count actual usage from database
      const [postsCount, strategiesCount, organizationsCount] = await Promise.all([
        prisma.contentPiece.count({
          where: {
            organization: { userId },
            createdAt: {
              gte: currentMonth,
              lt: nextMonth,
            },
          },
        }),
        prisma.aIStrategy.count({
          where: {
            organization: { userId },
            createdAt: {
              gte: currentMonth,
              lt: nextMonth,
            },
          },
        }),
        prisma.organization.count({
          where: {
            userId,
            createdAt: {
              gte: currentMonth,
              lt: nextMonth,
            },
          },
        }),
      ]);

      // Update usage record
      await prisma.usage.upsert({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
        update: {
          postsGenerated: postsCount,
          strategiesGenerated: strategiesCount,
          organizationsCreated: organizationsCount,
        },
        create: {
          userId,
          month: currentMonth,
          postsGenerated: postsCount,
          strategiesGenerated: strategiesCount,
          organizationsCreated: organizationsCount,
        },
      });

      console.log(`Usage synced for user ${userId}:`, {
        postsGenerated: postsCount,
        strategiesGenerated: strategiesCount,
        organizationsCreated: organizationsCount,
      });
    } catch (error) {
      console.error('Error syncing usage from data:', error);
      throw error;
    }
  }
}

export const usageTrackingService = new UsageTrackingService();
