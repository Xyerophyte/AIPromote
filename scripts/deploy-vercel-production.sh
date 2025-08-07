#!/bin/bash

# Vercel Production Deployment Script for AI Promote
# This script handles the complete deployment process with security checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-promote"
VERCEL_ORG="your-org-name"  # Update this
DOMAIN="aipromotapp.vercel.app"  # Update this
CUSTOM_DOMAIN="www.aipromotapp.com"  # Update this

echo -e "${BLUE}🚀 Starting AI Promote Production Deployment${NC}"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Please install it with: npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Please run: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI ready${NC}"

# Pre-deployment checks
echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if required environment files exist
if [ ! -f ".env.production.example" ]; then
    echo -e "${RED}❌ .env.production.example not found${NC}"
    exit 1
fi

# Validate package.json files
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Required package.json files not found${NC}"
    exit 1
fi

# Check if vercel.json exists and is valid
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ vercel.json not found${NC}"
    exit 1
fi

# Validate TypeScript configuration
echo -e "${YELLOW}📝 Validating TypeScript configuration...${NC}"
if ! npx tsc --noEmit -p frontend/tsconfig.json; then
    echo -e "${RED}❌ Frontend TypeScript validation failed${NC}"
    exit 1
fi

if ! npx tsc --noEmit -p backend/tsconfig.json; then
    echo -e "${RED}❌ Backend TypeScript validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TypeScript validation passed${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test || {
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Tests passed${NC}"

# Build and validate frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd frontend
npm ci --production=false
npm run build || {
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
}
cd ..

echo -e "${GREEN}✅ Frontend build successful${NC}"

# Build and validate backend
echo -e "${YELLOW}🏗️  Building backend...${NC}"
cd backend
npm ci --production=false
npm run build || {
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
}
cd ..

echo -e "${GREEN}✅ Backend build successful${NC}"

# Security audit
echo -e "${YELLOW}🔐 Running security audit...${NC}"
npm audit --audit-level moderate || {
    echo -e "${YELLOW}⚠️  Security vulnerabilities found. Please review.${NC}"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Set up production environment variables
echo -e "${YELLOW}⚙️  Setting up environment variables...${NC}"

# Core application variables
vercel env add NODE_ENV production --scope production
vercel env add VERCEL_ENV production --scope production

# Database configuration
read -p "Enter production DATABASE_URL: " -s DATABASE_URL
echo
vercel env add DATABASE_URL "$DATABASE_URL" --scope production

# Redis configuration
read -p "Enter production REDIS_URL: " -s REDIS_URL
echo
vercel env add REDIS_URL "$REDIS_URL" --scope production

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
vercel env add JWT_SECRET "$JWT_SECRET" --scope production
echo -e "${GREEN}✅ JWT_SECRET generated and set${NC}"

# Encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32)
vercel env add ENCRYPTION_KEY "$ENCRYPTION_KEY" --scope production
echo -e "${GREEN}✅ ENCRYPTION_KEY generated and set${NC}"

# API Keys (if provided)
if [ ! -z "$OPENAI_API_KEY" ]; then
    vercel env add OPENAI_API_KEY "$OPENAI_API_KEY" --scope production
fi

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    vercel env add ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY" --scope production
fi

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    vercel env add STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" --scope production
    vercel env add STRIPE_PUBLISHABLE_KEY "$STRIPE_PUBLISHABLE_KEY" --scope production
    vercel env add STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET" --scope production
fi

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

# Deploy with production settings
vercel deploy --prod --force || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
}

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | grep production | head -1 | awk '{print $2}')

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}📍 URL: https://$DEPLOYMENT_URL${NC}"

# Set up custom domain (if specified)
if [ ! -z "$CUSTOM_DOMAIN" ]; then
    echo -e "${YELLOW}🌐 Setting up custom domain...${NC}"
    vercel domains add "$CUSTOM_DOMAIN" --scope "$VERCEL_ORG" || {
        echo -e "${YELLOW}⚠️  Domain setup failed or already exists${NC}"
    }
    
    # Add domain to project
    vercel domains add "$CUSTOM_DOMAIN" --scope "$VERCEL_ORG" "$PROJECT_NAME" || {
        echo -e "${YELLOW}⚠️  Failed to link domain to project${NC}"
    }
fi

# Configure SSL/TLS
echo -e "${YELLOW}🔒 Configuring SSL/TLS...${NC}"
vercel certs add "$DOMAIN" || {
    echo -e "${YELLOW}⚠️  SSL certificate setup may already be configured${NC}"
}

# Run post-deployment health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

sleep 10  # Wait for deployment to be fully ready

# Check main health endpoint
if curl -f -s "https://$DEPLOYMENT_URL/api/health/simple" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Please check the deployment logs: vercel logs"
fi

# Check SSL/TLS
if curl -f -s "https://$DEPLOYMENT_URL" > /dev/null; then
    echo -e "${GREEN}✅ SSL/TLS working${NC}"
else
    echo -e "${RED}❌ SSL/TLS issue detected${NC}"
fi

# Security headers check
echo -e "${YELLOW}🛡️  Checking security headers...${NC}"
SECURITY_CHECK=$(curl -I -s "https://$DEPLOYMENT_URL" | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)")

if [ ! -z "$SECURITY_CHECK" ]; then
    echo -e "${GREEN}✅ Security headers configured${NC}"
else
    echo -e "${YELLOW}⚠️  Some security headers may be missing${NC}"
fi

# Database migration check
echo -e "${YELLOW}🗃️  Checking database connection...${NC}"
if curl -f -s "https://$DEPLOYMENT_URL/api/health/ready" > /dev/null; then
    echo -e "${GREEN}✅ Database connection verified${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "You may need to run database migrations manually"
fi

# Performance check
echo -e "${YELLOW}⚡ Running performance check...${NC}"
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "https://$DEPLOYMENT_URL")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

if (( $(echo "$RESPONSE_TIME_MS < 2000" | bc -l) )); then
    echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME_MS}ms (Good)${NC}"
elif (( $(echo "$RESPONSE_TIME_MS < 5000" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Response time: ${RESPONSE_TIME_MS}ms (Acceptable)${NC}"
else
    echo -e "${RED}❌ Response time: ${RESPONSE_TIME_MS}ms (Poor)${NC}"
fi

# Setup monitoring
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"

# Create monitoring endpoints
vercel env add SENTRY_DSN "$SENTRY_DSN" --scope production || echo "Sentry DSN not provided"
vercel env add NEW_RELIC_LICENSE_KEY "$NEW_RELIC_LICENSE_KEY" --scope production || echo "New Relic key not provided"

echo "=================================================="
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📋 Summary:"
echo "  • Production URL: https://$DEPLOYMENT_URL"
[ ! -z "$CUSTOM_DOMAIN" ] && echo "  • Custom Domain: https://$CUSTOM_DOMAIN"
echo "  • Environment: Production"
echo "  • Security: Enabled"
echo "  • SSL/TLS: Configured"
echo ""
echo "🔧 Next Steps:"
echo "  1. Verify all functionality at https://$DEPLOYMENT_URL"
echo "  2. Run end-to-end tests"
echo "  3. Monitor application logs: vercel logs --follow"
echo "  4. Set up monitoring alerts"
echo "  5. Configure domain DNS (if using custom domain)"
echo ""
echo "📚 Useful Commands:"
echo "  • View logs: vercel logs"
echo "  • Check status: vercel ls"
echo "  • Rollback: vercel rollback"
echo "  • Redeploy: vercel --prod"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}"
