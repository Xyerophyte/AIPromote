# Vercel Deployment Quick Start 🚀

## Quick Setup (5 minutes)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Initialize Project
```bash
vercel
```
Follow the prompts to link your project.

### 4. Set Environment Variables

**Required** (Set these in Vercel Dashboard → Settings → Environment Variables):
```bash
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app  
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
DATABASE_URL=your-database-connection-string
```

### 5. Deploy!
```bash
# Preview deployment
npm run deploy:preview

# Production deployment  
npm run deploy:production
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy:check` | Validate environment & run pre-checks |
| `npm run deploy:preview` | Deploy to preview environment |
| `npm run deploy:production` | Deploy to production |
| `npm run deploy:status` | Check deployment status |
| `npm run vercel:env` | List environment variables |
| `npm run vercel:logs` | View deployment logs |

## Configuration Files

✅ `vercel.json` - Main Vercel configuration  
✅ `.vercelignore` - Files to exclude from deployment  
✅ `scripts/deploy.js` - Deployment helper script  
✅ `docs/VERCEL_DEPLOYMENT.md` - Complete deployment guide  

## Key Features Configured

- ⚡ Next.js 15 framework preset
- 🔒 CORS headers for API routes  
- 🎯 Serverless functions (30s timeout)
- 📦 Optimized caching (static assets, images)
- 🛡️ Security headers (CSP, XSS protection)
- 🌐 Preview deployments for feature branches
- 📊 Built-in analytics and monitoring
- ⏰ Cron jobs support

## Environment-Specific Deployments

- **main** branch → Production
- **staging** branch → Staging environment  
- **feature/** branches → Preview deployments
- **hotfix/** branches → Priority previews

## Next Steps

1. Set up your environment variables in Vercel dashboard
2. Push code to trigger automatic deployments
3. Configure custom domain (optional)
4. Set up monitoring and alerts
5. Review performance metrics in Vercel dashboard

## Need Help?

- 📖 [Complete Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
- 🔧 [Vercel CLI Documentation](https://vercel.com/docs/cli)
- 💬 [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Pro Tip**: Always test with `npm run deploy:preview` before deploying to production! 🎯
