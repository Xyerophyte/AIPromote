import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { AdminService } from '../services/admin-service';

interface HealthCheck {
  name: string;
  metric: string;
  check: () => Promise<{ value: number; status: 'HEALTHY' | 'WARNING' | 'CRITICAL'; details?: any }>;
  threshold: {
    warning: number;
    critical: number;
  };
}

export class AdminHealthWorker {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;
  private adminService: AdminService;
  private isRunning = false;

  constructor(prisma: PrismaClient, fastify: FastifyInstance, adminService: AdminService) {
    this.prisma = prisma;
    this.fastify = fastify;
    this.adminService = adminService;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Health checks every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.runHealthChecks().catch(error => {
        this.fastify.log.error('Health check failed:', error);
      });
    });

    // System metrics collection every minute
    cron.schedule('* * * * *', () => {
      this.collectSystemMetrics().catch(error => {
        this.fastify.log.error('System metrics collection failed:', error);
      });
    });

    // Cleanup old metrics daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.cleanupOldMetrics().catch(error => {
        this.fastify.log.error('Metrics cleanup failed:', error);
      });
    });

    this.fastify.log.info('Admin health worker started');
  }

  stop() {
    this.isRunning = false;
    this.fastify.log.info('Admin health worker stopped');
  }

  private async runHealthChecks() {
    const checks: HealthCheck[] = [
      {
        name: 'Database Connection',
        metric: 'DATABASE_CONNECTIONS',
        check: this.checkDatabaseHealth.bind(this),
        threshold: { warning: 80, critical: 95 }
      },
      {
        name: 'Memory Usage',
        metric: 'MEMORY_USAGE',
        check: this.checkMemoryUsage.bind(this),
        threshold: { warning: 80, critical: 90 }
      },
      {
        name: 'Failed Posts',
        metric: 'FAILED_JOBS',
        check: this.checkFailedPosts.bind(this),
        threshold: { warning: 10, critical: 50 }
      },
      {
        name: 'Response Time',
        metric: 'RESPONSE_TIME',
        check: this.checkResponseTime.bind(this),
        threshold: { warning: 1000, critical: 3000 }
      },
      {
        name: 'Error Rate',
        metric: 'ERROR_RATE',
        check: this.checkErrorRate.bind(this),
        threshold: { warning: 5, critical: 10 }
      },
      {
        name: 'Active Users',
        metric: 'ACTIVE_USERS',
        check: this.checkActiveUsers.bind(this),
        threshold: { warning: 0, critical: 0 }
      }
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        let status = result.status;

        // Auto-determine status based on thresholds if not explicitly set
        if (result.status === 'HEALTHY') {
          if (result.value >= check.threshold.critical) {
            status = 'CRITICAL';
          } else if (result.value >= check.threshold.warning) {
            status = 'WARNING';
          }
        }

        await this.adminService.recordSystemMetric({
          metric: check.metric,
          value: result.value,
          status,
          details: result.details,
          tags: ['health-check', check.name.toLowerCase().replace(/\s+/g, '-')]
        });

        // Create alerts for critical issues
        if (status === 'CRITICAL') {
          await this.createHealthAlert(check.name, result.value, result.details);
        }

      } catch (error) {
        this.fastify.log.error(`Health check failed for ${check.name}:`, error);
        
        await this.adminService.recordSystemMetric({
          metric: check.metric,
          value: -1,
          status: 'UNKNOWN',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          tags: ['health-check', 'error']
        });
      }
    }
  }

  private async collectSystemMetrics() {
    try {
      // CPU and Memory
      const memUsage = process.memoryUsage();
      const memUsedMB = memUsage.heapUsed / 1024 / 1024;
      const memTotalMB = memUsage.heapTotal / 1024 / 1024;

      await this.adminService.recordSystemMetric({
        metric: 'MEMORY_USAGE',
        value: (memUsedMB / memTotalMB) * 100,
        unit: 'percent',
        status: 'HEALTHY',
        details: { used: memUsedMB, total: memTotalMB }
      });

      // Process uptime
      await this.adminService.recordSystemMetric({
        metric: 'CPU_USAGE',
        value: process.uptime(),
        unit: 'seconds',
        status: 'HEALTHY'
      });

      // Get database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      for (const metric of dbMetrics) {
        await this.adminService.recordSystemMetric(metric);
      }

    } catch (error) {
      this.fastify.log.error('Failed to collect system metrics:', error);
    }
  }

  private async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        value: responseTime,
        status: responseTime < 100 ? 'HEALTHY' as const : 'WARNING' as const,
        details: { responseTime }
      };
    } catch (error) {
      return {
        value: -1,
        status: 'CRITICAL' as const,
        details: { error: error instanceof Error ? error.message : 'Connection failed' }
      };
    }
  }

  private async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memUsedMB = memUsage.heapUsed / 1024 / 1024;
    const memTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (memUsedMB / memTotalMB) * 100;

    return {
      value: usagePercent,
      status: 'HEALTHY' as const,
      details: { used: memUsedMB, total: memTotalMB, percent: usagePercent }
    };
  }

  private async checkFailedPosts() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const failedCount = await this.prisma.scheduledPost.count({
      where: {
        status: 'FAILED',
        lastAttemptAt: { gte: oneHourAgo }
      }
    });

    return {
      value: failedCount,
      status: 'HEALTHY' as const,
      details: { failedInLastHour: failedCount }
    };
  }

  private async checkResponseTime() {
    // Simple response time check by measuring a basic query
    const start = Date.now();
    try {
      await this.prisma.user.count();
      const responseTime = Date.now() - start;

      return {
        value: responseTime,
        status: 'HEALTHY' as const,
        details: { responseTime }
      };
    } catch (error) {
      return {
        value: -1,
        status: 'CRITICAL' as const,
        details: { error: error instanceof Error ? error.message : 'Query failed' }
      };
    }
  }

  private async checkErrorRate() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [totalActions, errorActions] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: oneHourAgo } }
      }),
      this.prisma.auditLog.count({
        where: {
          action: { contains: 'ERROR' },
          createdAt: { gte: oneHourAgo }
        }
      })
    ]);

    const errorRate = totalActions > 0 ? (errorActions / totalActions) * 100 : 0;

    return {
      value: errorRate,
      status: 'HEALTHY' as const,
      details: { totalActions, errorActions, errorRate }
    };
  }

  private async checkActiveUsers() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const activeUsers = await this.prisma.user.count({
      where: { updatedAt: { gte: oneHourAgo } }
    });

    return {
      value: activeUsers,
      status: 'HEALTHY' as const,
      details: { activeInLastHour: activeUsers }
    };
  }

  private async getDatabaseMetrics() {
    const metrics = [];

    try {
      // Table sizes
      const [users, organizations, contentPieces, scheduledPosts] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.organization.count(),
        this.prisma.contentPiece.count(),
        this.prisma.scheduledPost.count()
      ]);

      metrics.push({
        metric: 'DATABASE_CONNECTIONS',
        value: users + organizations + contentPieces + scheduledPosts,
        unit: 'count',
        status: 'HEALTHY' as const,
        details: { users, organizations, contentPieces, scheduledPosts }
      });

      // Queue sizes
      const pendingPosts = await this.prisma.scheduledPost.count({
        where: { status: 'SCHEDULED' }
      });

      metrics.push({
        metric: 'QUEUE_SIZE',
        value: pendingPosts,
        unit: 'count',
        status: 'HEALTHY' as const,
        details: { pendingPosts }
      });

    } catch (error) {
      this.fastify.log.error('Failed to get database metrics:', error);
    }

    return metrics;
  }

  private async createHealthAlert(checkName: string, value: number, details?: any) {
    try {
      await this.adminService.createNotification({
        type: 'SYSTEM_ALERT',
        severity: 'CRITICAL',
        title: `System Health Alert: ${checkName}`,
        message: `Critical threshold exceeded for ${checkName}. Current value: ${value}`,
        targetRoles: ['ADMIN'],
        metadata: { 
          checkName, 
          value, 
          details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this.fastify.log.error('Failed to create health alert:', error);
    }
  }

  private async cleanupOldMetrics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await this.prisma.systemHealthMetric.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });

      this.fastify.log.info(`Cleaned up ${deletedCount.count} old health metrics`);

      // Also cleanup old audit logs (keep 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deletedAuditLogs = await this.prisma.auditLog.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });

      this.fastify.log.info(`Cleaned up ${deletedAuditLogs.count} old audit logs`);

    } catch (error) {
      this.fastify.log.error('Failed to cleanup old metrics:', error);
    }
  }
}

// Factory function to create and start the health worker
export function createAdminHealthWorker(
  prisma: PrismaClient, 
  fastify: FastifyInstance, 
  adminService: AdminService
): AdminHealthWorker {
  const worker = new AdminHealthWorker(prisma, fastify, adminService);
  
  // Start the worker automatically
  worker.start();
  
  // Graceful shutdown
  const shutdown = () => {
    worker.stop();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  return worker;
}
