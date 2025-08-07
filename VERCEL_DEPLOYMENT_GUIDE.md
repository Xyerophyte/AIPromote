# 🚀 AIPromote Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Set up production PostgreSQL (Vercel Postgres recommended)
4. **Redis**: Set up production Redis (Upstash recommended)

## 🗄️ Step 1: Set Up Production Databases

### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database" → "Postgres"
3. Copy the `DATABASE_URL` connection string

### Option B: External PostgreSQL
- Use services like Railway, Supabase, or AWS RDS
- Ensure the database allows external connections

### Redis Setup (Upstash - Free Tier Available)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a Redis database
3. Copy the `REDIS_URL` connection string

## 📤 Step 2: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel --prod

# Follow the prompts:
# - Link to existing project? No
# - What's your project's name? aipromotе
# - In which directory is your code located? ./
```

### Method 2: GitHub Integration
1. Push your code to GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave empty (monorepo setup)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty

## ⚙️ Step 3: Configure Environment Variables

### In Vercel Dashboard:
1. Go to your project → "Settings" → "Environment Variables"
2. Add these variables for **Production**:

```env
# Essential Variables (Required)
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=your-production-database-url
REDIS_URL=your-production-redis-url
NODE_ENV=production

# Generate secure secrets (use tools like: openssl rand -base64 32)
JWT_SECRET=your-secure-jwt-secret-here
NEXTAUTH_SECRET=your-secure-nextauth-secret-here

# Domain Configuration (Update after deployment)
NEXT_PUBLIC_API_URL=https://your-project-name.vercel.app
NEXTAUTH_URL=https://your-project-name.vercel.app
CORS_ORIGINS=https://your-project-name.vercel.app
```

### Generate Secure Secrets:
```bash
# Generate JWT Secret
openssl rand -base64 64

# Generate NextAuth Secret  
openssl rand -base64 32
```

## 🔄 Step 4: Database Migration

After deployment, run database migration:

### Option A: Using Vercel CLI
```bash
# Connect to your deployed project
vercel env pull .env.production

# Run Prisma migration
npx prisma db push --schema=backend/prisma/schema.prisma
```

### Option B: Using GitHub Actions (Automated)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma db push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🌐 Step 5: Custom Domain (Optional)

1. In Vercel Dashboard → "Domains"
2. Add your custom domain
3. Update environment variables with new domain:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_API_URL` 
   - `CORS_ORIGINS`

## 🔍 Step 6: Verify Deployment

### Test Endpoints:
- **Frontend**: `https://your-project.vercel.app`
- **API Health**: `https://your-project.vercel.app/api/health`
- **API Info**: `https://your-project.vercel.app/api/v1`

### Check Logs:
```bash
# View function logs
vercel logs

# View build logs
vercel logs --build
```

## 🚨 Important Notes

### Vercel Limitations:
- **Function Timeout**: 10 seconds (Hobby), 15 minutes (Pro)
- **Memory Limit**: 1GB (Hobby), 3GB (Pro)
- **File Size**: 50MB limit per function

### Database Considerations:
- Use connection pooling for PostgreSQL
- Consider using Prisma Data Platform for better performance
- Monitor connection limits

### Redis Considerations:
- Use Redis for caching, not as primary database
- Configure appropriate TTL values
- Monitor memory usage

## 🔧 Troubleshooting

### Build Errors:
```bash
# Check build logs
vercel logs --build

# Test build locally
npm run build
```

### Runtime Errors:
```bash
# Check function logs
vercel logs

# Test functions locally
vercel dev
```

### Database Connection Issues:
- Verify DATABASE_URL is correct
- Check if database allows external connections
- Test connection locally with production URL

### Common Issues:
1. **Module not found**: Ensure all dependencies are in `package.json`
2. **Timeout errors**: Optimize database queries
3. **Memory issues**: Reduce bundle size, optimize images

## 📊 Monitoring & Analytics

### Built-in Monitoring:
- Vercel Dashboard provides automatic analytics
- Function performance metrics
- Error tracking and logs

### External Monitoring (Recommended):
- **Sentry**: Error tracking
- **LogRocket**: User session replay  
- **DataDog**: Application monitoring

## 🔄 Continuous Deployment

### Automatic Deployment:
- Push to `main` branch triggers deployment
- Pull request previews available
- Environment-specific deployments

### Manual Deployment:
```bash
# Deploy specific branch
vercel --prod --confirm

# Deploy with specific environment
vercel --prod --env DATABASE_URL=custom-url
```

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes before production
2. **Monitor Performance**: Watch function execution times
3. **Optimize Bundle Size**: Use dynamic imports
4. **Cache Static Assets**: Configure proper caching headers
5. **Use Environment Variables**: Never hardcode secrets

## 🎉 Success!

Your AIPromote application should now be live on Vercel! 

### Next Steps:
- Set up monitoring and alerts
- Configure custom domain
- Add additional integrations
- Scale database as needed

**Your production URL**: `https://your-project-name.vercel.app` 🚀
