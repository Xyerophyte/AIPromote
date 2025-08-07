import { track } from '@vercel/analytics/react';
import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

// Web Vitals tracking
export function trackWebVitals() {
  onCLS((metric) => {
    track('CLS', { value: metric.value, delta: metric.delta });
  });

  onFCP((metric) => {
    track('FCP', { value: metric.value, delta: metric.delta });
  });

  onFID((metric) => {
    track('FID', { value: metric.value, delta: metric.delta });
  });

  onLCP((metric) => {
    track('LCP', { value: metric.value, delta: metric.delta });
  });

  onTTFB((metric) => {
    track('TTFB', { value: metric.value, delta: metric.delta });
  });

  onINP((metric) => {
    track('INP', { value: metric.value, delta: metric.delta });
  });
}

// Custom business metrics tracking
export function trackBusinessMetric(eventName: string, data: Record<string, any>) {
  track(eventName, {
    ...data,
    timestamp: Date.now(),
    userId: data.userId || 'anonymous',
    sessionId: data.sessionId || generateSessionId(),
  });
}

// Track user engagement
export function trackUserEngagement(action: string, details?: Record<string, any>) {
  track('user_engagement', {
    action,
    ...details,
    timestamp: Date.now(),
    page: window.location.pathname,
  });
}

// Track API performance
export function trackAPIPerformance(endpoint: string, duration: number, status: number) {
  track('api_performance', {
    endpoint,
    duration,
    status,
    timestamp: Date.now(),
  });
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>) {
  track('error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now(),
    page: window.location.pathname,
  });
}

// Generate session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Track conversion events
export function trackConversion(event: string, value?: number, currency?: string) {
  track('conversion', {
    event,
    value,
    currency: currency || 'USD',
    timestamp: Date.now(),
  });
}
