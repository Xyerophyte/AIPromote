# 🗄️ AI Promote Hub - Supabase Setup Guide

This guide will walk you through setting up your Supabase backend infrastructure for AI Promote Hub.

## 📋 **Prerequisites**

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Access to your deployed Vercel application
- Basic understanding of SQL (optional - scripts are provided)

---

## 🚀 **Step 1: Create Supabase Project**

### 1.1 Create New Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Select your organization (or create one)
4. Fill in project details:
   - **Name**: `ai-promote-hub`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
5. Click **"Create new project"**

### 1.2 Wait for Deployment
- Project creation takes ~2 minutes
- You'll see a progress indicator
- Once complete, you'll see the project dashboard

---

## 🔧 **Step 2: Configure Database Schema**

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**

### 2.2 Run Database Setup Script
1. Copy the entire contents of `supabase-setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** (Ctrl/Cmd + Enter)
4. Wait for execution (~30 seconds)
5. You should see ✅ "Success. No rows returned"

### 2.3 Verify Tables Created
1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `campaigns`
   - `generated_content`
   - `content_analytics`
   - `usage_analytics`
   - `content_templates`
   - `social_accounts`
   - `audit_log`
   - `api_usage`

---

## 🔐 **Step 3: Configure Authentication**

### 3.1 Enable Auth Providers
1. Go to **Authentication** → **Settings** (left sidebar)
2. Under **Auth Providers**, enable:
   - **Email** (already enabled)
   - **Google OAuth** (recommended)
   - **GitHub OAuth** (optional)

### 3.2 Configure Google OAuth (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (if needed)
6. Set **Authorized redirect URIs**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**
8. In Supabase, paste them in Google OAuth settings
9. Click **Save**

### 3.3 Configure Site URL
1. In **Authentication** → **Settings**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/dashboard
   http://localhost:3000/auth/callback (for development)
   ```

---

## 🔑 **Step 4: Get API Keys**

### 4.1 Project API Keys
1. Go to **Settings** → **API** (left sidebar)
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: Your public anon key
   - **service_role**: Your private service role key (keep secret!)

### 4.2 Database Connection String
1. In **Settings** → **Database**
2. Copy **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with your database password

---

## ⚙️ **Step 5: Configure Vercel Environment Variables**

### 5.1 Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Select your `frontend` project
3. Go to **Settings** → **Environment Variables**

### 5.2 Add Supabase Variables
Add these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URLs
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-random-secret-here
```

### 5.3 OAuth Provider Keys (if configured)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 5.4 Generate Secure Secrets
For `NEXTAUTH_SECRET`, generate a secure random string:

**Option 1: Online Generator**
- Visit [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

**Option 2: Command Line**
```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
```

---

## 🔄 **Step 6: Redeploy Application**

### 6.1 Trigger Redeployment
1. In Vercel dashboard, go to **Deployments**
2. Click **"Redeploy"** on the latest deployment
3. Or push a small change to trigger auto-deployment

### 6.2 Verify Environment Variables
1. Check deployment logs for any errors
2. Environment variables are loaded during build
3. No restart needed - Vercel handles this automatically

---

## ✅ **Step 7: Test the Setup**

### 7.1 Test Database Connection
1. Visit your deployed app: `https://your-app.vercel.app`
2. Try to sign up with email
3. Check Supabase **Authentication** → **Users** for new user
4. Check **Table Editor** → **users** for profile creation

### 7.2 Test OAuth (if configured)
1. Try signing in with Google/GitHub
2. Verify user appears in both auth and users table

### 7.3 Test Basic Functionality
1. Navigate to dashboard after login
2. Try creating content (if implemented)
3. Check browser console for any errors

---

## 🛡️ **Step 8: Security Configuration**

### 8.1 Row Level Security (RLS)
- ✅ Already configured in setup script
- Users can only access their own data
- Public templates are visible to all users

### 8.2 API Rate Limiting (Optional)
1. In **Settings** → **API**
2. Configure rate limits if needed:
   - **Requests per hour**: 1000 (adjust based on usage)
   - **Database connections**: 25 (default is fine)

### 8.3 Security Best Practices
- ✅ Never expose `service_role` key in frontend code
- ✅ Use environment variables for all secrets
- ✅ Enable RLS on all tables
- ✅ Use secure, random secrets
- ✅ Configure proper redirect URLs

---

## 📊 **Step 9: Monitoring & Maintenance**

### 9.1 Monitor Usage
1. **Database** → **Usage** - Track database size/connections
2. **Settings** → **Billing** - Monitor costs
3. **API** → **Logs** - Check for errors

### 9.2 Database Backups
1. **Settings** → **Backups**
2. Automatic daily backups included in free tier
3. Hourly backups available on paid plans

### 9.3 Set Up Alerts (Recommended)
1. **Settings** → **Billing** → **Usage alerts**
2. Set alerts at 50% and 80% of limits
3. Monitor authentication errors in logs

---

## 🚨 **Troubleshooting**

### Common Issues:

**Authentication not working:**
- Check redirect URLs match exactly
- Verify Site URL is correct
- Ensure OAuth credentials are valid

**Database connection errors:**
- Verify DATABASE_URL is correct
- Check password has special characters properly encoded
- Ensure IP whitelist includes Vercel (usually auto-configured)

**RLS errors:**
- Verify policies are active
- Check user authentication status
- Review table permissions

**Environment variables not loading:**
- Redeploy after adding variables
- Check variable names match exactly
- Ensure no trailing spaces in values

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check Vercel deployment logs**
2. **Check Supabase logs** (Settings → Logs)
3. **Verify all environment variables** are set correctly
4. **Test in development** with localhost values first

---

## 🎉 **You're Done!**

Your AI Promote Hub now has:
- ✅ **Secure authentication** with email/OAuth
- ✅ **Production database** with proper schema
- ✅ **Row-level security** protecting user data  
- ✅ **Scalable infrastructure** ready for growth
- ✅ **Analytics tracking** for usage monitoring
- ✅ **Content management** system

Next steps:
1. **Test all functionality** thoroughly
2. **Set up additional OAuth providers** if needed
3. **Configure email templates** for auth flows
4. **Add your OpenAI API key** for content generation
5. **Set up monitoring alerts** for production

Your application is now ready for production use! 🚀
