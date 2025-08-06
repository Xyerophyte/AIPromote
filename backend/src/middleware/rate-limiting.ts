import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (request: FastifyRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (request) => request.ip || 'unknown',
      ...options,
    };
  }

  async checkLimit(request: FastifyRequest): Promise<RateLimitInfo> {
    const key = this.options.keyGenerator!(request);
    const redisKey = `rate_limit:${key}`;
    const now = Date.now();
    const window = Math.floor(now / this.options.windowMs);
    const windowKey = `${redisKey}:${window}`;

    // Get current count
    const current = await redis.get(windowKey);
    const currentCount = current ? parseInt(current, 10) : 0;

    const resetTime = (window + 1) * this.options.windowMs;

    if (currentCount >= this.options.max) {
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((resetTime - now) / 1000)
      );
    }

    // Increment counter
    const pipe = redis.pipeline();
    pipe.incr(windowKey);
    pipe.expire(windowKey, Math.ceil(this.options.windowMs / 1000));
    await pipe.exec();

    return {
      limit: this.options.max,
      current: currentCount + 1,
      remaining: Math.max(0, this.options.max - currentCount - 1),
      resetTime,
    };
  }

  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const info = await this.checkLimit(request);

        // Set rate limit headers
        reply.headers({
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': new Date(info.resetTime).toISOString(),
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          reply.code(429).send({
            error: 'Too Many Requests',
            message: error.message,
            retryAfter: error.retryAfter,
          });
          return;
        }
        throw error;
      }
    };
  }
}

// Rate limiting configurations for different endpoints
export const rateLimitConfigs = {
  // General API requests
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
  }),

  // Auth endpoints (more restrictive)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    keyGenerator: (request) => {
      const email = (request.body as any)?.email;
      return email ? `auth:${email}` : `auth:${request.ip}`;
    },
  }),

  // Content generation (AI intensive)
  contentGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour
    keyGenerator: (request) => {
      const userId = (request as any).user?.id;
      return userId ? `content:${userId}` : `content:${request.ip}`;
    },
  }),

  // Social media publishing
  publishing: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 posts per hour
    keyGenerator: (request) => {
      const userId = (request as any).user?.id;
      return userId ? `publish:${userId}` : `publish:${request.ip}`;
    },
  }),

  // File uploads
  upload: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 uploads per 15 minutes
    keyGenerator: (request) => {
      const userId = (request as any).user?.id;
      return userId ? `upload:${userId}` : `upload:${request.ip}`;
    },
  }),

  // Admin actions
  admin: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // 200 admin actions per hour
    keyGenerator: (request) => {
      const userId = (request as any).user?.id;
      return `admin:${userId}`;
    },
  }),
};

// Dynamic rate limiting based on user plan
export class DynamicRateLimiter {
  private planLimits = {
    free: { windowMs: 60 * 60 * 1000, max: 10 },
    pro: { windowMs: 60 * 60 * 1000, max: 100 },
    enterprise: { windowMs: 60 * 60 * 1000, max: 1000 },
  };

  createMiddleware(endpoint: string) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const userPlan = user?.plan || 'free';
      const limits = this.planLimits[userPlan as keyof typeof this.planLimits];

      const limiter = new RateLimiter({
        ...limits,
        keyGenerator: (req) => `${endpoint}:${user?.id || req.ip}`,
      });

      try {
        const info = await limiter.checkLimit(request);
        reply.headers({
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': new Date(info.resetTime).toISOString(),
          'X-RateLimit-Plan': userPlan,
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          reply.code(429).send({
            error: 'Rate limit exceeded',
            message: `Rate limit exceeded for ${userPlan} plan. ${error.message}`,
            retryAfter: error.retryAfter,
            plan: userPlan,
            upgradeUrl: '/billing/upgrade',
          });
          return;
        }
        throw error;
      }
    };
  }
}

export const dynamicRateLimiter = new DynamicRateLimiter();

// Distributed rate limiting for multi-instance deployments
export class DistributedRateLimiter {
  private prefix: string;

  constructor(prefix = 'distributed_rate_limit') {
    this.prefix = prefix;
  }

  async isAllowed(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `${this.prefix}:${key}:${window}`;

    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local current = redis.call('GET', key)
      if not current then
        current = 0
      else
        current = tonumber(current)
      end
      
      if current >= limit then
        return {0, (math.floor(now / window) + 1) * window, limit - current}
      end
      
      redis.call('INCR', key)
      redis.call('EXPIRE', key, math.ceil(window / 1000))
      
      return {1, (math.floor(now / window) + 1) * window, limit - current - 1}
    `;

    const result = await redis.eval(
      script,
      1,
      redisKey,
      limit.toString(),
      windowMs.toString(),
      now.toString()
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      resetTime: result[1],
      remaining: Math.max(0, result[2]),
    };
  }
}

export const distributedRateLimiter = new DistributedRateLimiter();

// IP-based suspicious activity detection
export class SuspiciousActivityDetector {
  async checkSuspiciousActivity(request: FastifyRequest): Promise<void> {
    const ip = request.ip;
    const now = Date.now();
    const suspicious_key = `suspicious:${ip}`;
    
    // Check for rapid requests (more than 10 requests in 10 seconds)
    const rapidKey = `rapid:${ip}:${Math.floor(now / 10000)}`;
    const rapidCount = await redis.incr(rapidKey);
    await redis.expire(rapidKey, 10);
    
    if (rapidCount > 10) {
      await redis.setex(suspicious_key, 3600, 'rapid_requests');
      throw new RateLimitError('Suspicious activity detected. Access temporarily restricted.', 3600);
    }

    // Check if IP is already flagged
    const flagged = await redis.get(suspicious_key);
    if (flagged) {
      throw new RateLimitError('Access restricted due to suspicious activity.', 3600);
    }
  }

  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await this.checkSuspiciousActivity(request);
      } catch (error) {
        if (error instanceof RateLimitError) {
          reply.code(429).send({
            error: 'Access Restricted',
            message: error.message,
            retryAfter: error.retryAfter,
          });
          return;
        }
        throw error;
      }
    };
  }
}

export const suspiciousActivityDetector = new SuspiciousActivityDetector();
