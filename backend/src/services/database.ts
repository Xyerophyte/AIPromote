import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';

// Singleton Prisma client
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (config.nodeEnv === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// Connection event handlers
prisma.$on('query', (e) => {
  if (config.nodeEnv === 'development') {
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
  }
});

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Database initialization
export async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await prisma.$connect();
    
    // Run health check
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      console.log(`✅ Database connected successfully (${health.latency}ms)`);
    } else {
      throw new Error(health.error || 'Database health check failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

// Export the Prisma client instance
export { prisma };

// Database service functions
export const DatabaseService = {
  // Health check
  health: checkDatabaseHealth,
  
  // Connection management
  connect: initializeDatabase,
  disconnect: disconnectDatabase,
  
  // Raw client access
  client: prisma,
  
  // Utility functions
  async runInTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
  
  async executeRaw(query: string, ...params: any[]) {
    return prisma.$executeRawUnsafe(query, ...params);
  },
  
  async queryRaw<T = any>(query: string, ...params: any[]): Promise<T> {
    return prisma.$queryRawUnsafe(query, ...params);
  },
  
  // Bulk operations
  async bulkInsert<T>(model: string, data: T[]): Promise<{ count: number }> {
    const modelDelegate = (prisma as any)[model];
    if (!modelDelegate) {
      throw new Error(`Model ${model} not found`);
    }
    return modelDelegate.createMany({
      data,
      skipDuplicates: true,
    });
  },
  
  // Advanced queries with pagination
  async paginate<T>(
    model: string,
    {
      page = 1,
      limit = 10,
      where = {},
      orderBy = {},
      include = {},
    }: {
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    }
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const modelDelegate = (prisma as any)[model];
    if (!modelDelegate) {
      throw new Error(`Model ${model} not found`);
    }

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      modelDelegate.findMany({
        where,
        orderBy,
        include,
        skip,
        take: limit,
      }),
      modelDelegate.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  },
  
  // Search functionality
  async search<T>(
    model: string,
    searchTerm: string,
    searchFields: string[],
    options?: {
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    }
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const { page = 1, limit = 10, where = {}, orderBy = {}, include = {} } = options || {};
    
    // Build search condition using OR for each field
    const searchCondition = {
      OR: searchFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        },
      })),
    };
    
    // Combine with existing where clause
    const combinedWhere = {
      AND: [
        searchCondition,
        where,
      ],
    };
    
    return this.paginate<T>(model, {
      page,
      limit,
      where: combinedWhere,
      orderBy,
      include,
    });
  },
};

export default DatabaseService;
