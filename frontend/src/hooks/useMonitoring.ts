import { useEffect, useCallback, useRef } from 'react';
import { trackWebVitals, trackUserEngagement, trackAPIPerformance, trackError } from '@/lib/analytics';
import * as Sentry from '@sentry/nextjs';

// Hook for page view tracking
export function usePageView() {
  useEffect(() => {
    trackUserEngagement('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }, []);
}

// Hook for API monitoring
export function useAPIMonitoring() {
  const startTime = useRef<number>(0);

  const startTracking = useCallback((endpoint: string) => {
    startTime.current = performance.now();
  }, []);

  const endTracking = useCallback((endpoint: string, response: Response) => {
    const duration = performance.now() - startTime.current;
    trackAPIPerformance(endpoint, duration, response.status);

    // Track slow API calls
    if (duration > 2000) {
      Sentry.addBreadcrumb({
        message: `Slow API call: ${endpoint}`,
        data: { duration, status: response.status },
        level: 'warning',
      });
    }
  }, []);

  const trackError = useCallback((endpoint: string, error: Error) => {
    const duration = performance.now() - startTime.current;
    Sentry.captureException(error, {
      extra: { endpoint, duration },
      tags: { type: 'api_error' },
    });
  }, []);

  return { startTracking, endTracking, trackError };
}

// Hook for user engagement tracking
export function useUserEngagement() {
  const trackClick = useCallback((elementId: string, elementType?: string) => {
    trackUserEngagement('click', {
      elementId,
      elementType,
    });
  }, []);

  const trackFormSubmission = useCallback((formId: string, success: boolean) => {
    trackUserEngagement('form_submit', {
      formId,
      success,
    });
  }, []);

  const trackDownload = useCallback((fileName: string, fileType?: string) => {
    trackUserEngagement('download', {
      fileName,
      fileType,
    });
  }, []);

  return { trackClick, trackFormSubmission, trackDownload };
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    trackWebVitals();

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };

      Sentry.setContext('memory', memoryUsage);

      // Alert if memory usage is high
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercentage > 80) {
        Sentry.captureMessage('High memory usage detected', 'warning');
      }
    }

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      Sentry.setContext('connection', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    }
  }, []);
}

// Hook for error boundary monitoring
export function useErrorMonitoring() {
  const captureError = useCallback((error: Error, errorInfo?: any) => {
    trackError(error);
    Sentry.withScope((scope) => {
      if (errorInfo) {
        scope.setContext('errorInfo', errorInfo);
      }
      Sentry.captureException(error);
    });
  }, []);

  return { captureError };
}

// Hook for business metrics
export function useBusinessMetrics() {
  const trackUserRegistration = useCallback((userId: string, method: string) => {
    trackUserEngagement('user_registration', {
      userId,
      method,
    });
    
    Sentry.setUser({ id: userId });
  }, []);

  const trackFeatureUsage = useCallback((feature: string, userId?: string) => {
    trackUserEngagement('feature_usage', {
      feature,
      userId,
    });
  }, []);

  const trackSubscription = useCallback((plan: string, userId: string, value: number) => {
    trackUserEngagement('subscription', {
      plan,
      userId,
      value,
    });
  }, []);

  return { trackUserRegistration, trackFeatureUsage, trackSubscription };
}
