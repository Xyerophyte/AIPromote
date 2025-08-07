# Production Setup Guide

This comprehensive guide will help you set up AI Promote in production with Supabase, Upstash Redis, and Vercel deployment.

## Overview

Our production stack consists of:
- **Frontend**: Next.js application hosted on Vercel
- **Backend**: Fastify API server hosted on Vercel Functions
- **Database**: PostgreSQL hosted on Supabase (with connection pooling)
- **Redis**: Upstash Redis for caching, sessions, rate limiting, and job queues
- **File Storage**: AWS S3 for media and document storage
- **Monitoring**: Built-in Vercel monitoring + health check endpoints

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ and npm installed
- Git installed and project cloned
- Vercel CLI installed (`npm install -g vercel`)
- Access to Supabase account
- Access to Upstash account
- AWS account for S3 storage
- Stripe account for billing (optional)

## Step-by-Step Setup

### 1. Environment Configuration

First, create your production environment file:

```bash
cp .env.production.example .env.production
```

Fill in all the required values in `.env.production`. See the [Environment Variables](#environment-variables) section for details.

### 2. Database Setup (Supabase)

Run the database setup script:

```bash
# For Windows
bash scripts/setup-production-db.sh all

# Or step by step:
bash scripts/setup-production-db.sh create    # Create Supabase project
bash scripts/setup-production-db.sh init     # Initialize Supabase
bash scripts/setup-production-db.sh migrate  # Run migrations
bash scripts/setup-production-db.sh seed     # Seed database (optional)
```

#### Manual Supabase Setup:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Choose project settings:
   - **Name**: `aipromotdb-prod`
   - **Region**: Choose closest to your users
   - **Database Password**: Generate a strong password and save it securely
4. Wait for project creation
5. Get credentials from Settings > Database and Settings > API

### 3. Redis Setup (Upstash)

Run the Redis setup script:

```bash
# For Windows
bash scripts/setup-redis.sh all

# Or step by step:
bash scripts/setup-redis.sh create      # Create Upstash Redis
bash scripts/setup-redis.sh test        # Test connection
bash scripts/setup-redis.sh cache       # Setup caching utilities
bash scripts/setup-redis.sh session     # Setup session storage
bash scripts/setup-redis.sh ratelimit   # Setup rate limiting
bash scripts/setup-redis.sh queues      # Setup job queues
```

#### Manual Upstash Setup:

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Choose database settings:
   - **Name**: `aipromotdb-redis-prod`
   - **Region**: Choose closest to your users
   - **Type**: Regional
   - **Eviction Policy**: `allkeys-lru`
4. Get connection details from the dashboard

### 4. Deployment to Vercel

Run the deployment script:

```bash
# Full deployment process
bash scripts/deploy-production.sh all

# Or step by step:
bash scripts/deploy-production.sh check     # Check prerequisites
bash scripts/deploy-production.sh setup     # Setup Vercel project
bash scripts/deploy-production.sh env       # Set environment variables
bash scripts/deploy-production.sh deploy    # Deploy application
bash scripts/deploy-production.sh domain    # Setup custom domain (optional)
```

## Environment Variables

### Required Variables

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Redis (Upstash)
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT]:6380
REDIS_TOKEN=[YOUR_REDIS_TOKEN]

# Authentication
JWT_SECRET=[GENERATE_STRONG_SECRET]
NEXTAUTH_SECRET=[GENERATE_NEXTAUTH_SECRET]
NEXTAUTH_URL=https://[YOUR_DOMAIN].vercel.app

# AI Services
OPENAI_API_KEY=[YOUR_OPENAI_KEY]
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_KEY]

# Security
ENCRYPTION_KEY=[32_CHAR_HEX_KEY]
SESSION_SECRET=[GENERATE_SESSION_SECRET]
```

### Generating Secrets

Use these commands to generate secure secrets:

```bash
# JWT Secret (32 bytes, base64 encoded)
openssl rand -base64 32

# Encryption Key (32 bytes, hex encoded)
openssl rand -hex 32

# Session Secret
openssl rand -base64 48
```

## Security Configuration

### 1. Secret Management

- **Never commit `.env.production`** to version control
- Use Vercel environment variables for production secrets
- Rotate secrets regularly (quarterly recommended)
- Use different secrets for different environments

### 2. Database Security

```bash
# Connection pooling for performance
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1

# Row Level Security (RLS) enabled by default in Supabase
# Configure RLS policies for your tables
```

### 3. Redis Security

```bash
# Always use TLS connections
REDIS_URL=rediss://...

# Configure connection limits
REDIS_CONNECTION_POOL_SIZE=10
REDIS_MAX_RETRIES=3
```

### 4. API Security

- Rate limiting enabled by default
- CORS configured for your domain only
- Helmet.js security headers
- JWT token validation on protected routes

## Performance Optimization

### Database Performance

1. **Connection Pooling**: Enabled via PgBouncer
2. **Query Optimization**: Use indexes for frequently queried fields
3. **Caching**: Redis caching for expensive queries

### Redis Performance

1. **Memory Management**: TTL set on all cached data
2. **Connection Pooling**: Configured connection pool
3. **Eviction Policy**: LRU eviction for optimal memory usage

### Application Performance

1. **Caching Strategy**:
   ```typescript
   // Cache expensive operations
   await cache.set('user:profile:123', userData, 3600); // 1 hour TTL
   ```

2. **Background Jobs**:
   ```typescript
   // Use queues for heavy operations
   await addAIGenerationJob('generate-strategy', data);
   ```

3. **Rate Limiting**:
   ```typescript
   // Protect API endpoints
   const rateLimited = await rateLimiter.isAllowed(userId, 'api-call', 100, 60000);
   ```

## Monitoring and Maintenance

### Health Check Endpoints

- `GET /api/health` - Overall system health
- `GET /api/health/database` - Database connection
- `GET /api/health/redis` - Redis connection
- `GET /api/health/queues` - Job queue status

### Monitoring Dashboards

1. **Vercel Dashboard**: Application metrics, deployments, errors
2. **Supabase Dashboard**: Database performance, query analytics
3. **Upstash Console**: Redis metrics, memory usage, operations

### Maintenance Tasks

#### Weekly
- Check error rates in Vercel dashboard
- Review Redis memory usage
- Monitor database performance

#### Monthly
- Rotate secrets and API keys
- Review and update dependencies
- Analyze usage patterns and optimize

#### Quarterly
- Security audit of environment variables
- Database maintenance and optimization
- Backup strategy review

## Backup Strategy

### Database Backups

Supabase provides:
- Daily automated backups (7-day retention on free tier)
- Point-in-time recovery (Pro tier)
- Manual backup options

Additional backup script:
```bash
# Create manual backup
bash scripts/backup-database.sh
```

### Redis Backups

Upstash provides:
- Automatic daily backups
- Point-in-time recovery (Pro plans)
- Export/import capabilities

### Application Backups

- Git repository serves as code backup
- Environment variables documented securely
- Infrastructure-as-code configuration

## Disaster Recovery

### Database Recovery

1. **Point-in-time recovery**: Available with Supabase Pro
2. **Manual restoration**: From backup files
3. **Cross-region replication**: For high availability

### Application Recovery

1. **Vercel rollback**: `vercel rollback`
2. **Git reversion**: Revert to previous commit
3. **Infrastructure recreation**: Using setup scripts

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check connection string format
   # Verify PgBouncer settings
   # Check connection limits
   ```

2. **Redis Connection Timeouts**
   ```bash
   # Verify Redis URL format (rediss:// for TLS)
   # Check connection pool settings
   # Review retry configuration
   ```

3. **Rate Limiting Problems**
   ```bash
   # Check Redis connectivity
   # Verify rate limit configuration
   # Review request patterns
   ```

### Debugging Tools

1. **Application Logs**:
   ```bash
   vercel logs
   vercel logs --follow
   ```

2. **Health Checks**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Database Queries**:
   ```sql
   -- Check active connections
   SELECT * FROM pg_stat_activity;
   
   -- Check database performance
   SELECT * FROM pg_stat_database;
   ```

## Scaling Considerations

### Horizontal Scaling

- **Vercel Functions**: Auto-scaling based on demand
- **Database**: Supabase Pro for higher connection limits
- **Redis**: Upstash scales automatically

### Vertical Scaling

- **Database**: Upgrade Supabase plan for more resources
- **Redis**: Increase memory allocation
- **Storage**: AWS S3 scales automatically

### Performance Monitoring

1. Monitor response times
2. Track error rates
3. Watch resource utilization
4. Set up alerting for critical metrics

## Cost Optimization

### Free Tiers

- **Vercel**: Generous free tier for personal projects
- **Supabase**: Free tier with 500MB database
- **Upstash**: Free tier with 10,000 commands/day
- **AWS S3**: Free tier for limited storage

### Cost Monitoring

1. Set up billing alerts
2. Monitor usage patterns
3. Optimize resource allocation
4. Regular cost reviews

## Support and Resources

### Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Community

- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Next.js Community](https://github.com/vercel/next.js/discussions)

### Support Channels

- Vercel: Support tickets for Pro plans
- Supabase: Community support and Pro support
- Upstash: Email support and documentation

## Conclusion

This production setup provides a robust, scalable, and secure foundation for AI Promote. The combination of Supabase, Upstash, and Vercel offers excellent developer experience while maintaining production-grade reliability.

Remember to:
- Keep secrets secure and rotate regularly
- Monitor system health and performance
- Implement proper backup and recovery procedures
- Stay updated with security patches and updates

For additional help, refer to the individual service documentation or reach out to the respective support channels.
