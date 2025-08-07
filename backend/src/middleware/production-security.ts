import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis';
import { config } from '../config/config';
import { securityLogger, SecurityEvent } from './security';
import { RateLimitError } from '../utils/errors';

// Enhanced WAF-like security features for production
export class ProductionSecurityMiddleware {
  private static instance: ProductionSecurityMiddleware;
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Set<string>();
  
  // Threat detection patterns
  private readonly threatPatterns = {
    sqlInjection: [
      /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /union(.*?)select/i,
      /select(.*?)from/i,
      /insert(.*?)into/i,
      /delete(.*?)from/i,
      /drop(.*?)table/i,
      /exec(\s|\+)+(s|x)p\w+/i,
    ],
    xss: [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /expression\s*\(/gi,
      /<img[^>]+src[^>]*javascript:/gi,
    ],
    pathTraversal: [
      /\.\.[\/\\]/g,
      /\.\.\\/g,
      /\.\.%2F/gi,
      /\.\.%5C/gi,
      /%2E%2E%2F/gi,
      /%2E%2E%5C/gi,
    ],
    commandInjection: [
      /[;&|`$(){}[\]]/g,
      /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat)\b/gi,
      /\$(IFS|PATH|HOME)/gi,
    ],
  };

  // Suspicious behavior patterns
  private readonly suspiciousBehavior = {
    rapidRequests: { window: 60, threshold: 100 }, // 100 requests per minute
    errorRate: { window: 300, threshold: 0.8 }, // 80% error rate over 5 minutes
    resourceAbuse: { window: 3600, threshold: 1000 }, // 1000 requests per hour
  };

  public static getInstance(): ProductionSecurityMiddleware {
    if (!ProductionSecurityMiddleware.instance) {
      ProductionSecurityMiddleware.instance = new ProductionSecurityMiddleware();
    }
    return ProductionSecurityMiddleware.instance;
  }

  // Main security middleware
  public createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const clientIP = this.getClientIP(request);
      const userAgent = request.headers['user-agent'] || '';
      const url = request.url;

      try {
        // Check if IP is blocked
        if (await this.isIPBlocked(clientIP)) {
          this.logSecurityEvent('BLOCKED_REQUEST', clientIP, userAgent, url, {
            reason: 'IP blocked',
          });
          return this.sendBlockedResponse(reply);
        }

        // Threat detection
        await this.detectThreats(request, clientIP, userAgent);
        
        // Behavioral analysis
        await this.analyzeBehavior(request, clientIP);
        
        // GeoIP filtering (if enabled)
        if (config.nodeEnv === 'production') {
          await this.checkGeolocation(request, reply);
        }

        // Bot detection
        await this.detectBots(request, reply);

      } catch (error) {
        if (error instanceof RateLimitError) {
          reply.code(429).send({
            error: 'Security Violation',
            message: error.message,
            retryAfter: error.retryAfter,
          });
          return;
        }
        throw error;
      }
    };
  }

  private getClientIP(request: FastifyRequest): string {
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const cfConnectingIP = request.headers['cf-connecting-ip'] as string;
    
    return cfConnectingIP || realIP || 
           (forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip);
  }

  private async isIPBlocked(ip: string): Promise<boolean> {
    if (this.blockedIPs.has(ip)) return true;
    
    const blocked = await redis.get(`blocked_ip:${ip}`);
    if (blocked) {
      this.blockedIPs.add(ip);
      return true;
    }
    
    return false;
  }

  private async detectThreats(request: FastifyRequest, clientIP: string, userAgent: string) {
    const payload = JSON.stringify({
      url: request.url,
      query: request.query,
      body: request.body,
      headers: request.headers,
    });

    // SQL Injection detection
    for (const pattern of this.threatPatterns.sqlInjection) {
      if (pattern.test(payload)) {
        await this.flagSuspiciousIP(clientIP, 'sql_injection');
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, userAgent, request.url, {
          reason: 'SQL injection attempt detected',
          pattern: pattern.toString(),
        });
        throw new RateLimitError('Security violation detected', 3600);
      }
    }

    // XSS detection
    for (const pattern of this.threatPatterns.xss) {
      if (pattern.test(payload)) {
        await this.flagSuspiciousIP(clientIP, 'xss_attempt');
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, userAgent, request.url, {
          reason: 'XSS attempt detected',
          pattern: pattern.toString(),
        });
        throw new RateLimitError('Security violation detected', 3600);
      }
    }

    // Path traversal detection
    for (const pattern of this.threatPatterns.pathTraversal) {
      if (pattern.test(request.url)) {
        await this.flagSuspiciousIP(clientIP, 'path_traversal');
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, userAgent, request.url, {
          reason: 'Path traversal attempt detected',
          pattern: pattern.toString(),
        });
        throw new RateLimitError('Security violation detected', 3600);
      }
    }

    // Command injection detection
    for (const pattern of this.threatPatterns.commandInjection) {
      if (pattern.test(payload)) {
        await this.flagSuspiciousIP(clientIP, 'command_injection');
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, userAgent, request.url, {
          reason: 'Command injection attempt detected',
          pattern: pattern.toString(),
        });
        throw new RateLimitError('Security violation detected', 3600);
      }
    }
  }

  private async analyzeBehavior(request: FastifyRequest, clientIP: string) {
    const now = Math.floor(Date.now() / 1000);
    
    // Track request rate
    const requestKey = `rate:${clientIP}:${Math.floor(now / this.suspiciousBehavior.rapidRequests.window)}`;
    const requestCount = await redis.incr(requestKey);
    await redis.expire(requestKey, this.suspiciousBehavior.rapidRequests.window);
    
    if (requestCount > this.suspiciousBehavior.rapidRequests.threshold) {
      await this.flagSuspiciousIP(clientIP, 'rapid_requests');
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIP, 
        request.headers['user-agent'] || '', request.url, {
          reason: 'Rapid requests detected',
          count: requestCount,
          threshold: this.suspiciousBehavior.rapidRequests.threshold,
        });
      throw new RateLimitError('Rate limit exceeded due to suspicious activity', 3600);
    }
  }

  private async checkGeolocation(request: FastifyRequest, reply: FastifyReply) {
    const countryCode = request.headers['cf-ipcountry'] as string ||
                       request.headers['x-country-code'] as string;
    
    // Block countries if configured (example: high-risk countries)
    const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];
    
    if (countryCode && blockedCountries.includes(countryCode)) {
      this.logSecurityEvent('BLOCKED_REQUEST', 
        this.getClientIP(request), 
        request.headers['user-agent'] || '', 
        request.url, {
          reason: 'Blocked country',
          country: countryCode,
        });
      throw new RateLimitError('Access not available from your location', 86400);
    }
  }

  private async detectBots(request: FastifyRequest, reply: FastifyReply) {
    const userAgent = request.headers['user-agent'] || '';
    const clientIP = this.getClientIP(request);
    
    // Known bot patterns
    const botPatterns = [
      /bot/i,
      /spider/i,
      /crawler/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /postman/i,
      /insomnia/i,
      /^$/,
    ];

    // Legitimate bot whitelist
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimateBot = legitimateBots.some(pattern => pattern.test(userAgent));

    if (isBot && !isLegitimateBot) {
      // Check if this is an API endpoint that should allow programmatic access
      const isApiEndpoint = request.url.startsWith('/api/');
      const hasValidApiKey = request.headers['x-api-key'];
      
      if (isApiEndpoint && hasValidApiKey) {
        // Allow API access with valid key
        return;
      }

      await this.flagSuspiciousIP(clientIP, 'bot_activity');
      this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, userAgent, request.url, {
        reason: 'Suspicious bot activity',
        userAgent,
      });
      
      throw new RateLimitError('Bot access not allowed', 3600);
    }
  }

  private async flagSuspiciousIP(ip: string, reason: string) {
    const flagKey = `suspicious:${ip}`;
    const currentFlags = await redis.get(flagKey);
    const flags = currentFlags ? JSON.parse(currentFlags) : {};
    
    flags[reason] = (flags[reason] || 0) + 1;
    flags.lastSeen = Date.now();
    
    await redis.setex(flagKey, 3600, JSON.stringify(flags));
    
    // If multiple different types of suspicious activity, block the IP
    const flagTypes = Object.keys(flags).filter(k => k !== 'lastSeen');
    const totalFlags = Object.values(flags).reduce((sum: number, count) => 
      typeof count === 'number' ? sum + count : sum, 0);
    
    if (flagTypes.length >= 3 || totalFlags >= 10) {
      await this.blockIP(ip, 86400); // Block for 24 hours
    }
  }

  private async blockIP(ip: string, ttl: number) {
    await redis.setex(`blocked_ip:${ip}`, ttl, JSON.stringify({
      reason: 'Multiple security violations',
      timestamp: Date.now(),
    }));
    
    this.blockedIPs.add(ip);
    
    this.logSecurityEvent('BLOCKED_REQUEST', ip, '', '', {
      reason: 'IP blocked due to multiple violations',
      duration: ttl,
    });
  }

  private logSecurityEvent(
    type: SecurityEvent['type'], 
    ip: string, 
    userAgent: string, 
    endpoint: string, 
    details: any
  ) {
    securityLogger.logEvent({
      type,
      ip,
      userAgent,
      endpoint,
      details,
    });
  }

  private sendBlockedResponse(reply: FastifyReply) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Access denied due to security policy',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Admin methods for IP management
  public async unblockIP(ip: string): Promise<boolean> {
    const deleted = await redis.del(`blocked_ip:${ip}`);
    this.blockedIPs.delete(ip);
    return deleted > 0;
  }

  public async getBlockedIPs(): Promise<string[]> {
    const keys = await redis.keys('blocked_ip:*');
    return keys.map(key => key.replace('blocked_ip:', ''));
  }

  public async getSuspiciousIPs(): Promise<Record<string, any>> {
    const keys = await redis.keys('suspicious:*');
    const result: Record<string, any> = {};
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        result[key.replace('suspicious:', '')] = JSON.parse(data);
      }
    }
    
    return result;
  }

  // Honeypot endpoints for threat detection
  public createHoneypotMiddleware() {
    const honeypotPaths = [
      '/admin.php',
      '/wp-admin/',
      '/wp-login.php',
      '/.env',
      '/config.php',
      '/phpinfo.php',
      '/backup.sql',
      '/.git/config',
      '/robots.txt',
    ];

    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (honeypotPaths.some(path => request.url.includes(path))) {
        const clientIP = this.getClientIP(request);
        await this.flagSuspiciousIP(clientIP, 'honeypot_access');
        
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', clientIP, 
          request.headers['user-agent'] || '', request.url, {
            reason: 'Honeypot access attempt',
            path: request.url,
          });

        // Return fake 404 to not reveal it's a honeypot
        reply.code(404).send({
          error: 'Not Found',
          message: 'The requested resource could not be found',
        });
        return;
      }
    };
  }
}

// Export singleton instance
export const productionSecurity = ProductionSecurityMiddleware.getInstance();

// Additional security utilities for production
export class SecurityUtils {
  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  // Validate request signature (for webhooks)
  static validateSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Rate limit key generator based on multiple factors
  static generateRateLimitKey(request: FastifyRequest): string {
    const ip = request.ip;
    const userAgent = request.headers['user-agent'] || '';
    const endpoint = request.routeOptions?.url || request.url;
    
    // Use a combination of IP, user agent hash, and endpoint for more granular rate limiting
    const crypto = require('crypto');
    const userAgentHash = crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 8);
    
    return `${ip}:${userAgentHash}:${endpoint}`;
  }

  // Content filtering for user-generated content
  static filterContent(content: string): { filtered: string; flagged: boolean } {
    const profanityPatterns = [
      // Add profanity patterns as needed
    ];

    let filtered = content;
    let flagged = false;

    for (const pattern of profanityPatterns) {
      if (pattern.test(content)) {
        flagged = true;
        filtered = filtered.replace(pattern, '***');
      }
    }

    return { filtered, flagged };
  }
}
