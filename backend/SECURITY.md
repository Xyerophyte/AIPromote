# Security and Performance Implementation

This document outlines the comprehensive security and performance optimizations implemented in the AI Promote backend application.

## 🛡️ Security Features

### 1. Rate Limiting with Redis

- **Advanced Rate Limiting**: Custom Redis-based rate limiting with different limits per endpoint type
- **Dynamic Rate Limiting**: User plan-based rate limiting (free, pro, enterprise)
- **Distributed Rate Limiting**: Support for multi-instance deployments
- **Suspicious Activity Detection**: Automatic IP blocking for rapid requests

#### Configuration
```typescript
// Different rate limits for different endpoint types
const rateLimitConfigs = {
  general: 100 requests per 15 minutes,
  auth: 10 requests per 15 minutes,
  contentGeneration: 50 requests per hour,
  publishing: 30 requests per hour,
  upload: 20 requests per 15 minutes,
  admin: 200 requests per hour
};
```

### 2. Request Validation and Sanitization

- **Input Validation**: Comprehensive Zod schemas for all endpoints
- **XSS Prevention**: Automatic detection and sanitization of cross-site scripting attempts
- **SQL Injection Prevention**: Pattern detection and input sanitization
- **Content Sanitization**: HTML sanitization with DOMPurify
- **File Upload Validation**: MIME type, size, and filename validation

#### Key Features
- Platform-specific content validation (Twitter 280 chars, LinkedIn 3000 chars)
- Hashtag and mention validation
- URL sanitization and protocol validation
- Filename sanitization for safe uploads

### 3. CORS and Security Headers

- **Advanced CORS**: Wildcard subdomain support, credential handling
- **Content Security Policy**: Comprehensive CSP with external service support
- **Security Headers**: Complete set of security headers including:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: Restricted device access
  - HSTS: Production HTTPS enforcement

### 4. SQL Injection Prevention

- **Pattern Detection**: Multiple regex patterns for SQL injection detection
- **Input Sanitization**: Automatic removal of dangerous SQL characters
- **Prisma Integration**: Leveraging Prisma's built-in SQL injection protection
- **Recursive Validation**: Deep object validation for nested inputs

### 5. API Key Management

- **Secure Key Generation**: Cryptographically secure API key generation
- **Permission System**: Granular permission-based access control
- **Rate Limiting**: Per-API-key rate limiting with Redis
- **IP Whitelisting**: Optional IP restriction for API keys
- **Expiration Management**: Automatic key expiration and rotation

#### API Permissions
```typescript
const API_PERMISSIONS = {
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  SOCIAL_PUBLISH: 'social:publish',
  AI_GENERATE: 'ai:generate',
  ADMIN_READ: 'admin:read',
  ALL: '*'
};
```

### 6. Data Encryption

- **AES-256-GCM Encryption**: Industry-standard encryption for sensitive data
- **Key Derivation**: PBKDF2 with 100,000 iterations for password-based encryption
- **Streaming Encryption**: Support for large file encryption
- **Key Rotation**: Automated key rotation capabilities
- **OAuth Token Encryption**: All social media tokens encrypted at rest

#### Encryption Features
- Salt-based encryption for password-derived keys
- Authenticated encryption with GCM mode
- Secure random key generation
- Timing-safe comparison functions

### 7. Additional Security Measures

- **IP Filtering**: Whitelist/blacklist IP management
- **Geolocation Filtering**: Country-based access control
- **Honeypot Detection**: Bot detection and blocking
- **User-Agent Validation**: Suspicious user agent detection
- **HTTPS Enforcement**: Automatic HTTPS redirect in production
- **Request Size Limits**: Configurable request size validation
- **Request Timeouts**: Automatic timeout handling

## ⚡ Performance Optimizations

### 1. Performance Monitoring

- **Real-time Metrics**: Response time, memory usage, CPU monitoring
- **Performance Alerts**: Automatic alerts for slow responses (>5s), high memory (>85%), high error rates (>10%)
- **Endpoint Analysis**: Slowest and error-prone endpoint identification
- **System Health**: Comprehensive health checks with uptime, throughput, and error rates

### 2. Query Optimization

- **In-Memory Caching**: TTL-based caching for frequently accessed data
- **Memory Management**: Automatic expired cache cleanup
- **Connection Pool Monitoring**: Database connection usage tracking
- **Performance Metrics Export**: JSON and Prometheus format support

### 3. Redis Integration

- **Distributed Caching**: Redis-based caching for multi-instance deployments
- **Performance Metrics Storage**: Aggregated performance statistics
- **Rate Limiting Storage**: Distributed rate limiting counters
- **Security Event Logging**: Centralized security event storage

## 🚀 Implementation Details

### Server Configuration

The main server file (`src/server.ts`) implements a comprehensive security middleware stack:

1. **HTTPS Enforcement** (Production only)
2. **Security Headers** (CSP, XSS protection, etc.)
3. **Request Size Limits** (Configurable per endpoint type)
4. **Request Timeouts** (30-second default)
5. **Content Type Validation** (JSON, form-data, multipart)
6. **IP Filtering** (If configured)
7. **Suspicious Activity Detection**
8. **Performance Monitoring**
9. **Input Sanitization**

### Middleware Hierarchy

```typescript
// Security middleware applied in order:
server.addHook('onRequest', httpsEnforcementMiddleware);
server.addHook('onRequest', securityHeadersMiddleware);
server.addHook('onRequest', createRequestSizeMiddleware(requestSizeLimits.default));
server.addHook('onRequest', createTimeoutMiddleware(30000));
server.addHook('onRequest', createContentTypeMiddleware([...allowedTypes]));
server.addHook('onRequest', ipFilter.createMiddleware());
server.addHook('onRequest', suspiciousActivityDetector.createMiddleware());
server.addHook('onRequest', performanceMonitor.createMiddleware());
server.addHook('preHandler', sanitizationMiddleware);
server.addHook('preHandler', rateLimitConfigs.general.createMiddleware());
```

### Environment Variables

Required environment variables for security features:

```bash
# Encryption
ENCRYPTION_KEY=your-32-char-secret-encryption-key

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aipromotdb
```

## 📊 Monitoring and Alerting

### Health Check Endpoint

`GET /health` provides comprehensive system health information:

```json
{
  "status": "healthy|degraded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "memory": {
    "used": 134217728,
    "free": 1073741824,
    "total": 1207959552,
    "percentage": 11.1
  },
  "redis": true
}
```

### Metrics Endpoint

`GET /metrics` (Admin only) provides performance metrics in JSON or Prometheus format:

```bash
# JSON format (default)
curl /metrics

# Prometheus format
curl /metrics?format=prometheus
```

### Security Events Endpoint

`GET /security/events` (Admin only) provides recent security events:

```json
{
  "events": [
    {
      "type": "SUSPICIOUS_ACTIVITY",
      "ip": "192.168.1.100",
      "userAgent": "curl/7.68.0",
      "endpoint": "/api/v1/content",
      "details": { "reason": "Suspicious user agent" },
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

## 🔧 Configuration Options

### Rate Limiting

Customize rate limits per endpoint type in `src/middleware/rate-limiting.ts`:

```typescript
export const rateLimitConfigs = {
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  }),
  // ... other configurations
};
```

### Security Headers

Modify security headers in `src/middleware/security.ts`:

```typescript
const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  // ... other directives
].join('; ');
```

### Request Size Limits

Configure request size limits per endpoint type:

```typescript
export const requestSizeLimits = {
  default: 1024 * 1024, // 1MB
  fileUpload: 10 * 1024 * 1024, // 10MB
  contentGeneration: 100 * 1024, // 100KB
  bulk: 5 * 1024 * 1024, // 5MB
};
```

## 🚨 Security Alerts

The system automatically generates alerts for:

- **Slow Responses**: >5 seconds response time
- **High Memory Usage**: >85% memory utilization
- **High Error Rate**: >10% error rate in last 100 requests
- **Suspicious Activity**: Rapid requests, bot detection
- **Rate Limit Violations**: Excessive requests from single source

Alerts can be integrated with external services like:
- Slack webhooks
- PagerDuty
- DataDog
- New Relic
- Custom monitoring dashboards

## 🛠️ Deployment Considerations

### Production Settings

1. Set `NODE_ENV=production`
2. Use strong encryption keys (32+ characters)
3. Enable HTTPS with valid SSL certificates
4. Configure Redis for persistence
5. Set up external monitoring services
6. Configure log aggregation
7. Set up automated security scanning

### Performance Tuning

1. Adjust rate limits based on usage patterns
2. Configure Redis memory policies
3. Set appropriate request timeouts
4. Monitor and adjust connection pool sizes
5. Enable garbage collection monitoring
6. Set up CDN for static assets

### Security Best Practices

1. Regularly rotate encryption keys
2. Monitor security event logs
3. Keep dependencies updated
4. Regular security audits
5. Implement intrusion detection
6. Set up automated vulnerability scanning
7. Regular penetration testing

## 📝 Testing Security Features

Test the security implementations:

```bash
# Test rate limiting
for i in {1..20}; do curl -X POST /api/v1/content; done

# Test request size limits
curl -X POST /api/v1/content -d "$(head -c 2M < /dev/zero | base64)"

# Test input validation
curl -X POST /api/v1/content -d '{"body": "<script>alert(1)</script>"}'

# Test suspicious activity detection
for i in {1..15}; do curl /health & done
```

This comprehensive security and performance implementation provides enterprise-level protection while maintaining optimal performance for the AI Promote application.
