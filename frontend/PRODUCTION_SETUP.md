# 🚀 Production Infrastructure Setup - Vercel + Supabase

This guide walks you through setting up the production infrastructure for AI Promote Hub using Vercel and Supabase.

## ✅ Prerequisites

- [x] Vercel account
- [x] Supabase account  
- [x] Domain name (optional but recommended)
- [x] Sentry account for error tracking
- [x] Resend account for email services

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Create Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Choose organization and set project details
```

### 1.2 Set up Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified TIMESTAMPTZ,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (for OAuth)
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
```

### 1.3 Configure Environment Variables
Copy the following from your Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## 🌐 Step 2: Vercel Deployment Setup

### 2.1 Install and Login to Vercel CLI
```bash
# If not already installed
npm i -g vercel

# Login to your account
vercel login
```

### 2.2 Initialize Vercel Project
```bash
# In your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your team/personal)
# - Link to existing project? N (for new) or Y (for existing)
# - What's your project's name? ai-promote-hub
# - In which directory is your code located? ./
```

### 2.3 Configure Environment Variables
```bash
# Set environment variables via Vercel dashboard or CLI
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GITHUB_CLIENT_ID production
vercel env add GITHUB_CLIENT_SECRET production
vercel env add RESEND_API_KEY production
vercel env add FROM_EMAIL production
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_ORG production
vercel env add SENTRY_PROJECT production
vercel env add SENTRY_AUTH_TOKEN production
```

## 📦 Step 3: Vercel KV Setup (Redis Replacement)

### 3.1 Create KV Database
```bash
# Via Vercel dashboard
# Go to Storage → Create Database → KV
# Or via CLI
vercel kv create ai-promote-hub-kv
```

### 3.2 Link KV to Project
```bash
# This will automatically add KV environment variables
vercel kv link
```

## 📁 Step 4: Vercel Blob Setup (File Storage)

### 4.1 Enable Blob Storage
```bash
# Go to Vercel dashboard → Storage → Create Store → Blob
# Or via CLI (if available)
vercel blob create ai-promote-hub-storage
```

### 4.2 Configure Blob Environment Variables
The following variables will be automatically added:
- `BLOB_READ_WRITE_TOKEN`

## 🔧 Step 5: OAuth Providers Setup

### 5.1 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`

### 5.2 GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - `https://your-domain.vercel.app/api/auth/callback/github`

## 📧 Step 6: Email Service Setup (Resend)

### 6.1 Create Resend Account
1. Go to [Resend](https://resend.com/)
2. Create account and get API key
3. Add domain (optional but recommended for production)

### 6.2 Configure DNS (if using custom domain)
Add the following DNS records:
```
TXT @ "resend-domain-verification=your-verification-code"
MX @ "feedback-smtp.resend.dev" (priority 10)
```

## 🐛 Step 7: Error Tracking Setup (Sentry)

### 7.1 Create Sentry Project
1. Go to [Sentry](https://sentry.io/)
2. Create new project
3. Choose Next.js platform
4. Get DSN and project details

### 7.2 Configure Sentry Environment Variables
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## 📈 Step 8: Analytics Setup

### 8.1 Enable Vercel Analytics
```bash
# Analytics are automatically included with @vercel/analytics package
# Set environment variable
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS 1 production
```

## 🚀 Step 9: Deploy to Production

### 9.1 Deploy Application
```bash
# Deploy to production
vercel --prod

# Or set up automatic deployments via GitHub integration
# Connect your repository in Vercel dashboard
```

### 9.2 Set Up Domain (Optional)
```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS
# Add A record: @ → 76.76.19.61
# Add CNAME record: www → cname.vercel-dns.com
```

## 🔒 Step 10: Security Configuration

### 10.1 Environment Variables Security
- Never commit `.env` files to version control
- Use Vercel's environment variable dashboard
- Rotate secrets regularly

### 10.2 Database Security
- Enable Row Level Security (RLS) in Supabase
- Configure proper authentication policies
- Monitor access logs

### 10.3 HTTPS and Security Headers
- Vercel automatically provides HTTPS
- Security headers are configured in `next.config.js`
- CSP headers can be added for additional security

## 📊 Step 11: Monitoring and Maintenance

### 11.1 Set Up Monitoring
- Monitor application performance in Vercel dashboard
- Track errors in Sentry
- Monitor database performance in Supabase

### 11.2 Backup Strategy
- Supabase automatically backs up your database
- Consider additional backup strategies for critical data
- Test restore procedures regularly

### 11.3 Regular Maintenance Tasks
- Update dependencies regularly
- Monitor error logs
- Review and rotate API keys
- Check performance metrics

## 🎯 Step 12: Optimization

### 12.1 Performance Optimization
- Enable Vercel Analytics
- Monitor Core Web Vitals
- Optimize images using Next.js Image component
- Use Vercel's Edge Functions for better performance

### 12.2 Cost Optimization
- Monitor usage in Vercel dashboard
- Optimize database queries
- Use caching effectively with Vercel KV
- Review and optimize Blob storage usage

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Verify variables are set for the correct environment
   - Redeploy after adding new variables

2. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify Supabase project is active
   - Check network connectivity

3. **OAuth Issues**
   - Verify callback URLs are correct
   - Check client ID and secret
   - Ensure OAuth apps are active

4. **Email Delivery Issues**
   - Verify Resend API key
   - Check domain verification
   - Review email templates

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Sentry Documentation](https://docs.sentry.io)

---

## ✅ Production Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Vercel project set up
- [ ] Environment variables configured
- [ ] Vercel KV database created
- [ ] Vercel Blob storage enabled
- [ ] OAuth providers configured
- [ ] Email service set up
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Custom domain configured (optional)
- [ ] Security headers enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place

Your production infrastructure is now ready! 🎉
