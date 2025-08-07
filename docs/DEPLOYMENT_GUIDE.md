# AI Promote Production Deployment Guide

This guide covers the complete deployment process for AI Promote to production environments using Vercel and Supabase, along with comprehensive monitoring, security, and maintenance procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain and SSL Configuration](#domain-and-ssl-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Security Hardening](#security-hardening)
9. [Performance Optimization](#performance-optimization)
10. [Backup and Recovery](#backup-and-recovery)
11. [CI/CD Pipeline](#ci-cd-pipeline)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts and Services

- **Vercel Account** (for frontend and backend deployment)
- **Supabase Account** (for PostgreSQL database)
- **Domain Name** (for custom domain)
- **Sentry Account** (for error monitoring)
- **Uptime Monitor** (e.g., UptimeRobot, Pingdom)
- **Email Service** (e.g., SendGrid, Mailgun)
- **AWS Account** (for S3 storage)

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-promote.git
cd ai-promote

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Setup

### Production Environment Variables

Create the following environment files:

#### Backend Environment Variables (`.env.production`)

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
REDIS_URL="redis://user:password@host:port"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-256-bits-minimum"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# Social Media APIs
TWITTER_API_KEY="your-twitter-api-key"
TWITTER_API_SECRET="your-twitter-api-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="aipromotapp-production"

# Email Service
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASS="your-sendgrid-api-key"
FROM_EMAIL="noreply@aipromotapp.com"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENVIRONMENT="production"

# Security
RATE_LIMIT_MAX="1000"
RATE_LIMIT_WINDOW="3600000"
CORS_ORIGIN="https://aipromotapp.com"

# External Services
STRIPE_SECRET_KEY="sk_live_your-stripe-secret"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# System
NODE_ENV="production"
PORT="3000"
LOG_LEVEL="info"
```

#### Frontend Environment Variables (`.env.production`)

```env
# API Configuration
NEXT_PUBLIC_API_URL="https://api.aipromotapp.com"
NEXT_PUBLIC_APP_URL="https://aipromotapp.com"

# Authentication
NEXTAUTH_URL="https://aipromotapp.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="your-frontend-sentry-dsn"
SENTRY_ENVIRONMENT="production"

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS="GA-MEASUREMENT-ID"
NEXT_PUBLIC_MIXPANEL_TOKEN="your-mixpanel-token"

# Feature Flags
NEXT_PUBLIC_FEATURE_A_B_TESTING="true"
NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS="true"
```

## Database Deployment

### Supabase Setup

1. **Create New Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new organization and project
   # Note down the database URL and API keys
   ```

2. **Database Configuration**
   ```sql
   -- Enable necessary extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   
   -- Create database user for application
   CREATE USER aipromotapp WITH PASSWORD 'secure_password_here';
   GRANT CONNECT ON DATABASE postgres TO aipromotapp;
   ```

3. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Seed Production Data**
   ```bash
   NODE_ENV=production npx prisma db seed
   ```

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_content_user_id ON content(user_id);
CREATE INDEX CONCURRENTLY idx_content_created_at ON content(created_at DESC);
CREATE INDEX CONCURRENTLY idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);

-- Optimize for analytics queries
CREATE INDEX CONCURRENTLY idx_analytics_date_platform ON analytics(date DESC, platform);
CREATE INDEX CONCURRENTLY idx_analytics_user_date ON analytics(user_id, date DESC);

-- Set up automatic vacuuming
ALTER TABLE analytics SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

## Backend Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Backend Configuration** (`backend/vercel.json`)
   ```json
   {
     "version": 2,
     "name": "aipromotapp-backend",
     "functions": {
       "src/server.ts": {
         "runtime": "@vercel/node@3.0.7"
       }
     },
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/src/server.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/src/server.ts"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     },
     "build": {
       "env": {
         "NODE_ENV": "production"
       }
     }
   }
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   # Set each environment variable
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   # ... add all other environment variables
   ```

### Health Check Endpoint

Ensure your health check endpoint is working:

```bash
curl https://api.aipromotapp.com/health
# Should return: {"status": "healthy", "timestamp": "..."}
```

## Frontend Deployment

### Vercel Frontend Deployment

1. **Frontend Configuration** (`frontend/vercel.json`)
   ```json
   {
     "version": 2,
     "name": "aipromotapp-frontend",
     "build": {
       "env": {
         "NODE_ENV": "production"
       }
     },
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "https://api.aipromotapp.com/api/$1"
       }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           },
           {
             "key": "Strict-Transport-Security",
             "value": "max-age=31536000; includeSubDomains"
           }
         ]
       }
     ]
   }
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Custom Domain**
   ```bash
   vercel domains add aipromotapp.com
   vercel domains add www.aipromotapp.com
   ```

## Domain and SSL Configuration

### DNS Configuration

```dns
# A Records
@ -> Vercel IP (handled automatically)
www -> Vercel IP (handled automatically)
api -> Backend Vercel deployment

# CNAME Records
api.aipromotapp.com -> your-backend-deployment.vercel.app

# TXT Records (for verification)
@ -> vercel-verification-token
```

### SSL Certificate

Vercel automatically provides SSL certificates. Verify:

```bash
curl -I https://aipromotapp.com
# Should include: strict-transport-security header
```

## Monitoring and Logging

### Sentry Configuration

1. **Initialize Sentry**
   ```javascript
   // backend/src/config/sentry.ts
   import { sentryManager } from './sentry';
   sentryManager.init();
   ```

2. **Frontend Sentry** (`frontend/sentry.client.config.ts`)
   ```javascript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     environment: process.env.SENTRY_ENVIRONMENT,
   });
   ```

### Uptime Monitoring

Set up monitoring for critical endpoints:

```yaml
# monitoring-config.yml
endpoints:
  - name: "Frontend Homepage"
    url: "https://aipromotapp.com"
    interval: 60
    timeout: 10
    
  - name: "API Health Check"
    url: "https://api.aipromotapp.com/health"
    interval: 30
    timeout: 5
    
  - name: "Authentication Endpoint"
    url: "https://api.aipromotapp.com/auth/health"
    interval: 120
    timeout: 10

  - name: "Content Generation"
    url: "https://api.aipromotapp.com/api/content/health"
    interval: 300
    timeout: 30
```

### Log Aggregation

```javascript
// Structured logging
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

## Security Hardening

### Security Headers

```javascript
// backend/src/middleware/security.ts
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.aipromotapp.com"
  ].join('; ')
};
```

### Rate Limiting

```javascript
// Tiered rate limiting
const rateLimits = {
  authentication: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 attempts per minute
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
  },
  contentGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 generations per hour
  }
};
```

### Environment Security

```bash
# Audit dependencies
npm audit --audit-level moderate
npm audit fix

# Check for vulnerabilities
npx snyk test

# Update dependencies
npm update --save
```

## Performance Optimization

### Database Optimization

```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Query optimization
ANALYZE;
VACUUM ANALYZE;

-- Monitor slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Redis Caching

```javascript
// Cache frequently accessed data
const cache = {
  userProfile: (userId) => `user:${userId}:profile`,
  contentList: (userId, page) => `content:${userId}:page:${page}`,
  analytics: (userId, date) => `analytics:${userId}:${date}`,
};

// Set cache TTL based on data volatility
const TTL = {
  userProfile: 3600, // 1 hour
  contentList: 300,  // 5 minutes
  analytics: 1800,   // 30 minutes
};
```

### CDN Configuration

```javascript
// Static asset optimization
const nextConfig = {
  images: {
    domains: ['aipromotapp.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
};
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aipromotapp_backup_${DATE}.sql"

# Create backup
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# Compress backup
gzip /backups/$BACKUP_FILE

# Upload to S3
aws s3 cp /backups/${BACKUP_FILE}.gz s3://aipromotapp-backups/database/

# Keep only last 30 days
find /backups -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Backup Verification

```bash
#!/bin/bash
# verify-backup.sh

LATEST_BACKUP=$(ls -t /backups/*.gz | head -n1)

# Test restore to temporary database
gunzip -c $LATEST_BACKUP | psql $TEST_DATABASE_URL

# Run basic checks
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM content;"

echo "Backup verification completed"
```

### Disaster Recovery Plan

```yaml
# disaster-recovery.yml
procedures:
  database_failure:
    - Restore from latest S3 backup
    - Point application to backup database
    - Verify data integrity
    - Update DNS if necessary
    
  application_failure:
    - Check Vercel deployment status
    - Rollback to previous deployment
    - Verify all services are running
    
  total_outage:
    - Activate maintenance page
    - Restore from backups
    - Gradually bring services online
    - Communicate with users
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:all
        
      - name: Run security audit
        run: npm audit --audit-level high
        
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_BACKEND_PROJECT_ID }}
          working-directory: ./backend
          vercel-args: '--prod'
          
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_FRONTEND_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
          
  post-deploy:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Run health checks
        run: |
          curl -f https://api.aipromotapp.com/health
          curl -f https://aipromotapp.com
          
      - name: Notify team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"✅ Production deployment successful!"}'
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '1 hour';
```

#### Memory Issues
```bash
# Check memory usage
node --max-old-space-size=4096 src/server.js

# Monitor memory
top -p $(pgrep -f "node.*server")

# Analyze memory leaks
node --inspect src/server.js
```

#### Performance Issues
```bash
# Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.aipromotapp.com/health

# Check cache hit rates
redis-cli info stats | grep hit_rate
```

### Debugging Tools

```javascript
// Debug middleware
app.use('/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
  });
});
```

### Emergency Procedures

1. **Application Down**
   ```bash
   # Enable maintenance mode
   vercel env add MAINTENANCE_MODE true production
   
   # Check logs
   vercel logs --follow
   
   # Rollback deployment
   vercel rollback
   ```

2. **Database Issues**
   ```bash
   # Switch to read-only mode
   psql $DATABASE_URL -c "ALTER DATABASE aipromotapp SET default_transaction_read_only = on;"
   
   # Restore from backup
   pg_restore -d $DATABASE_URL latest_backup.dump
   ```

3. **Security Incident**
   ```bash
   # Revoke all JWT tokens
   redis-cli flushall
   
   # Reset API keys
   # Update environment variables
   # Force user re-authentication
   ```

## Maintenance Schedule

### Daily
- Monitor system health dashboards
- Check error rates in Sentry
- Review performance metrics

### Weekly
- Analyze slow database queries
- Review security logs
- Update dependencies (patch versions)

### Monthly
- Full backup verification
- Security audit
- Performance optimization review
- Update documentation

### Quarterly
- Major dependency updates
- Disaster recovery drill
- Security penetration testing
- Infrastructure cost optimization

## Support and Escalation

### Contact Information

- **DevOps Lead**: devops@aipromotapp.com
- **Security Team**: security@aipromotapp.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Escalation Matrix

1. **Level 1**: Service degradation (< 2 hours)
2. **Level 2**: Service outage (< 30 minutes)
3. **Level 3**: Security incident (< 15 minutes)
4. **Level 4**: Data loss/corruption (immediate)

This comprehensive deployment guide ensures a robust, secure, and scalable production environment for AI Promote. Regular review and updates of these procedures are essential for maintaining system reliability and security.
