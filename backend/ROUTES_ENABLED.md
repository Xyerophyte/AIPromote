# Backend API Routes - ENABLED ✅

## Overview
All backend API routes have been successfully enabled and configured with proper middleware, security, and rate limiting.

## Enabled Routes

### 🔐 Authentication Routes (`/auth`)
- **POST** `/auth/register` - User registration
- **POST** `/auth/signin` - User login
- **POST** `/auth/oauth` - OAuth user creation/update
- **POST** `/auth/forgot-password` - Password reset request
- **POST** `/auth/reset-password` - Password reset
- **GET** `/auth/user/:id` - Get user by ID

**Middleware Applied:**
- Rate limiting (10 attempts per 15 minutes)
- Input sanitization
- Security headers

---

### 🧠 AI Strategy Routes (`/api/v1/ai-strategy`)
- **POST** `/api/v1/ai-strategy/generate` - Generate AI marketing strategy
- **POST** `/api/v1/ai-strategy/compare` - Compare two strategies
- **POST** `/api/v1/ai-strategy/tone/analyze` - Analyze content tone
- **POST** `/api/v1/ai-strategy/brand-voice/generate` - Generate brand voice
- **POST** `/api/v1/ai-strategy/content-pillars/analyze` - Identify content pillars
- **POST** `/api/v1/ai-strategy/audience/analyze` - Analyze target audience
- **POST** `/api/v1/ai-strategy/safety/check` - Check content safety
- **GET** `/api/v1/ai-strategy/strategies/:organizationId` - Get strategy versions
- **PATCH** `/api/v1/ai-strategy/strategies/:id/accept` - Accept/activate strategy

**Middleware Applied:**
- Rate limiting (50 generations per hour)
- Request size limiting (100KB)
- Input sanitization

---

### 📝 Content Routes (`/api/v1/content`)
- **POST** `/api/v1/content/generate` - Generate AI content
- **POST** `/api/v1/content/variations` - Generate content variations
- **POST** `/api/v1/content/validate/:platform` - Validate platform content
- **GET** `/api/v1/content/templates` - Get content templates
- **GET** `/api/v1/content/templates/:id` - Get specific template
- **POST** `/api/v1/content/templates/apply` - Apply template
- **GET** `/api/v1/content/templates/search` - Search templates
- **POST** `/api/v1/content/approval/request` - Create approval request
- **GET** `/api/v1/content/approval/requests` - Get approval requests
- **GET** `/api/v1/content/library/search` - Search content library
- **GET** `/api/v1/content/library/analytics/:organizationId` - Get library analytics
- **POST** `/api/v1/content/hashtags/research` - Research hashtags
- **GET** `/api/v1/content/hashtags/analytics/:organizationId` - Get hashtag analytics
- **GET** `/api/v1/content/hashtags/trending` - Get trending hashtags
- **POST** `/api/v1/content/hashtags/suggest` - Suggest hashtags
- **POST** `/api/v1/content/media/upload` - Upload media
- **POST** `/api/v1/content/media/:mediaId/validate/:platform/:contentType` - Validate media
- **GET** `/api/v1/content/platforms/:platform/rules` - Get platform rules
- **GET** `/api/v1/content/platforms` - Get all platforms
- **GET** `/api/v1/content/templates/categories` - Get template categories

**Middleware Applied:**
- Rate limiting (50 generations per hour)
- Request size limiting (100KB)
- Input sanitization

---

### 📱 Social Media Routes (`/api/v1/social`)
- **GET** `/api/v1/social/accounts/:organizationId` - Get connected accounts
- **POST** `/api/v1/social/connect` - Initiate OAuth connection
- **GET** `/api/v1/social/twitter/callback` - Twitter OAuth callback
- **GET** `/api/v1/social/linkedin/callback` - LinkedIn OAuth callback
- **DELETE** `/api/v1/social/accounts/:accountId` - Disconnect account
- **POST** `/api/v1/social/schedule` - Schedule a post
- **POST** `/api/v1/social/cross-post` - Cross-post to multiple platforms
- **GET** `/api/v1/social/scheduled/:organizationId` - Get scheduled posts
- **DELETE** `/api/v1/social/scheduled/:postId` - Cancel scheduled post
- **GET** `/api/v1/social/analytics/:organizationId` - Get analytics summary
- **GET** `/api/v1/social/analytics/:organizationId/top-posts` - Get top posts
- **POST** `/api/v1/social/analytics/:organizationId/collect` - Trigger analytics collection
- **POST** `/api/v1/social/webhooks/:platform` - Platform webhook handler
- **POST** `/api/v1/social/refresh-tokens` - Refresh expired tokens

**Middleware Applied:**
- Rate limiting (30 posts per hour)
- Input sanitization

---

### 📅 Scheduling Routes (`/api/v1/scheduling`)
- **POST** `/api/v1/scheduling/optimal-times/analyze` - Analyze optimal posting times
- **GET** `/api/v1/scheduling/optimal-times/:organizationId/:platform` - Get optimal times
- **POST** `/api/v1/scheduling/bulk-schedule` - Create bulk schedule
- **POST** `/api/v1/scheduling/recurring-schedule` - Create recurring schedule
- **POST** `/api/v1/scheduling/calendar/events` - Create calendar event
- **GET** `/api/v1/scheduling/calendar/events` - Get calendar events
- **PUT** `/api/v1/scheduling/calendar/events/drag-drop` - Update via drag-drop
- **DELETE** `/api/v1/scheduling/calendar/events/:eventId` - Delete event
- **POST** `/api/v1/scheduling/conflicts/detect` - Detect conflicts
- **GET** `/api/v1/scheduling/conflicts/:organizationId` - Get conflicts
- **PUT** `/api/v1/scheduling/conflicts/:conflictId/resolve` - Resolve conflict
- **GET** `/api/v1/scheduling/templates/:organizationId` - Get templates
- **PUT** `/api/v1/scheduling/templates/:templateId` - Update template
- **DELETE** `/api/v1/scheduling/templates/:templateId` - Delete template
- **POST** `/api/v1/scheduling/export` - Create calendar export
- **GET** `/api/v1/scheduling/export/:exportId` - Get export status
- **GET** `/api/v1/scheduling/export/history/:organizationId` - Get export history
- **DELETE** `/api/v1/scheduling/export/:exportId` - Delete export
- **GET** `/api/v1/scheduling/analytics/:organizationId` - Get scheduling analytics
- **GET** `/api/v1/scheduling/calendar/overview/:organizationId` - Get calendar overview

**Middleware Applied:**
- General rate limiting (100 requests per 15 minutes)
- Input sanitization

---

### 📊 Analytics Routes (`/api/v1/analytics`)
- **GET** `/api/v1/analytics/dashboard` - Real-time dashboard data
- **GET** `/api/v1/analytics/realtime` - Real-time metrics
- **GET** `/api/v1/analytics/engagement` - Engagement tracking
- **GET** `/api/v1/analytics/growth` - Growth metrics
- **GET** `/api/v1/analytics/comparison` - Performance comparison
- **GET** `/api/v1/analytics/custom-range` - Custom date range filtering
- **POST** `/api/v1/analytics/reports/generate` - Generate report
- **GET** `/api/v1/analytics/reports/:reportId/status` - Get report status
- **GET** `/api/v1/analytics/reports/:reportId/download` - Download report
- **POST** `/api/v1/analytics/competitor-analysis` - Competitor analysis
- **GET** `/api/v1/analytics/top-content` - Top performing content
- **GET** `/api/v1/analytics/insights` - Analytics insights
- **POST** `/api/v1/analytics/collect` - Trigger analytics collection

**Middleware Applied:**
- General rate limiting (100 requests per 15 minutes)
- Input sanitization

---

### 💳 Billing Routes (`/api/v1/billing`)
- **GET** `/api/v1/billing/plans` - Get subscription plans
- **GET** `/api/v1/billing/subscription` - Get current subscription
- **POST** `/api/v1/billing/subscription` - Create subscription
- **PUT** `/api/v1/billing/subscription` - Update subscription
- **DELETE** `/api/v1/billing/subscription` - Cancel subscription
- **POST** `/api/v1/billing/checkout-session` - Create Stripe checkout
- **POST** `/api/v1/billing/portal-session` - Create billing portal
- **GET** `/api/v1/billing/payment-methods` - Get payment methods
- **POST** `/api/v1/billing/payment-methods` - Add payment method
- **PUT** `/api/v1/billing/payment-methods/:paymentMethodId/default` - Set default
- **DELETE** `/api/v1/billing/payment-methods/:paymentMethodId` - Remove method
- **GET** `/api/v1/billing/invoices` - Get invoices
- **GET** `/api/v1/billing/usage` - Get usage statistics
- **POST** `/api/v1/billing/usage` - Record usage
- **POST** `/api/v1/billing/webhooks/stripe` - Stripe webhooks
- **GET** `/api/v1/billing/dashboard` - Billing dashboard

**Middleware Applied:**
- General rate limiting (100 requests per 15 minutes)
- Authentication required for most endpoints
- Input sanitization

---

### 👨‍💼 Admin Routes (`/api/v1/admin`)
- **GET** `/api/v1/admin/users` - Get all users with pagination
- **GET** `/api/v1/admin/users/:userId` - Get user details
- **PATCH** `/api/v1/admin/users/:userId` - Update user
- **DELETE** `/api/v1/admin/users/:userId` - Delete user
- **GET** `/api/v1/admin/moderation/content` - Get content for moderation
- **POST** `/api/v1/admin/moderation/content/:contentId` - Moderate content
- **GET** `/api/v1/admin/moderation/flagged` - Get flagged users/orgs
- **GET** `/api/v1/admin/health/system` - System health metrics
- **GET** `/api/v1/admin/health/errors` - Get error logs
- **GET** `/api/v1/admin/analytics/overview` - Platform analytics
- **GET** `/api/v1/admin/analytics/users` - User activity analytics
- **GET** `/api/v1/admin/feature-flags` - Get feature flags
- **POST** `/api/v1/admin/feature-flags` - Create feature flag
- **PATCH** `/api/v1/admin/feature-flags/:flagId` - Update feature flag
- **DELETE** `/api/v1/admin/feature-flags/:flagId` - Delete feature flag
- **GET** `/api/v1/admin/audit-logs` - Get audit logs
- **GET** `/api/v1/admin/audit-logs/stats` - Get audit statistics

**Middleware Applied:**
- Admin rate limiting (200 actions per hour)
- Admin role verification
- Input sanitization

---

## Global Middleware Applied

### 🔒 Security Middleware
- **CORS** - Configured for cross-origin requests
- **Helmet** - Security headers (CSP, XSS protection, etc.)
- **Input Sanitization** - XSS and SQL injection prevention
- **Request Size Limits** - Prevent oversized requests
- **HTTPS Enforcement** - Force HTTPS in production

### ⏱️ Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes
- **Content Generation**: 50 generations per hour
- **Publishing**: 30 posts per hour
- **Admin**: 200 actions per hour

### 🔑 Authentication
- **JWT Integration** - Token-based authentication
- **Cookie Support** - Secure cookie handling
- **Token Refresh** - Automatic token renewal

### 📁 File Upload Support
- **Multipart** - File upload handling
- **Size Limits** - 10MB max file size
- **Type Validation** - MIME type checking

### 🚨 Error Handling
- **Global Error Handler** - Centralized error processing
- **Validation Errors** - Proper error responses
- **Rate Limit Errors** - Informative rate limit messages
- **JWT Errors** - Authentication error handling

### 📝 Logging
- **Request Logging** - All API requests logged
- **Error Logging** - Comprehensive error tracking
- **Security Events** - Security-related event logging

## Health Endpoints

### 🏥 System Health
- **GET** `/health` - Basic health check with service status
- **GET** `/api/v1` - API information and endpoint list

## Configuration

### 📊 Redis Integration
- Queue management (BullMQ)
- Rate limiting storage
- Caching support
- Session management

### 🗄️ Database (Prisma)
- Connection pooling
- Query optimization
- Transaction support
- Health monitoring

### 🔧 Environment Configuration
- Development/Production modes
- Environment-specific settings
- Secure secret management
- CORS origin configuration

## Dependencies Added
- `ioredis`: ^5.3.2 - Redis client
- `bullmq`: ^5.4.6 - Queue management

All routes are now fully operational with production-ready security, monitoring, and error handling! 🚀
