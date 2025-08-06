import React from 'react';
import LogRocket from 'logrocket';
import { setupLogRocketReact } from 'logrocket-react';

interface LogRocketConfig {
  appId: string;
  shouldCaptureIP: boolean;
  dom: {
    textSanitizer: boolean;
    inputSanitizer: boolean;
    baseHref: string | null;
  };
  network: {
    requestSanitizer: (request: any) => any;
    responseSanitizer: (response: any) => any;
  };
  console: {
    shouldAggregateConsoleErrors: boolean;
    isEnabled: {
      log: boolean;
      info: boolean;
      warn: boolean;
      error: boolean;
    };
  };
}

class LogRocketManager {
  private initialized = false;
  
  /**
   * Initialize LogRocket session recording and monitoring
   */
  init(): void {
    const appId = process.env.NEXT_PUBLIC_LOGROCKET_ID;
    
    if (this.initialized || !appId || typeof window === 'undefined') {
      return;
    }

    const config: LogRocketConfig = {
      appId,
      shouldCaptureIP: false, // GDPR compliance
      dom: {
        textSanitizer: true,
        inputSanitizer: true,
        baseHref: null,
      },
      network: {
        requestSanitizer: this.sanitizeRequest.bind(this),
        responseSanitizer: this.sanitizeResponse.bind(this),
      },
      console: {
        shouldAggregateConsoleErrors: true,
        isEnabled: {
          log: process.env.NODE_ENV !== 'production',
          info: process.env.NODE_ENV !== 'production',
          warn: true,
          error: true,
        },
      },
    };

    LogRocket.init(appId, config);
    
    // Set up React plugin for component tracking
    setupLogRocketReact(LogRocket);
    
    // Set up privacy rules
    this.setupPrivacyRules();
    
    this.initialized = true;
    console.log('✅ LogRocket initialized');
  }

  /**
   * Set up privacy rules to protect sensitive data
   */
  private setupPrivacyRules(): void {
    // Hide sensitive input fields
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="secret"]',
      'input[name*="token"]',
      'input[name*="key"]',
      'input[name*="credit"]',
      'input[name*="card"]',
      'input[name*="ssn"]',
      'textarea[name*="private"]',
      '[data-private]',
      '[data-sensitive]',
    ];

    sensitiveSelectors.forEach(selector => {
      LogRocket.addSanitizedProperty(selector);
    });

    // Hide sensitive text content
    const sensitiveTextSelectors = [
      '.password',
      '.secret',
      '.token',
      '.api-key',
      '.credit-card',
      '.ssn',
      '[data-sensitive-text]',
    ];

    sensitiveTextSelectors.forEach(selector => {
      LogRocket.addSanitizedProperty(selector);
    });
  }

  /**
   * Sanitize network requests to remove sensitive data
   */
  private sanitizeRequest(request: any): any {
    // Don't log requests to sensitive endpoints
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/password',
      '/billing/payment',
      '/api/keys',
    ];

    if (sensitiveEndpoints.some(endpoint => request.url?.includes(endpoint))) {
      return null; // Don't log these requests at all
    }

    // Sanitize headers
    const sanitizedHeaders = { ...request.reqHeaders };
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitizedHeaders[header]) {
        sanitizedHeaders[header] = '[REDACTED]';
      }
    });

    // Sanitize request body
    let sanitizedBody = request.body;
    if (typeof sanitizedBody === 'string') {
      try {
        const parsed = JSON.parse(sanitizedBody);
        sanitizedBody = this.sanitizeObject(parsed);
      } catch {
        // If not JSON, keep as is
      }
    } else if (typeof sanitizedBody === 'object') {
      sanitizedBody = this.sanitizeObject(sanitizedBody);
    }

    return {
      ...request,
      reqHeaders: sanitizedHeaders,
      body: sanitizedBody,
    };
  }

  /**
   * Sanitize network responses to remove sensitive data
   */
  private sanitizeResponse(response: any): any {
    // Don't log responses from sensitive endpoints
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/register',
      '/billing/payment',
      '/api/keys',
    ];

    if (sensitiveEndpoints.some(endpoint => response.url?.includes(endpoint))) {
      return null; // Don't log these responses at all
    }

    // Sanitize response body
    let sanitizedBody = response.body;
    if (typeof sanitizedBody === 'string') {
      try {
        const parsed = JSON.parse(sanitizedBody);
        sanitizedBody = this.sanitizeObject(parsed);
      } catch {
        // If not JSON, keep as is
      }
    } else if (typeof sanitizedBody === 'object') {
      sanitizedBody = this.sanitizeObject(sanitizedBody);
    }

    return {
      ...response,
      body: sanitizedBody,
    };
  }

  /**
   * Sanitize object by removing sensitive properties
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'apiKey',
      'accessToken',
      'refreshToken',
      'sessionId',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Identify user for session tracking
   */
  identify(user: {
    id: string;
    email?: string;
    name?: string;
    plan?: string;
  }): void {
    if (!this.initialized) return;

    LogRocket.identify(user.id, {
      name: user.name,
      email: user.email,
      subscriptionType: user.plan,
      // Don't include sensitive information
    });
  }

  /**
   * Track custom events
   */
  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    // Sanitize properties before tracking
    const sanitizedProperties = properties ? this.sanitizeObject(properties) : {};
    
    LogRocket.track(event, sanitizedProperties);
  }

  /**
   * Add custom tags to session
   */
  addTag(key: string, value: string): void {
    if (!this.initialized) return;
    
    LogRocket.addTag(key, value);
  }

  /**
   * Capture custom error
   */
  captureException(error: Error, extra?: Record<string, any>): void {
    if (!this.initialized) return;

    LogRocket.captureException(error, extra ? this.sanitizeObject(extra) : undefined);
  }

  /**
   * Start a new session (useful for SPA navigation)
   */
  startNewSession(): void {
    if (!this.initialized) return;
    
    LogRocket.startNewSession();
  }

  /**
   * Get current session URL
   */
  getSessionURL(): string | null {
    if (!this.initialized) return null;
    
    return LogRocket.sessionURL;
  }

  /**
   * Disable session recording temporarily
   */
  pauseRecording(): void {
    if (!this.initialized) return;
    
    LogRocket.getRecordingStatus() === 'active' && LogRocket.pauseRecording();
  }

  /**
   * Resume session recording
   */
  resumeRecording(): void {
    if (!this.initialized) return;
    
    LogRocket.resumeRecording();
  }

  /**
   * Check if LogRocket is initialized and recording
   */
  isActive(): boolean {
    return this.initialized && LogRocket.getRecordingStatus() === 'active';
  }

  /**
   * Enhanced error boundary integration
   */
  createErrorBoundary() {
    return class LogRocketErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log the error to LogRocket
        LogRocket.captureException(error, {
          extra: errorInfo,
          tags: {
            component: 'ErrorBoundary',
          },
        });
      }

      render(): React.ReactNode {
        if (this.state.hasError) {
          return (
            <div className="error-boundary">
              <h2>Something went wrong.</h2>
              <p>We've been notified about this error and will fix it soon.</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="retry-button"
              >
                Try again
              </button>
            </div>
          );
        }

        return this.props.children;
      }
    };
  }

  /**
   * Integration with Next.js App Router
   */
  setupNextJSIntegration(): void {
    if (typeof window === 'undefined') return;

    // Track page views
    const handleRouteChange = (url: string) => {
      this.track('page_view', { url });
    };

    // Listen for route changes in Next.js 13+ App Router
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        handleRouteChange(window.location.href);
      };

      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        handleRouteChange(window.location.href);
      };

      window.addEventListener('popstate', () => {
        handleRouteChange(window.location.href);
      });
    }
  }

  /**
   * GDPR compliance helper
   */
  handleGDPRConsent(hasConsent: boolean): void {
    if (hasConsent && !this.initialized) {
      this.init();
    } else if (!hasConsent && this.initialized) {
      // Stop recording and clear session
      LogRocket.pauseRecording();
      this.initialized = false;
    }
  }
}

// Export singleton instance
export const logRocketManager = new LogRocketManager();

// Auto-initialize if environment variable is present
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_ID) {
  logRocketManager.init();
  logRocketManager.setupNextJSIntegration();
}

// Export for React components
export default LogRocket;
