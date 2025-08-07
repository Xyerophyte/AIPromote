import { kv } from '@vercel/kv'

export interface CacheOptions {
  ex?: number // expiration time in seconds
  px?: number // expiration time in milliseconds
  nx?: boolean // only set if key doesn't exist
  xx?: boolean // only set if key exists
}

export interface RateLimitOptions {
  windowMs: number // time window in milliseconds
  max: number // maximum requests allowed
  keyGenerator?: (identifier: string) => string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

class KVService {
  // Basic cache operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      return await kv.get(key)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }

  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      if (options?.ex) {
        await kv.setex(key, options.ex, JSON.stringify(value))
      } else if (options?.px) {
        await kv.psetex(key, options.px, JSON.stringify(value))
      } else {
        await kv.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('KV set error:', error)
      return false
    }
  }

  async del(key: string | string[]): Promise<boolean> {
    try {
      if (Array.isArray(key)) {
        await kv.del(...key)
      } else {
        await kv.del(key)
      }
      return true
    } catch (error) {
      console.error('KV del error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await kv.exists(key)
      return result === 1
    } catch (error) {
      console.error('KV exists error:', error)
      return false
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await kv.expire(key, seconds)
      return result === 1
    } catch (error) {
      console.error('KV expire error:', error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await kv.ttl(key)
    } catch (error) {
      console.error('KV ttl error:', error)
      return -1
    }
  }

  // Advanced cache operations
  async getWithTTL<T = any>(key: string): Promise<{ value: T | null; ttl: number }> {
    try {
      const [value, ttl] = await Promise.all([
        this.get<T>(key),
        this.ttl(key)
      ])
      return { value, ttl }
    } catch (error) {
      console.error('KV getWithTTL error:', error)
      return { value: null, ttl: -1 }
    }
  }

  async getOrSet<T = any>(
    key: string,
    generator: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      const existing = await this.get<T>(key)
      if (existing !== null) {
        return existing
      }

      const value = await generator()
      const options: CacheOptions = {}
      if (ttl) options.ex = ttl

      await this.set(key, value, options)
      return value
    } catch (error) {
      console.error('KV getOrSet error:', error)
      return null
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await kv.lpush(key, ...values)
    } catch (error) {
      console.error('KV lpush error:', error)
      return 0
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await kv.rpush(key, ...values)
    } catch (error) {
      console.error('KV rpush error:', error)
      return 0
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await kv.lpop(key)
    } catch (error) {
      console.error('KV lpop error:', error)
      return null
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await kv.rpop(key)
    } catch (error) {
      console.error('KV rpop error:', error)
      return null
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await kv.lrange(key, start, stop)
    } catch (error) {
      console.error('KV lrange error:', error)
      return []
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await kv.llen(key)
    } catch (error) {
      console.error('KV llen error:', error)
      return 0
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await kv.sadd(key, ...members)
    } catch (error) {
      console.error('KV sadd error:', error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await kv.smembers(key)
    } catch (error) {
      console.error('KV smembers error:', error)
      return []
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await kv.sismember(key, member)
      return result === 1
    } catch (error) {
      console.error('KV sismember error:', error)
      return false
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await kv.srem(key, ...members)
    } catch (error) {
      console.error('KV srem error:', error)
      return 0
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await kv.hset(key, { [field]: value })
    } catch (error) {
      console.error('KV hset error:', error)
      return 0
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await kv.hget(key, field)
    } catch (error) {
      console.error('KV hget error:', error)
      return null
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await kv.hgetall(key) || {}
    } catch (error) {
      console.error('KV hgetall error:', error)
      return {}
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await kv.hdel(key, ...fields)
    } catch (error) {
      console.error('KV hdel error:', error)
      return 0
    }
  }

  // Increment operations
  async incr(key: string): Promise<number> {
    try {
      return await kv.incr(key)
    } catch (error) {
      console.error('KV incr error:', error)
      return 0
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    try {
      return await kv.incrby(key, increment)
    } catch (error) {
      console.error('KV incrby error:', error)
      return 0
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await kv.decr(key)
    } catch (error) {
      console.error('KV decr error:', error)
      return 0
    }
  }

  async decrby(key: string, decrement: number): Promise<number> {
    try {
      return await kv.decrby(key, decrement)
    } catch (error) {
      console.error('KV decrby error:', error)
      return 0
    }
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const { windowMs, max, keyGenerator } = options
    const key = keyGenerator ? keyGenerator(identifier) : `rate_limit:${identifier}`
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs

    try {
      // Use a hash to store both count and window start time
      const pipe = kv.pipeline()
      pipe.hget(key, 'count')
      pipe.hget(key, 'windowStart')
      
      const [currentCountStr, windowStartStr] = await pipe.exec() as [string | null, string | null]
      
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0
      const storedWindowStart = windowStartStr ? parseInt(windowStartStr, 10) : 0

      // Check if we're in a new window
      if (storedWindowStart < windowStart) {
        // New window, reset counter
        await kv.hset(key, {
          count: '1',
          windowStart: windowStart.toString()
        })
        await kv.expire(key, Math.ceil(windowMs / 1000))
        
        return {
          allowed: true,
          remaining: max - 1,
          resetTime: windowStart + windowMs,
          totalRequests: 1
        }
      }

      // Same window, check limit
      if (currentCount >= max) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + windowMs,
          totalRequests: currentCount
        }
      }

      // Increment counter
      const newCount = await kv.hincrby(key, 'count', 1)
      
      return {
        allowed: true,
        remaining: max - newCount,
        resetTime: windowStart + windowMs,
        totalRequests: newCount
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // On error, allow the request to avoid blocking legitimate users
      return {
        allowed: true,
        remaining: max - 1,
        resetTime: Date.now() + windowMs,
        totalRequests: 1
      }
    }
  }

  // Session management
  async createSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, { ex: ttl })
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`)
  }

  async updateSession(sessionId: string, data: any, ttl?: number): Promise<boolean> {
    const key = `session:${sessionId}`
    const success = await this.set(key, data)
    if (success && ttl) {
      await this.expire(key, ttl)
    }
    return success
  }

  async destroySession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`)
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Note: This is a simplified implementation
      // In a real Redis setup, you'd use SCAN with pattern matching
      // Vercel KV doesn't support SCAN, so this is a basic approach
      console.warn('Pattern invalidation is limited in Vercel KV')
      return 0
    } catch (error) {
      console.error('KV pattern invalidation error:', error)
      return 0
    }
  }

  // Content caching helpers
  async cacheContentGeneration(
    organizationId: string,
    platform: string,
    contentType: string,
    prompt: string,
    result: any,
    ttl: number = 3600
  ): Promise<boolean> {
    const key = `content:${organizationId}:${platform}:${contentType}:${Buffer.from(prompt).toString('base64')}`
    return this.set(key, result, { ex: ttl })
  }

  async getCachedContentGeneration(
    organizationId: string,
    platform: string,
    contentType: string,
    prompt: string
  ): Promise<any> {
    const key = `content:${organizationId}:${platform}:${contentType}:${Buffer.from(prompt).toString('base64')}`
    return this.get(key)
  }

  // User activity tracking
  async trackUserActivity(userId: string, activity: string): Promise<boolean> {
    const key = `user_activity:${userId}`
    const timestamp = Date.now()
    
    try {
      // Store last 10 activities
      await this.lpush(key, JSON.stringify({ activity, timestamp }))
      // Keep only last 10 activities
      await kv.ltrim(key, 0, 9)
      // Expire after 7 days
      await this.expire(key, 7 * 24 * 3600)
      return true
    } catch (error) {
      console.error('User activity tracking error:', error)
      return false
    }
  }

  async getUserActivity(userId: string, limit: number = 10): Promise<Array<{ activity: string; timestamp: number }>> {
    try {
      const activities = await this.lrange(`user_activity:${userId}`, 0, limit - 1)
      return activities.map(item => JSON.parse(item))
    } catch (error) {
      console.error('Get user activity error:', error)
      return []
    }
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; latency: number; error?: string }> {
    const start = Date.now()
    try {
      const testKey = 'health_check_test'
      const testValue = 'test'
      
      await this.set(testKey, testValue, { ex: 10 })
      const retrieved = await this.get(testKey)
      await this.del(testKey)
      
      const latency = Date.now() - start
      
      if (retrieved === testValue) {
        return { success: true, latency }
      } else {
        return { success: false, latency, error: 'Value mismatch' }
      }
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Batch operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await kv.mget(...keys)
    } catch (error) {
      console.error('KV mget error:', error)
      return Array(keys.length).fill(null)
    }
  }

  async mset(keyValues: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const entries = Object.entries(keyValues)
      const pipe = kv.pipeline()
      
      for (const [key, value] of entries) {
        pipe.set(key, JSON.stringify(value))
        if (ttl) {
          pipe.expire(key, ttl)
        }
      }
      
      await pipe.exec()
      return true
    } catch (error) {
      console.error('KV mset error:', error)
      return false
    }
  }
}

export const kvService = new KVService()
export default kvService
