import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/config';
import { authRoutes } from './routes/auth';
import prismaPlugin from './plugins/prisma';

// Security and performance imports
import { 
  securityHeadersMiddleware,
  corsConfig,
  httpsEnforcementMiddleware,
  createRequestSizeMiddleware,
  createTimeoutMiddleware,
  createContentTypeMiddleware,
  requestSizeLimits,
  ipFilter,
  securityLogger 
} from './middleware/security';
import { 
  rateLimitConfigs,
  dynamicRateLimiter,
  suspiciousActivityDetector 
} from './middleware/rate-limiting';
import { 
  sanitizationMiddleware,
  createValidationMiddleware,
  CommonValidations 
} from './middleware/validation';
import { 
  performanceMonitor,
  queryOptimizer,
  connectionPoolOptimizer 
} from './services/performance-monitor';
import { redis } from './config/redis';

// Helper function to check Redis health
async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

const server = fastify({
  logger: config.nodeEnv === 'development' ? {
    level: config.logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  } : {
    level: config.logLevel
  }
});

async function buildServer() {
  // Register database plugin
  await server.register(prismaPlugin);
  
  // ============================================
  // SECURITY MIDDLEWARE (Applied First)
  // ============================================
  
  // HTTPS enforcement in production
  server.addHook('onRequest', httpsEnforcementMiddleware);
  
  // Security headers
  server.addHook('onRequest', securityHeadersMiddleware);
  
  // Request size limits
  server.addHook('onRequest', createRequestSizeMiddleware(requestSizeLimits.default));
  
  // Request timeouts
  server.addHook('onRequest', createTimeoutMiddleware(30000)); // 30 seconds
  
  // Content type validation
  server.addHook('onRequest', createContentTypeMiddleware([
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ]));
  
  // IP filtering (if configured)
  server.addHook('onRequest', ipFilter.createMiddleware());
  
  // Suspicious activity detection
  server.addHook('onRequest', suspiciousActivityDetector.createMiddleware());
  
  // Performance monitoring
  server.addHook('onRequest', performanceMonitor.createMiddleware());
  
  // Input sanitization
  server.addHook('preHandler', sanitizationMiddleware);
  
  // ============================================
  // FASTIFY PLUGINS
  // ============================================
  
  // Enhanced CORS configuration
  await server.register(cors, corsConfig);
  
  // Helmet with enhanced security headers (disabled since we have custom implementation)
  await server.register(helmet, {
    contentSecurityPolicy: false, // We handle this in securityHeadersMiddleware
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    hsts: config.nodeEnv === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
  });
  
  // Redis-based distributed rate limiting
  server.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
  
  // ============================================
  // HEALTH AND MONITORING ENDPOINTS
  // ============================================
  
  // Enhanced health check
  server.get('/health', {
    preHandler: [createRequestSizeMiddleware(1024)] // 1KB limit
  }, async (request, reply) => {
    const health = await performanceMonitor.getSystemHealth();
    const redisHealth = await checkRedisHealth();
    
    const status = redisHealth ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : 503;
    
    return reply.code(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      uptime: health.uptime,
      memory: health.memory,
      redis: redisHealth,
    });
  });
  
  // Performance metrics endpoint (admin only)
  server.get('/metrics', async (request, reply) => {
    const format = (request.query as any)?.format || 'json';
    const metrics = performanceMonitor.exportMetrics(format);
    
    if (format === 'prometheus') {
      reply.type('text/plain');
    }
    
    return metrics;
  });
  
  // Security events endpoint (admin only)
  server.get('/security/events', async (request, reply) => {
    const events = securityLogger.getRecentEvents(100);
    return { events, total: events.length };
  });

  // Register auth routes
  await server.register(authRoutes, { prefix: '/auth' });

  // Register AI strategy routes
  const { aiStrategyRoutes } = await import('./routes/ai-strategy');
  await server.register(aiStrategyRoutes, { prefix: '/api/v1/ai-strategy' });

  // Register content routes
  const { contentRoutes } = await import('./routes/content');
  await server.register(contentRoutes, { prefix: '/api/v1/content' });

  // Register social media routes
  const { socialMediaRoutes } = await import('./routes/social-media');
  await server.register(socialMediaRoutes, { prefix: '/api/v1/social' });

  // Register scheduling routes
  const { schedulingRoutes } = await import('./routes/scheduling');
  await server.register(schedulingRoutes, { prefix: '/api/v1/scheduling' });

  // Register analytics routes
  const { analyticsRoutes } = await import('./routes/analytics');
  await server.register(analyticsRoutes, { prefix: '/api/v1/analytics' });

  // Register billing routes
  const { billingRoutes } = await import('./routes/billing');
  await server.register(billingRoutes, { prefix: '/api/v1/billing' });

  // Register admin routes
  const { adminRoutes } = await import('./routes/admin');
  await server.register(adminRoutes, { prefix: '/api/v1/admin' });

  // API routes will be added here
  server.get('/api/v1', async (request, reply) => {
    return { 
      message: 'AI Promote API v1',
      version: '1.0.0',
      environment: config.nodeEnv
    };
  });

  return server;
}

async function start() {
  try {
    const app = await buildServer();
    
    await app.listen({
      port: config.port,
      host: config.host
    });

    console.log(`🚀 Server running on http://${config.host}:${config.port}`);
    console.log(`📖 Environment: ${config.nodeEnv}`);
    
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  await server.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildServer };
