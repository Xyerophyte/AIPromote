# Vercel Deployment Guide

This document provides comprehensive instructions for deploying your Next.js application to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Vercel CLI installed globally**:
   ```bash
   npm install -g vercel
   ```

2. **Vercel account** and project created on [vercel.com](https://vercel.com)

3. **All dependencies installed**:
   ```bash
   npm ci
   ```

4. **Environment variables configured** (see [Environment Variables](#environment-variables))

## Configuration Files

### vercel.json

The main Vercel configuration file includes:

- **Framework preset**: `nextjs`
- **Build command**: `npm run build` 
- **Output directory**: `.next`
- **Serverless functions**: Configured for API routes
- **CORS headers**: Enabled for all API routes
- **Caching**: Optimized for static assets and images
- **Security headers**: CSP, CSRF protection, etc.
- **Preview deployments**: Configured for feature branches

### .vercelignore

Excludes unnecessary files from deployment:
- Test files and directories
- Development configuration
- Build artifacts (except .next)
- Documentation files

## Environment Variables

### Required Variables

These must be set in Vercel dashboard under Project Settings > Environment Variables:

```bash
# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-app.vercel.app

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

### Optional Variables

```bash
# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Email
RESEND_API_KEY=your-resend-api-key

# Storage
BLOB_READ_WRITE_TOKEN=your-blob-token
KV_URL=your-kv-url
```

### Setting Environment Variables

#### Via Vercel CLI:
```bash
# Set production variable
vercel env add NEXTAUTH_SECRET production

# Set for all environments
vercel env add DATABASE_URL
```

#### Via Vercel Dashboard:
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add variables for appropriate environments

## Deployment Process

### 1. Pre-deployment Checks

Run the deployment helper script to validate your setup:

```bash
npm run deploy:check
```

This will:
- Validate environment variables
- Run type checking
- Execute linting
- Test the build process

### 2. Preview Deployment

Deploy to a preview environment for testing:

```bash
npm run deploy:preview
```

Or manually:
```bash
vercel --confirm
```

### 3. Production Deployment

Deploy to production:

```bash
npm run deploy:production
```

Or manually:
```bash
vercel --prod --confirm
```

### 4. Check Deployment Status

```bash
npm run deploy:status
```

## Post-Deployment

### Domain Configuration

1. **Custom Domain**: Add your domain in Vercel dashboard
2. **DNS Setup**: Point your domain to Vercel
3. **SSL Certificate**: Automatically provisioned by Vercel

### Monitoring

1. **Analytics**: Built-in Vercel Analytics enabled
2. **Error Tracking**: Sentry integration configured
3. **Performance**: Web Vitals monitoring active

### Database Migrations

After deployment, run database migrations if needed:

```bash
# Connect to production database
npx prisma migrate deploy
```

## Branch-based Deployments

The configuration supports automatic deployments for:

- **main**: Production deployments
- **staging**: Staging environment
- **feature/***: Preview deployments
- **hotfix/***: Priority preview deployments

## Serverless Functions

API routes are configured as serverless functions with:

- **Runtime**: Node.js 20.x
- **Max Duration**: 30 seconds
- **Memory**: Default (1024MB)
- **Region**: US East (iad1)

### Function Optimization

For better performance:
- Keep functions small and focused
- Use middleware for common logic
- Implement proper caching headers
- Minimize cold starts

## Caching Strategy

### Static Assets
- **JS/CSS/Images**: 1 year cache with immutable flag
- **Next.js static**: 1 year cache with immutable flag
- **Images**: 24 hours cache

### API Routes
- **Default**: No cache, no store
- **Custom**: Set via response headers

## Security Headers

The following security headers are automatically applied:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## CORS Configuration

CORS is enabled for all API routes with:

- **Origin**: `*` (configure as needed for production)
- **Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With, Accept, Origin`
- **Max Age**: 86400 seconds (24 hours)

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set
   - Ensure all dependencies are installed
   - Verify TypeScript compilation passes

2. **API Route Issues**:
   - Check function timeout limits
   - Verify CORS configuration
   - Review function logs in Vercel dashboard

3. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Ensure Supabase connection string is valid
   - Check Prisma client generation

### Debugging Commands

```bash
# View deployment logs
vercel logs

# Inspect specific deployment
vercel inspect [deployment-url]

# List all deployments
vercel ls

# View environment variables
vercel env ls
```

### Performance Issues

1. **Slow Build Times**:
   - Enable build cache
   - Optimize dependencies
   - Use incremental builds

2. **Cold Start Latency**:
   - Minimize function size
   - Pre-warm critical functions
   - Use edge functions for simple logic

## Best Practices

1. **Environment Management**:
   - Use different environments for development, staging, production
   - Never commit secrets to version control
   - Use Vercel's secret management

2. **Deployment Strategy**:
   - Always test in preview first
   - Use feature flags for risky changes
   - Monitor deployments closely

3. **Performance**:
   - Optimize bundle size
   - Use proper caching strategies
   - Monitor Core Web Vitals

4. **Security**:
   - Regularly rotate secrets
   - Monitor security headers
   - Keep dependencies updated

## Support

For additional help:

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Note**: This configuration is optimized for the AIPromote application stack including Next.js 15, Supabase, and Vercel's native integrations.
