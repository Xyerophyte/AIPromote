import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis';
import { config } from '../config/config';

// Performance metrics interface
export interface PerformanceMetric {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  ip: string;
  userAgent: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

// System health metrics
export interface SystemHealthMetrics {
  timestamp: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  uptime: number;
  activeConnections: number;
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number; // requests per minute
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];

  // Middleware to track request performance
  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = process.hrtime.bigint();
      const startCpuUsage = process.cpuUsage();

      // Track request start
      this.requestCount++;

      reply.raw.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const endCpuUsage = process.cpuUsage(startCpuUsage);

        // Track errors
        if (reply.statusCode >= 400) {
          this.errorCount++;
        }

        // Store response time for statistics
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
          this.responseTimes = this.responseTimes.slice(-1000);
        }

        const metric: PerformanceMetric = {
          timestamp: Date.now(),
          endpoint: request.url,
          method: request.method,
          responseTime,
          statusCode: reply.statusCode,
          userId: (request as any).user?.id,
          ip: request.ip,
          userAgent: request.headers['user-agent'] || '',
          memoryUsage: process.memoryUsage(),
          cpuUsage: endCpuUsage,
        };

        this.addMetric(metric);
      });
    };
  }

  // Add a performance metric
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last 10,000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    // Store in Redis for distributed monitoring
    this.storeMetricInRedis(metric);

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);
  }

  // Store metric in Redis
  private async storeMetricInRedis(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `performance:${Date.now()}`;
      await redis.setex(key, 3600, JSON.stringify(metric)); // Store for 1 hour

      // Update aggregate statistics
      const now = Date.now();
      const minuteKey = `perf_stats:${Math.floor(now / 60000)}`;
      
      const pipe = redis.pipeline();
      pipe.hincrby(minuteKey, 'request_count', 1);
      pipe.hincrbyfloat(minuteKey, 'total_response_time', metric.responseTime);
      pipe.hset(minuteKey, 'last_updated', now);
      pipe.expire(minuteKey, 3600);
      
      if (metric.statusCode >= 400) {
        pipe.hincrby(minuteKey, 'error_count', 1);
      }
      
      await pipe.exec();
    } catch (error) {
      console.error('Error storing performance metric in Redis:', error);
    }
  }

  // Check for performance alerts
  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    // Alert on slow responses (>5 seconds)
    if (metric.responseTime > 5000) {
      this.sendAlert('SLOW_RESPONSE', {
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        timestamp: metric.timestamp,
      });
    }

    // Alert on high memory usage (>85%)
    const memoryPercentage = (metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal) * 100;
    if (memoryPercentage > 85) {
      this.sendAlert('HIGH_MEMORY_USAGE', {
        percentage: memoryPercentage,
        used: metric.memoryUsage.heapUsed,
        total: metric.memoryUsage.heapTotal,
        timestamp: metric.timestamp,
      });
    }

    // Alert on high error rate (>10% in last 100 requests)
    const recentMetrics = this.metrics.slice(-100);
    const errorRate = (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100;
    if (errorRate > 10 && recentMetrics.length >= 100) {
      this.sendAlert('HIGH_ERROR_RATE', {
        errorRate,
        recentErrors: recentMetrics.filter(m => m.statusCode >= 400).length,
        totalRequests: recentMetrics.length,
        timestamp: metric.timestamp,
      });
    }
  }

  // Send performance alert
  private async sendAlert(type: string, data: any): Promise<void> {
    const alertKey = `alert:${type}:${Math.floor(Date.now() / 300000)}`; // 5-minute window
    
    // Prevent duplicate alerts within 5 minutes
    const existing = await redis.get(alertKey);
    if (existing) return;

    await redis.setex(alertKey, 300, JSON.stringify(data));

    // In production, you would send this to your monitoring service
    console.warn(`Performance Alert [${type}]:`, data);

    // You could integrate with services like:
    // - Slack webhooks
    // - PagerDuty
    // - DataDog
    // - New Relic
    // - Custom monitoring dashboard
  }

  // Get current system health metrics
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    const now = Date.now();
    const uptime = (now - this.startTime) / 1000;
    
    // Calculate memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate response time statistics
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const avgResponseTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length 
      : 0;
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p95 = sortedTimes[p95Index] || 0;
    const p99 = sortedTimes[p99Index] || 0;

    // Calculate error rate
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    // Calculate throughput (requests per minute)
    const uptimeMinutes = uptime / 60;
    const throughput = uptimeMinutes > 0 ? this.requestCount / uptimeMinutes : 0;

    return {
      timestamp: now,
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      cpu: {
        usage: await this.getCpuUsage(),
      },
      uptime,
      activeConnections: this.getActiveConnections(),
      responseTime: {
        avg: avgResponseTime,
        p95,
        p99,
      },
      errorRate,
      throughput,
    };
  }

  // Get CPU usage
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const percentage = (totalUsage / 1000000) / 0.1 * 100; // 100ms sampling period
        resolve(Math.min(100, percentage));
      }, 100);
    });
  }

  // Get active connections (placeholder - would need actual server reference)
  private getActiveConnections(): number {
    // This would need to be implemented based on your server setup
    return 0;
  }

  // Get performance statistics for a time period
  getMetricsForPeriod(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  // Get slowest endpoints
  getSlowestEndpoints(limit: number = 10): Array<{ endpoint: string; avgResponseTime: number; count: number }> {
    const endpointStats = new Map<string, { totalTime: number; count: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);
  }

  // Get error-prone endpoints
  getErrorProneEndpoints(limit: number = 10): Array<{ endpoint: string; errorRate: number; errorCount: number; totalCount: number }> {
    const endpointStats = new Map<string, { errorCount: number; totalCount: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { errorCount: 0, totalCount: 0 };
      endpointStats.set(key, {
        errorCount: existing.errorCount + (metric.statusCode >= 400 ? 1 : 0),
        totalCount: existing.totalCount + 1,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        errorRate: (stats.errorCount / stats.totalCount) * 100,
        errorCount: stats.errorCount,
        totalCount: stats.totalCount,
      }))
      .filter(stat => stat.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  // Clear metrics (for testing or memory management)
  clearMetrics(): void {
    this.metrics = [];
    this.responseTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // Export metrics for external monitoring tools
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusMetrics();
    }

    return JSON.stringify({
      metrics: this.metrics,
      summary: {
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        averageResponseTime: this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length || 0,
        uptime: (Date.now() - this.startTime) / 1000,
      },
    });
  }

  // Export metrics in Prometheus format
  private exportPrometheusMetrics(): string {
    const avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length || 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0;

    return `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${this.requestCount}

# HELP http_request_errors_total Total number of HTTP request errors
# TYPE http_request_errors_total counter
http_request_errors_total ${this.errorCount}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum ${this.responseTimes.reduce((a, b) => a + b / 1000, 0)}
http_request_duration_seconds_count ${this.responseTimes.length}

# HELP http_request_error_rate HTTP request error rate
# TYPE http_request_error_rate gauge
http_request_error_rate ${errorRate}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${(Date.now() - this.startTime) / 1000}
    `.trim();
  }
}

// Query optimization helpers
export class QueryOptimizer {
  // Cache frequently accessed data
  private cache = new Map<string, { data: any; expiry: number }>();

  // Cache with TTL
  set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  // Get cached data
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear expired cache entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Memory usage optimization
  optimizeMemory(): void {
    // Clear expired cache entries
    this.clearExpired();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

// Database connection pool optimization
export class ConnectionPoolOptimizer {
  private activeConnections = 0;
  private maxConnections = 20;

  // Monitor connection usage
  trackConnection(acquire: boolean): void {
    if (acquire) {
      this.activeConnections++;
    } else {
      this.activeConnections = Math.max(0, this.activeConnections - 1);
    }

    // Alert if connection pool is exhausted
    if (this.activeConnections >= this.maxConnections * 0.9) {
      console.warn(`High database connection usage: ${this.activeConnections}/${this.maxConnections}`);
    }
  }

  // Get connection pool stats
  getStats(): { active: number; max: number; utilization: number } {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      utilization: (this.activeConnections / this.maxConnections) * 100,
    };
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const queryOptimizer = new QueryOptimizer();
export const connectionPoolOptimizer = new ConnectionPoolOptimizer();

// Cleanup jobs
setInterval(() => {
  queryOptimizer.clearExpired();
}, 60000); // Run every minute
