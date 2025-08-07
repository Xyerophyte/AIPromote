# Environment Variables Documentation

This document describes all environment variables required for production deployment of AI Promote.

## Required Environment Variables

### Database Configuration (Supabase)

```bash
# Primary database connection with connection pooling
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# Direct database connection (for migrations)
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Supabase API configuration
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > Database for connection strings
4. Go to Settings > API for API keys

### Redis Configuration (Upstash)

```bash
# Primary Redis connection (TLS enabled)
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT]:6380

# Redis token for REST API access (optional)
REDIS_TOKEN=[YOUR_REDIS_TOKEN]

# Redis connection pool settings
REDIS_CONNECTION_POOL_SIZE=10
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
```

**How to get these values:**
1. Go to [Upstash Console](https://console.upstash.com)
2. Select your Redis database
3. Copy connection URL from database details

### Authentication & Security

```bash
# JWT signing secret (32+ characters)
JWT_SECRET=[GENERATE_STRONG_SECRET]
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# NextAuth configuration
NEXTAUTH_URL=https://[YOUR_DOMAIN].vercel.app
NEXTAUTH_SECRET=[GENERATE_NEXTAUTH_SECRET]

# Encryption key for sensitive data (32 bytes hex)
ENCRYPTION_KEY=[32_CHAR_HEX_KEY]

# Session storage configuration
SESSION_SECRET=[GENERATE_SESSION_SECRET]
SESSION_REDIS_URL=${REDIS_URL}
SESSION_MAX_AGE=86400000
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# Webhook security
WEBHOOK_SECRET=[GENERATE_WEBHOOK_SECRET]
```

**How to generate secrets:**
```bash
# JWT Secret (32 bytes, base64)
openssl rand -base64 32

# Encryption Key (32 bytes, hex)
openssl rand -hex 32

# Session Secret (48 bytes, base64)
openssl rand -base64 48
```

### AI Provider APIs

```bash
# OpenAI configuration
OPENAI_API_KEY=[YOUR_OPENAI_KEY]
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic configuration
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_KEY]
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# AI provider settings
PREFERRED_AI_PROVIDER=openai
FALLBACK_AI_PROVIDER=anthropic
AI_PROVIDER_TIMEOUT=30000
```

**How to get these values:**
- OpenAI: [OpenAI API Keys](https://platform.openai.com/api-keys)
- Anthropic: [Anthropic Console](https://console.anthropic.com/)

### Application URLs

```bash
# Server configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
LOG_LEVEL=warn

# Application URLs
BASE_URL=https://[YOUR_API_DOMAIN].vercel.app
FRONTEND_URL=https://[YOUR_DOMAIN].vercel.app
NEXT_PUBLIC_API_URL=https://[YOUR_API_DOMAIN].vercel.app

# CORS configuration
CORS_ORIGINS=https://[YOUR_DOMAIN].vercel.app
```

### Social Media APIs (Optional)

```bash
# Twitter/X API v2
TWITTER_API_KEY=[YOUR_TWITTER_API_KEY]
TWITTER_API_SECRET=[YOUR_TWITTER_API_SECRET]
TWITTER_BEARER_TOKEN=[YOUR_TWITTER_BEARER_TOKEN]
TWITTER_CLIENT_ID=[YOUR_TWITTER_CLIENT_ID]
TWITTER_CLIENT_SECRET=[YOUR_TWITTER_CLIENT_SECRET]

# LinkedIn API
LINKEDIN_CLIENT_ID=[YOUR_LINKEDIN_CLIENT_ID]
LINKEDIN_CLIENT_SECRET=[YOUR_LINKEDIN_CLIENT_SECRET]

# Google OAuth
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
```

### Payment Processing (Stripe)

```bash
# Stripe API keys (use live keys for production)
STRIPE_SECRET_KEY=sk_live_[YOUR_LIVE_SECRET_KEY]
STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]

# Stripe product configuration
STRIPE_STARTER_PRICE_ID=[PROD_STARTER_PRICE_ID]
STRIPE_GROWTH_PRICE_ID=[PROD_GROWTH_PRICE_ID]
STRIPE_SCALE_PRICE_ID=[PROD_SCALE_PRICE_ID]

# Billing configuration
TRIAL_PERIOD_DAYS=14
BILLING_PORTAL_RETURN_URL=https://[YOUR_DOMAIN].vercel.app/billing
CHECKOUT_SUCCESS_URL=https://[YOUR_DOMAIN].vercel.app/billing/success
CHECKOUT_CANCEL_URL=https://[YOUR_DOMAIN].vercel.app/billing/cancel
```

### File Storage (AWS S3)

```bash
# AWS S3 configuration
AWS_ACCESS_KEY_ID=[YOUR_AWS_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET_KEY]
AWS_REGION=us-east-1
AWS_S3_BUCKET=[YOUR_S3_BUCKET_NAME]
```

### Email Configuration

```bash
# Email service settings
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=[YOUR_EMAIL]
EMAIL_SERVER_PASSWORD=[YOUR_APP_PASSWORD]
EMAIL_FROM=noreply@[YOUR_DOMAIN].com
```

## Queue & Job Processing

```bash
# BullMQ configuration
QUEUE_REDIS_URL=${REDIS_URL}
QUEUE_CONCURRENCY=5
QUEUE_MAX_ATTEMPTS=3
QUEUE_DELAY_BETWEEN_ATTEMPTS=5000

# Queue types
ENABLE_AI_GENERATION_QUEUE=true
ENABLE_SOCIAL_POSTING_QUEUE=true
ENABLE_ANALYTICS_QUEUE=true
ENABLE_EMAIL_QUEUE=true
```

## Rate Limiting

```bash
# Redis-based rate limiting
RATE_LIMIT_REDIS_URL=${REDIS_URL}
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# API-specific rate limits
API_RATE_LIMIT_AUTHENTICATED=1000
API_RATE_LIMIT_ANONYMOUS=100
AI_GENERATION_RATE_LIMIT=50
```

## Performance & Caching

```bash
# Caching configuration
ENABLE_CACHING=true
CACHE_TTL=3600
CONCURRENT_AI_REQUESTS=10
MAX_REQUESTS_PER_MINUTE=1000

# Performance features
ENABLE_BACKGROUND_PROCESSING=true
ENABLE_REQUEST_BATCHING=true
```

## Security Settings

```bash
# Security features
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
SSL_ENABLED=true

# Content safety
BRAND_SAFETY_ENABLED=true
STRICT_CONTENT_FILTERING=true
AUTO_APPROVE_THRESHOLD=0.95
```

## Feature Flags

```bash
# Feature toggles
ENABLE_STRATEGY_GENERATION=true
ENABLE_TONE_ANALYSIS=true
ENABLE_CONTENT_PILLARS=true
ENABLE_AUDIENCE_ANALYSIS=true
ENABLE_BRAND_SAFETY=true
```

## Monitoring & Logging

```bash
# Health checks and monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
ERROR_REPORTING_ENABLED=true

# Health check URLs
HEALTH_CHECK_URL=https://[YOUR_API_DOMAIN].vercel.app/health
METRICS_URL=https://[YOUR_API_DOMAIN].vercel.app/metrics

# Error reporting (optional)
SENTRY_DSN=[YOUR_SENTRY_DSN]
```

## Backup Configuration

```bash
# Backup settings (handled by services)
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
```

## Setting Environment Variables in Vercel

### Via Vercel CLI

```bash
# Set individual variables
vercel env add VARIABLE_NAME production
# Then enter the value when prompted

# Set from .env.production file (automated in deployment script)
# The deployment script will read .env.production and set all variables
```

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with the environment set to "Production"

### Environment Variable Validation

Create a validation script to check all required variables:

```javascript
// scripts/validate-env.js
const requiredVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
  'ENCRYPTION_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

## Security Best Practices

1. **Never commit environment files** to version control
2. **Use different secrets** for different environments
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use strong, random values** for all secrets
5. **Monitor for leaked credentials** in logs and error messages
6. **Use environment-specific URLs** and API keys
7. **Enable audit logging** for environment variable changes

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check DATABASE_URL format and credentials
2. **Redis connection timeouts**: Ensure REDIS_URL uses `rediss://` (TLS)
3. **JWT authentication failures**: Verify JWT_SECRET is set correctly
4. **API rate limits**: Check API key validity and usage quotas
5. **CORS errors**: Verify CORS_ORIGINS matches your domain

### Environment Variable Testing

```bash
# Test database connection
node -e "console.log('DB URL format:', process.env.DATABASE_URL ? 'OK' : 'Missing')"

# Test Redis connection
node -e "console.log('Redis URL format:', process.env.REDIS_URL ? 'OK' : 'Missing')"

# Test secrets length
node -e "console.log('JWT secret length:', process.env.JWT_SECRET?.length || 0)"
```

## Environment Templates

### Development Template
```bash
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/aipromotdb
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-change-in-production
```

### Production Template
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT]:6380
JWT_SECRET=[GENERATED_SECRET]
```

This document should be kept up to date as new environment variables are added to the application.
