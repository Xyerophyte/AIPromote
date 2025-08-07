import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { config } from '../config/config';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
    memory: HealthStatus;
    disk: HealthStatus;
    external: {
      openai: HealthStatus;
      anthropic: HealthStatus;
      stripe: HealthStatus;
    };
  };
  metrics: {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
    security: SecurityMetrics;
  };
}

interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  responseTime: number;
  message?: string;
  details?: any;
}

interface MemoryMetrics {
  used: number;
  total: number;
  free: number;
  percentage: number;
}

interface PerformanceMetrics {
  cpuUsage: number;
  loadAverage: number[];
  eventLoopDelay: number;
}

interface SecurityMetrics {
  blockedIPs: number;
  suspiciousActivity: number;
  rateLimitViolations: number;
}

const prisma = new PrismaClient();

export default async function healthRoutes(fastify: FastifyInstance) {
  // Detailed health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {
      database: { status: 'fail', responseTime: 0 },
      redis: { status: 'fail', responseTime: 0 },
      memory: { status: 'pass', responseTime: 0 },
      disk: { status: 'pass', responseTime: 0 },
      external: {
        openai: { status: 'pass', responseTime: 0 },
        anthropic: { status: 'pass', responseTime: 0 },
        stripe: { status: 'pass', responseTime: 0 },
      },
    };

    // Database health check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;
      checks.database = {
        status: dbTime < 1000 ? 'pass' : dbTime < 3000 ? 'warn' : 'fail',
        responseTime: dbTime,
        message: dbTime < 1000 ? 'Database responding normally' : 'Database response slow',
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Redis health check
    try {
      const redisStart = Date.now();
      await redis.ping();
      const redisTime = Date.now() - redisStart;
      checks.redis = {
        status: redisTime < 100 ? 'pass' : redisTime < 500 ? 'warn' : 'fail',
        responseTime: redisTime,
        message: redisTime < 100 ? 'Redis responding normally' : 'Redis response slow',
      };
    } catch (error) {
      checks.redis = {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    checks.memory = {
      status: memoryPercentage < 80 ? 'pass' : memoryPercentage < 95 ? 'warn' : 'fail',
      responseTime: 0,
      message: `Memory usage: ${memoryPercentage.toFixed(2)}%`,
      details: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
    };

    // Disk health check (simplified)
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      checks.disk = {
        status: 'pass',
        responseTime: 0,
        message: 'Disk access normal',
      };
    } catch (error) {
      checks.disk = {
        status: 'fail',
        responseTime: 0,
        message: 'Disk access failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // External service health checks (optional, only if API keys are configured)
    if (config.ai.openai.apiKey) {
      checks.external.openai = await checkExternalService('https://api.openai.com/v1/models', {
        'Authorization': `Bearer ${config.ai.openai.apiKey}`,
      });
    }

    if (config.stripe.secretKey) {
      checks.external.stripe = await checkExternalService('https://api.stripe.com/v1/account', {
        'Authorization': `Bearer ${config.stripe.secretKey}`,
      });
    }

    // Collect metrics
    const metrics = await collectMetrics();

    // Determine overall status
    const allChecks = [
      checks.database,
      checks.redis,
      checks.memory,
      checks.disk,
    ];
    
    const failedChecks = allChecks.filter(check => check.status === 'fail').length;
    const warnChecks = allChecks.filter(check => check.status === 'warn').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks > 0) {
      overallStatus = 'unhealthy';
    } else if (warnChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      uptime: Math.floor(process.uptime()),
      checks,
      metrics,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    reply.code(statusCode).send(result);
  });

  // Simple health check for load balancers
  fastify.get('/health/simple', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Quick database ping
      await prisma.$queryRaw`SELECT 1`;
      
      reply.code(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      });
    }
  });

  // Liveness probe (Kubernetes compatible)
  fastify.get('/health/live', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.code(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  });

  // Readiness probe (Kubernetes compatible)
  fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if all critical services are ready
      await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        redis.ping(),
      ]);

      reply.code(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      reply.code(503).send({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Metrics endpoint for Prometheus/monitoring
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await collectDetailedMetrics();
    
    // Format as Prometheus metrics
    let prometheusMetrics = '';
    
    // Process metrics
    prometheusMetrics += `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n`;
    prometheusMetrics += `# TYPE process_cpu_user_seconds_total counter\n`;
    prometheusMetrics += `process_cpu_user_seconds_total ${process.cpuUsage().user / 1000000}\n`;
    
    prometheusMetrics += `# HELP process_memory_heap_bytes Process heap memory in bytes.\n`;
    prometheusMetrics += `# TYPE process_memory_heap_bytes gauge\n`;
    prometheusMetrics += `process_memory_heap_bytes ${process.memoryUsage().heapUsed}\n`;
    
    prometheusMetrics += `# HELP process_uptime_seconds Process uptime in seconds.\n`;
    prometheusMetrics += `# TYPE process_uptime_seconds counter\n`;
    prometheusMetrics += `process_uptime_seconds ${Math.floor(process.uptime())}\n`;
    
    // Custom application metrics
    prometheusMetrics += `# HELP app_blocked_ips_total Total number of blocked IPs.\n`;
    prometheusMetrics += `# TYPE app_blocked_ips_total gauge\n`;
    prometheusMetrics += `app_blocked_ips_total ${metrics.security.blockedIPs}\n`;
    
    prometheusMetrics += `# HELP app_rate_limit_violations_total Total rate limit violations.\n`;
    prometheusMetrics += `# TYPE app_rate_limit_violations_total counter\n`;
    prometheusMetrics += `app_rate_limit_violations_total ${metrics.security.rateLimitViolations}\n`;

    reply.type('text/plain').send(prometheusMetrics);
  });
}

// Helper function to check external services
async function checkExternalService(url: string, headers: Record<string, string>): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'pass' : 'warn',
      responseTime,
      message: response.ok ? 'Service responding' : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: 'Service unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Collect basic metrics
async function collectMetrics(): Promise<HealthCheckResult['metrics']> {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Get security metrics from Redis
  let securityMetrics: SecurityMetrics;
  try {
    const blockedIPsCount = (await redis.keys('blocked_ip:*')).length;
    const suspiciousIPsCount = (await redis.keys('suspicious:*')).length;
    const rateLimitKeys = await redis.keys('rate_limit:*');
    
    securityMetrics = {
      blockedIPs: blockedIPsCount,
      suspiciousActivity: suspiciousIPsCount,
      rateLimitViolations: rateLimitKeys.length,
    };
  } catch (error) {
    securityMetrics = {
      blockedIPs: 0,
      suspiciousActivity: 0,
      rateLimitViolations: 0,
    };
  }

  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024),
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    performance: {
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      loadAverage: require('os').loadavg(),
      eventLoopDelay: 0, // This would require additional measurement
    },
    security: securityMetrics,
  };
}

// Collect detailed metrics for Prometheus
async function collectDetailedMetrics() {
  const basicMetrics = await collectMetrics();
  
  return {
    ...basicMetrics,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

// Graceful shutdown handler
export function setupGracefulShutdown(fastify: FastifyInstance) {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    try {
      await fastify.close();
      await prisma.$disconnect();
      redis.disconnect();
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}
