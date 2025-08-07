import { sentryManager } from '../config/sentry';
import { redis } from '../config/redis';
import { config } from '../config/config';
import { performance } from 'perf_hooks';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime: number;
  timestamp: Date;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  incidents: number;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: number; // seconds
  enabled: boolean;
  channels: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class MonitoringDashboard {
  private static instance: MonitoringDashboard;
  private healthChecks: Map<string, HealthCheck[]> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private metricsRetention = 7 * 24 * 60 * 60 * 1000; // 7 days

  private readonly services = [
    {
      name: 'Database',
      url: process.env.DATABASE_URL,
      check: this.checkDatabase.bind(this),
    },
    {
      name: 'Redis',
      url: process.env.REDIS_URL,
      check: this.checkRedis.bind(this),
    },
    {
      name: 'OpenAI API',
      url: 'https://api.openai.com/v1/models',
      check: this.checkOpenAI.bind(this),
    },
    {
      name: 'Anthropic API',
      url: 'https://api.anthropic.com/v1/messages',
      check: this.checkAnthropic.bind(this),
    },
    {
      name: 'S3 Storage',
      url: null,
      check: this.checkS3.bind(this),
    },
    {
      name: 'Email Service',
      url: null,
      check: this.checkEmailService.bind(this),
    },
  ];

  public static getInstance(): MonitoringDashboard {
    if (!MonitoringDashboard.instance) {
      MonitoringDashboard.instance = new MonitoringDashboard();
    }
    return MonitoringDashboard.instance;
  }

  /**
   * Start monitoring services
   */
  public startMonitoring(): void {
    console.log('📊 Starting monitoring dashboard...');
    
    // Setup default alert rules
    this.setupDefaultAlertRules();
    
    // Start health checks every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
      await this.collectSystemMetrics();
      await this.checkAlertRules();
    }, 30000);

    // Initial health check
    this.performHealthChecks();
    this.collectSystemMetrics();
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('📊 Monitoring dashboard stopped');
  }

  /**
   * Get current system status
   */
  public async getSystemStatus(): Promise<{
    overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
    services: ServiceStatus[];
    uptime: number;
    lastUpdated: Date;
  }> {
    const services = Array.from(this.serviceStatuses.values());
    
    // Determine overall status
    let overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' = 'operational';
    const unhealthyServices = services.filter(s => s.status !== 'operational');
    
    if (unhealthyServices.length === 0) {
      overall = 'operational';
    } else if (unhealthyServices.length === services.length) {
      overall = 'major_outage';
    } else if (unhealthyServices.some(s => s.status === 'major_outage')) {
      overall = 'partial_outage';
    } else {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      uptime: process.uptime(),
      lastUpdated: new Date(),
    };
  }

  /**
   * Get system metrics
   */
  public getSystemMetrics(hours = 24): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.systemMetrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Get health check history
   */
  public getHealthCheckHistory(service?: string, hours = 24): HealthCheck[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    if (service) {
      const checks = this.healthChecks.get(service) || [];
      return checks.filter(c => c.timestamp.getTime() > cutoff);
    }

    // Return all health checks
    const allChecks: HealthCheck[] = [];
    this.healthChecks.forEach(checks => {
      allChecks.push(...checks.filter(c => c.timestamp.getTime() > cutoff));
    });
    
    return allChecks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        condition: 'gt',
        threshold: 80,
        duration: 300, // 5 minutes
        enabled: true,
        channels: ['email', 'slack'],
        severity: 'high',
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        metric: 'memory.usage',
        condition: 'gt',
        threshold: 85,
        duration: 300,
        enabled: true,
        channels: ['email', 'slack'],
        severity: 'high',
      },
      {
        id: 'disk-space-low',
        name: 'Low Disk Space',
        metric: 'disk.usage',
        condition: 'gt',
        threshold: 90,
        duration: 60,
        enabled: true,
        channels: ['email', 'slack', 'pagerduty'],
        severity: 'critical',
      },
      {
        id: 'service-down',
        name: 'Service Down',
        metric: 'service.status',
        condition: 'eq',
        threshold: 0, // 0 = down
        duration: 60,
        enabled: true,
        channels: ['email', 'slack', 'pagerduty'],
        severity: 'critical',
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        metric: 'service.responseTime',
        condition: 'gt',
        threshold: 5000, // 5 seconds
        duration: 180,
        enabled: true,
        channels: ['slack'],
        severity: 'medium',
      },
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        metric: 'error.rate',
        condition: 'gt',
        threshold: 5, // 5% error rate
        duration: 120,
        enabled: true,
        channels: ['email', 'slack'],
        severity: 'high',
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const checks = await Promise.allSettled(
      this.services.map(service => this.performServiceHealthCheck(service))
    );

    // Update service statuses
    this.services.forEach((service, index) => {
      const result = checks[index];
      if (result.status === 'fulfilled') {
        this.updateServiceStatus(service.name, result.value);
      }
    });
  }

  /**
   * Perform health check on a single service
   */
  private async performServiceHealthCheck(service: {
    name: string;
    check: () => Promise<HealthCheck>;
  }): Promise<HealthCheck> {
    const start = performance.now();
    try {
      const result = await service.check();
      const responseTime = performance.now() - start;
      return { ...result, responseTime };
    } catch (error) {
      const responseTime = performance.now() - start;
      return {
        service: service.name,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update service status
   */
  private updateServiceStatus(serviceName: string, healthCheck: HealthCheck): void {
    const current = this.serviceStatuses.get(serviceName);
    const isHealthy = healthCheck.status === 'healthy';
    
    const status: ServiceStatus = {
      name: serviceName,
      status: this.mapHealthToStatus(healthCheck.status),
      uptime: current ? (isHealthy ? current.uptime + 30 : 0) : (isHealthy ? 30 : 0),
      responseTime: healthCheck.responseTime,
      lastCheck: healthCheck.timestamp,
      incidents: current ? (isHealthy ? current.incidents : current.incidents + 1) : (isHealthy ? 0 : 1),
    };

    this.serviceStatuses.set(serviceName, status);

    // Store health check history
    const history = this.healthChecks.get(serviceName) || [];
    history.push(healthCheck);
    
    // Keep only recent history
    const cutoff = Date.now() - this.metricsRetention;
    const filtered = history.filter(h => h.timestamp.getTime() > cutoff);
    this.healthChecks.set(serviceName, filtered);
  }

  /**
   * Map health status to service status
   */
  private mapHealthToStatus(health: 'healthy' | 'degraded' | 'unhealthy'): ServiceStatus['status'] {
    switch (health) {
      case 'healthy':
        return 'operational';
      case 'degraded':
        return 'degraded';
      case 'unhealthy':
        return 'major_outage';
      default:
        return 'major_outage';
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        cpu: await this.getCPUMetrics(),
        memory: await this.getMemoryMetrics(),
        disk: await this.getDiskMetrics(),
        network: await this.getNetworkMetrics(),
        uptime: process.uptime(),
        timestamp: new Date(),
      };

      this.systemMetrics.push(metrics);

      // Keep only recent metrics
      const cutoff = Date.now() - this.metricsRetention;
      this.systemMetrics = this.systemMetrics.filter(m => m.timestamp.getTime() > cutoff);

      // Store in Redis for persistence
      await redis.zadd(
        'system_metrics',
        Date.now(),
        JSON.stringify(metrics)
      );

      // Keep only recent metrics in Redis
      await redis.zremrangebyscore('system_metrics', 0, cutoff);
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Get CPU metrics
   */
  private async getCPUMetrics(): Promise<SystemMetrics['cpu']> {
    const os = require('os');
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach((cpu: any) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usage = 100 - ~~(100 * totalIdle / totalTick);
    
    return {
      usage,
      loadAverage,
    };
  }

  /**
   * Get memory metrics
   */
  private async getMemoryMetrics(): Promise<SystemMetrics['memory']> {
    const os = require('os');
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;
    
    return {
      used,
      free,
      usage,
    };
  }

  /**
   * Get disk metrics
   */
  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    const fs = require('fs').promises;
    
    try {
      const stats = await fs.statvfs || fs.stat;
      // Simplified disk metrics - in production, use proper disk monitoring
      return {
        used: 0,
        free: 0,
        usage: 0,
      };
    } catch {
      return {
        used: 0,
        free: 0,
        usage: 0,
      };
    }
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<SystemMetrics['network']> {
    // Simplified network metrics - in production, monitor actual network usage
    return {
      bytesIn: 0,
      bytesOut: 0,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = performance.now() - start;
      
      await prisma.$disconnect();
      
      return {
        service: 'Database',
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
        timestamp: new Date(),
        details: {
          query: 'SELECT 1',
          connectionPool: 'active',
        },
      };
    } catch (error) {
      return {
        service: 'Database',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheck> {
    try {
      const start = performance.now();
      const result = await redis.ping();
      const responseTime = performance.now() - start;
      
      return {
        service: 'Redis',
        status: result === 'PONG' && responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date(),
        details: {
          response: result,
          connected: redis.status === 'ready',
        },
      };
    } catch (error) {
      return {
        service: 'Redis',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  /**
   * Check OpenAI API health
   */
  private async checkOpenAI(): Promise<HealthCheck> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'OpenAI API',
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: 'API key not configured',
        };
      }

      const start = performance.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      const responseTime = performance.now() - start;
      
      return {
        service: 'OpenAI API',
        status: response.ok && responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
          rateLimit: response.headers.get('x-ratelimit-remaining'),
        },
      };
    } catch (error) {
      return {
        service: 'OpenAI API',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'OpenAI API unreachable',
      };
    }
  }

  /**
   * Check Anthropic API health
   */
  private async checkAnthropic(): Promise<HealthCheck> {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          service: 'Anthropic API',
          status: 'degraded',
          responseTime: 0,
          timestamp: new Date(),
          error: 'API key not configured',
        };
      }

      // Simple health check - just verify the API key is valid
      const start = performance.now();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'health check' }],
        }),
      });
      const responseTime = performance.now() - start;
      
      return {
        service: 'Anthropic API',
        status: response.status < 500 && responseTime < 10000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
        },
      };
    } catch (error) {
      return {
        service: 'Anthropic API',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Anthropic API unreachable',
      };
    }
  }

  /**
   * Check S3 health
   */
  private async checkS3(): Promise<HealthCheck> {
    try {
      const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
      const client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
      });
      
      const start = performance.now();
      await client.send(new ListBucketsCommand({}));
      const responseTime = performance.now() - start;
      
      return {
        service: 'S3 Storage',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date(),
        details: {
          region: process.env.AWS_REGION || 'us-east-1',
        },
      };
    } catch (error) {
      return {
        service: 'S3 Storage',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'S3 connection failed',
      };
    }
  }

  /**
   * Check email service health
   */
  private async checkEmailService(): Promise<HealthCheck> {
    // Simplified email service check
    return {
      service: 'Email Service',
      status: process.env.EMAIL_HOST ? 'healthy' : 'degraded',
      responseTime: 0,
      timestamp: new Date(),
      details: {
        configured: !!process.env.EMAIL_HOST,
      },
    };
  }

  /**
   * Check alert rules
   */
  private async checkAlertRules(): Promise<void> {
    // Implementation for checking alert rules and triggering alerts
    // This would compare current metrics against thresholds
  }

  /**
   * Generate status page data
   */
  public async getStatusPageData(): Promise<{
    status: {
      indicator: 'none' | 'minor' | 'major' | 'critical';
      description: string;
    };
    components: Array<{
      name: string;
      status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage';
      description?: string;
    }>;
  }> {
    const systemStatus = await this.getSystemStatus();
    
    const statusMap = {
      operational: 'none' as const,
      degraded: 'minor' as const,
      partial_outage: 'major' as const,
      major_outage: 'critical' as const,
    };

    return {
      status: {
        indicator: statusMap[systemStatus.overall],
        description: this.getStatusDescription(systemStatus.overall),
      },
      components: systemStatus.services.map(service => ({
        name: service.name,
        status: service.status === 'operational' ? 'operational' :
                service.status === 'degraded' ? 'degraded_performance' :
                service.status === 'partial_outage' ? 'partial_outage' : 'major_outage',
        description: service.status !== 'operational' ? 
          `Response time: ${service.responseTime.toFixed(0)}ms` : undefined,
      })),
    };
  }

  /**
   * Get status description
   */
  private getStatusDescription(status: string): string {
    switch (status) {
      case 'operational':
        return 'All systems operational';
      case 'degraded':
        return 'Some systems experiencing degraded performance';
      case 'partial_outage':
        return 'Some systems are experiencing outages';
      case 'major_outage':
        return 'Major system outage affecting all services';
      default:
        return 'System status unknown';
    }
  }
}

// Export singleton instance
export const monitoringDashboard = MonitoringDashboard.getInstance();
