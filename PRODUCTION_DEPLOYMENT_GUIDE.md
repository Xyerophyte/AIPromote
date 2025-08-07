# AI Promote - Production Deployment Guide

## 🚀 Overview

This guide covers the complete production deployment setup for AI Promote, including Vercel deployment, security hardening, monitoring, and maintenance procedures.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment](#vercel-deployment)
3. [Security Configuration](#security-configuration)
4. [Monitoring Setup](#monitoring-setup)
5. [Database Configuration](#database-configuration)
6. [Environment Variables](#environment-variables)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Performance Optimization](#performance-optimization)
9. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
10. [Maintenance Procedures](#maintenance-procedures)
11. [Security Monitoring](#security-monitoring)
12. [Troubleshooting](#troubleshooting)

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compilation successful
- [ ] ESLint checks pass
- [ ] Security audit clean (`npm audit`)
- [ ] Code reviewed and approved

### Environment Setup
- [ ] Production database provisioned
- [ ] Redis instance configured
- [ ] Environment variables documented
- [ ] API keys and secrets secured
- [ ] Domain name registered

### Security
- [ ] Security headers configured
- [ ] CORS properly set up
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Authentication flows tested

### Dependencies
- [ ] All dependencies up to date
- [ ] No critical vulnerabilities
- [ ] Package-lock.json committed
- [ ] Build process tested

## 🚀 Vercel Deployment

### 1. Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Configure Vercel Project

The `vercel.json` configuration includes:

```json
{
  "version": 2,
  "framework": "nextjs",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/src/server.ts",
      "use": "@vercel/node"
    }
  ]
}
```

### 3. Production Deployment

```bash
# Run the automated deployment script
chmod +x scripts/deploy-vercel-production.sh
./scripts/deploy-vercel-production.sh
```

Or manual deployment:

```bash
# Deploy to production
vercel --prod

# Set environment variables
vercel env add NODE_ENV production
vercel env add DATABASE_URL "your-production-db-url"
# ... add other environment variables
```

### 4. Custom Domain Setup

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.61
```

## 🔐 Security Configuration

### 1. Security Headers

All security headers are configured in `next.config.ts`:

- **Content Security Policy (CSP)**
- **X-Frame-Options: DENY**
- **X-Content-Type-Options: nosniff**
- **X-XSS-Protection: 1; mode=block**
- **Strict-Transport-Security**
- **Referrer-Policy**
- **Permissions-Policy**

### 2. CORS Configuration

Configured in `backend/src/middleware/security.ts`:

```typescript
export const corsConfig = {
  origin: config.nodeEnv === 'development' ? true : config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};
```

### 3. Rate Limiting

Multiple rate limiting configurations:

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 10 attempts per 15 minutes
- **Content generation**: 50 per hour
- **File uploads**: 20 per 15 minutes

### 4. Input Validation

Comprehensive validation using Zod schemas:

- SQL injection prevention
- XSS protection
- Path traversal detection
- Command injection detection

### 5. WAF-like Protection

Advanced security features in `production-security.ts`:

- Threat pattern detection
- Behavioral analysis
- IP reputation checking
- Honeypot endpoints
- Geolocation filtering

## 📊 Monitoring Setup

### 1. Health Checks

Multiple health check endpoints:

- `/api/health` - Detailed health check
- `/api/health/simple` - Load balancer health check
- `/api/health/live` - Kubernetes liveness probe
- `/api/health/ready` - Kubernetes readiness probe
- `/api/metrics` - Prometheus metrics

### 2. Security Monitoring

Real-time security monitoring includes:

- Threat detection and alerting
- IP reputation tracking
- Anomaly detection
- Security event logging
- Automated response to threats

### 3. External Monitoring Services

Configure these services:

- **Sentry** for error tracking
- **New Relic** for performance monitoring
- **LogRocket** for user session replay
- **DataDog** for infrastructure monitoring

### 4. Alerting Channels

- Slack notifications for critical alerts
- Discord webhooks for security events
- PagerDuty for incident management
- Email alerts for high-priority issues

## 🗄️ Database Configuration

### 1. Production Database

Recommended setup:
- **Provider**: Supabase, PlanetScale, or Railway
- **Type**: PostgreSQL
- **Connection**: SSL required
- **Pool size**: 10 connections
- **Timeout**: 30 seconds

### 2. Database Migrations

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (if needed)
npx prisma db seed
```

### 3. Connection String Format

```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require&pgbouncer=true&connection_limit=10"
```

## ⚙️ Environment Variables

### Required Variables

```env
# Core
NODE_ENV=production
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
WEBHOOK_SECRET=your-webhook-secret

# APIs
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
```

### Setting Environment Variables

```bash
# Using Vercel CLI
vercel env add NODE_ENV production
vercel env add DATABASE_URL "your-database-url"

# Using Vercel Dashboard
# Go to Project Settings > Environment Variables
```

### Environment Variable Security

- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate secrets regularly
- ✅ Use different keys for different environments
- ❌ Never commit secrets to version control
- ❌ Don't use predictable values

## 🔒 SSL/TLS Configuration

### 1. Automatic SSL

Vercel automatically provisions SSL certificates:
- Free SSL certificates from Let's Encrypt
- Automatic renewal
- HTTP to HTTPS redirect
- HSTS headers

### 2. Custom SSL

For custom domains:

```bash
# Vercel handles SSL automatically
vercel certs ls
vercel certs add yourdomain.com
```

### 3. SSL Best Practices

- Force HTTPS in production
- Use HSTS headers
- Implement certificate pinning
- Monitor certificate expiration

## ⚡ Performance Optimization

### 1. Frontend Optimizations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: webpack-bundle-analyzer
- **CDN**: Vercel's global CDN
- **Caching**: Static asset caching

### 2. Backend Optimizations

- **Database Indexing**: Proper indexes on queries
- **Connection Pooling**: PgBouncer for PostgreSQL
- **Caching**: Redis for session and data caching
- **Compression**: Gzip compression enabled

### 3. Monitoring Performance

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null https://your-domain.com

# Monitor Core Web Vitals
# Use Vercel Analytics or Google PageSpeed Insights
```

## 💾 Backup and Disaster Recovery

### 1. Database Backups

```sql
-- Automated backups (daily)
-- Configure with your database provider

-- Manual backup
pg_dump $DATABASE_URL > backup.sql

-- Restore
psql $DATABASE_URL < backup.sql
```

### 2. Application Backups

- **Code**: Git repository (multiple remotes)
- **Environment**: Documented configuration
- **Assets**: S3 or Cloudinary backups
- **Logs**: Centralized logging service

### 3. Disaster Recovery Plan

1. **Detection**: Monitoring alerts
2. **Assessment**: Determine impact
3. **Communication**: Notify stakeholders
4. **Recovery**: Execute recovery procedures
5. **Post-mortem**: Document lessons learned

## 🔧 Maintenance Procedures

### 1. Regular Updates

```bash
# Update dependencies (weekly)
npm update
npm audit fix

# Update Vercel CLI
npm update -g vercel

# Check for security updates
npm audit
```

### 2. Database Maintenance

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM your_table;

-- Update statistics
ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

### 3. Log Rotation

- Configure log retention policies
- Archive old logs to S3
- Monitor log volume
- Set up log alerts

### 4. Security Audits

- Monthly dependency audits
- Quarterly penetration testing
- Annual security reviews
- Regular access reviews

## 🛡️ Security Monitoring

### 1. Real-time Monitoring

The security monitoring system provides:

- **Threat Detection**: SQL injection, XSS, path traversal
- **Behavioral Analysis**: Rapid requests, error rates
- **IP Reputation**: External threat intelligence
- **Anomaly Detection**: Unusual patterns

### 2. Security Alerts

Alert levels:
- **CRITICAL**: Immediate response required
- **HIGH**: Response within 1 hour
- **MEDIUM**: Response within 4 hours
- **LOW**: Response within 24 hours

### 3. Incident Response

1. **Detection**: Automated monitoring
2. **Triage**: Assess severity
3. **Containment**: Block threats
4. **Investigation**: Analyze logs
5. **Recovery**: Restore services
6. **Lessons Learned**: Update procedures

## 🔍 Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check build logs
vercel logs

# Verify environment variables
vercel env ls

# Check function logs
vercel logs --follow
```

#### Database Connection Issues

```bash
# Test connection
npx prisma db push

# Check connection string
echo $DATABASE_URL

# Verify SSL settings
```

#### Performance Issues

```bash
# Check response times
curl -w "%{time_total}" https://your-domain.com

# Monitor metrics
curl https://your-domain.com/api/metrics
```

### Health Check Commands

```bash
# Application health
curl https://your-domain.com/api/health

# Database health
curl https://your-domain.com/api/health/ready

# Quick status
curl https://your-domain.com/api/health/simple
```

### Log Analysis

```bash
# View recent logs
vercel logs --since 1h

# Follow logs in real-time
vercel logs --follow

# Filter by function
vercel logs --filter "api/health"
```

## 📞 Support and Escalation

### Contact Information

- **Primary**: DevOps team
- **Secondary**: Security team
- **Emergency**: On-call engineer

### Escalation Matrix

1. **Developer** → 15 minutes
2. **Team Lead** → 30 minutes
3. **Engineering Manager** → 1 hour
4. **CTO** → 2 hours

### External Support

- **Vercel Support**: For platform issues
- **Database Provider**: For database issues
- **CDN Provider**: For performance issues

---

## 🎯 Success Criteria

Your production deployment is successful when:

- ✅ Application accessible via HTTPS
- ✅ All health checks passing
- ✅ Security headers configured
- ✅ Monitoring and alerting active
- ✅ Performance within targets
- ✅ Database connections stable
- ✅ Error rates below threshold
- ✅ SSL certificates valid

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Production Best Practices](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

**Remember**: Production deployments should always be tested in a staging environment first. Never deploy directly to production without proper testing and approval processes.

**Security Note**: This guide contains references to security configurations. Always review and customize security settings based on your specific requirements and compliance needs.
