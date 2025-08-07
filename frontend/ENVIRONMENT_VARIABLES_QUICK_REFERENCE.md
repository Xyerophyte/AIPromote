# Environment Variables Quick Reference

This is a quick reference guide for setting up environment variables for external services.

## 🔧 Using Vercel CLI

To set environment variables using Vercel CLI:

```bash
# Add environment variable for specific environments
vercel env add VARIABLE_NAME -e production -e preview -e development

# List all environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME

# Pull environment variables to local .env.local
vercel env pull .env.local
```

## 📋 Required Environment Variables

### Core Authentication & Database
```bash
vercel env add NEXTAUTH_URL -e production -e preview
vercel env add NEXTAUTH_SECRET -e production -e preview -e development
vercel env add NEXT_PUBLIC_SUPABASE_URL -e production -e preview -e development  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY -e production -e preview -e development
vercel env add SUPABASE_SERVICE_ROLE_KEY -e production -e preview
vercel env add DATABASE_URL -e production -e preview
```

### OpenAI (Required)
```bash
vercel env add OPENAI_API_KEY -e production -e preview -e development
```

## 🔧 Optional Services

### Email Service (Resend)
```bash
vercel env add RESEND_API_KEY -e production -e preview
vercel env add FROM_EMAIL -e production -e preview
```

### Payment Processing (Stripe)
```bash
vercel env add STRIPE_SECRET_KEY -e production -e preview
vercel env add STRIPE_WEBHOOK_SECRET -e production -e preview
vercel env add STRIPE_STARTER_PRICE_ID -e production -e preview
vercel env add STRIPE_PRO_PRICE_ID -e production -e preview
vercel env add STRIPE_ENTERPRISE_PRICE_ID -e production -e preview
```

### OAuth Providers
```bash
# Google OAuth
vercel env add GOOGLE_CLIENT_ID -e production -e preview
vercel env add GOOGLE_CLIENT_SECRET -e production -e preview

# GitHub OAuth  
vercel env add GITHUB_CLIENT_ID -e production -e preview
vercel env add GITHUB_CLIENT_SECRET -e production -e preview
```

### Analytics & Monitoring
```bash
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS -e production -e preview
vercel env add NEXT_PUBLIC_SENTRY_DSN -e production -e preview
```

## 🏪 Vercel Storage Services

These are automatically configured when you create storage resources in Vercel Dashboard:

### Vercel KV (Redis)
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Vercel Blob (File Storage)
- `BLOB_READ_WRITE_TOKEN`

## 📚 Service Setup Links

### 🤖 OpenAI
1. Visit: https://platform.openai.com/
2. Go to API Keys section
3. Create new secret key
4. Add to `OPENAI_API_KEY`

### 📧 Resend
1. Visit: https://resend.com/
2. Create account and verify domain
3. Generate API key  
4. Add to `RESEND_API_KEY` and set `FROM_EMAIL`

### 🏪 Vercel Storage
1. Go to Vercel Dashboard > Your Project > Storage
2. Create KV Database and/or Blob Store
3. Environment variables are automatically added

### 💳 Stripe
1. Visit: https://dashboard.stripe.com/
2. Get API keys from Developers section
3. Create products and get price IDs
4. Set up webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
5. Add all Stripe environment variables

### 🔐 OAuth Providers
- **Google**: https://console.cloud.google.com/
- **GitHub**: GitHub Settings > Developer settings > OAuth Apps

## 🧪 Testing Configuration

After setting up environment variables, test your configuration:

```bash
# Test all services
npm run services:health

# Test specific endpoints
curl https://your-app.vercel.app/api/test/openai
curl https://your-app.vercel.app/api/test/email  
curl https://your-app.vercel.app/api/test/stripe
```

## 🔍 Health Check Endpoints

The following test endpoints are available:

- `/api/test/openai` - OpenAI configuration check
- `/api/test/email` - Email service check
- `/api/test/kv` - Vercel KV check
- `/api/test/blob` - Vercel Blob check
- `/api/test/stripe` - Stripe configuration check
- `/api/test/database` - Database connectivity check

## 🚀 Deployment Checklist

Before going to production:

- [ ] All required environment variables are set
- [ ] Test endpoints return success (200 OK)
- [ ] Domain is configured for email service
- [ ] Stripe webhook is properly configured
- [ ] OAuth redirect URLs are correct
- [ ] Database migrations are applied
- [ ] Application builds successfully

```bash
# Final deployment
vercel --prod
```

## 💡 Troubleshooting

### Common Issues:

1. **Environment variable not found**
   - Check spelling and case sensitivity
   - Ensure variable is set for correct environment
   - Try `vercel env pull` to sync locally

2. **API key invalid**
   - Regenerate API key in service dashboard
   - Check for any leading/trailing spaces
   - Verify key has proper permissions

3. **Webhook not working**
   - Check endpoint URL is correct
   - Verify webhook secret matches
   - Check service dashboard for delivery logs

4. **OAuth redirect errors**
   - Ensure redirect URLs match exactly
   - Check protocol (http vs https)
   - Verify client IDs and secrets

For more detailed setup instructions, see: `EXTERNAL_SERVICES_SETUP.md`
