"use client"

import { autoRegisterServiceWorker, warmImportantRoutes } from './sw/registration'
import { cache } from './cache/redis'
import performanceMonitor from './performance/monitor'

interface InitOptions {
  enableServiceWorker?: boolean
  enablePerformanceMonitoring?: boolean
  enableCacheWarming?: boolean
  warmupUrls?: string[]
}

/**
 * Initialize all performance optimizations
 */
export async function initPerformanceOptimizations(options: InitOptions = {}): Promise<void> {
  const {
    enableServiceWorker = true,
    enablePerformanceMonitoring = true,
    enableCacheWarming = true,
    warmupUrls = []
  } = options

  console.log('🚀 Initializing performance optimizations...')

  try {
    // Initialize service worker
    if (enableServiceWorker && typeof window !== 'undefined') {
      const swRegistered = await autoRegisterServiceWorker()
      if (swRegistered) {
        console.log('✅ Service Worker registered')
        
        // Warm up important routes after SW registration
        if (enableCacheWarming) {
          await warmImportantRoutes()
          
          // Warm up custom URLs if provided
          if (warmupUrls.length > 0) {
            const { warmServiceWorkerCache } = await import('./sw/registration')
            await warmServiceWorkerCache(warmupUrls)
          }
        }
      } else {
        console.log('⚠️  Service Worker not supported or failed to register')
      }
    }

    // Initialize performance monitoring
    if (enablePerformanceMonitoring && typeof window !== 'undefined') {
      // Performance monitor is already initialized via constructor
      console.log('✅ Performance monitoring enabled')
      
      // Log initial optimization suggestions
      setTimeout(() => {
        const suggestions = performanceMonitor.getOptimizationSuggestions()
        if (suggestions.length > 0) {
          console.log('💡 Performance optimization suggestions:')
          suggestions.forEach(suggestion => console.log(`  - ${suggestion}`))
        }
      }, 2000)
    }

    // Initialize cache warming for frequently accessed data
    if (enableCacheWarming) {
      setTimeout(async () => {
        await warmupFrequentlyAccessedData()
      }, 1000)
    }

    console.log('🎉 Performance optimizations initialized successfully')

  } catch (error) {
    console.error('❌ Failed to initialize performance optimizations:', error)
  }
}

/**
 * Warm up cache with frequently accessed data
 */
async function warmupFrequentlyAccessedData(): Promise<void> {
  try {
    console.log('🔥 Warming up cache with frequently accessed data...')
    
    // You can add specific data warmup here based on your app's needs
    // For example, cache common API responses or user preferences
    
    console.log('✅ Cache warmup completed')
  } catch (error) {
    console.error('❌ Cache warmup failed:', error)
  }
}

/**
 * Cleanup performance optimizations (useful for hot reloading in development)
 */
export function cleanupPerformanceOptimizations(): void {
  if (typeof window === 'undefined') return
  
  console.log('🧹 Cleaning up performance optimizations...')
  
  try {
    // Cleanup performance monitor
    performanceMonitor.destroy()
    
    console.log('✅ Performance optimizations cleaned up')
  } catch (error) {
    console.error('❌ Failed to cleanup performance optimizations:', error)
  }
}

/**
 * Get current performance status
 */
export function getPerformanceStatus() {
  return {
    serviceWorkerSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    serviceWorkerActive: typeof window !== 'undefined' && !!navigator.serviceWorker?.controller,
    performanceAPISupported: typeof performance !== 'undefined',
    cacheSupported: typeof caches !== 'undefined',
    performanceObserverSupported: typeof PerformanceObserver !== 'undefined',
    memoryAPISupported: !!(performance as any)?.memory,
    connectionAPISupported: !!(navigator as any)?.connection
  }
}

// Auto-initialize in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize with a slight delay to avoid blocking initial render
  setTimeout(() => {
    initPerformanceOptimizations()
  }, 100)
}

export default initPerformanceOptimizations
