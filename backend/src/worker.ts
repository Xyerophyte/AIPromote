import { PrismaClient } from '@prisma/client';
import { SocialMediaWorkers } from './workers/social-media-workers';
import { closeRedis } from './config/redis';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Initialize workers
const workers = new SocialMediaWorkers(prisma);

async function startWorker() {
  try {
    console.log('🔥 Starting AI Promote Worker Process...');
    
    // Connect to database
    await prisma.$connect();
    console.log('📦 Connected to database');
    
    // Start workers
    await workers.startWorkers();
    
    console.log('🎉 AI Promote Worker Process started successfully');
    
    // Health check endpoint for monitoring
    setInterval(async () => {
      const health = await workers.healthCheck();
      if (!health.healthy) {
        console.error('⚠️  Worker health check failed:', health.details);
      }
    }, 60000); // Check every minute
    
  } catch (error) {
    console.error('❌ Failed to start worker process:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
async function shutdown() {
  console.log('🛑 Shutting down worker process...');
  
  try {
    // Stop workers
    await workers.stopWorkers();
    
    // Close Redis connections
    await closeRedis();
    
    // Disconnect from database
    await prisma.$disconnect();
    
    console.log('✅ Worker process shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the worker process
if (require.main === module) {
  startWorker();
}
