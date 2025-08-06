# Social Media Integration & Publishing System

This document describes the social media integration and publishing system implemented for AI Promote, including Twitter/X API v2 integration, LinkedIn API integration, OAuth flows, post scheduling with BullMQ, retry logic, error handling, webhook handlers, and cross-posting functionality.

## 🚀 Features

### ✅ Completed Features

1. **Twitter/X API v2 Integration**
   - OAuth 2.0 authentication flow
   - Tweet posting with media support
   - Tweet analytics collection
   - User profile management
   - Tweet deletion
   - Media uploads

2. **LinkedIn API Integration**
   - OAuth 2.0 authentication flow
   - Professional content posting
   - Post analytics collection
   - User profile management
   - Post deletion
   - Media uploads

3. **OAuth Flow for Social Account Connections**
   - Secure token encryption/decryption
   - State management for OAuth flows
   - Automatic token refresh
   - Account disconnection

4. **Post Scheduling System with BullMQ**
   - Scheduled post creation
   - Background job processing
   - Queue monitoring and health checks
   - Job priority management

5. **Retry Logic and Error Handling**
   - Exponential backoff retry strategy
   - Maximum retry attempts configuration
   - Comprehensive error logging
   - Graceful failure handling

6. **Webhook Handlers for Social Media Events**
   - Signature verification
   - Account deauthorization handling
   - Post status updates
   - Event-based processing

7. **Cross-posting Functionality**
   - Multi-platform content distribution
   - Platform-specific content adaptation
   - Synchronized scheduling
   - Bulk operations

8. **Analytics Collection**
   - Automated analytics collection
   - Performance metrics tracking
   - Top performing content identification
   - Engagement rate calculations

## 📋 Prerequisites

- Node.js 18+ 
- TypeScript
- PostgreSQL database
- Redis server
- Social media API credentials

## 🔧 Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Configure your `.env` file with the following social media API credentials:**

```bash
# Twitter/X API v2
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Security
ENCRYPTION_KEY=your-32-char-secret-encryption-key
WEBHOOK_SECRET=your-webhook-secret-key

# URLs
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

4. **Run database migrations:**
```bash
npm run db:migrate
```

5. **Generate Prisma client:**
```bash
npm run db:generate
```

## 🏃‍♂️ Running the Application

### Development Mode

**Start the main server:**
```bash
npm run dev
```

**Start the worker process (in a separate terminal):**
```bash
npm run dev:worker
```

### Production Mode

**Build the application:**
```bash
npm run build
```

**Start the main server:**
```bash
npm start
```

**Start the worker process (in a separate terminal):**
```bash
npm run start:worker
```

## 📚 API Endpoints

### Social Account Management

#### Get Connected Accounts
```http
GET /api/v1/social/accounts/:organizationId
```

#### Initiate OAuth Connection
```http
POST /api/v1/social/connect
Content-Type: application/json

{
  "platform": "TWITTER" | "LINKEDIN",
  "organizationId": "string"
}
```

#### Disconnect Account
```http
DELETE /api/v1/social/accounts/:accountId
```

### Post Scheduling

#### Schedule a Single Post
```http
POST /api/v1/social/schedule
Content-Type: application/json

{
  "contentPieceId": "string",
  "socialAccountId": "string",
  "scheduledAt": "2024-01-01T12:00:00Z"
}
```

#### Cross-post to Multiple Platforms
```http
POST /api/v1/social/cross-post
Content-Type: application/json

{
  "contentPieceId": "string",
  "platformSchedules": [
    {
      "platform": "TWITTER",
      "socialAccountId": "string",
      "scheduledAt": "2024-01-01T12:00:00Z"
    },
    {
      "platform": "LINKEDIN",
      "socialAccountId": "string",
      "scheduledAt": "2024-01-01T12:05:00Z"
    }
  ]
}
```

#### Get Scheduled Posts
```http
GET /api/v1/social/scheduled/:organizationId?status=SCHEDULED&platform=TWITTER&limit=50&offset=0
```

#### Cancel Scheduled Post
```http
DELETE /api/v1/social/scheduled/:postId
```

### Analytics

#### Get Analytics Summary
```http
GET /api/v1/social/analytics/:organizationId?platform=TWITTER&startDate=2024-01-01&endDate=2024-01-31
```

#### Get Top Performing Posts
```http
GET /api/v1/social/analytics/:organizationId/top-posts?metric=engagementRate&limit=10
```

#### Trigger Analytics Collection
```http
POST /api/v1/social/analytics/:organizationId/collect
Content-Type: application/json

{
  "platform": "TWITTER",
  "forceRefresh": true
}
```

### Webhooks

#### Social Media Platform Webhooks
```http
POST /api/v1/social/webhooks/:platform
```

### Utility

#### Refresh Tokens
```http
POST /api/v1/social/refresh-tokens
```

## 🔐 Setting Up Social Media APIs

### Twitter/X API v2 Setup

1. **Create a Twitter Developer Account:**
   - Go to [developer.twitter.com](https://developer.twitter.com)
   - Apply for a developer account
   - Create a new project and app

2. **Configure OAuth 2.0:**
   - Enable OAuth 2.0 in your app settings
   - Add callback URL: `http://localhost:3001/api/v1/social/twitter/callback`
   - Copy API Key, API Secret, Bearer Token, Client ID, and Client Secret

3. **Set Required Permissions:**
   - Read and Write permissions
   - Offline access (for refresh tokens)

### LinkedIn API Setup

1. **Create a LinkedIn App:**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create a new app
   - Verify your company page (required for API access)

2. **Configure OAuth 2.0:**
   - Add callback URL: `http://localhost:3001/api/v1/social/linkedin/callback`
   - Request access to required products:
     - Sign In with LinkedIn
     - Share on LinkedIn
     - Marketing Developer Platform (for analytics)

3. **Set Required Scopes:**
   - `r_liteprofile` - Read profile information
   - `r_emailaddress` - Read email address
   - `w_member_social` - Write posts
   - `r_member_social` - Read posts and analytics

## 🔄 Background Processing

The system uses BullMQ for background job processing with Redis as the queue backend.

### Worker Types

1. **Publishing Worker**
   - Processes scheduled posts
   - Handles retries with exponential backoff
   - Updates post status in database
   - Triggers analytics collection

2. **Analytics Worker**
   - Collects post performance metrics
   - Updates analytics database
   - Handles rate limiting from social APIs
   - Processes bulk analytics requests

### Scheduled Jobs

1. **Token Refresh** (every 12 hours)
   - Refreshes expiring OAuth tokens
   - Updates database with new tokens
   - Handles refresh failures

2. **Analytics Collection** (every 6 hours)
   - Collects analytics for all published posts
   - Updates performance metrics
   - Generates engagement reports

3. **Cleanup Jobs** (daily at 2 AM)
   - Removes old completed jobs
   - Archives old analytics data
   - Cancels expired scheduled posts

## 📊 Analytics and Metrics

### Collected Metrics

**Twitter/X Metrics:**
- Impressions
- Likes (Hearts)
- Retweets
- Replies
- Quote Tweets
- Bookmarks
- Profile clicks
- Link clicks
- Engagement rate
- Click-through rate

**LinkedIn Metrics:**
- Impressions
- Reactions
- Comments
- Shares
- Clicks
- Reach
- Engagement rate
- Click-through rate

### Calculated Metrics

- **Engagement Rate:** `(Total Engagements / Impressions) * 100`
- **Click-Through Rate:** `(Clicks / Impressions) * 100`

## 🔧 Configuration Options

### BullMQ Configuration

```typescript
// Queue configuration
const queueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};
```

### Retry Strategy

```typescript
// Publishing retry logic
const shouldRetry = attemptCount < maxAttempts;
const backoffDelay = Math.pow(2, attemptCount) * 60000; // Exponential backoff
```

### Security Configuration

```typescript
// Token encryption
const encryptedToken = encrypt(accessToken);
const decryptedToken = decrypt(encryptedToken);

// Webhook signature verification
const isValid = verifyWebhookSignature(payload, signature, secret);
```

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Authorization Failures**
   - Check callback URLs match exactly
   - Verify API credentials are correct
   - Ensure required permissions are granted

2. **Publishing Failures**
   - Check token expiration
   - Verify content meets platform requirements
   - Review rate limiting status

3. **Analytics Collection Issues**
   - Verify API permissions for analytics endpoints
   - Check token scopes
   - Review rate limiting

4. **Worker Process Issues**
   - Check Redis connection
   - Verify database connectivity
   - Review queue health status

### Monitoring

**Queue Health Check:**
```typescript
const health = await workers.healthCheck();
console.log(health);
```

**Worker Statistics:**
```typescript
const stats = await workers.getWorkerStats();
console.log(stats);
```

**Queue Monitoring:**
```typescript
const queueHealth = await getQueueHealth();
console.log(queueHealth);
```

## 🚀 Production Deployment

### Environment Variables

Ensure all required environment variables are set:
- Social media API credentials
- Database connection strings
- Redis connection
- Security keys
- Base URLs

### Process Management

Use a process manager like PM2 for production:

```bash
# Start main server
pm2 start dist/server.js --name "ai-promote-server"

# Start worker process
pm2 start dist/worker.js --name "ai-promote-worker"

# Monitor processes
pm2 monit
```

### Security Considerations

1. Use strong encryption keys
2. Set up proper CORS origins
3. Enable rate limiting
4. Use HTTPS in production
5. Secure webhook endpoints
6. Monitor for unusual activity

### Scaling

1. **Horizontal Scaling:**
   - Multiple server instances
   - Load balancer configuration
   - Shared Redis instance

2. **Worker Scaling:**
   - Multiple worker processes
   - Queue-based job distribution
   - Resource monitoring

## 📝 Contributing

When contributing to the social media integration system:

1. Follow TypeScript best practices
2. Add proper error handling
3. Include comprehensive tests
4. Update documentation
5. Follow security guidelines
6. Test with actual API credentials

## 🔍 Code Structure

```
src/
├── services/
│   ├── twitter-api.ts          # Twitter API integration
│   ├── linkedin-api.ts         # LinkedIn API integration
│   ├── social-media-publisher.ts   # Publishing logic
│   └── analytics-collector.ts  # Analytics collection
├── routes/
│   └── social-media.ts         # API endpoints
├── workers/
│   └── social-media-workers.ts # Background job processing
├── utils/
│   └── encryption.ts           # Token encryption/decryption
└── config/
    └── redis.ts               # Queue configuration
```

This completes the comprehensive social media integration and publishing system for AI Promote! 🎉
