import { PrismaClient } from '@prisma/client'

// Global variable to store Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Prisma connection configuration for serverless environments
const createPrismaClient = () => {
  return new PrismaClient({
    // Connection configuration optimized for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Logging configuration
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Error formatting
    errorFormat: 'minimal',
  })
}

// Singleton pattern for Prisma client to avoid connection issues in serverless
const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Connection pooling helpers for serverless environments
export const connectPrisma = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')
  } catch (error) {
    console.error('❌ Prisma connection failed:', error)
    throw error
  }
}

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma disconnected successfully')
  } catch (error) {
    console.error('❌ Prisma disconnection failed:', error)
    throw error
  }
}

// Health check for database connection
export const healthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    }
  }
}

// Connection pool optimization for serverless
export const optimizeConnectionPool = () => {
  // Set connection pool size based on environment
  const connectionLimit = process.env.NODE_ENV === 'production' ? 3 : 10
  
  // Configure connection pool settings
  return {
    connectionLimit,
    // Pool timeout configuration
    poolTimeout: 60, // 60 seconds
    // Statement timeout
    statementTimeout: 30000, // 30 seconds
    // Query timeout
    queryTimeout: 30000, // 30 seconds
  }
}

// Export the Prisma client instance
export default prisma

// Export types for TypeScript
export type { PrismaClient } from '@prisma/client'
