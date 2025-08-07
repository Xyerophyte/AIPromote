import { kv } from '@vercel/kv'

export interface CacheOptions {
  ex?: number // Expiration time in seconds
  px?: number // Expiration time in milliseconds
}

export class KVCache {
  /**
   * Set a key-value pair in the cache
   */
  static async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      await kv.set(key, value, options)
    } catch (error) {
      console.error('KV set error:', error)
      throw error
    }
  }

  /**
   * Get a value from the cache
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      return await kv.get<T>(key)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }

  /**
   * Delete a key from the cache
   */
  static async del(key: string): Promise<void> {
    try {
      await kv.del(key)
    } catch (error) {
      console.error('KV del error:', error)
      throw error
    }
  }

  /**
   * Check if a key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await kv.exists(key)
      return result === 1
    } catch (error) {
      console.error('KV exists error:', error)
      return false
    }
  }

  /**
   * Set expiration time for a key
   */
  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await kv.expire(key, seconds)
    } catch (error) {
      console.error('KV expire error:', error)
      throw error
    }
  }

  /**
   * Get all keys matching a pattern
   */
  static async keys(pattern: string = '*'): Promise<string[]> {
    try {
      return await kv.keys(pattern)
    } catch (error) {
      console.error('KV keys error:', error)
      return []
    }
  }

  /**
   * Increment a numeric value
   */
  static async incr(key: string): Promise<number> {
    try {
      return await kv.incr(key)
    } catch (error) {
      console.error('KV incr error:', error)
      throw error
    }
  }

  /**
   * Add items to a set
   */
  static async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await kv.sadd(key, ...members)
    } catch (error) {
      console.error('KV sadd error:', error)
      throw error
    }
  }

  /**
   * Get all members of a set
   */
  static async smembers(key: string): Promise<string[]> {
    try {
      return await kv.smembers(key)
    } catch (error) {
      console.error('KV smembers error:', error)
      return []
    }
  }

  /**
   * Cache wrapper function for expensive operations
   */
  static async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // If not in cache, fetch and cache the result
    const result = await fetcher()
    await this.set(key, result, options)
    return result
  }
}

// Predefined cache keys for common operations
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  session: (token: string) => `session:${token}`,
  authAttempts: (email: string) => `auth_attempts:${email}`,
  resetToken: (token: string) => `reset_token:${token}`,
  emailVerification: (token: string) => `email_verification:${token}`,
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
} as const

// Common cache durations
export const CacheDurations = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 60 * 60 * 24,
  WEEK: 60 * 60 * 24 * 7,
  MONTH: 60 * 60 * 24 * 30,
} as const
