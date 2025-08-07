import fastify, { FastifyError, FastifyRequest, FastifyReply, RateLimitError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import { config } from './config/config';
import { authRoutes } from './routes/auth';
import { aiStrategyRoutes } from './routes/ai-strategy';
import { contentRoutes } from './routes/content';
import { socialMediaRoutes } from './routes/social-media';
import { schedulingRoutes } from './routes/scheduling';
import { analyticsRoutes } from './routes/analytics';
import { billingRoutes } from './routes/billing';
import { adminRoutes } from './routes/admin';
import { uploadRoutes } from './routes/upload';
import { testRoutes } from './routes/test';
import prismaPlugin from './plugins/prisma';
import { redis } from './config/redis';
import { rateLimitConfigs, dynamicRateLimiter } from './middleware/rate-limiting';
import { 
  securityHeadersMiddleware, 
  corsConfig,
  createRequestSizeMiddleware,
  requestSizeLimits 
} from './middleware/security';
import { sanitizationMiddleware } from './middleware/validation';
import { isRateLimitError } from '../types/fastify';

// Import additional types
import '../types/fastify';

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

// Authentication middleware
async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Authentication required' });
  }
}

const server = fastify({
  logger: config.nodeEnv === 'development' ? {
    level: config.logLevel,
    // temporarily disabled pino-pretty to avoid transport issues
    // transport: {
    //   target: 'pino-pretty',
    //   options: {
    //     translateTime: 'HH:MM:ss Z',
    //     ignore: 'pid,hostname'
    //   }
    // }
  } : {
    level: config.logLevel
  }
});

async function buildServer() {
  // ===========================================
  // CORE PLUGINS & MIDDLEWARE
  // ===========================================
  
  // Register database plugin
  await server.register(prismaPlugin);
  
  // Register JWT authentication
  await server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });
  
  // Register cookie support
  await server.register(cookie, {
    secret: config.jwt.secret,
    parseOptions: {},
  });
  
  // Register multipart support for file uploads
  await server.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100000,
      fields: 10,
      fileSize: requestSizeLimits.fileUpload,
      files: 5,
      headerPairs: 2000,
    },
  });
  
  // Advanced CORS configuration
  await server.register(cors, corsConfig);
  
  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.openai.com', 'https://api.anthropic.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API usage
  });
  
  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    redis: redis,
    nameSpace: 'rate_limit:',
    continueExceeding: true,
  });
  
  // ===========================================
  // GLOBAL HOOKS & MIDDLEWARE
  // ===========================================
  
  // Add authentication middleware decorator
  server.decorate('authenticate', authenticate);
  
  // Security headers hook
  server.addHook('onRequest', securityHeadersMiddleware);
  
  // Input sanitization hook
  server.addHook('preHandler', sanitizationMiddleware);
  
  // Request size validation hook
  server.addHook('onRequest', createRequestSizeMiddleware(requestSizeLimits.default));
  
  // Error handling
  server.setErrorHandler(async (error: any, request, reply) => {
    server.log.error(error);
    
    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: error.retryAfter || 900,
      });
    }
    
    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      });
    }
    
    // JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE' || 
        error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
        error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        error: 'Authentication Error',
        message: 'Invalid or expired token',
      });
    }
    
    // Generic error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.name || 'Error',
      message: statusCode >= 500 ? 'Something went wrong. Please try again later.' : error.message || 'An error occurred',
      ...(config.nodeEnv === 'development' && { stack: error.stack }),
    });
  });
  
  // ===========================================
  // HEALTH & STATUS ENDPOINTS
  // ===========================================
  
  // Health check endpoint
  server.get('/health', async (request, reply) => {
    const redisHealth = await checkRedisHealth();
    
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      services: {
        database: 'connected',
        redis: redisHealth ? 'connected' : 'disconnected',
      },
    });
  });
  
  // API info endpoint
  server.get('/api/v1', async (request, reply) => {
    return reply.send({ 
      message: 'AI Promote API v1',
      version: '1.0.0',
      environment: config.nodeEnv,
      endpoints: {
        auth: '/api/v1/auth',
        aiStrategy: '/api/v1/ai-strategy',
        content: '/api/v1/content',
        social: '/api/v1/social',
        scheduling: '/api/v1/scheduling',
        analytics: '/api/v1/analytics',
        billing: '/api/v1/billing',
        admin: '/api/v1/admin',
        upload: '/api/v1/upload',
      }
    });
  });
  
  // ===========================================
  // ROUTE REGISTRATION
  // ===========================================
  
  // Authentication routes (public)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for auth routes
    fastify.addHook('preHandler', rateLimitConfigs.auth.createMiddleware());
    await fastify.register(authRoutes);
  }, { 
    prefix: '/api/v1/auth'
  });
  
  // AI Strategy routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting and request size middleware for AI strategy routes
    fastify.addHook('preHandler', rateLimitConfigs.contentGeneration.createMiddleware());
    fastify.addHook('preHandler', createRequestSizeMiddleware(requestSizeLimits.contentGeneration));
    await fastify.register(aiStrategyRoutes);
  }, { 
    prefix: '/api/v1/ai-strategy'
  });
  
  // Content routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting and request size middleware for content routes
    fastify.addHook('preHandler', rateLimitConfigs.contentGeneration.createMiddleware());
    fastify.addHook('preHandler', createRequestSizeMiddleware(requestSizeLimits.contentGeneration));
    await fastify.register(contentRoutes);
  }, { 
    prefix: '/api/v1/content'
  });
  
  // Social Media routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for social media routes
    fastify.addHook('preHandler', rateLimitConfigs.publishing.createMiddleware());
    await fastify.register(socialMediaRoutes);
  }, { 
    prefix: '/api/v1/social'
  });
  
  // Scheduling routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for scheduling routes
    fastify.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
    await fastify.register(schedulingRoutes);
  }, { 
    prefix: '/api/v1/scheduling'
  });
  
  // Analytics routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for analytics routes
    fastify.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
    await fastify.register(analyticsRoutes);
  }, { 
    prefix: '/api/v1/analytics'
  });
  
  // Billing routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for billing routes
    fastify.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
    await fastify.register(billingRoutes);
  }, { 
    prefix: '/api/v1/billing'
  });
  
  // Admin routes (protected, admin only)
  await server.register(async (fastify) => {
    // Add rate limiting middleware for admin routes
    fastify.addHook('preHandler', rateLimitConfigs.admin.createMiddleware());
    await fastify.register(adminRoutes);
  }, { 
    prefix: '/api/v1/admin'
  });
  
  // Upload routes (protected)
  await server.register(async (fastify) => {
    // Add rate limiting and request size middleware for upload routes
    fastify.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
    fastify.addHook('preHandler', createRequestSizeMiddleware(requestSizeLimits.fileUpload));
    await fastify.register(uploadRoutes);
  }, { 
    prefix: '/api/v1'
  });
  
  // Test routes (development only)
  if (config.nodeEnv === 'development') {
    await server.register(testRoutes, { 
      prefix: '/api/v1',
    });
  }
  
  // ===========================================
  // CATCH-ALL & ERROR ROUTES
  // ===========================================
  
  // 404 handler
  server.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      availableEndpoints: {
        health: 'GET /health',
        api: 'GET /api/v1',
        auth: 'POST /auth/register, POST /auth/signin',
        docs: 'See API documentation for complete endpoint list',
      },
    });
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
