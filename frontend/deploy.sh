#!/bin/bash

# 🚀 AI Promote Hub - Production Deployment Script
# This script handles the deployment process to Vercel with proper checks

set -e

echo "🚀 AI Promote Hub - Production Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Check if we're logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️ You're not logged into Vercel${NC}"
    echo "Please run: vercel login"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checks${NC}"

# Check for required environment variables template
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}⚠️ .env.example not found${NC}"
    echo "Consider creating one to document required environment variables"
fi

# Check for critical files
CRITICAL_FILES=(
    "next.config.js"
    "vercel.json"
    "src/lib/supabase.ts"
    "src/lib/auth-config.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Critical file missing: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All critical files found${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies${NC}"
npm ci

# Run type checking
echo -e "${BLUE}🔍 Running type checks${NC}"
if npm run type-check; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    echo "Fix type errors before deploying"
    exit 1
fi

# Run linting
echo -e "${BLUE}🧹 Running linter${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️ Linting issues found${NC}"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Run tests (if available)
if npm run test --if-present > /dev/null 2>&1; then
    echo -e "${BLUE}🧪 Running tests${NC}"
    if npm test; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed${NC}"
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled"
            exit 1
        fi
    fi
fi

# Build the application
echo -e "${BLUE}🏗️ Building application${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Fix build errors before deploying"
    exit 1
fi

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel${NC}"

# Ask for deployment environment
echo "Select deployment environment:"
echo "1) Preview (development)"
echo "2) Production"
read -p "Enter choice (1-2): " -n 1 -r
echo

case $REPLY in
    1)
        echo -e "${YELLOW}🔄 Deploying to preview environment${NC}"
        DEPLOY_RESULT=$(vercel --json)
        ;;
    2)
        echo -e "${GREEN}🔄 Deploying to production${NC}"
        echo -e "${RED}⚠️ This will deploy to production!${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled"
            exit 1
        fi
        DEPLOY_RESULT=$(vercel --prod --json)
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Parse deployment result
if [ $? -eq 0 ]; then
    DEPLOY_URL=$(echo $DEPLOY_RESULT | jq -r '.url')
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${BLUE}🌐 URL: https://$DEPLOY_URL${NC}"
    
    # Copy URL to clipboard if available
    if command -v pbcopy &> /dev/null; then
        echo "https://$DEPLOY_URL" | pbcopy
        echo "📋 URL copied to clipboard"
    elif command -v xclip &> /dev/null; then
        echo "https://$DEPLOY_URL" | xclip -selection clipboard
        echo "📋 URL copied to clipboard"
    fi
    
    # Open in browser (optional)
    read -p "Open deployment in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "https://$DEPLOY_URL"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://$DEPLOY_URL"
        else
            echo "Please open https://$DEPLOY_URL in your browser"
        fi
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo "Next steps:"
echo "1. Test your application thoroughly"
echo "2. Monitor error tracking in Sentry"
echo "3. Check performance in Vercel Analytics"
echo "4. Verify email functionality"
echo "5. Test authentication flows"

echo
echo -e "${BLUE}📚 Useful commands:${NC}"
echo "vercel logs                 - View deployment logs"
echo "vercel env ls              - List environment variables"
echo "vercel domains             - Manage custom domains"
echo "vercel --help              - View all Vercel CLI options"
