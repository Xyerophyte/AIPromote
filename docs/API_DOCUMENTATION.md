# AI Promote API Documentation

## Overview

The AI Promote API provides comprehensive endpoints for AI-powered social media content generation, scheduling, and analytics. This RESTful API is built with TypeScript and Fastify, ensuring high performance and type safety.

**Base URL**: `https://api.aipromotapp.com/v1`  
**API Version**: v1  
**Authentication**: Bearer Token (JWT)

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Pagination](#pagination)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Startups](#startup-endpoints)
   - [Content Generation](#content-generation-endpoints)
   - [Social Media](#social-media-endpoints)
   - [Scheduling](#scheduling-endpoints)
   - [Analytics](#analytics-endpoints)
   - [Admin](#admin-endpoints)
6. [Webhooks](#webhooks)
7. [SDK Examples](#sdk-examples)

## Authentication

All API requests (except auth endpoints) require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

### Getting an Authentication Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_abc123...",
    "expiresAt": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling

The API uses conventional HTTP response codes and returns detailed error information.

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "requestId": "req_123456789"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 503 | AI service unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

API requests are rate limited to ensure fair usage and system stability.

**Limits**:
- **Authentication**: 10 requests per minute per IP
- **Content Generation**: 50 requests per hour per user
- **General API**: 1000 requests per hour per user

**Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints use cursor-based pagination for consistent results.

**Request Parameters**:
- `limit` (optional): Number of items to return (max 100, default 20)
- `cursor` (optional): Pagination cursor from previous response

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "hasMore": true,
      "nextCursor": "cursor_abc123",
      "totalCount": 250
    }
  }
}
```

## Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "rt_abc123..."
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

#### Password Reset
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Startup Endpoints

#### Create Startup
```http
POST /api/startups
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "TechCorp Inc.",
  "industry": "Technology",
  "stage": "series-a",
  "description": "Revolutionary AI platform",
  "website": "https://techcorp.com",
  "targetAudience": "B2B SaaS companies",
  "brandVoice": "professional",
  "brandPersonality": ["innovative", "trustworthy"],
  "goals": ["brand-awareness", "lead-generation"],
  "competitors": ["competitor1.com", "competitor2.com"]
}
```

#### Get Startups
```http
GET /api/startups?limit=20&cursor=abc123
Authorization: Bearer <token>
```

#### Update Startup
```http
PUT /api/startups/{startupId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "TechCorp Updated",
  "description": "Updated description"
}
```

#### Delete Startup
```http
DELETE /api/startups/{startupId}
Authorization: Bearer <token>
```

### Content Generation Endpoints

#### Generate Content
```http
POST /api/content/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "startupId": "startup_123",
  "platform": "TWITTER",
  "contentType": "POST",
  "context": {
    "targetAudience": "startup founders",
    "tone": "professional",
    "objective": "engagement",
    "keywords": ["AI", "automation", "startup"],
    "themes": ["innovation", "growth"],
    "callToAction": "Learn more at our website"
  },
  "variations": {
    "count": 3,
    "diversityLevel": "medium"
  },
  "optimization": {
    "seo": true,
    "engagement": true,
    "conversion": false,
    "brandSafety": true
  },
  "constraints": {
    "maxLength": 280,
    "includeHashtags": true,
    "includeMentions": false,
    "mediaSupport": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "content_456",
    "platform": "TWITTER",
    "contentType": "POST",
    "content": {
      "title": "Revolutionize Your Startup with AI",
      "body": "🚀 Startup founders: Ready to scale with AI automation? Our platform helps you grow faster while maintaining quality. Join 1000+ successful startups! #AI #StartupGrowth",
      "hook": "🚀 Startup founders: Ready to scale with AI automation?",
      "cta": "Join 1000+ successful startups!",
      "hashtags": ["#AI", "#StartupGrowth"],
      "mentions": [],
      "media": []
    },
    "variations": [
      {
        "id": "var_1",
        "content": {
          "body": "AI is changing the startup game! 📈 Automate your growth and focus on what matters most. Ready to transform your business?",
          "hashtags": ["#AI", "#Automation"]
        },
        "differentiator": "More casual tone with emoji",
        "confidence": 0.85
      }
    ],
    "metadata": {
      "confidence": 0.92,
      "rationale": "High engagement potential with clear value proposition",
      "keywordsUsed": ["AI", "automation", "startup"],
      "targetAudience": "startup founders",
      "estimatedEngagement": 0.78,
      "brandSafetyScore": 0.95
    },
    "optimization": {
      "seoScore": 0.85,
      "engagementPotential": 0.88,
      "conversionPotential": 0.72,
      "readabilityScore": 0.90
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Content
```http
GET /api/content?platform=TWITTER&status=draft&limit=20
Authorization: Bearer <token>
```

#### Update Content
```http
PUT /api/content/{contentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": {
    "body": "Updated content text",
    "hashtags": ["#Updated", "#Content"]
  },
  "status": "approved"
}
```

#### Delete Content
```http
DELETE /api/content/{contentId}
Authorization: Bearer <token>
```

### Social Media Endpoints

#### Connect Social Account
```http
POST /api/social-media/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "TWITTER",
  "authCode": "oauth_code_from_platform"
}
```

#### Get Connected Accounts
```http
GET /api/social-media/accounts
Authorization: Bearer <token>
```

#### Publish Content
```http
POST /api/social-media/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": "content_456",
  "accountIds": ["account_123", "account_456"],
  "publishAt": "2024-01-15T15:00:00Z"
}
```

### Scheduling Endpoints

#### Schedule Post
```http
POST /api/scheduling/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": "content_456",
  "socialAccountId": "account_123",
  "scheduledFor": "2024-01-15T15:00:00Z",
  "timezone": "America/New_York",
  "recurring": {
    "enabled": false,
    "interval": "daily",
    "endDate": "2024-02-15T00:00:00Z"
  }
}
```

#### Get Scheduled Posts
```http
GET /api/scheduling/posts?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Update Schedule
```http
PUT /api/scheduling/posts/{scheduleId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledFor": "2024-01-15T16:00:00Z",
  "status": "active"
}
```

#### Cancel Scheduled Post
```http
DELETE /api/scheduling/posts/{scheduleId}
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Get Dashboard Analytics
```http
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPosts": 156,
      "totalEngagement": 12450,
      "averageEngagement": 79.8,
      "topPerformingPlatform": "TWITTER",
      "growthRate": 15.5
    },
    "metrics": {
      "impressions": 45000,
      "clicks": 2300,
      "likes": 5600,
      "shares": 890,
      "comments": 340,
      "followers": 12000,
      "followersGrowth": 450
    },
    "platformBreakdown": [
      {
        "platform": "TWITTER",
        "posts": 89,
        "engagement": 7200,
        "avgEngagement": 80.9
      }
    ],
    "timeSeriesData": [
      {
        "date": "2024-01-01",
        "impressions": 1200,
        "clicks": 65,
        "engagement": 89
      }
    ]
  }
}
```

#### Get Content Performance
```http
GET /api/analytics/content/{contentId}/performance
Authorization: Bearer <token>
```

#### Get Real-time Analytics
```http
GET /api/analytics/realtime
Authorization: Bearer <token>
```

#### Export Analytics
```http
POST /api/analytics/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "csv",
  "metrics": ["impressions", "clicks", "engagement"],
  "platforms": ["TWITTER", "LINKEDIN"]
}
```

### Admin Endpoints

#### Get System Status
```http
GET /api/admin/status
Authorization: Bearer <admin_token>
```

#### Get User Statistics
```http
GET /api/admin/users/stats
Authorization: Bearer <admin_token>
```

#### Manage Users
```http
GET /api/admin/users?role=user&status=active&limit=50
PUT /api/admin/users/{userId}/role
DELETE /api/admin/users/{userId}
Authorization: Bearer <admin_token>
```

## Webhooks

Configure webhooks to receive real-time notifications about events.

### Webhook Events

- `content.generated` - New content generated
- `content.published` - Content published to social media
- `analytics.updated` - Analytics data updated
- `user.registered` - New user registered

### Webhook Payload

```json
{
  "event": "content.published",
  "timestamp": "2024-01-15T15:00:00Z",
  "data": {
    "contentId": "content_456",
    "platform": "TWITTER",
    "postId": "1234567890",
    "accountId": "account_123"
  },
  "signature": "sha256=abc123..."
}
```

### Webhook Verification

Verify webhook authenticity using the signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const AIPromoteAPI = require('@aipromotapp/sdk');

const client = new AIPromoteAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.aipromotapp.com/v1'
});

// Generate content
const content = await client.content.generate({
  platform: 'TWITTER',
  context: {
    targetAudience: 'developers',
    keywords: ['JavaScript', 'API']
  }
});

// Schedule post
await client.scheduling.schedule({
  contentId: content.id,
  scheduledFor: '2024-01-15T15:00:00Z'
});
```

### Python

```python
from aipromotapp import AIPromoteClient

client = AIPromoteClient(
    api_key='your_api_key',
    base_url='https://api.aipromotapp.com/v1'
)

# Generate content
content = client.content.generate(
    platform='TWITTER',
    context={
        'target_audience': 'developers',
        'keywords': ['Python', 'API']
    }
)

# Get analytics
analytics = client.analytics.dashboard(
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```

### cURL Examples

```bash
# Generate content
curl -X POST https://api.aipromotapp.com/v1/api/content/generate \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "TWITTER",
    "contentType": "POST",
    "context": {
      "targetAudience": "developers",
      "tone": "professional",
      "keywords": ["API", "development"]
    }
  }'

# Get analytics
curl -X GET "https://api.aipromotapp.com/v1/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer your_token"
```

## Testing

### Test Environment

**Base URL**: `https://api-staging.aipromotapp.com/v1`

### Test Data

Use the following test data for development:

```json
{
  "testUser": {
    "email": "test@aipromotapp.com",
    "password": "TestPassword123!"
  },
  "testStartup": {
    "companyName": "Test Startup Inc.",
    "industry": "Technology",
    "stage": "seed"
  }
}
```

## Support

- **Documentation**: https://docs.aipromotapp.com
- **API Status**: https://status.aipromotapp.com
- **Support Email**: api-support@aipromotapp.com
- **Discord Community**: https://discord.gg/aipromotapp

## Changelog

### v1.3.0 - 2024-01-15
- Added A/B testing endpoints
- Enhanced analytics with real-time data
- Improved content generation with brand safety

### v1.2.0 - 2024-01-01
- Added bulk operations support
- Enhanced error handling
- Improved rate limiting

### v1.1.0 - 2023-12-15
- Added webhook support
- Enhanced scheduling features
- Added content approval workflow

### v1.0.0 - 2023-12-01
- Initial API release
- Core content generation features
- Basic analytics and scheduling
