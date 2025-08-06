import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/config';

// Security headers middleware
export const securityHeadersMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // Content Security Policy
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.twitter.com https://api.linkedin.com https://graph.facebook.com",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ].join('; ');

  reply.headers({
    // Content Security Policy
    'Content-Security-Policy': cspPolicy,
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
    ].join(', '),
    
    // Strict Transport Security (HTTPS only)
    ...(config.nodeEnv === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
    
    // Prevent caching of sensitive data
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    
    // Remove server identification
    'Server': '',
    
    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
  });
};

// Advanced CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const allowedOrigins = config.corsOrigins;
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      if (allowedOrigin.includes('*')) {
        // Handle wildcard subdomains
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key',
    'X-Client-Version',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

// IP Whitelist/Blacklist middleware
export class IPFilterMiddleware {
  private whitelist: Set<string>;
  private blacklist: Set<string>;

  constructor(whitelist: string[] = [], blacklist: string[] = []) {
    this.whitelist = new Set(whitelist);
    this.blacklist = new Set(blacklist);
  }

  updateWhitelist(ips: string[]) {
    this.whitelist = new Set(ips);
  }

  updateBlacklist(ips: string[]) {
    this.blacklist = new Set(ips);
  }

  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const clientIP = request.ip;
      const forwardedIPs = request.headers['x-forwarded-for'];
      const realIP = request.headers['x-real-ip'] as string;
      
      // Get the actual client IP (considering proxies)
      const actualIP = realIP || (Array.isArray(forwardedIPs) ? forwardedIPs[0] : forwardedIPs) || clientIP;
      
      // Check blacklist first
      if (this.blacklist.size > 0 && this.blacklist.has(actualIP)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied from your IP address',
        });
        return;
      }
      
      // Check whitelist if it exists
      if (this.whitelist.size > 0 && !this.whitelist.has(actualIP)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied. IP not in whitelist',
        });
        return;
      }
    };
  }
}

// Geolocation-based access control
export class GeolocationMiddleware {
  private allowedCountries: Set<string>;
  private blockedCountries: Set<string>;

  constructor(allowedCountries: string[] = [], blockedCountries: string[] = []) {
    this.allowedCountries = new Set(allowedCountries);
    this.blockedCountries = new Set(blockedCountries);
  }

  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // In a real implementation, you would use a geolocation service
      // like MaxMind GeoIP2 or a similar service
      const countryCode = request.headers['cf-ipcountry'] as string || 
                         request.headers['x-country-code'] as string || 
                         'UNKNOWN';

      if (this.blockedCountries.size > 0 && this.blockedCountries.has(countryCode)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied from your location',
        });
        return;
      }

      if (this.allowedCountries.size > 0 && !this.allowedCountries.has(countryCode)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access not available in your location',
        });
        return;
      }
    };
  }
}

// Request size limits
export const requestSizeLimits = {
  // General API requests
  default: 1024 * 1024, // 1MB
  
  // File uploads
  fileUpload: 10 * 1024 * 1024, // 10MB
  
  // Content generation requests
  contentGeneration: 100 * 1024, // 100KB
  
  // Bulk operations
  bulk: 5 * 1024 * 1024, // 5MB
};

// Request size validation middleware
export function createRequestSizeMiddleware(maxSize: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const contentLength = parseInt(request.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      reply.code(413).send({
        error: 'Payload Too Large',
        message: `Request size ${contentLength} bytes exceeds maximum allowed size ${maxSize} bytes`,
      });
      return;
    }
  };
}

// Request timeout middleware
export function createTimeoutMiddleware(timeoutMs: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const timeout = setTimeout(() => {
      if (!reply.sent) {
        reply.code(408).send({
          error: 'Request Timeout',
          message: `Request timed out after ${timeoutMs}ms`,
        });
      }
    }, timeoutMs);

    reply.raw.on('finish', () => {
      clearTimeout(timeout);
    });

    reply.raw.on('close', () => {
      clearTimeout(timeout);
    });
  };
}

// Security event logging
export interface SecurityEvent {
  type: 'SUSPICIOUS_ACTIVITY' | 'BLOCKED_REQUEST' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN';
  ip: string;
  userAgent: string;
  endpoint: string;
  details: any;
  timestamp: Date;
}

export class SecurityLogger {
  private events: SecurityEvent[] = [];
  
  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };
    
    this.events.push(securityEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Log to console in development
    if (config.nodeEnv === 'development') {
      console.log('Security Event:', securityEvent);
    }
    
    // In production, you might want to send this to an external service
    // like DataDog, Splunk, or a SIEM solution
  }
  
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }
  
  getEventsByType(type: SecurityEvent['type'], limit: number = 100): SecurityEvent[] {
    return this.events.filter(event => event.type === type).slice(-limit);
  }
  
  getEventsByIP(ip: string, limit: number = 100): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip).slice(-limit);
  }
}

export const securityLogger = new SecurityLogger();

// Honeypot middleware for bot detection
export class HoneypotMiddleware {
  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const honeypotField = (request.body as any)?.honeypot;
      
      // If honeypot field is filled, it's likely a bot
      if (honeypotField && honeypotField.trim() !== '') {
        securityLogger.logEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: request.ip,
          userAgent: request.headers['user-agent'] || '',
          endpoint: request.url,
          details: { reason: 'Honeypot field filled', honeypotValue: honeypotField },
        });
        
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid form submission',
        });
        return;
      }
    };
  }
}

// User-Agent validation
export class UserAgentValidator {
  private suspiciousPatterns = [
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /postman/i,
    /python-requests/i,
    /^$/,
  ];

  createMiddleware(allowBots: boolean = false) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userAgent = request.headers['user-agent'] || '';
      
      if (!allowBots && this.suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        securityLogger.logEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: request.ip,
          userAgent,
          endpoint: request.url,
          details: { reason: 'Suspicious user agent' },
        });
        
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
        return;
      }
    };
  }
}

// HTTPS enforcement in production
export const httpsEnforcementMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  if (config.nodeEnv === 'production') {
    const proto = request.headers['x-forwarded-proto'] || request.protocol;
    
    if (proto !== 'https') {
      const httpsUrl = `https://${request.hostname}${request.url}`;
      reply.code(301).redirect(httpsUrl);
      return;
    }
  }
};

// Content type validation
export function createContentTypeMiddleware(allowedTypes: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      const contentType = request.headers['content-type'] || '';
      const baseType = contentType.split(';')[0].trim();
      
      if (!allowedTypes.includes(baseType)) {
        reply.code(415).send({
          error: 'Unsupported Media Type',
          message: `Content type ${baseType} is not supported`,
          supportedTypes: allowedTypes,
        });
        return;
      }
    }
  };
}

// Export IP filter and geolocation instances
export const ipFilter = new IPFilterMiddleware();
export const geolocationFilter = new GeolocationMiddleware();
export const honeypot = new HoneypotMiddleware();
export const userAgentValidator = new UserAgentValidator();

// Security configuration object
export const securityConfig = {
  corsConfig,
  requestSizeLimits,
  securityHeadersMiddleware,
  httpsEnforcementMiddleware,
  ipFilter,
  geolocationFilter,
  honeypot,
  userAgentValidator,
  securityLogger,
  createRequestSizeMiddleware,
  createTimeoutMiddleware,
  createContentTypeMiddleware,
};
