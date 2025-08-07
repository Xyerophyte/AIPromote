import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

// Database connection pool configuration
const databaseConfig = {
  // Connection pooling settings
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  maxIdleTime: parseInt(process.env.DB_MAX_IDLE_TIME || '30000'), // 30 seconds
  maxLifeTime: parseInt(process.env.DB_MAX_LIFE_TIME || '1800000'), // 30 minutes
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '20000'), // 20 seconds
  
  // Performance settings
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '60000'), // 60 seconds
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'), // 10 seconds
  
  // Logging and monitoring
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty' as const,
  
  // Read replica configuration
  readReplica: process.env.DATABASE_READ_REPLICA_URL,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  } : false,
};

// Prisma Client instance with optimized configuration
export const prisma = new PrismaClient({
  log: databaseConfig.log as any,
  errorFormat: databaseConfig.errorFormat,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool monitoring
export const connectionPoolStats = () => {
  return {
    activeConnections: 0, // Metrics not available in newer Prisma versions
    totalConnections: databaseConfig.connectionLimit,
    configuration: {
      connectionLimit: databaseConfig.connectionLimit,
      maxIdleTime: databaseConfig.maxIdleTime,
      maxLifeTime: databaseConfig.maxLifeTime,
      queryTimeout: databaseConfig.queryTimeout,
    },
  };
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      connectionPool: connectionPoolStats(),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async () => {
  try {
    console.log('Closing database connections...');
    await prisma.$disconnect();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
};

// Database connection middleware for performance monitoring
export const withDatabaseMetrics = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Database operation "${operationName}" completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Database operation "${operationName}" failed after ${duration}ms:`, error);
    throw error;
  }
};

// Read replica query helper (if configured)
export const executeReadQuery = async <T>(query: () => Promise<T>): Promise<T> => {
  // If read replica is configured, use it for read operations
  if (databaseConfig.readReplica) {
    // Note: This would require a separate Prisma client instance for read replica
    // For now, we use the main connection
    console.log('Read replica not implemented, using main connection');
  }
  
  return await query();
};

// Transaction helper with retry logic
export const withTransaction = async <T>(
  callback: (prisma: any) => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx as any);
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Transaction failed');
      
      if (attempt === maxRetries) {
        console.error(`Transaction failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Database indexes optimization queries
export const optimizeIndexes = async () => {
  try {
    console.log('Running database index optimization...');
    
    // Analyze table statistics
    await prisma.$executeRaw`ANALYZE;`;
    
    // Re-index frequently queried tables
    const criticalTables = [
      'users',
      'organizations', 
      'content_pieces',
      'scheduled_posts',
      'analytics'
    ];
    
    for (const table of criticalTables) {
      await prisma.$executeRaw`REINDEX TABLE ${table};`;
    }
    
    console.log('Database index optimization completed');
    return { success: true, optimizedTables: criticalTables };
  } catch (error) {
    console.error('Database index optimization failed:', error);
    throw error;
  }
};

export default prisma;
