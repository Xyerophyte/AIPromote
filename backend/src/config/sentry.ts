import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { config } from './config';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

class SentryManager {
  private initialized = false;
  
  /**
   * Initialize Sentry error monitoring
   */
  init(): void {
    if (this.initialized || !process.env.SENTRY_DSN) {
      return;
    }

    const sentryConfig: SentryConfig = {
      dsn: process.env.SENTRY_DSN,
      environment: config.nodeEnv,
      release: process.env.BUILD_ID || process.env.VERSION || 'unknown',
      tracesSampleRate: this.getTracesSampleRate(),
      profilesSampleRate: this.getProfilesSampleRate(),
      beforeSend: this.beforeSend.bind(this),
    };

    Sentry.init({
      ...sentryConfig,
      integrations: [
        // Enable HTTP requests tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app: undefined }),
        // Enable database queries tracing
        new Tracing.Integrations.Prisma({ client: undefined }),
        // Enable Redis tracing
        new Tracing.Integrations.Redis(),
      ],
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive data from breadcrumbs
        if (breadcrumb.category === 'http' && breadcrumb.data) {
          // Remove sensitive headers and query parameters
          const sensitiveKeys = ['authorization', 'cookie', 'password', 'secret', 'token', 'key'];
          Object.keys(breadcrumb.data).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              breadcrumb.data![key] = '[Filtered]';
            }
          });
        }
        return breadcrumb;
      },
    });

    this.initialized = true;
    console.log(`✅ Sentry initialized for ${config.nodeEnv} environment`);
  }

  /**
   * Get traces sample rate based on environment
   */
  private getTracesSampleRate(): number {
    switch (config.nodeEnv) {
      case 'production':
        return 0.1; // 10% sampling in production
      case 'staging':
        return 0.5; // 50% sampling in staging
      default:
        return 1.0; // 100% sampling in development
    }
  }

  /**
   * Get profiles sample rate based on environment
   */
  private getProfilesSampleRate(): number {
    switch (config.nodeEnv) {
      case 'production':
        return 0.1; // 10% sampling in production
      case 'staging':
        return 0.5; // 50% sampling in staging
      default:
        return 1.0; // 100% sampling in development
    }
  }

  /**
   * Filter events before sending to Sentry
   */
  private beforeSend(event: Sentry.Event): Sentry.Event | null {
    // Don't send events in development unless explicitly enabled
    if (config.nodeEnv === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter out common non-critical errors
    const ignoredErrors = [
      'NetworkError',
      'ChunkLoadError',
      'Loading chunk',
      'ResizeObserver loop limit exceeded',
    ];

    if (event.exception?.values) {
      const error = event.exception.values[0];
      if (error.value && ignoredErrors.some(ignored => error.value!.includes(ignored))) {
        return null;
      }
    }

    // Sanitize sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
          if (event.request!.headers![header]) {
            event.request!.headers![header] = '[Filtered]';
          }
        });
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const url = new URLSearchParams(event.request.query_string);
        const sensitiveParams = ['password', 'token', 'secret', 'key', 'api_key'];
        sensitiveParams.forEach(param => {
          if (url.has(param)) {
            url.set(param, '[Filtered]');
          }
        });
        event.request.query_string = url.toString();
      }
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        name: 'ai-promote-backend',
        version: process.env.VERSION || 'unknown',
        build_id: process.env.BUILD_ID || 'unknown',
      },
      runtime: {
        name: 'node',
        version: process.version,
      },
    };

    return event;
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Set custom tags
   */
  setTags(tags: Record<string, string>): void {
    Sentry.setTags(tags);
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>): void {
    Sentry.setContext(key, context);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Capture exception with additional context
   */
  captureException(error: Error, context?: Record<string, any>): void {
    if (context) {
      Sentry.withScope(scope => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  /**
   * Capture message with level
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  /**
   * Start a new transaction
   */
  startTransaction(name: string, op?: string): Sentry.Transaction {
    return Sentry.startTransaction({ name, op });
  }

  /**
   * Get current transaction
   */
  getCurrentTransaction(): Sentry.Transaction | undefined {
    return Sentry.getCurrentHub().getScope()?.getTransaction();
  }

  /**
   * Middleware for Fastify to capture requests
   */
  getFastifyMiddleware() {
    return {
      onRequest: async (request: any, reply: any) => {
        const transaction = Sentry.startTransaction({
          op: 'http.server',
          name: `${request.method} ${request.url}`,
        });

        // Set transaction on the request for later use
        request.sentryTransaction = transaction;

        // Set user context if available
        if (request.user) {
          this.setUser(request.user);
        }

        // Add request context
        this.setContext('request', {
          method: request.method,
          url: request.url,
          headers: this.filterSensitiveHeaders(request.headers),
          query: request.query,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      },

      onResponse: async (request: any, reply: any) => {
        const transaction = request.sentryTransaction;
        if (transaction) {
          transaction.setHttpStatus(reply.statusCode);
          transaction.finish();
        }

        // Log errors to Sentry
        if (reply.statusCode >= 400) {
          this.captureMessage(
            `HTTP ${reply.statusCode}: ${request.method} ${request.url}`,
            reply.statusCode >= 500 ? 'error' : 'warning'
          );
        }
      },

      onError: async (request: any, reply: any, error: Error) => {
        this.captureException(error, {
          request: {
            method: request.method,
            url: request.url,
            headers: this.filterSensitiveHeaders(request.headers),
            query: request.query,
          },
          response: {
            statusCode: reply.statusCode,
          },
        });
      },
    };
  }

  /**
   * Filter sensitive headers
   */
  private filterSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
    const filtered = { ...headers };
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveKeys.forEach(key => {
      if (filtered[key]) {
        filtered[key] = '[Filtered]';
      }
    });
    
    return filtered;
  }

  /**
   * Performance monitoring for AI operations
   */
  monitorAIOperation<T>(
    operation: string,
    provider: string,
    model: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.trace(
      {
        name: `ai.${operation}`,
        op: 'ai.completion',
        data: {
          provider,
          model,
        },
      },
      fn
    );
  }

  /**
   * Monitor database operations
   */
  monitorDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.trace(
      {
        name: `db.${operation}`,
        op: 'db.query',
        data: {
          table,
        },
      },
      fn
    );
  }

  /**
   * Health check for Sentry integration
   */
  healthCheck(): boolean {
    return this.initialized && !!process.env.SENTRY_DSN;
  }

  /**
   * Flush pending events (useful for graceful shutdown)
   */
  async flush(timeout = 2000): Promise<boolean> {
    return Sentry.flush(timeout);
  }

  /**
   * Close Sentry client
   */
  async close(): Promise<void> {
    await Sentry.close();
    this.initialized = false;
  }
}

// Export singleton instance
export const sentryManager = new SentryManager();

// Export common Sentry utilities
export {
  Sentry,
  Tracing,
};

// Initialize Sentry if DSN is available
if (process.env.SENTRY_DSN) {
  sentryManager.init();
}
