# AIPromote API Documentation

## 📖 Overview

The AIPromote API is a RESTful service built with Fastify and TypeScript that powers the AIPromote marketing automation platform. This documentation covers all available endpoints, authentication, request/response formats, and usage examples.

**Base URL**: `https://api.aipromotapp.com` (Production) | `http://localhost:3001` (Development)  
**API Version**: v1  
**Content-Type**: `application/json`

---

## 🔐 Authentication

AIPromote uses JWT-based authentication. Include the JWT token in the Authorization header for protected endpoints.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user|admin",
  "exp": 1640995200
}
```

---

## 📚 API Endpoints

### Authentication

#### `POST /api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clr123...",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### `POST /api/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clr123...",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "free"
    }
  }
}
```

#### `POST /api/auth/forgot-password`
Initiate password reset process.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### `POST /api/auth/reset-password`
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newSecurePassword123"
}
```

---

### Startups Management

#### `GET /api/startups`
Get user's startups.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "startup_id",
      "name": "My AI Startup",
      "url": "https://myai.com",
      "stage": "pre-seed",
      "description": "AI-powered solution for...",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/startups`
Create a new startup.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My AI Startup",
  "url": "https://myai.com",
  "stage": "pre-seed",
  "description": "AI-powered solution for developers",
  "category": "developer-tools",
  "markets": ["US", "EU"],
  "languages": ["en"]
}
```

#### `GET /api/startups/:id`
Get specific startup details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "startup_id",
    "name": "My AI Startup",
    "url": "https://myai.com",
    "stage": "pre-seed",
    "description": "AI-powered solution for...",
    "brandRules": {
      "tone": "professional",
      "allowedPhrases": ["AI-powered", "innovative"],
      "forbiddenPhrases": ["revolutionary", "game-changing"]
    },
    "contentPillars": [
      {
        "id": "pillar_1",
        "name": "Educational Content",
        "description": "Teaching users about AI"
      }
    ]
  }
}
```

#### `PUT /api/startups/:id`
Update startup information.

**Request Body:** Same as POST `/api/startups`

#### `DELETE /api/startups/:id`
Delete a startup.

---

### AI Strategy Generation

#### `POST /api/startups/:id/strategy/generate`
Generate marketing strategy for a startup.

**Request Body:**
```json
{
  "goals": {
    "primary": "increase_signups",
    "kpis": ["followers", "signups", "demos"],
    "targetFollowers": 10000,
    "timeframe": "90_days"
  },
  "preferences": {
    "platforms": ["twitter", "linkedin"],
    "postingFrequency": "daily",
    "contentTypes": ["educational", "product_updates"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "strategy_id",
    "positioning": {
      "tagline": "The AI development platform that just works",
      "usp": "Zero-config AI integration for developers",
      "keyMessages": [
        "Simplify AI integration",
        "Built for developers, by developers"
      ]
    },
    "audienceSegments": [
      {
        "name": "Junior Developers",
        "description": "New developers looking to integrate AI",
        "painPoints": ["Complex setup", "Documentation gaps"],
        "channels": ["twitter", "linkedin"]
      }
    ],
    "contentPillars": [
      {
        "name": "Educational",
        "description": "Teach AI concepts and best practices",
        "percentage": 40
      }
    ],
    "channelPlan": [
      {
        "platform": "twitter",
        "cadence": "daily",
        "bestTimes": ["09:00", "13:00", "17:00"]
      }
    ],
    "calendarSkeleton": [
      {
        "date": "2024-01-15",
        "platform": "twitter",
        "pillar": "educational",
        "theme": "AI basics"
      }
    ]
  }
}
```

#### `GET /api/startups/:id/strategy`
Get current active strategy.

#### `POST /api/strategy/:id/accept`
Accept a proposed strategy.

---

### Content Generation

#### `POST /api/startups/:id/content/generate`
Generate content based on strategy.

**Request Body:**
```json
{
  "pillars": ["educational", "product"],
  "platforms": ["twitter", "linkedin"],
  "weeks": 2,
  "options": {
    "includeHashtags": true,
    "includeEmojis": true,
    "variants": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "content_id",
      "platform": "twitter",
      "pillar": "educational",
      "status": "draft",
      "body": "🚀 Building AI apps doesn't have to be complex!\n\nHere's a simple 3-step approach:\n\n1️⃣ Define your use case\n2️⃣ Choose the right model\n3️⃣ Implement with our SDK\n\nWhat's your biggest AI integration challenge? 👇\n\n#AI #WebDev #Developer",
      "hashtags": ["AI", "WebDev", "Developer"],
      "scheduledAt": null,
      "rationale": "Educational content to establish thought leadership",
      "estimatedEngagement": "medium"
    }
  ]
}
```

#### `GET /api/startups/:id/content`
List content items with filtering.

**Query Parameters:**
- `status`: `draft|approved|scheduled|published|failed`
- `platform`: `twitter|linkedin|instagram`
- `pillar`: pillar ID
- `limit`: number (default: 20)
- `offset`: number (default: 0)

#### `GET /api/content/:id`
Get specific content item.

#### `PATCH /api/content/:id`
Update content item.

**Request Body:**
```json
{
  "body": "Updated content text...",
  "status": "approved",
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

#### `POST /api/content/:id/approve`
Approve content for scheduling.

#### `DELETE /api/content/:id`
Delete content item.

---

### Scheduling & Publishing

#### `POST /api/content/:id/schedule`
Schedule content for publishing.

**Request Body:**
```json
{
  "publishAt": "2024-01-15T10:00:00Z",
  "timezone": "America/New_York"
}
```

#### `POST /api/content/:id/publish-now`
Publish content immediately.

#### `GET /api/startups/:id/schedule`
Get publishing schedule.

**Query Parameters:**
- `from`: ISO date
- `to`: ISO date
- `platform`: platform filter

---

### Social Media Connections

#### `GET /api/social/:startupId/accounts`
List connected social accounts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "account_id",
      "platform": "twitter",
      "handle": "@myaistartup",
      "isActive": true,
      "connectedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/social/:startupId/connect/:platform/start`
Initiate OAuth connection for platform.

**Supported Platforms:** `twitter`, `linkedin`, `instagram`, `tiktok`

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://api.twitter.com/oauth/authenticate?...",
    "state": "random_state_string"
  }
}
```

#### `GET /api/social/:startupId/connect/:platform/callback`
Handle OAuth callback.

**Query Parameters:**
- `code`: OAuth code
- `state`: State parameter

#### `DELETE /api/social/:startupId/accounts/:accountId`
Disconnect social account.

---

### Analytics & Performance

#### `GET /api/startups/:id/analytics/summary`
Get analytics summary.

**Query Parameters:**
- `period`: `7d|30d|90d`
- `platform`: platform filter

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "metrics": {
      "totalPosts": 45,
      "totalImpressions": 125000,
      "totalEngagements": 3200,
      "engagementRate": 2.56,
      "followerGrowth": 150
    },
    "platformBreakdown": [
      {
        "platform": "twitter",
        "posts": 30,
        "impressions": 80000,
        "engagements": 2100
      }
    ],
    "topPerformers": [
      {
        "contentId": "content_123",
        "platform": "twitter",
        "impressions": 5000,
        "engagements": 150,
        "body": "🚀 Building AI apps doesn't..."
      }
    ]
  }
}
```

#### `GET /api/content/:id/metrics`
Get metrics for specific content.

**Response:**
```json
{
  "success": true,
  "data": {
    "contentId": "content_123",
    "platform": "twitter",
    "impressions": 5000,
    "likes": 89,
    "comments": 23,
    "shares": 12,
    "clicks": 45,
    "followersDelta": 5,
    "engagementRate": 3.38,
    "collectedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### `POST /api/startups/:id/weekly-summary/generate`
Generate AI coaching summary.

#### `GET /api/startups/:id/weekly-summaries`
List weekly summaries.

---

### File Upload & Assets

#### `POST /api/upload`
Upload files (images, videos, documents).

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File to upload
- `type`: `logo|screenshot|video|document`
- `startupId`: Startup ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "asset_id",
    "type": "logo",
    "url": "https://cdn.aipromotapp.com/assets/logo.png",
    "size": 45678,
    "mime": "image/png"
  }
}
```

#### `GET /api/startups/:id/assets`
List startup assets.

#### `DELETE /api/assets/:id`
Delete an asset.

---

### Billing & Subscription

#### `GET /api/billing/plans`
Get available plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "limits": {
        "startups": 1,
        "postsPerMonth": 20,
        "platforms": ["twitter", "linkedin"]
      }
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 49,
      "limits": {
        "startups": 3,
        "postsPerMonth": 200,
        "platforms": ["all"]
      }
    }
  ]
}
```

#### `POST /api/billing/checkout`
Create Stripe checkout session.

**Request Body:**
```json
{
  "planId": "pro",
  "successUrl": "https://app.aipromotapp.com/dashboard?success=true",
  "cancelUrl": "https://app.aipromotapp.com/billing?canceled=true"
}
```

#### `GET /api/billing/subscription`
Get current subscription.

#### `POST /api/billing/cancel`
Cancel subscription.

#### `GET /api/usage`
Get current usage metrics.

---

### Admin Endpoints

#### `GET /api/admin/users`
List all users (admin only).

#### `GET /api/admin/stats`
Get platform statistics.

#### `POST /api/admin/users/:id/update-plan`
Update user's plan.

---

## 🔍 Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `AUTHENTICATION_REQUIRED` | Missing or invalid JWT token | 401 |
| `AUTHORIZATION_FAILED` | Insufficient permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |
| `SOCIAL_API_ERROR` | External API error | 502 |
| `CONTENT_GENERATION_FAILED` | AI generation failed | 503 |

---

## 📊 Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| Authentication | 5 requests | 15 minutes |
| Content Generation | 10 requests | 1 hour |
| Publishing | 100 requests | 1 hour |
| Analytics | 60 requests | 1 minute |
| General API | 1000 requests | 1 hour |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 🔗 Webhooks

AIPromote sends webhooks for important events:

### Webhook Events

| Event | Description |
|-------|-------------|
| `content.published` | Content was successfully published |
| `content.failed` | Content publishing failed |
| `strategy.generated` | New strategy was generated |
| `subscription.updated` | User subscription changed |
| `usage.limit_reached` | Usage limit reached |

### Webhook Payload

```json
{
  "event": "content.published",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "contentId": "content_123",
    "platform": "twitter",
    "startupId": "startup_456"
  }
}
```

---

## 🧪 Testing

### Test Environment
- **Base URL**: `https://api-staging.aipromotapp.com`
- **Test API Key**: Contact support for test credentials

### Example Requests

#### cURL Examples

```bash
# Register a new user
curl -X POST https://api.aipromotapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Create a startup
curl -X POST https://api.aipromotapp.com/api/startups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Startup","url":"https://test.com","stage":"pre-seed"}'

# Generate content
curl -X POST https://api.aipromotapp.com/api/startups/123/content/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pillars":["educational"],"platforms":["twitter"],"weeks":1}'
```

#### JavaScript Examples

```javascript
// Using fetch
const response = await fetch('https://api.aipromotapp.com/api/startups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My AI Startup',
    url: 'https://myai.com',
    stage: 'pre-seed'
  })
});

const data = await response.json();
```

---

## 📝 SDK & Libraries

### Official SDKs

- **JavaScript/TypeScript**: `npm install @aipromotapp/sdk`
- **Python**: `pip install aipromotapp-sdk`
- **Go**: `go get github.com/aipromotapp/go-sdk`

### Community SDKs

- **PHP**: Available on GitHub
- **Ruby**: Available as gem

---

## 📞 Support

- **Documentation**: https://docs.aipromotapp.com
- **Support Email**: support@aipromotapp.com
- **Discord**: https://discord.gg/aipromotapp
- **GitHub Issues**: https://github.com/aipromotapp/api-issues

---

## 📄 License

This API documentation is licensed under MIT License. See [LICENSE](../LICENSE) for details.

---

*Last updated: January 15, 2025*
