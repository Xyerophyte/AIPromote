import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/config';

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
  // Security plugins
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
  });

  await server.register(cors, {
    origin: config.corsOrigins,
    credentials: true
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Health check route
  server.get('/health', async (request, reply) => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

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
