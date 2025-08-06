import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hash, generateToken } from '../utils/encryption';
import { redis } from '../config/redis';

// First, let's add the API key model to the schema (we'll need to create a migration for this)
export interface APIKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  userId: string;
  organizationId?: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
  ipWhitelist?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class APIKeyService {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Generate a new API key
  async generateAPIKey(data: {
    name: string;
    userId: string;
    organizationId?: string;
    permissions: string[];
    expiresInDays?: number;
    rateLimit?: { requests: number; window: number };
    ipWhitelist?: string[];
  }): Promise<{ key: string; keyInfo: APIKey }> {
    // Generate a secure API key
    const keyData = generateToken(32); // 64 character hex string
    const prefix = 'aip'; // AI Promote prefix
    const key = `${prefix}_${keyData}`;
    
    // Hash the key for storage
    const keyHash = hash(key);
    
    // Set expiration if provided
    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Default rate limit
    const rateLimit = data.rateLimit || {
      requests: 1000,
      window: 3600, // 1 hour
    };

    // Store in database (we would need to add this table to Prisma schema)
    const apiKey = {
      id: generateToken(16),
      name: data.name,
      keyHash,
      keyPrefix: prefix,
      userId: data.userId,
      organizationId: data.organizationId,
      permissions: data.permissions,
      expiresAt,
      lastUsedAt: null,
      isActive: true,
      rateLimit,
      ipWhitelist: data.ipWhitelist,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store API key info in Redis for fast lookups
    await redis.hset(
      `api_key:${keyHash}`,
      {
        id: apiKey.id,
        userId: apiKey.userId,
        organizationId: apiKey.organizationId || '',
        permissions: JSON.stringify(apiKey.permissions),
        isActive: apiKey.isActive.toString(),
        rateLimit: JSON.stringify(apiKey.rateLimit),
        ipWhitelist: JSON.stringify(apiKey.ipWhitelist || []),
        expiresAt: apiKey.expiresAt?.toISOString() || '',
      }
    );

    // Set expiration in Redis if applicable
    if (expiresAt) {
      await redis.expireat(
        `api_key:${keyHash}`,
        Math.floor(expiresAt.getTime() / 1000)
      );
    }

    return { key, keyInfo: apiKey };
  }

  // Validate API key and return user info
  async validateAPIKey(key: string, ip?: string): Promise<{
    isValid: boolean;
    userId?: string;
    organizationId?: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      // Extract prefix and validate format
      if (!key.startsWith('aip_') || key.length !== 67) { // aip_ + 64 chars
        return { isValid: false, error: 'Invalid API key format' };
      }

      const keyHash = hash(key);
      
      // Check Redis cache first for performance
      const cachedKey = await redis.hgetall(`api_key:${keyHash}`);
      
      if (!cachedKey || Object.keys(cachedKey).length === 0) {
        return { isValid: false, error: 'API key not found' };
      }

      // Check if key is active
      if (cachedKey.isActive !== 'true') {
        return { isValid: false, error: 'API key is deactivated' };
      }

      // Check expiration
      if (cachedKey.expiresAt && new Date(cachedKey.expiresAt) < new Date()) {
        return { isValid: false, error: 'API key has expired' };
      }

      // Check IP whitelist
      const ipWhitelist = JSON.parse(cachedKey.ipWhitelist || '[]');
      if (ip && ipWhitelist.length > 0 && !ipWhitelist.includes(ip)) {
        return { isValid: false, error: 'IP address not authorized' };
      }

      // Update last used timestamp
      await this.updateLastUsed(keyHash);

      return {
        isValid: true,
        userId: cachedKey.userId,
        organizationId: cachedKey.organizationId || undefined,
        permissions: JSON.parse(cachedKey.permissions),
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return { isValid: false, error: 'Internal error during validation' };
    }
  }

  // Check rate limits for API key
  async checkRateLimit(keyHash: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const keyData = await redis.hgetall(`api_key:${keyHash}`);
    
    if (!keyData) {
      return { allowed: false, remaining: 0, resetTime: 0 };
    }

    const rateLimit = JSON.parse(keyData.rateLimit);
    const now = Date.now();
    const window = Math.floor(now / (rateLimit.window * 1000));
    const rateLimitKey = `rate_limit:api_key:${keyHash}:${window}`;

    // Get current usage
    const current = await redis.get(rateLimitKey);
    const currentCount = current ? parseInt(current, 10) : 0;

    const resetTime = (window + 1) * rateLimit.window * 1000;

    if (currentCount >= rateLimit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Increment usage
    const pipe = redis.pipeline();
    pipe.incr(rateLimitKey);
    pipe.expire(rateLimitKey, rateLimit.window);
    await pipe.exec();

    return {
      allowed: true,
      remaining: Math.max(0, rateLimit.requests - currentCount - 1),
      resetTime,
    };
  }

  // Update last used timestamp
  private async updateLastUsed(keyHash: string): Promise<void> {
    const lastUsedKey = `api_key_last_used:${keyHash}`;
    const now = new Date().toISOString();
    
    // Update in Redis (debounced - only update once per minute)
    const lastUpdate = await redis.get(lastUsedKey);
    if (!lastUpdate || Date.now() - new Date(lastUpdate).getTime() > 60000) {
      await redis.setex(lastUsedKey, 300, now); // Cache for 5 minutes
      
      // Update in database (we would need the API key table in Prisma)
      // await this.prisma.aPIKey.update({
      //   where: { keyHash },
      //   data: { lastUsedAt: new Date() }
      // });
    }
  }

  // Revoke API key
  async revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
    try {
      // We would update in database:
      // const apiKey = await this.prisma.aPIKey.update({
      //   where: { id: keyId, userId },
      //   data: { isActive: false }
      // });

      // Update in Redis
      const keyInfo = await redis.hgetall(`api_key:*`);
      for (const [redisKey, value] of Object.entries(keyInfo)) {
        if (redisKey.includes(keyId)) {
          await redis.hset(redisKey, 'isActive', 'false');
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Error revoking API key:', error);
      return false;
    }
  }

  // Get API keys for user
  async getUserAPIKeys(userId: string): Promise<Partial<APIKey>[]> {
    // This would fetch from database:
    // return this.prisma.aPIKey.findMany({
    //   where: { userId },
    //   select: {
    //     id: true,
    //     name: true,
    //     keyPrefix: true,
    //     permissions: true,
    //     isActive: true,
    //     lastUsedAt: true,
    //     expiresAt: true,
    //     createdAt: true,
    //   }
    // });
    
    // For now, return empty array
    return [];
  }

  // Refresh API key (generate new key, keep same permissions)
  async refreshAPIKey(keyId: string, userId: string): Promise<{ key: string } | null> {
    // This would involve:
    // 1. Get existing API key from database
    // 2. Generate new key
    // 3. Update database with new key hash
    // 4. Update Redis cache
    // 5. Invalidate old key
    
    return null; // Placeholder
  }
}

// API Key middleware
export class APIKeyMiddleware {
  private apiKeyService: APIKeyService;

  constructor(apiKeyService: APIKeyService) {
    this.apiKeyService = apiKeyService;
  }

  // Middleware to validate API key
  createMiddleware(requiredPermissions: string[] = []) {
    return async (request: any, reply: any) => {
      const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'API key is required',
        });
        return;
      }

      const validation = await this.apiKeyService.validateAPIKey(apiKey, request.ip);
      
      if (!validation.isValid) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: validation.error || 'Invalid API key',
        });
        return;
      }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(permission =>
          validation.permissions?.includes(permission) || validation.permissions?.includes('*')
        );

        if (!hasPermission) {
          reply.code(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions for this operation',
            required: requiredPermissions,
          });
          return;
        }
      }

      // Check rate limits
      const keyHash = hash(apiKey);
      const rateLimit = await this.apiKeyService.checkRateLimit(keyHash);
      
      if (!rateLimit.allowed) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'API key rate limit exceeded',
          resetTime: new Date(rateLimit.resetTime).toISOString(),
        });
        return;
      }

      // Add rate limit headers
      reply.headers({
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      });

      // Add user info to request
      request.apiUser = {
        userId: validation.userId,
        organizationId: validation.organizationId,
        permissions: validation.permissions,
        source: 'api_key',
      };
    };
  }
}

// Permissions constants
export const API_PERMISSIONS = {
  // Content operations
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
  
  // Organization operations
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_WRITE: 'organization:write',
  
  // Analytics operations
  ANALYTICS_READ: 'analytics:read',
  
  // Social media operations
  SOCIAL_READ: 'social:read',
  SOCIAL_WRITE: 'social:write',
  SOCIAL_PUBLISH: 'social:publish',
  
  // AI operations
  AI_GENERATE: 'ai:generate',
  AI_STRATEGY: 'ai:strategy',
  
  // Admin operations (be careful with these)
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  
  // Full access
  ALL: '*',
} as const;

// Permission groups for common use cases
export const PERMISSION_GROUPS = {
  READ_ONLY: [
    API_PERMISSIONS.CONTENT_READ,
    API_PERMISSIONS.ORGANIZATION_READ,
    API_PERMISSIONS.ANALYTICS_READ,
    API_PERMISSIONS.SOCIAL_READ,
  ],
  
  CONTENT_MANAGER: [
    API_PERMISSIONS.CONTENT_READ,
    API_PERMISSIONS.CONTENT_WRITE,
    API_PERMISSIONS.AI_GENERATE,
    API_PERMISSIONS.SOCIAL_READ,
  ],
  
  SOCIAL_PUBLISHER: [
    API_PERMISSIONS.CONTENT_READ,
    API_PERMISSIONS.SOCIAL_READ,
    API_PERMISSIONS.SOCIAL_WRITE,
    API_PERMISSIONS.SOCIAL_PUBLISH,
  ],
  
  FULL_ACCESS: [API_PERMISSIONS.ALL],
};

export { APIKeyService };
