# Migration to Vercel Deployment

## Overview

This document outlines the migration from a separate Fastify backend to Next.js API routes for Vercel deployment compatibility.

## Changes Made

### 1. Project Structure

- **Before**: Separate `backend/` and `frontend/` workspaces
- **After**: Integrated Next.js application with API routes in `frontend/src/app/api/`

### 2. Backend Logic Migration

#### Routes Converted

The following Fastify routes have been converted to Next.js API routes:

- `backend/src/routes/auth.ts` → `frontend/src/app/api/auth/`
  - `/auth/register` → `frontend/src/app/api/auth/register/route.ts`
  - `/auth/signin` → `frontend/src/app/api/auth/signin/route.ts`
- `backend/src/routes/content.ts` → `frontend/src/app/api/v1/content/generate/route.ts`
- `backend/src/routes/upload.ts` → `frontend/src/app/api/v1/upload/route.ts`
- Health check → `frontend/src/app/api/health/route.ts`

#### Key Changes

1. **Request/Response Pattern**:
   - **Before**: Fastify `request.body`, `reply.send()`
   - **After**: Next.js `await request.json()`, `NextResponse.json()`

2. **Authentication**:
   - **Before**: Fastify JWT plugin with decorators
   - **After**: Manual JWT verification using `jsonwebtoken`

3. **Middleware**:
   - **Before**: Fastify hooks and preHandlers
   - **After**: Next.js middleware and utility functions

### 3. Dependencies

#### Moved to Frontend

All backend dependencies have been moved to `frontend/package.json`:

- `@prisma/client`, `bcryptjs`, `jsonwebtoken`
- `nodemailer`, `axios`, `stripe`
- All other backend service dependencies

#### Prisma Schema

- Moved from `backend/prisma/` to `frontend/prisma/`
- Added password reset token fields to User model
- Updated field names for consistency

### 4. Package.json Updates

#### Root Package.json

- Removed `backend` from workspaces
- Simplified scripts to only target frontend
- Updated description and keywords

#### Frontend Package.json

- Added all backend dependencies
- Added database management scripts
- Added missing type definitions

### 5. Shared Library

The `shared/` workspace remains unchanged and continues to provide:
- Common TypeScript types
- Utility functions
- Enum definitions

## TODO Items

The following items need to be completed to fully migrate:

### 1. Service Layer Migration

Backend services need to be moved and adapted:

```
backend/src/services/ → frontend/src/lib/services/
```

Key services to migrate:
- `content-generation.ts`
- `s3-file-service.ts`
- `analytics-service.ts`
- `social-media-publisher.ts`
- And all other service files

### 2. Configuration Migration

- Move `backend/src/config/` to `frontend/src/lib/config/`
- Update import paths in all files
- Ensure environment variable compatibility

### 3. Middleware and Utils

- Move `backend/src/middleware/` to `frontend/src/lib/middleware/`
- Move `backend/src/utils/` to `frontend/src/lib/utils/`
- Update imports and adapt for Next.js environment

### 4. Database Setup

- Copy any migration files from `backend/prisma/migrations/`
- Copy seed files from `backend/prisma/`
- Test database connection and migrations

### 5. Testing

- Update test files to work with new structure
- Test all API routes
- Verify authentication flows
- Test file uploads and other features

### 6. Environment Variables

Ensure all required environment variables are available:

```env
DATABASE_URL
JWT_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
NEXTAUTH_URL
# ... and others from backend configuration
```

### 7. Vercel Configuration

Create or update `vercel.json` with appropriate settings:
- Serverless function configuration
- Build settings
- Environment variables

## Benefits of Migration

1. **Simplified Deployment**: Single Next.js application deploys easily to Vercel
2. **Better Integration**: API routes share the same runtime as frontend
3. **Improved Performance**: Reduced latency between frontend and API
4. **Cost Efficiency**: Single serverless deployment instead of separate services
5. **Developer Experience**: Unified codebase and development workflow

## Testing the Migration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Test API endpoints:
   - `GET /api/health` - Health check
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/signin` - User authentication
   - `POST /api/v1/content/generate` - Content generation
   - `POST /api/v1/upload` - File upload

## Next Steps

1. Complete the TODO items listed above
2. Test thoroughly in development environment
3. Set up staging environment on Vercel
4. Migrate database and test production deployment
5. Update CI/CD pipelines if applicable
