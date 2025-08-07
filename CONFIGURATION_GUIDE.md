# AIPromote Configuration Guide

## 🚀 Quick Start (Your App is Already Running!)

Your AIPromote application is currently running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on port 5432
- **Redis Cache**: Redis on port 6379

## 📋 Essential Configuration Steps

### 1. **Basic Application Access** ✅ COMPLETE
Your application is already running! Open your browser and visit http://localhost:3000

### 2. **Core Features Configuration** ⚠️ REQUIRED

To enable all features, you need to configure these API keys in your `.env` file:

#### **AI Services (Required for core functionality)**
```env
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here

# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-key-here
```

#### **Authentication (Recommended)**
```env
# For Google OAuth - Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# For email authentication
EMAIL_SERVER_USER=your-gmail@gmail.com
EMAIL_SERVER_PASSWORD=your-gmail-app-password
```

#### **Social Media Integration (Optional)**
```env
# For Twitter/X posting - Get from: https://developer.twitter.com/
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# For LinkedIn posting - Get from: https://www.linkedin.com/developers/
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

#### **Payment Processing (Optional)**
```env
# For subscription billing - Get from: https://dashboard.stripe.com/
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

#### **File Storage (Optional)**
```env
# For image/media uploads - Get from: https://aws.amazon.com/s3/
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### 3. **Development Commands**

```bash
# View application logs
docker logs aipromotfrontend
docker logs aipromotbackend

# Restart services after configuration changes
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Access database directly
docker exec -it aipromotdb psql -U user -d aipromotdb

# Run database migrations
docker exec aipromotbackend npx prisma db push

# View database in Prisma Studio
docker exec aipromotbackend npx prisma studio
```

## 🎯 What Works Right Now

### ✅ **Immediately Available**
- Frontend application interface
- Backend API endpoints
- Database with full schema
- Redis caching
- Health monitoring endpoints

### ⚙️ **Requires API Keys**
- AI content generation (needs OpenAI/Anthropic keys)
- Social media posting (needs Twitter/LinkedIn keys)
- User authentication (needs OAuth setup)
- Payment processing (needs Stripe keys)
- File uploads (needs AWS S3 setup)

## 🔧 Priority Configuration Order

### **Level 1 - Essential (Do This First)**
1. **OpenAI API Key** - For AI content generation
   - Visit: https://platform.openai.com/api-keys
   - Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`

### **Level 2 - User Experience**
2. **Google OAuth** - For user authentication
   - Visit: https://console.cloud.google.com/
   - Enable Google OAuth API
   - Add credentials to `.env`

### **Level 3 - Full Features**
3. **Social Media APIs** - For posting capabilities
4. **Stripe** - For billing/subscriptions
5. **AWS S3** - For file storage

## 🚨 Security Notes

### **For Production Deployment:**
1. Change all default passwords in `.env`
2. Generate strong JWT secrets
3. Use environment-specific database URLs
4. Set up proper CORS origins
5. Enable HTTPS
6. Use secure Redis passwords

### **Current Development Setup:**
- Database: `user:password@localhost:5432`
- Redis: `redispassword` 
- JWT Secret: Change in `.env` file

## 📱 Testing Your Setup

1. **Frontend Test**: Visit http://localhost:3000
2. **API Test**: Visit http://localhost:3001/health
3. **Database Test**: 
   ```bash
   docker exec aipromotbackend npx prisma db push
   ```

## 🆘 Troubleshooting

### **Application Won't Start?**
```bash
docker-compose down
docker-compose up --build -d
docker logs aipromotfrontend
docker logs aipromotbackend
```

### **Database Issues?**
```bash
docker exec aipromotbackend npx prisma db push
docker exec aipromotbackend npx prisma generate
```

### **Can't Access Frontend?**
- Check if port 3000 is available
- Ensure Docker containers are running: `docker ps`

## 📞 Need Help?
Your application is already running successfully! The main thing you need now is to add your API keys for the features you want to use.

**Start with OpenAI API key for AI content generation - that's the core feature!**
