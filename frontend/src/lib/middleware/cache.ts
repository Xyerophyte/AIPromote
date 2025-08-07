import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheKeys, cacheTTL, cacheTags } from '../cache/redis'
import { createHash } from 'crypto'

export interface CacheMiddlewareOptions {
  ttl?: number
  tags?: string[]
  varyOn?: string[] // Headers or query params to vary cache on
  skipCache?: (req: NextRequest) => boolean
  generateKey?: (req: NextRequest) => string
}

/**
 * Create cache key from request
 */
function generateCacheKey(req: NextRequest, customKey?: string): string {
  if (customKey) return customKey
  
  const url = new URL(req.url)
  const method = req.method
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  // Create a hash of the full request signature
  const signature = `${method}:${pathname}:${searchParams}`
  const hash = createHash('md5').update(signature).digest('hex')
  
  return `api_cache:${hash}`
}

/**
 * Get cache headers for response
 */
function getCacheHeaders(ttl: number): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
    'Vary': 'Accept, Authorization, Accept-Encoding',
    'X-Cache-TTL': ttl.toString(),
  }
}

/**
 * Cache middleware for API routes
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      ttl = cacheTTL.MEDIUM,
      tags = [cacheTags.API],
      varyOn = [],
      skipCache,
      generateKey
    } = options

    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return handler(req)
    }

    // Check if we should skip cache
    if (skipCache && skipCache(req)) {
      return handler(req)
    }

    // Generate cache key
    let cacheKey = generateCacheKey(req, generateKey?.(req))
    
    // Add variation based on headers/params
    if (varyOn.length > 0) {
      const variations = varyOn.map(key => {
        // Check headers
        const headerValue = req.headers.get(key)
        if (headerValue) return `${key}:${headerValue}`
        
        // Check query params
        const url = new URL(req.url)
        const paramValue = url.searchParams.get(key)
        if (paramValue) return `${key}:${paramValue}`
        
        return null
      }).filter(Boolean)
      
      if (variations.length > 0) {
        const variationHash = createHash('md5')
          .update(variations.join('|'))
          .digest('hex')
        cacheKey += `:${variationHash}`
      }
    }

    try {
      // Try to get cached response
      const cachedResponse = await cache.get<{
        status: number
        headers: Record<string, string>
        body: any
      }>(cacheKey)

      if (cachedResponse) {
        console.log(`🎯 API Cache HIT: ${req.method} ${req.url}`)
        
        // Return cached response with cache hit header
        return new NextResponse(
          JSON.stringify(cachedResponse.body),
          {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache-Status': 'HIT',
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Cache miss - execute handler
      console.log(`❌ API Cache MISS: ${req.method} ${req.url}`)
      const response = await handler(req)
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        try {
          // Clone response to read body
          const responseClone = response.clone()
          const body = await responseClone.json()
          
          // Prepare cache data
          const cacheData = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body
          }
          
          // Cache the response
          await cache.set(cacheKey, cacheData, { ttl, tags })
          
          // Add cache headers to response
          const cacheHeaders = getCacheHeaders(ttl)
          for (const [key, value] of Object.entries(cacheHeaders)) {
            response.headers.set(key, value)
          }
          response.headers.set('X-Cache-Status', 'MISS')
          
        } catch (error) {
          console.error('Failed to cache API response:', error)
        }
      }

      return response
      
    } catch (error) {
      console.error('Cache middleware error:', error)
      // If caching fails, still return the response
      return handler(req)
    }
  }
}

/**
 * Invalidate cached API responses by tags
 */
export async function invalidateAPICache(tags: string[]): Promise<number> {
  let totalInvalidated = 0
  
  for (const tag of tags) {
    const count = await cache.invalidateByTag(tag)
    totalInvalidated += count
  }
  
  console.log(`🗑️  Invalidated ${totalInvalidated} cached API responses`)
  return totalInvalidated
}

/**
 * Prebuilt cache configurations
 */
export const cachePresets = {
  // Short cache for frequently changing data
  dynamic: {
    ttl: cacheTTL.SHORT,
    tags: [cacheTags.API, 'dynamic']
  },
  
  // Medium cache for user-specific data
  userContent: {
    ttl: cacheTTL.MEDIUM,
    tags: [cacheTags.API, cacheTags.USER],
    varyOn: ['authorization']
  },
  
  // Long cache for startup data
  startups: {
    ttl: cacheTTL.LONG,
    tags: [cacheTags.API, cacheTags.STARTUP],
    varyOn: ['authorization']
  },
  
  // Very long cache for static content
  static: {
    ttl: cacheTTL.VERY_LONG,
    tags: [cacheTags.API, 'static']
  }
} as const
