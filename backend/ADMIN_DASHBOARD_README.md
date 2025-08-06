# Admin Dashboard & Management Tools

## Overview

The admin dashboard provides comprehensive management tools for the AI Promote platform, including user management, content moderation, system health monitoring, analytics, feature flags, audit logging, and customer support tools.

## Features

### 1. Admin Panel for User Management

**Location**: `src/routes/admin.ts` - `/api/v1/admin/users/*`

**Features:**
- **User Listing**: Paginated list of all users with search and filtering
- **User Details**: Comprehensive user profile with activity history
- **User Management**: Update user roles, plans, verification status
- **User Analytics**: Usage statistics and subscription details
- **Soft Delete**: Safe user deletion with data preservation

**API Endpoints:**
```
GET /api/v1/admin/users - List users with pagination/filters
GET /api/v1/admin/users/:userId - Get user details
PATCH /api/v1/admin/users/:userId - Update user
DELETE /api/v1/admin/users/:userId - Soft delete user
```

**Permissions**: Requires `ADMIN` or `MODERATOR` role

### 2. Content Moderation Tools

**Location**: `src/routes/admin.ts` - `/api/v1/admin/moderation/*`

**Features:**
- **Moderation Queue**: Content requiring review
- **Automated Flagging**: AI-powered content screening
- **Manual Review**: Approve, reject, or flag content
- **Bulk Actions**: Process multiple items simultaneously
- **Assignment System**: Distribute work among moderators

**API Endpoints:**
```
GET /api/v1/admin/moderation/content - Get content pending moderation
POST /api/v1/admin/moderation/content/:contentId - Moderate content
GET /api/v1/admin/moderation/flagged - Get flagged users/organizations
```

**Database Models:**
- `ContentModerationQueue` - Tracks items needing review
- `AuditLog` - Records all moderation actions

### 3. System Health Monitoring

**Location**: `src/workers/admin-health-worker.ts`, `src/services/admin-service.ts`

**Features:**
- **Real-time Monitoring**: Continuous system health checks
- **Performance Metrics**: Memory, CPU, database performance
- **Error Tracking**: Failed jobs, error rates
- **Alert System**: Automatic notifications for critical issues
- **Health Dashboard**: Visual system status overview

**API Endpoints:**
```
GET /api/v1/admin/health/system - Current system health
GET /api/v1/admin/health/errors - Error logs and details
```

**Monitoring Metrics:**
- Database connectivity and response time
- Memory usage and performance
- Failed post processing
- Error rates and patterns
- Active user counts
- Queue sizes and processing

**Health Checks** (Every 5 minutes):
- Database connection
- Memory usage thresholds
- Failed job counts
- Response time monitoring
- Error rate analysis

### 4. Usage Analytics Dashboard

**Location**: `src/routes/admin.ts` - `/api/v1/admin/analytics/*`

**Features:**
- **Platform Analytics**: User growth, content creation, engagement
- **Revenue Tracking**: Subscription metrics and revenue analytics
- **User Activity**: Activity patterns and usage statistics
- **Performance Insights**: Content and platform performance
- **Custom Reports**: Flexible reporting with time ranges

**API Endpoints:**
```
GET /api/v1/admin/analytics/overview - Platform overview
GET /api/v1/admin/analytics/users - User activity analytics
```

**Metrics Tracked:**
- User registration and growth
- Content creation and publication
- Platform engagement rates
- Revenue and subscription data
- Feature usage statistics

### 5. Feature Flag Management

**Location**: `src/routes/admin.ts` - `/api/v1/admin/feature-flags/*`

**Features:**
- **Flag Creation**: Create and configure feature flags
- **Rollout Control**: Gradual feature rollouts (0-100%)
- **User Targeting**: Target specific users or segments
- **A/B Testing**: Support for controlled experiments
- **Real-time Updates**: Instant flag changes without deployment

**API Endpoints:**
```
GET /api/v1/admin/feature-flags - List all feature flags
POST /api/v1/admin/feature-flags - Create new feature flag
PATCH /api/v1/admin/feature-flags/:flagId - Update feature flag
DELETE /api/v1/admin/feature-flags/:flagId - Delete feature flag
```

**Flag Configuration:**
- **Name**: Unique identifier
- **Description**: Human-readable description
- **Enabled**: Global on/off switch
- **Rollout Percentage**: Gradual rollout (0-100%)
- **Target Users**: Specific user IDs
- **Conditions**: Advanced targeting rules

### 6. Audit Logging

**Location**: `src/services/admin-service.ts`, Database model: `AuditLog`

**Features:**
- **Action Tracking**: All admin and user actions logged
- **Change History**: Before/after values for updates
- **IP and User Agent**: Security and forensics information
- **Search and Filter**: Find specific actions or users
- **Retention Policy**: Automatic cleanup of old logs (90 days)

**API Endpoints:**
```
GET /api/v1/admin/audit-logs - Search and filter audit logs
GET /api/v1/admin/audit-logs/stats - Audit statistics
```

**Logged Actions:**
- User management (create, update, delete)
- Content moderation decisions
- Feature flag changes
- System configuration updates
- Support ticket actions
- Security events

**Log Data Structure:**
```typescript
{
  userId: string,
  action: string, // e.g., "USER_UPDATE", "CONTENT_APPROVE"
  resource: string, // e.g., "User", "ContentPiece"
  resourceId: string,
  details: object, // Action-specific details
  ipAddress: string,
  userAgent: string,
  createdAt: Date
}
```

### 7. Customer Support Tools

**Location**: `src/routes/admin.ts` - `/api/v1/admin/support/*`

**Features:**
- **Ticket Management**: Create, update, and resolve support tickets
- **Assignment System**: Assign tickets to support staff
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Response Tracking**: Internal notes and customer responses
- **SLA Monitoring**: Track response times and resolution rates

**API Endpoints:**
```
GET /api/v1/admin/support/tickets - List support tickets
GET /api/v1/admin/support/tickets/:ticketId - Get ticket details
PATCH /api/v1/admin/support/tickets/:ticketId - Update ticket
POST /api/v1/admin/support/tickets/:ticketId/responses - Add response
GET /api/v1/admin/support/stats - Support statistics
```

**Ticket Lifecycle:**
1. **OPEN** - New ticket created
2. **IN_PROGRESS** - Being worked on
3. **WAITING_FOR_USER** - Awaiting customer response
4. **RESOLVED** - Issue resolved
5. **CLOSED** - Ticket closed

## Installation & Setup

### 1. Database Migration

Update your database schema with the new admin models:

```bash
# Generate Prisma client with new models
npm run db:generate

# Push schema changes to database
npm run db:push

# Or create and run a migration
npm run db:migrate
```

### 2. Environment Variables

Add admin-specific configuration to your `.env` file:

```env
# Admin Configuration
ADMIN_SESSION_SECRET=your-admin-session-secret
ADMIN_DEFAULT_PASSWORD=change-this-in-production

# Health Monitoring
HEALTH_CHECK_INTERVAL=300000  # 5 minutes
METRIC_RETENTION_DAYS=30
AUDIT_LOG_RETENTION_DAYS=90

# Feature Flags
FEATURE_FLAG_CACHE_TTL=300  # 5 minutes
```

### 3. Start the Admin Health Worker

The health monitoring worker should be started automatically:

```typescript
// In your main application
import { createAdminService } from './src/services/admin-service';
import { createAdminHealthWorker } from './src/workers/admin-health-worker';

const adminService = createAdminService(prisma, fastify);
const healthWorker = createAdminHealthWorker(prisma, fastify, adminService);
```

## Frontend Integration

### 1. Admin Dashboard Component

The main admin dashboard is located at:
```
frontend/src/components/admin/AdminDashboard.tsx
```

### 2. Route Protection

Ensure admin routes are protected:

```typescript
// Example route protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Usage
<AdminRoute>
  <AdminDashboard />
</AdminRoute>
```

### 3. API Integration

The frontend makes requests to admin endpoints:

```typescript
// Example API calls
const fetchSystemHealth = async () => {
  const response = await fetch('/api/v1/admin/health/system', {
    headers: { 'x-user-id': userId }
  });
  return response.json();
};

const moderateContent = async (contentId: string, action: string) => {
  const response = await fetch(`/api/v1/admin/moderation/content/${contentId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': userId 
    },
    body: JSON.stringify({ action })
  });
  return response.json();
};
```

## Security Considerations

### 1. Authentication & Authorization

- All admin routes require authentication via `x-user-id` header
- Role-based access control (ADMIN, MODERATOR)
- Sensitive operations limited to ADMIN role only

### 2. Audit Trail

- All admin actions are automatically logged
- IP addresses and user agents captured
- Cannot be deleted or modified by admins

### 3. Data Protection

- Soft delete for user data preservation
- Encrypted sensitive information
- Automatic data retention policies

## Monitoring & Alerts

### 1. Health Monitoring

The system automatically monitors:
- **Database**: Connection status and query performance
- **Memory**: Heap usage and memory leaks
- **Processing**: Failed jobs and error rates
- **Users**: Active user counts and system usage

### 2. Alert Thresholds

Default alert thresholds:
- **Memory Usage**: Warning at 80%, Critical at 90%
- **Failed Posts**: Warning at 10, Critical at 50
- **Response Time**: Warning at 1s, Critical at 3s
- **Error Rate**: Warning at 5%, Critical at 10%

### 3. Notification System

Alerts are sent to:
- Admin dashboard notifications
- Email notifications (if configured)
- Slack/Discord webhooks (if configured)

## API Documentation

### Authentication

All admin API endpoints require authentication:

```http
GET /api/v1/admin/users
Headers:
  x-user-id: admin-user-id
```

### Error Handling

Standard error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common status codes:
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error

## Development

### 1. Adding New Admin Features

1. **Create API endpoints** in `src/routes/admin.ts`
2. **Add database models** in `prisma/schema.prisma`
3. **Update admin service** in `src/services/admin-service.ts`
4. **Add frontend components** in `frontend/src/components/admin/`
5. **Update audit logging** for new actions

### 2. Testing

```bash
# Run admin-specific tests
npm test -- --grep "admin"

# Test health monitoring
npm test -- --grep "health"

# Test audit logging
npm test -- --grep "audit"
```

### 3. Extending Health Checks

Add new health checks to the worker:

```typescript
// In src/workers/admin-health-worker.ts
private async checkCustomMetric() {
  const value = await measureCustomMetric();
  return {
    value,
    status: value < threshold ? 'HEALTHY' : 'WARNING',
    details: { customData: value }
  };
}
```

## Production Deployment

### 1. Performance Considerations

- Enable database connection pooling
- Configure appropriate rate limits
- Set up proper caching for feature flags
- Monitor memory usage and optimize queries

### 2. Scaling

- Health worker can run on separate instance
- Database read replicas for analytics
- CDN for admin dashboard assets
- Load balancing for multiple admin users

### 3. Backup & Recovery

- Regular database backups including audit logs
- Export functionality for compliance
- Disaster recovery procedures
- Data retention compliance

This comprehensive admin dashboard provides all the tools needed for effective platform management while maintaining security, auditability, and scalability.
