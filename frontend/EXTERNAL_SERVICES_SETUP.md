# External Services Configuration Guide

This guide walks you through setting up all external services for your AIPromote application.

## 🚀 Quick Setup

Run the setup script to configure environment variables:

```bash
node scripts/setup-vercel-env.js
```

## 🔧 Service Configuration

### 1. OpenAI API

**Purpose**: AI content generation

**Setup Steps**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Create a new secret key
5. Add to Vercel environment variables:
   ```bash
   vercel env add OPENAI_API_KEY -e production -e preview -e development
   ```

**Required Environment Variables**:
- `OPENAI_API_KEY` - Your OpenAI API secret key

**Features**:
- Content generation for all social platforms
- Content moderation
- Hashtag generation
- Multiple content variations

---

### 2. Resend Email Service

**Purpose**: Transactional emails and notifications

**Setup Steps**:
1. Go to [Resend](https://resend.com/)
2. Create an account and verify your email
3. Add and verify your domain (or use their test domain)
4. Generate an API key
5. Add to Vercel environment variables:
   ```bash
   vercel env add RESEND_API_KEY -e production -e preview
   vercel env add FROM_EMAIL -e production -e preview
   ```

**Required Environment Variables**:
- `RESEND_API_KEY` - Your Resend API key
- `FROM_EMAIL` - Your verified sender email address

**Email Templates Available**:
- Welcome emails
- Email verification
- Password reset
- Content generation notifications
- Content scheduling confirmations
- Weekly performance reports

---

### 3. Vercel KV (Redis Alternative)

**Purpose**: Caching, rate limiting, and session management

**Setup Steps**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to "Storage" tab
4. Create a new "KV Database"
5. Connect it to your project
6. Environment variables are automatically added

**Auto-Generated Environment Variables**:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

**Features**:
- Content generation caching
- API rate limiting
- User session management
- Activity tracking
- Feature flags

---

### 4. Vercel Blob Storage

**Purpose**: File uploads and media storage (replaces AWS S3)

**Setup Steps**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to "Storage" tab
4. Create a new "Blob Store"
5. Connect it to your project
6. Environment variables are automatically added

**Auto-Generated Environment Variables**:
- `BLOB_READ_WRITE_TOKEN`

**Features**:
- User avatar uploads
- Content media storage (images, videos)
- Document uploads
- Automatic file validation
- Storage usage tracking

---

### 5. Stripe Payment Processing

**Purpose**: Subscription management and billing

**Setup Steps**:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. In test mode, get your API keys from Developers > API keys
4. Create your products and pricing in Products section
5. Set up webhooks endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
6. Add to Vercel environment variables:
   ```bash
   vercel env add STRIPE_SECRET_KEY -e production -e preview
   vercel env add STRIPE_WEBHOOK_SECRET -e production -e preview
   ```

**Required Environment Variables**:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret
- `STRIPE_STARTER_PRICE_ID` - Price ID for Starter plan
- `STRIPE_PRO_PRICE_ID` - Price ID for Pro plan  
- `STRIPE_ENTERPRISE_PRICE_ID` - Price ID for Enterprise plan

**Subscription Plans** (defined in `src/lib/services/stripe.ts`):

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $19/month | 100 posts/month, 3 platforms, Basic analytics |
| **Pro** | $49/month | 500 posts/month, All platforms, Advanced analytics |
| **Enterprise** | $99/month | Unlimited posts, Team tools, White-label |

**Features**:
- Subscription management
- Payment processing
- Customer portal
- Usage tracking
- Invoice management

---

### 6. OAuth Providers (Optional)

#### Google OAuth

**Setup Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

**Environment Variables**:
```bash
vercel env add GOOGLE_CLIENT_ID -e production -e preview
vercel env add GOOGLE_CLIENT_SECRET -e production -e preview
```

#### GitHub OAuth

**Setup Steps**:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

**Environment Variables**:
```bash
vercel env add GITHUB_CLIENT_ID -e production -e preview
vercel env add GITHUB_CLIENT_SECRET -e production -e preview
```

---

## 🔐 Environment Variables Checklist

### Required for Core Functionality
- ✅ `NEXTAUTH_URL` - Your production URL
- ✅ `NEXTAUTH_SECRET` - NextAuth secret key
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- ✅ `DATABASE_URL` - Database connection string
- ✅ `OPENAI_API_KEY` - OpenAI API key

### Optional but Recommended
- 🔧 `RESEND_API_KEY` - Email service
- 🔧 `FROM_EMAIL` - Sender email address
- 🔧 `BLOB_READ_WRITE_TOKEN` - File storage
- 🔧 `KV_REST_API_TOKEN` - Caching/rate limiting
- 🔧 `STRIPE_SECRET_KEY` - Payment processing

### OAuth (Optional)
- 🔧 `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- 🔧 `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`

### Analytics & Monitoring
- 🔧 `NEXT_PUBLIC_VERCEL_ANALYTICS=1` - Enable Vercel Analytics
- 🔧 `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

---

## 🚀 Deployment Commands

### Set Environment Variables
```bash
# Using the setup script (recommended)
node scripts/setup-vercel-env.js

# Manual setup
vercel env add OPENAI_API_KEY -e production -e preview -e development
vercel env add RESEND_API_KEY -e production -e preview
# ... continue for all variables
```

### Deploy Application
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Sync Environment Variables Locally
```bash
# Pull environment variables to local .env.local
vercel env pull .env.local
```

---

## 🧪 Testing Services

Create API endpoints to test each service:

### Test OpenAI
```bash
curl -X POST https://your-app.vercel.app/api/test/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test content generation"}'
```

### Test Email Service
```bash
curl -X POST https://your-app.vercel.app/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Test File Upload
```bash
curl -X POST https://your-app.vercel.app/api/test/blob \
  -F "file=@test-image.jpg"
```

### Test Stripe
```bash
curl -X POST https://your-app.vercel.app/api/test/stripe \
  -H "Content-Type: application/json"
```

---

## 🔍 Monitoring and Health Checks

### Service Health Endpoints

Each service has built-in health check methods:

```javascript
// Check OpenAI service
import { openAIService } from '@/lib/services/openai'
const health = await openAIService.healthCheck()

// Check email service
import { emailService } from '@/lib/services/email'
const emailHealth = await emailService.testConnection()

// Check KV service
import { kvService } from '@/lib/services/kv'
const kvHealth = await kvService.healthCheck()

// Check blob service
import { blobService } from '@/lib/services/blob'
const blobHealth = await blobService.healthCheck()
```

### Admin Dashboard
Access service status at: `https://your-app.vercel.app/admin/system-health`

---

## 🛠 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key is valid and has sufficient credits
   - Verify rate limits haven't been exceeded
   - Check OpenAI service status

2. **Email Delivery Issues**
   - Verify domain is properly configured in Resend
   - Check sender email is verified
   - Review email logs in Resend dashboard

3. **File Upload Problems**
   - Check blob storage quotas
   - Verify file size limits
   - Ensure proper file types are allowed

4. **Payment Processing Issues**
   - Verify webhook endpoints are properly configured
   - Check Stripe API keys are correct
   - Review webhook logs in Stripe dashboard

### Debug Mode
Enable debug logging by setting:
```bash
vercel env add DEBUG -e development
```

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

## 🎉 You're All Set!

Once all services are configured, your application will have:

- ✨ AI-powered content generation
- 📧 Automated email notifications  
- 💾 Redis-like caching and rate limiting
- 📁 Scalable file storage
- 💳 Complete payment processing
- 🔐 Social login options
- 📊 Analytics and monitoring

Deploy your application and start creating amazing AI-generated social media content! 🚀
