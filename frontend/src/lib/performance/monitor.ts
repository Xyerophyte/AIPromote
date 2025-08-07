import { cache } from '../cache/redis'

interface PerformanceMetrics {
  pageName: string
  loadTime: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToInteractive?: number
  domContentLoaded: number
  timestamp: number
  userAgent: string
  connection?: NetworkInformation
  memory?: MemoryInfo
  cacheStats?: {
    hits: number
    misses: number
    hitRate: number
  }
}

interface MemoryInfo {
  usedJSMemSize: number
  totalJSMemSize: number
  jsHeapSizeLimit: number
}

interface NetworkInformation {
  effectiveType: string
  downlink: number
  rtt: number
  saveData?: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observer?: PerformanceObserver
  private startTime: number = Date.now()
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init(): void {
    // Listen for page load events
    window.addEventListener('load', () => {
      setTimeout(() => this.collectLoadMetrics(), 0)
    })

    // Set up performance observer for web vitals
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver()
    }

    // Collect metrics periodically
    setInterval(() => {
      this.collectRuntimeMetrics()
    }, 30000) // Every 30 seconds
  }

  private setupPerformanceObserver(): void {
    try {
      // Observe largest contentful paint
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry)
        }
      })

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      
      // Also observe navigation and resource timings
      this.observer.observe({ entryTypes: ['navigation', 'resource'] })
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error)
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.recordLCP(entry as PerformanceEntry & { startTime: number })
        break
      case 'first-input':
        this.recordFID(entry as PerformanceEventTiming)
        break
      case 'layout-shift':
        this.recordCLS(entry as PerformanceEntry & { value: number, hadRecentInput: boolean })
        break
      case 'navigation':
        this.recordNavigationTiming(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.recordResourceTiming(entry as PerformanceResourceTiming)
        break
    }
  }

  private recordLCP(entry: PerformanceEntry & { startTime: number }): void {
    console.log('📊 LCP:', entry.startTime)
    this.updateLatestMetric('largestContentfulPaint', entry.startTime)
  }

  private recordFID(entry: PerformanceEventTiming): void {
    const fid = entry.processingStart - entry.startTime
    console.log('📊 FID:', fid)
    this.updateLatestMetric('firstInputDelay', fid)
  }

  private recordCLS(entry: PerformanceEntry & { value: number, hadRecentInput: boolean }): void {
    // Only record layout shifts not caused by user input
    if (!entry.hadRecentInput) {
      console.log('📊 CLS:', entry.value)
      const currentCLS = this.getLatestMetric()?.cumulativeLayoutShift || 0
      this.updateLatestMetric('cumulativeLayoutShift', currentCLS + entry.value)
    }
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.navigationStart
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart
    
    console.log('📊 Navigation Timing:', { loadTime, domContentLoaded })
    
    this.updateLatestMetric('loadTime', loadTime)
    this.updateLatestMetric('domContentLoaded', domContentLoaded)
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart
    
    // Log slow resources (over 1 second)
    if (duration > 1000) {
      console.warn('🐌 Slow Resource:', entry.name, `${duration.toFixed(0)}ms`)
    }
  }

  private collectLoadMetrics(): void {
    const pageName = this.getPageName()
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (!navigation) return

    const metrics: PerformanceMetrics = {
      pageName,
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      memory: this.getMemoryInfo(),
      cacheStats: this.getCacheStats()
    }

    // Get FCP if available
    const fcpEntries = performance.getEntriesByName('first-contentful-paint')
    if (fcpEntries.length > 0) {
      metrics.firstContentfulPaint = fcpEntries[0].startTime
    }

    this.metrics.push(metrics)
    this.reportMetrics(metrics)
    
    console.log('📊 Performance Metrics Collected:', metrics)
  }

  private collectRuntimeMetrics(): void {
    const memInfo = this.getMemoryInfo()
    if (memInfo) {
      const memUsageMB = memInfo.usedJSMemSize / 1024 / 1024
      
      // Warn about high memory usage
      if (memUsageMB > 100) {
        console.warn('🚨 High Memory Usage:', `${memUsageMB.toFixed(1)}MB`)
      }
      
      // Log memory stats
      console.log('💾 Memory Usage:', {
        used: `${memUsageMB.toFixed(1)}MB`,
        total: `${(memInfo.totalJSMemSize / 1024 / 1024).toFixed(1)}MB`,
        limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`
      })
    }
  }

  private updateLatestMetric(key: keyof PerformanceMetrics, value: any): void {
    const latest = this.getLatestMetric()
    if (latest) {
      ;(latest as any)[key] = value
    }
  }

  private getLatestMetric(): PerformanceMetrics | undefined {
    return this.metrics[this.metrics.length - 1]
  }

  private getPageName(): string {
    return window.location.pathname || 'unknown'
  }

  private getConnectionInfo(): NetworkInformation | undefined {
    return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  }

  private getMemoryInfo(): MemoryInfo | undefined {
    return (performance as any).memory
  }

  private getCacheStats() {
    const stats = cache.getStats()
    const total = stats.hits + stats.misses
    return {
      ...stats,
      hitRate: total > 0 ? stats.hits / total : 0
    }
  }

  private async reportMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // In a real app, you might send this to an analytics service
      // For now, we'll store in cache for admin dashboard
      const cacheKey = `perf_metrics:${Date.now()}`
      await cache.set(cacheKey, metrics, { ttl: 86400 }) // Store for 24 hours
      
      // Also store aggregated daily metrics
      await this.updateDailyAggregates(metrics)
      
    } catch (error) {
      console.error('Failed to report performance metrics:', error)
    }
  }

  private async updateDailyAggregates(metrics: PerformanceMetrics): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const aggregateKey = `perf_daily:${today}`
    
    try {
      let dailyStats = await cache.get<any>(aggregateKey) || {
        date: today,
        pages: {},
        totalPageViews: 0,
        averageLoadTime: 0,
        slowestPage: '',
        slowestTime: 0
      }
      
      // Update page-specific stats
      if (!dailyStats.pages[metrics.pageName]) {
        dailyStats.pages[metrics.pageName] = {
          views: 0,
          totalLoadTime: 0,
          averageLoadTime: 0,
          fastestLoad: Infinity,
          slowestLoad: 0
        }
      }
      
      const pageStats = dailyStats.pages[metrics.pageName]
      pageStats.views++
      pageStats.totalLoadTime += metrics.loadTime
      pageStats.averageLoadTime = pageStats.totalLoadTime / pageStats.views
      pageStats.fastestLoad = Math.min(pageStats.fastestLoad, metrics.loadTime)
      pageStats.slowestLoad = Math.max(pageStats.slowestLoad, metrics.loadTime)
      
      // Update global stats
      dailyStats.totalPageViews++
      
      if (metrics.loadTime > dailyStats.slowestTime) {
        dailyStats.slowestPage = metrics.pageName
        dailyStats.slowestTime = metrics.loadTime
      }
      
      // Recalculate global average
      let totalTime = 0
      let totalViews = 0
      for (const page of Object.values(dailyStats.pages) as any[]) {
        totalTime += page.totalLoadTime
        totalViews += page.views
      }
      dailyStats.averageLoadTime = totalViews > 0 ? totalTime / totalViews : 0
      
      await cache.set(aggregateKey, dailyStats, { ttl: 86400 * 7 }) // Store for 7 days
      
    } catch (error) {
      console.error('Failed to update daily aggregates:', error)
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  public clearMetrics(): void {
    this.metrics = []
  }

  public async getDailyStats(date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const cacheKey = `perf_daily:${targetDate}`
    return await cache.get(cacheKey)
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    
    console.log(`⏱️  ${name}: ${(endTime - startTime).toFixed(2)}ms`)
    return result
  }

  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    console.log(`⏱️  ${name}: ${(endTime - startTime).toFixed(2)}ms`)
    return result
  }

  // Performance optimization suggestions
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const latest = this.getLatestMetric()
    
    if (!latest) return suggestions
    
    if (latest.loadTime > 3000) {
      suggestions.push('Page load time is over 3 seconds. Consider optimizing images and reducing JavaScript bundle size.')
    }
    
    if (latest.firstContentfulPaint && latest.firstContentfulPaint > 2000) {
      suggestions.push('First Contentful Paint is slow. Consider implementing critical CSS inline and deferring non-critical resources.')
    }
    
    if (latest.largestContentfulPaint && latest.largestContentfulPaint > 2500) {
      suggestions.push('Largest Contentful Paint is slow. Optimize your largest page element (images, text blocks).')
    }
    
    if (latest.firstInputDelay && latest.firstInputDelay > 100) {
      suggestions.push('First Input Delay is high. Consider reducing JavaScript execution time and using web workers for heavy computations.')
    }
    
    if (latest.cumulativeLayoutShift && latest.cumulativeLayoutShift > 0.1) {
      suggestions.push('Cumulative Layout Shift is high. Ensure images and ads have defined dimensions and avoid inserting content above existing content.')
    }
    
    const memInfo = this.getMemoryInfo()
    if (memInfo && memInfo.usedJSMemSize / memInfo.jsHeapSizeLimit > 0.8) {
      suggestions.push('Memory usage is high. Consider implementing memory cleanup and avoiding memory leaks.')
    }
    
    const cacheStats = this.getCacheStats()
    if (cacheStats.hitRate < 0.5) {
      suggestions.push('Cache hit rate is low. Review caching strategy and increase TTL for stable data.')
    }
    
    return suggestions
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions
export function measurePerformance<T>(name: string, fn: () => T): T {
  return performanceMonitor.measureFunction(name, fn)
}

export function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureAsyncFunction(name, fn)
}

export function getPerformanceMetrics(): PerformanceMetrics[] {
  return performanceMonitor.getMetrics()
}

export function getOptimizationSuggestions(): string[] {
  return performanceMonitor.getOptimizationSuggestions()
}

export default performanceMonitor
