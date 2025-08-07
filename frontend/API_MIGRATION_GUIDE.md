# API Migration Guide: Fastify to Next.js

This document outlines the complete migration from Fastify backend endpoints to Next.js API routes with proper error handling, validation, and rate limiting using Vercel KV.

## Migration Overview

### Completed API Routes

#### Authentication Routes (`/api/auth/*`)
- ✅ `POST /api/auth/register` - User registration with email verification
- ✅ `POST /api/auth/signin` - User authentication with JWT tokens
- ✅ `POST /api/auth/verify-email` - Email verification
- ✅ `POST /api/auth/forgot-password` - Password reset request
- ✅ `POST /api/auth/reset-password` - Password reset completion

#### User Management (`/api/users/*`)
- ✅ `GET /api/users/[id]` - Get user profile
- ✅ `PATCH /api/users/[id]` - Update user profile

#### Organization Management (`/api/organizations/*`)
- ✅ `GET /api/organizations` - List user's organizations
- ✅ `POST /api/organizations` - Create new organization
- ✅ `GET /api/organizations/[id]` - Get organization details
- ✅ `PATCH /api/organizations/[id]` - Update organization
- ✅ `DELETE /api/organizations/[id]` - Delete organization

#### Content Generation (`/api/v1/content/*`)
- ✅ `POST /api/v1/content/generate` - AI content generation with OpenAI

#### File Upload (`/api/v1/upload/*`)
- ✅ `POST /api/v1/upload` - File upload with validation and metadata storage

#### Billing/Stripe Integration (`/api/billing/*`)
- ✅ `GET /api/billing/plans` - Get subscription plans
- ✅ `GET /api/billing/subscription` - Get user's subscription
- ✅ `POST /api/billing/subscription` - Create new subscription
- ✅ `PUT /api/billing/subscription` - Update subscription
- ✅ `DELETE /api/billing/subscription` - Cancel subscription
- ✅ `POST /api/billing/webhooks/stripe` - Stripe webhook handler

#### Health Check
- ✅ `GET /api/health` - System health check with database and KV connectivity

## Key Features Implemented

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Email verification requirements
- Secure password hashing with bcrypt

### 2. Error Handling
- Centralized error handling with custom error classes
- Proper HTTP status codes
- Zod validation error formatting
- Production-safe error messages

### 3. Rate Limiting (Vercel KV)
- Different rate limits for different endpoint types:
  - Authentication: 5 attempts per 15 minutes
  - Content generation: 50 requests per hour
  - General API: 100 requests per 15 minutes
  - File uploads: 10 uploads per minute
  - Password resets: 3 requests per hour

### 4. Input Validation
- Zod schema validation for all request bodies
- File type and size validation for uploads
- Proper sanitization and type checking

### 5. Database Integration
- Prisma ORM for type-safe database operations
- Proper foreign key relationships
- Transaction support for complex operations

### 6. Stripe Integration
- Secure webhook handling with signature verification
- Subscription lifecycle management
- Invoice and payment tracking
- Customer and subscription synchronization

## Environment Variables Required

```env
# Database
DATABASE_URL="your-database-connection-string"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# Vercel KV (Redis)
KV_URL="your-vercel-kv-url"
KV_REST_API_URL="your-kv-rest-api-url"
KV_REST_API_TOKEN="your-kv-rest-api-token"
KV_REST_API_READ_ONLY_TOKEN="your-kv-read-only-token"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
BILLING_TRIAL_DAYS="14"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## Usage Examples

### Authentication
```javascript
// Register a new user
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    name: 'John Doe'
  })
})

// Sign in
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
})

const { data } = await response.json()
const { token } = data
```

### Authenticated Requests
```javascript
// Use JWT token for authenticated requests
const response = await fetch('/api/organizations', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Content Generation
```javascript
const response = await fetch('/api/v1/content/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organizationId: 'org-123',
    platform: 'TWITTER',
    contentType: 'POST',
    variations: { count: 3 },
    context: {
      targetAudience: 'tech entrepreneurs',
      tone: 'professional',
      objective: 'engagement'
    }
  })
})
```

### File Upload
```javascript
const formData = new FormData()
formData.append('file', file)
formData.append('organizationId', 'org-123')

const response = await fetch('/api/v1/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

## Error Response Format

All API routes return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Additional error details when available
}
```

## Rate Limiting Headers

Rate-limited endpoints include headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 900 (only when rate limited)
```

## Database Schema Requirements

The migration assumes these Prisma models exist:
- `User` - User accounts
- `Organization` - User organizations
- `ContentPiece` - Generated content
- `MediaAsset` - Uploaded files
- `Subscription` - User subscriptions
- `SubscriptionPlan` - Available plans
- `Invoice` - Billing invoices
- `PaymentMethod` - Payment methods

## Next Steps

### Recommended Additions

1. **Admin Routes** - Migrate admin management endpoints
2. **Analytics Routes** - Add analytics and reporting endpoints  
3. **Social Media Integration** - Add platform publishing endpoints
4. **Webhook Management** - Add webhook configuration endpoints
5. **API Documentation** - Generate OpenAPI/Swagger documentation

### Performance Optimizations

1. **Caching Layer** - Implement Redis caching for frequently accessed data
2. **Database Optimization** - Add database indexes for query performance
3. **File Storage** - Implement AWS S3 or Vercel Blob storage
4. **Background Jobs** - Add queue system for long-running tasks

### Security Enhancements

1. **API Key Authentication** - Add API key support for service-to-service calls
2. **Request Signing** - Implement request signing for sensitive operations
3. **IP Whitelisting** - Add IP restrictions for admin operations
4. **Audit Logging** - Implement comprehensive audit logs

## Deployment Notes

### Vercel Deployment
- Ensure environment variables are configured
- Set up Stripe webhooks pointing to your production domain
- Configure domain for NEXTAUTH_URL
- Set up monitoring and alerting

### Database Considerations
- Run database migrations before deployment
- Set up database backups
- Monitor database performance and connections
- Consider read replicas for high-traffic applications

This migration provides a solid foundation for a scalable, secure API built on Next.js with modern best practices.
