import { getSession } from "next-auth/react"
import { cache, cacheKeys, cacheTTL, cacheTags } from '../cache/redis'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
  cache?: {
    enabled?: boolean
    ttl?: number
    tags?: string[]
    key?: string
  }
}

export interface BatchRequest {
  id: string
  endpoint: string
  options?: ApiRequestOptions
}

export interface BatchResponse {
  id: string
  response: ApiResponse
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private batchQueue: Map<string, { requests: BatchRequest[], resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map()
  private readonly BATCH_DELAY = 50 // milliseconds
  private readonly MAX_BATCH_SIZE = 10

  constructor() {
    // Use Next.js API routes instead of direct backend calls
    this.baseURL = ''
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession()
    
    if (session?.user?.id) {
      // Create a JWT token for the backend (simplified for development)
      const token = btoa(JSON.stringify({ 
        userId: session.user.id, 
        email: session.user.email,
        role: session.user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }))
      
      return {
        'Authorization': `Bearer ${token}`
      }
    }
    
    return {}
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(endpoint: string, options: ApiRequestOptions): string {
    const { method = 'GET', body, cache } = options
    
    if (cache?.key) {
      return cache.key
    }
    
    // Create cache key based on endpoint, method, and body
    const bodyHash = body ? btoa(JSON.stringify(body)).slice(0, 8) : ''
    return cacheKeys.apiResponse(endpoint, `${method}:${bodyHash}`)
  }

  /**
   * Cached request wrapper
   */
  async cachedRequest<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { cache: cacheOptions, method = 'GET' } = options
    
    // Skip caching for non-GET requests or when disabled
    if (method !== 'GET' || !cacheOptions?.enabled) {
      return this.request<T>(endpoint, options)
    }
    
    const cacheKey = this.generateCacheKey(endpoint, options)
    const ttl = cacheOptions.ttl || cacheTTL.MEDIUM
    const tags = cacheOptions.tags || [cacheTags.API]
    
    return cache.getOrSet(
      cacheKey,
      () => this.request<T>(endpoint, options),
      { ttl, tags }
    )
  }

  async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
      cache: cacheOptions
    } = options
    
    // Use cached request if caching is enabled
    if (cacheOptions?.enabled) {
      return this.cachedRequest<T>(endpoint, options)
    }

    try {
      const url = `${this.baseURL}${endpoint}`
      
      let requestHeaders = {
        ...this.defaultHeaders,
        ...headers
      }

      // Add authentication headers if required
      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders()
        requestHeaders = { ...requestHeaders, ...authHeaders }
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
      }

      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          // Remove Content-Type header for FormData - browser sets it with boundary
          delete requestHeaders['Content-Type']
          requestOptions.body = body
        } else {
          requestOptions.body = JSON.stringify(body)
        }
      }

      console.log(`🌐 API Request: ${method} ${url}`, {
        headers: requestHeaders,
        body: body instanceof FormData ? '[FormData]' : body
      })

      const response = await fetch(url, requestOptions)
      
      let responseData: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = { message: await response.text() }
      }

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, responseData)
        return {
          success: false,
          error: responseData.message || responseData.error || `HTTP ${response.status}`,
          data: responseData
        }
      }

      console.log(`✅ API Success: ${method} ${url}`, responseData)
      
      return {
        success: true,
        data: responseData,
        message: responseData.message
      }
    } catch (error) {
      console.error('🔥 API Client Error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      }
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth })
  }

  async post<T>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth })
  }

  async put<T>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth })
  }

  async delete<T>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth })
  }

  async patch<T>(endpoint: string, body?: any, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth })
  }

  /**
   * Batch multiple GET requests together
   */
  async batch<T>(requests: BatchRequest[]): Promise<BatchResponse[]> {
    // Filter only GET requests for batching
    const getRequests = requests.filter(req => 
      !req.options?.method || req.options.method === 'GET'
    )
    
    if (getRequests.length === 0) {
      // Execute non-GET requests individually
      const responses = await Promise.all(
        requests.map(async (req) => ({
          id: req.id,
          response: await this.request(req.endpoint, req.options)
        }))
      )
      return responses
    }
    
    // Create batch key based on auth requirements
    const requiresAuth = getRequests.some(req => req.options?.requireAuth !== false)
    const batchKey = requiresAuth ? 'auth' : 'public'
    
    return new Promise((resolve, reject) => {
      // Add to existing batch or create new one
      const existingBatch = this.batchQueue.get(batchKey)
      
      if (existingBatch) {
        // Add to existing batch
        existingBatch.requests.push(...getRequests)
        
        // If batch is full, process immediately
        if (existingBatch.requests.length >= this.MAX_BATCH_SIZE) {
          clearTimeout(existingBatch.timeout)
          this.processBatch(batchKey)
        }
        
        // Update promise handlers to include new requests
        const originalResolve = existingBatch.resolve
        existingBatch.resolve = (responses: BatchResponse[]) => {
          const myResponses = responses.filter(r => 
            getRequests.some(req => req.id === r.id)
          )
          resolve(myResponses)
          
          // Resolve original promise with remaining responses
          const otherResponses = responses.filter(r => 
            !getRequests.some(req => req.id === r.id)
          )
          if (otherResponses.length > 0) {
            originalResolve(otherResponses)
          }
        }
        
      } else {
        // Create new batch
        const timeout = setTimeout(() => {
          this.processBatch(batchKey)
        }, this.BATCH_DELAY)
        
        this.batchQueue.set(batchKey, {
          requests: [...getRequests],
          resolve,
          reject,
          timeout
        })
      }
    })
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey)
    if (!batch) return
    
    // Remove from queue
    this.batchQueue.delete(batchKey)
    clearTimeout(batch.timeout)
    
    console.log(`📦 Processing batch: ${batch.requests.length} requests`)
    
    try {
      // Execute all requests in parallel
      const responses = await Promise.all(
        batch.requests.map(async (req): Promise<BatchResponse> => ({
          id: req.id,
          response: await this.request(req.endpoint, req.options)
        }))
      )
      
      batch.resolve(responses)
    } catch (error) {
      batch.reject(error)
    }
  }

  /**
   * Cached convenience methods
   */
  async getCached<T>(
    endpoint: string, 
    cacheOptions: { ttl?: number; tags?: string[]; key?: string } = {},
    requireAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      requireAuth,
      cache: { enabled: true, ...cacheOptions }
    })
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateCache(tags: string[]): Promise<number> {
    let totalInvalidated = 0
    
    for (const tag of tags) {
      const count = await cache.invalidateByTag(tag)
      totalInvalidated += count
    }
    
    return totalInvalidated
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cache.getStats()
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()
