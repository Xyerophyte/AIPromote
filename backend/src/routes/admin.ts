import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Admin schemas
const AdminUserUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  plan: z.string().optional(),
  verified: z.boolean().optional(),
});

const AdminContentModerationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'FLAG', 'HIDE', 'DELETE']),
  reason: z.string().optional(),
  note: z.string().optional(),
});

const AdminFeatureFlagSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  targetUsers: z.array(z.string()).optional(),
  conditions: z.record(z.unknown()).optional(),
});

const AdminAuditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  resource: z.string().optional(),
});

const AdminSupportTicketSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
  note: z.string().optional(),
});

// Middleware to check admin role
async function requireAdmin(request: any, reply: any) {
  const userId = request.headers['x-user-id'];
  if (!userId) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  try {
    const user = await request.server.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true }
    });

    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    request.adminUser = user;
  } catch (error) {
    return reply.code(500).send({ error: 'Authentication error' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Add admin middleware to all routes
  fastify.addHook('preHandler', requireAdmin);

  // ===========================================
  // USER MANAGEMENT
  // ===========================================

  // Get all users with pagination and filters
  fastify.get('/users', async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        role, 
        plan, 
        verified,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query as any;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (role) where.role = role;
      if (plan) where.plan = plan;
      if (verified !== undefined) where.verified = verified === 'true';

      const [users, totalCount] = await Promise.all([
        fastify.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            plan: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                organizations: true,
                subscriptions: true,
                usage: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        fastify.prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Admin get users error:', error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Get user details
  fastify.get('/users/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          organizations: {
            include: {
              _count: {
                select: {
                  contentPieces: true,
                  scheduledPosts: true,
                  socialAccounts: true
                }
              }
            }
          },
          subscriptions: {
            include: {
              plan: true,
              usageRecords: {
                orderBy: { createdAt: 'desc' },
                take: 10
              }
            }
          },
          usage: {
            orderBy: { month: 'desc' },
            take: 6
          }
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Remove sensitive data
      const { passwordHash, ...userResponse } = user;
      return userResponse;
    } catch (error) {
      fastify.log.error('Admin get user error:', error);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    }
  });

  // Update user
  fastify.patch('/users/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const updates = AdminUserUpdateSchema.parse(request.body);

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          verified: true,
          updatedAt: true
        }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'USER_UPDATE',
          resource: 'User',
          resourceId: userId,
          details: {
            changes: updates,
            adminEmail: request.adminUser.email
          }
        }
      });

      return updatedUser;
    } catch (error) {
      fastify.log.error('Admin update user error:', error);
      return reply.code(500).send({ error: 'Failed to update user' });
    }
  });

  // Delete user (soft delete)
  fastify.delete('/users/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      // Soft delete by setting a deleted flag or updating email
      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${Date.now()}_${userId}@deleted.local`,
          verified: false,
          role: 'USER'
        }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'USER_DELETE',
          resource: 'User',
          resourceId: userId,
          details: {
            adminEmail: request.adminUser.email
          }
        }
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      fastify.log.error('Admin delete user error:', error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });

  // ===========================================
  // CONTENT MODERATION
  // ===========================================

  // Get content pending moderation
  fastify.get('/moderation/content', async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        platform, 
        status = 'PENDING_REVIEW',
        flagged = false 
      } = request.query as any;

      const where: any = { status };
      if (platform) where.platform = platform;

      const content = await fastify.prisma.contentPiece.findMany({
        where,
        include: {
          organization: {
            select: { name: true, user: { select: { email: true } } }
          },
          pillar: { select: { name: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const totalCount = await fastify.prisma.contentPiece.count({ where });

      return {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Admin get moderation content error:', error);
      return reply.code(500).send({ error: 'Failed to fetch content' });
    }
  });

  // Moderate content
  fastify.post('/moderation/content/:contentId', async (request, reply) => {
    try {
      const { contentId } = request.params as { contentId: string };
      const moderation = AdminContentModerationSchema.parse(request.body);

      let newStatus: string;
      switch (moderation.action) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          break;
        case 'REJECT':
          newStatus = 'DRAFT';
          break;
        case 'HIDE':
        case 'DELETE':
          newStatus = 'ARCHIVED';
          break;
        default:
          newStatus = 'PENDING_REVIEW';
      }

      const updatedContent = await fastify.prisma.contentPiece.update({
        where: { id: contentId },
        data: { 
          status: newStatus as any,
          updatedAt: new Date()
        }
      });

      // Create moderation log
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: `CONTENT_${moderation.action}`,
          resource: 'ContentPiece',
          resourceId: contentId,
          details: {
            action: moderation.action,
            reason: moderation.reason,
            note: moderation.note,
            adminEmail: request.adminUser.email
          }
        }
      });

      return updatedContent;
    } catch (error) {
      fastify.log.error('Admin moderate content error:', error);
      return reply.code(500).send({ error: 'Failed to moderate content' });
    }
  });

  // Get flagged users/organizations
  fastify.get('/moderation/flagged', async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as any;

      // Get organizations with high rejection rates or suspicious activity
      const flaggedOrganizations = await fastify.prisma.organization.findMany({
        include: {
          user: { select: { email: true, name: true } },
          _count: {
            select: {
              contentPieces: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return {
        flagged: flaggedOrganizations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: flaggedOrganizations.length
        }
      };
    } catch (error) {
      fastify.log.error('Admin get flagged error:', error);
      return reply.code(500).send({ error: 'Failed to fetch flagged items' });
    }
  });

  // ===========================================
  // SYSTEM HEALTH MONITORING
  // ===========================================

  // Get system health metrics
  fastify.get('/health/system', async (request, reply) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Database health
      const [
        userCount,
        activeUsers,
        contentCount,
        scheduledPostsCount,
        failedPostsCount,
        activeSubscriptions
      ] = await Promise.all([
        fastify.prisma.user.count(),
        fastify.prisma.user.count({
          where: { updatedAt: { gte: oneWeekAgo } }
        }),
        fastify.prisma.contentPiece.count(),
        fastify.prisma.scheduledPost.count({
          where: { status: 'SCHEDULED' }
        }),
        fastify.prisma.scheduledPost.count({
          where: { 
            status: 'FAILED',
            createdAt: { gte: oneDayAgo }
          }
        }),
        fastify.prisma.subscription.count({
          where: { status: 'ACTIVE' }
        })
      ]);

      // Get recent errors from audit logs
      const recentErrors = await fastify.prisma.auditLog.count({
        where: {
          action: { contains: 'ERROR' },
          createdAt: { gte: oneDayAgo }
        }
      });

      // System performance metrics
      const performanceMetrics = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      };

      return {
        database: {
          totalUsers: userCount,
          activeUsers,
          totalContent: contentCount,
          scheduledPosts: scheduledPostsCount,
          failedPosts: failedPostsCount,
          activeSubscriptions
        },
        errors: {
          recentErrors
        },
        performance: performanceMetrics,
        status: failedPostsCount > 10 ? 'DEGRADED' : 'HEALTHY',
        timestamp: now
      };
    } catch (error) {
      fastify.log.error('Admin health check error:', error);
      return reply.code(500).send({ error: 'Failed to get system health' });
    }
  });

  // Get detailed error logs
  fastify.get('/health/errors', async (request, reply) => {
    try {
      const { page = 1, limit = 50 } = request.query as any;

      const errors = await fastify.prisma.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: 'ERROR' } },
            { action: { contains: 'FAILED' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      return { errors };
    } catch (error) {
      fastify.log.error('Admin get errors error:', error);
      return reply.code(500).send({ error: 'Failed to fetch errors' });
    }
  });

  // ===========================================
  // USAGE ANALYTICS DASHBOARD
  // ===========================================

  // Get platform analytics
  fastify.get('/analytics/overview', async (request, reply) => {
    try {
      const { timeframe = '7d' } = request.query as any;
      
      let startDate: Date;
      const now = new Date();
      
      switch (timeframe) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
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
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const [
        userGrowth,
        contentStats,
        platformStats,
        revenueStats,
        engagementStats
      ] = await Promise.all([
        // User growth
        fastify.prisma.user.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        
        // Content statistics
        fastify.prisma.contentPiece.groupBy({
          by: ['status', 'platform'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        
        // Platform usage
        fastify.prisma.scheduledPost.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        
        // Revenue (from active subscriptions)
        fastify.prisma.subscription.findMany({
          where: { 
            status: 'ACTIVE',
            createdAt: { gte: startDate }
          },
          include: { plan: true }
        }),
        
        // Engagement metrics
        fastify.prisma.analytics.aggregate({
          where: { createdAt: { gte: startDate } },
          _avg: { engagementRate: true },
          _sum: { 
            impressions: true, 
            likes: true, 
            comments: true, 
            shares: true 
          }
        })
      ]);

      // Calculate revenue
      const monthlyRevenue = revenueStats.reduce((total, sub) => {
        return total + (sub.plan?.priceMonthly || 0);
      }, 0) / 100; // Convert from cents

      return {
        timeframe,
        userGrowth: userGrowth.length,
        contentStats,
        platformStats,
        revenue: {
          monthly: monthlyRevenue,
          activeSubscriptions: revenueStats.length
        },
        engagement: engagementStats,
        generatedAt: now
      };
    } catch (error) {
      fastify.log.error('Admin analytics overview error:', error);
      return reply.code(500).send({ error: 'Failed to fetch analytics' });
    }
  });

  // Get user activity analytics
  fastify.get('/analytics/users', async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as any;

      const userActivity = await fastify.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              organizations: true,
              subscriptions: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return { users: userActivity };
    } catch (error) {
      fastify.log.error('Admin user analytics error:', error);
      return reply.code(500).send({ error: 'Failed to fetch user analytics' });
    }
  });

  // ===========================================
  // FEATURE FLAG MANAGEMENT
  // ===========================================

  // Get all feature flags
  fastify.get('/feature-flags', async (request, reply) => {
    try {
      const flags = await fastify.prisma.featureFlag.findMany({
        orderBy: { name: 'asc' }
      });

      return { flags };
    } catch (error) {
      fastify.log.error('Admin get feature flags error:', error);
      return reply.code(500).send({ error: 'Failed to fetch feature flags' });
    }
  });

  // Create feature flag
  fastify.post('/feature-flags', async (request, reply) => {
    try {
      const flagData = AdminFeatureFlagSchema.parse(request.body);

      const flag = await fastify.prisma.featureFlag.create({
        data: {
          ...flagData,
          createdBy: request.adminUser.id
        }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'FEATURE_FLAG_CREATE',
          resource: 'FeatureFlag',
          resourceId: flag.id,
          details: {
            flag: flagData,
            adminEmail: request.adminUser.email
          }
        }
      });

      return flag;
    } catch (error) {
      fastify.log.error('Admin create feature flag error:', error);
      return reply.code(500).send({ error: 'Failed to create feature flag' });
    }
  });

  // Update feature flag
  fastify.patch('/feature-flags/:flagId', async (request, reply) => {
    try {
      const { flagId } = request.params as { flagId: string };
      const updates = AdminFeatureFlagSchema.partial().parse(request.body);

      const flag = await fastify.prisma.featureFlag.update({
        where: { id: flagId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'FEATURE_FLAG_UPDATE',
          resource: 'FeatureFlag',
          resourceId: flagId,
          details: {
            changes: updates,
            adminEmail: request.adminUser.email
          }
        }
      });

      return flag;
    } catch (error) {
      fastify.log.error('Admin update feature flag error:', error);
      return reply.code(500).send({ error: 'Failed to update feature flag' });
    }
  });

  // Delete feature flag
  fastify.delete('/feature-flags/:flagId', async (request, reply) => {
    try {
      const { flagId } = request.params as { flagId: string };

      await fastify.prisma.featureFlag.delete({
        where: { id: flagId }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'FEATURE_FLAG_DELETE',
          resource: 'FeatureFlag',
          resourceId: flagId,
          details: {
            adminEmail: request.adminUser.email
          }
        }
      });

      return { message: 'Feature flag deleted successfully' };
    } catch (error) {
      fastify.log.error('Admin delete feature flag error:', error);
      return reply.code(500).send({ error: 'Failed to delete feature flag' });
    }
  });

  // ===========================================
  // AUDIT LOGGING
  // ===========================================

  // Get audit logs
  fastify.get('/audit-logs', async (request, reply) => {
    try {
      const filters = AdminAuditLogFilterSchema.parse(request.query);
      const { page = 1, limit = 50 } = request.query as any;

      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = { contains: filters.action };
      if (filters.resource) where.resource = filters.resource;
      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      }

      const [logs, totalCount] = await Promise.all([
        fastify.prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { email: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.auditLog.count({ where })
      ]);

      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Admin get audit logs error:', error);
      return reply.code(500).send({ error: 'Failed to fetch audit logs' });
    }
  });

  // Get audit log statistics
  fastify.get('/audit-logs/stats', async (request, reply) => {
    try {
      const { timeframe = '7d' } = request.query as any;
      
      let startDate: Date;
      const now = new Date();
      
      switch (timeframe) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const [actionStats, userStats, resourceStats] = await Promise.all([
        fastify.prisma.auditLog.groupBy({
          by: ['action'],
          where: { createdAt: { gte: startDate } },
          _count: true,
          orderBy: { _count: { action: 'desc' } }
        }),
        fastify.prisma.auditLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: startDate } },
          _count: true,
          orderBy: { _count: { userId: 'desc' } }
        }),
        fastify.prisma.auditLog.groupBy({
          by: ['resource'],
          where: { createdAt: { gte: startDate } },
          _count: true,
          orderBy: { _count: { resource: 'desc' } }
        })
      ]);

      return {
        timeframe,
        actionStats,
        userStats: userStats.slice(0, 10), // Top 10 users
        resourceStats,
        generatedAt: now
      };
    } catch (error) {
      fastify.log.error('Admin audit stats error:', error);
      return reply.code(500).send({ error: 'Failed to fetch audit statistics' });
    }
  });

  // ===========================================
  // CUSTOMER SUPPORT TOOLS
  // ===========================================

  // Get support tickets
  fastify.get('/support/tickets', async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status,
        priority,
        assignedTo,
        search 
      } = request.query as any;

      const where: any = {};
      
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assignedTo) where.assignedTo = assignedTo;
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [tickets, totalCount] = await Promise.all([
        fastify.prisma.supportTicket.findMany({
          where,
          include: {
            user: { select: { id: true, email: true, name: true } },
            assignedToUser: { select: { id: true, email: true, name: true } },
            _count: { select: { responses: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.supportTicket.count({ where })
      ]);

      return {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      fastify.log.error('Admin get support tickets error:', error);
      return reply.code(500).send({ error: 'Failed to fetch support tickets' });
    }
  });

  // Get support ticket details
  fastify.get('/support/tickets/:ticketId', async (request, reply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };

      const ticket = await fastify.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: { 
            select: { 
              id: true, 
              email: true, 
              name: true, 
              plan: true,
              organizations: { 
                select: { id: true, name: true } 
              }
            } 
          },
          assignedToUser: { select: { id: true, email: true, name: true } },
          responses: {
            include: {
              user: { select: { id: true, email: true, name: true, role: true } }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!ticket) {
        return reply.code(404).send({ error: 'Support ticket not found' });
      }

      return ticket;
    } catch (error) {
      fastify.log.error('Admin get support ticket error:', error);
      return reply.code(500).send({ error: 'Failed to fetch support ticket' });
    }
  });

  // Update support ticket
  fastify.patch('/support/tickets/:ticketId', async (request, reply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      const updates = AdminSupportTicketSchema.parse(request.body);

      const ticket = await fastify.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Log admin action
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.adminUser.id,
          action: 'SUPPORT_TICKET_UPDATE',
          resource: 'SupportTicket',
          resourceId: ticketId,
          details: {
            changes: updates,
            adminEmail: request.adminUser.email
          }
        }
      });

      return ticket;
    } catch (error) {
      fastify.log.error('Admin update support ticket error:', error);
      return reply.code(500).send({ error: 'Failed to update support ticket' });
    }
  });

  // Add response to support ticket
  fastify.post('/support/tickets/:ticketId/responses', async (request, reply) => {
    try {
      const { ticketId } = request.params as { ticketId: string };
      const { content, isInternal = false } = request.body as any;

      const response = await fastify.prisma.supportTicketResponse.create({
        data: {
          ticketId,
          userId: request.adminUser.id,
          content,
          isInternal,
          userType: 'ADMIN'
        },
        include: {
          user: { select: { id: true, email: true, name: true, role: true } }
        }
      });

      // Update ticket status if it was resolved
      if (!isInternal) {
        await fastify.prisma.supportTicket.update({
          where: { id: ticketId },
          data: { 
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          }
        });
      }

      return response;
    } catch (error) {
      fastify.log.error('Admin add ticket response error:', error);
      return reply.code(500).send({ error: 'Failed to add ticket response' });
    }
  });

  // Get support statistics
  fastify.get('/support/stats', async (request, reply) => {
    try {
      const { timeframe = '30d' } = request.query as any;
      
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
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime,
        ticketsByPriority,
        ticketsByStatus
      ] = await Promise.all([
        fastify.prisma.supportTicket.count({
          where: { createdAt: { gte: startDate } }
        }),
        fastify.prisma.supportTicket.count({
          where: { 
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            createdAt: { gte: startDate } 
          }
        }),
        fastify.prisma.supportTicket.count({
          where: { 
            status: 'RESOLVED',
            createdAt: { gte: startDate } 
          }
        }),
        // Calculate average response time (simplified)
        fastify.prisma.supportTicketResponse.aggregate({
          where: { 
            createdAt: { gte: startDate },
            userType: 'ADMIN'
          },
          _avg: { id: true } // Placeholder for actual response time calculation
        }),
        fastify.prisma.supportTicket.groupBy({
          by: ['priority'],
          where: { createdAt: { gte: startDate } },
          _count: true
        }),
        fastify.prisma.supportTicket.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: true
        })
      ]);

      return {
        timeframe,
        totalTickets,
        openTickets,
        resolvedTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
        ticketsByPriority,
        ticketsByStatus,
        generatedAt: now
      };
    } catch (error) {
      fastify.log.error('Admin support stats error:', error);
      return reply.code(500).send({ error: 'Failed to fetch support statistics' });
    }
  });

  // Export data endpoint
  fastify.post('/export/:type', async (request, reply) => {
    try {
      const { type } = request.params as { type: string };
      const { format = 'csv', filters = {} } = request.body as any;

      // Handle different export types
      let data: any[];
      let filename: string;

      switch (type) {
        case 'users':
          data = await fastify.prisma.user.findMany({
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              verified: true,
              createdAt: true
            }
          });
          filename = `users_export_${Date.now()}.${format}`;
          break;
        
        case 'content':
          data = await fastify.prisma.contentPiece.findMany({
            include: {
              organization: { select: { name: true } }
            }
          });
          filename = `content_export_${Date.now()}.${format}`;
          break;
        
        case 'audit-logs':
          data = await fastify.prisma.auditLog.findMany({
            include: {
              user: { select: { email: true } }
            }
          });
          filename = `audit_logs_export_${Date.now()}.${format}`;
          break;
        
        default:
          return reply.code(400).send({ error: 'Invalid export type' });
      }

      // For now, return the data directly
      // In production, you would generate the file and return a download URL
      return {
        message: 'Export generated successfully',
        filename,
        recordCount: data.length,
        downloadUrl: `/admin/downloads/${filename}` // Placeholder
      };
    } catch (error) {
      fastify.log.error('Admin export error:', error);
      return reply.code(500).send({ error: 'Failed to export data' });
    }
  });
}
