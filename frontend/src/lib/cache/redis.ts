import { kv } from '@vercel/kv'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
}

class RedisCache {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await kv.get<T>(key)
      
      if (value !== null) {
        this.stats.hits++
        console.log(`🎯 Cache HIT: ${key}`)
      } else {
        this.stats.misses++
        console.log(`❌ Cache MISS: ${key}`)
      }
      
      return value
    } catch (error) {
      console.error(`🔥 Cache GET error for key ${key}:`, error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl = 3600, tags = [] } = options
      
      // Store the main value
      await kv.set(key, value, { ex: ttl })
      
      // Store cache tags for invalidation
      if (tags.length > 0) {
        const tagKey = `tags:${key}`
        await kv.set(tagKey, tags, { ex: ttl + 60 }) // Tags expire slightly later
        
        // Add to tag indexes
        for (const tag of tags) {
          const tagIndexKey = `tag_index:${tag}`
          await kv.sadd(tagIndexKey, key)
          await kv.expire(tagIndexKey, ttl + 3600) // Tag indexes live longer
        }
      }
      
      this.stats.sets++
      console.log(`✅ Cache SET: ${key} (TTL: ${ttl}s, Tags: ${tags.join(', ')})`)
      return true
    } catch (error) {
      console.error(`🔥 Cache SET error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Get and clean up tags first
      const tagKey = `tags:${key}`
      const tags = await kv.get<string[]>(tagKey)
      
      if (tags) {
        for (const tag of tags) {
          const tagIndexKey = `tag_index:${tag}`
          await kv.srem(tagIndexKey, key)
        }
        await kv.del(tagKey)
      }
      
      // Delete the main key
      const result = await kv.del(key)
      
      if (result > 0) {
        this.stats.deletes++
        console.log(`🗑️  Cache DELETE: ${key}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`🔥 Cache DELETE error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagIndexKey = `tag_index:${tag}`
      const keys = await kv.smembers(tagIndexKey)
      
      if (!keys || keys.length === 0) {
        console.log(`🏷️  No keys found for tag: ${tag}`)
        return 0
      }
      
      // Delete all keys with this tag
      let deletedCount = 0
      for (const key of keys) {
        const deleted = await this.delete(key as string)
        if (deleted) deletedCount++
      }
      
      // Clean up the tag index
      await kv.del(tagIndexKey)
      
      console.log(`🏷️  Invalidated ${deletedCount} keys with tag: ${tag}`)
      return deletedCount
    } catch (error) {
      console.error(`🔥 Cache invalidateByTag error for tag ${tag}:`, error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Clear cache statistics
   */
  clearStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 }
  }

  /**
   * Get or set pattern - common caching pattern
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Cache miss - fetch data
    console.log(`🔄 Cache MISS - fetching data for: ${key}`)
    const data = await fetcher()
    
    // Cache the result
    await this.set(key, data, options)
    
    return data
  }

  /**
   * Warm up cache with pre-computed values
   */
  async warmup(data: Record<string, { value: any; options?: CacheOptions }>): Promise<void> {
    console.log('🔥 Starting cache warmup...')
    
    const promises = Object.entries(data).map(([key, { value, options }]) =>
      this.set(key, value, options)
    )
    
    await Promise.all(promises)
    console.log(`✅ Cache warmup completed: ${Object.keys(data).length} keys`)
  }
}

// Singleton instance
export const cache = new RedisCache()

// Cache key builders
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  startup: (id: string) => `startup:${id}`,
  startupList: (userId: string) => `startups:user:${userId}`,
  content: (startupId: string, filters?: string) => 
    `content:${startupId}${filters ? `:${filters}` : ''}`,
  dashboardStats: (userId: string) => `dashboard_stats:${userId}`,
  apiResponse: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? `:${btoa(params)}` : ''}`,
  socialMediaData: (platform: string, account: string) => 
    `social:${platform}:${account}`,
} as const

// Cache TTL constants (in seconds)
export const cacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const

// Cache tags for organized invalidation
export const cacheTags = {
  USER: 'user',
  STARTUP: 'startup', 
  CONTENT: 'content',
  DASHBOARD: 'dashboard',
  SOCIAL: 'social',
  API: 'api'
} as const
