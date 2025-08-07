#!/bin/bash

# Master Production Setup Script for AI Promote
# This script orchestrates the complete setup process for production deployment

set -e

echo "🚀 AI Promote - Production Setup Master Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SETUP_LOG="setup-$(date +"%Y%m%d_%H%M%S").log"
CURRENT_STEP=1
TOTAL_STEPS=7

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$SETUP_LOG"
}

# Function to display step header
step_header() {
    echo ""
    echo -e "${PURPLE}=================================================${NC}"
    echo -e "${PURPLE}Step $CURRENT_STEP/$TOTAL_STEPS: $1${NC}"
    echo -e "${PURPLE}=================================================${NC}"
    log "Starting Step $CURRENT_STEP: $1"
    ((CURRENT_STEP++))
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    step_header "Prerequisites Check"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js 18+")
    else
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        fi
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    # Check git
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    # Check if we can install Vercel CLI
    if ! command_exists vercel; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    # Check if Supabase CLI is available
    echo -e "${BLUE}Checking Supabase CLI availability...${NC}"
    npx supabase@latest --version > /dev/null 2>&1
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}Missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "${RED}  - $dep${NC}"
        done
        echo -e "${RED}Please install missing dependencies and run this script again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites satisfied!${NC}"
    log "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    step_header "Environment Configuration"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        if [ -f ".env.production.example" ]; then
            echo -e "${YELLOW}Creating .env.production from example...${NC}"
            cp .env.production.example .env.production
            echo -e "${YELLOW}⚠️  Please edit .env.production with your actual values before continuing!${NC}"
            echo -e "${YELLOW}Required values include:${NC}"
            echo "  - Database credentials from Supabase"
            echo "  - Redis credentials from Upstash"  
            echo "  - API keys for OpenAI/Anthropic"
            echo "  - Generated secrets for JWT, encryption, etc."
            echo ""
            read -p "Press Enter when you have updated .env.production with real values..."
        else
            echo -e "${RED}No .env.production.example found. Creating basic template...${NC}"
            cat > .env.production << 'EOF'
# Production Environment Variables
# Please fill in all values before proceeding

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT]:6380

# Authentication
JWT_SECRET=[GENERATE_JWT_SECRET]
NEXTAUTH_SECRET=[GENERATE_NEXTAUTH_SECRET]
NEXTAUTH_URL=https://[YOUR_DOMAIN].vercel.app

# AI Services
OPENAI_API_KEY=[YOUR_OPENAI_KEY]
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_KEY]

# Security
ENCRYPTION_KEY=[32_CHAR_HEX_KEY]
SESSION_SECRET=[GENERATE_SESSION_SECRET]
EOF
            echo -e "${RED}Created basic .env.production template. Please fill in all values!${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Environment configuration ready!${NC}"
    log "Environment setup completed"
}

# Function to generate secrets
generate_secrets() {
    step_header "Generate Security Secrets"
    
    echo -e "${BLUE}Generating secure secrets...${NC}"
    
    if command_exists openssl; then
        echo ""
        echo -e "${CYAN}Generated secrets (save these securely):${NC}"
        echo -e "${CYAN}=====================================5${NC}"
        echo -e "${YELLOW}JWT_SECRET=${NC}$(openssl rand -base64 32)"
        echo -e "${YELLOW}NEXTAUTH_SECRET=${NC}$(openssl rand -base64 32)"
        echo -e "${YELLOW}ENCRYPTION_KEY=${NC}$(openssl rand -hex 32)"
        echo -e "${YELLOW}SESSION_SECRET=${NC}$(openssl rand -base64 48)"
        echo -e "${YELLOW}WEBHOOK_SECRET=${NC}$(openssl rand -base64 32)"
        echo ""
        
        # Save to file for reference
        cat > generated-secrets.txt << EOF
# Generated secrets for production deployment
# Generated on: $(date)
# IMPORTANT: Add these to your .env.production file

JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -base64 48)
WEBHOOK_SECRET=$(openssl rand -base64 32)

# Delete this file after copying the secrets to .env.production
EOF
        
        echo -e "${GREEN}Secrets saved to generated-secrets.txt${NC}"
        echo -e "${YELLOW}⚠️  Copy these secrets to your .env.production file${NC}"
        echo -e "${YELLOW}⚠️  Delete generated-secrets.txt after copying${NC}"
        echo ""
        read -p "Press Enter when you have updated .env.production with the generated secrets..."
    else
        echo -e "${YELLOW}OpenSSL not found. Please generate secrets manually:${NC}"
        echo "You can use online tools or other methods to generate secure random strings"
        echo "Required lengths:"
        echo "  - JWT_SECRET: 32+ characters"
        echo "  - NEXTAUTH_SECRET: 32+ characters"
        echo "  - ENCRYPTION_KEY: 64 hex characters (32 bytes)"
        echo "  - SESSION_SECRET: 48+ characters"
    fi
    
    echo -e "${GREEN}✅ Security secrets generated!${NC}"
    log "Security secrets generated"
}

# Function to setup database
setup_database() {
    step_header "Database Setup (Supabase)"
    
    echo -e "${BLUE}Setting up production database...${NC}"
    
    # Check if setup script exists
    if [ -f "scripts/setup-production-db.sh" ]; then
        echo -e "${CYAN}Running database setup script...${NC}"
        bash scripts/setup-production-db.sh all
    else
        echo -e "${YELLOW}Database setup script not found. Please follow manual setup:${NC}"
        echo "1. Go to https://app.supabase.com"
        echo "2. Create a new project named 'aipromotdb-prod'"
        echo "3. Get your connection strings and API keys"
        echo "4. Update your .env.production file"
        echo "5. Run database migrations manually"
        echo ""
        read -p "Press Enter when you have completed the database setup..."
    fi
    
    echo -e "${GREEN}✅ Database setup completed!${NC}"
    log "Database setup completed"
}

# Function to setup Redis
setup_redis() {
    step_header "Redis Setup (Upstash)"
    
    echo -e "${BLUE}Setting up Redis cache and queues...${NC}"
    
    # Check if setup script exists
    if [ -f "scripts/setup-redis.sh" ]; then
        echo -e "${CYAN}Running Redis setup script...${NC}"
        bash scripts/setup-redis.sh all
    else
        echo -e "${YELLOW}Redis setup script not found. Please follow manual setup:${NC}"
        echo "1. Go to https://console.upstash.com"
        echo "2. Create a new Redis database named 'aipromotdb-redis-prod'"
        echo "3. Get your connection URL and credentials"
        echo "4. Update your .env.production file"
        echo ""
        read -p "Press Enter when you have completed the Redis setup..."
    fi
    
    echo -e "${GREEN}✅ Redis setup completed!${NC}"
    log "Redis setup completed"
}

# Function to deploy to production
deploy_to_production() {
    step_header "Production Deployment (Vercel)"
    
    echo -e "${BLUE}Deploying to production...${NC}"
    
    # Check if deployment script exists
    if [ -f "scripts/deploy-production.sh" ]; then
        echo -e "${CYAN}Running deployment script...${NC}"
        bash scripts/deploy-production.sh all
    else
        echo -e "${YELLOW}Deployment script not found. Running manual deployment:${NC}"
        
        # Manual deployment steps
        echo "1. Initializing Vercel project..."
        vercel link --confirm
        
        echo "2. Building application..."
        npm run build
        
        echo "3. Deploying to production..."
        vercel --prod --confirm
    fi
    
    echo -e "${GREEN}✅ Production deployment completed!${NC}"
    log "Production deployment completed"
}

# Function to run post-deployment verification
verify_deployment() {
    step_header "Post-Deployment Verification"
    
    echo -e "${BLUE}Verifying deployment...${NC}"
    
    # Get deployment URL
    deployment_url=$(vercel ls 2>/dev/null | grep -o 'https://[^[:space:]]*\.vercel\.app' | head -1)
    
    if [ -z "$deployment_url" ]; then
        read -p "Enter your deployment URL: " deployment_url
    fi
    
    echo -e "${CYAN}Testing deployment at: $deployment_url${NC}"
    
    # Wait for deployment to be ready
    echo "Waiting 30 seconds for deployment to stabilize..."
    sleep 30
    
    # Test health endpoint
    echo "Testing health endpoint..."
    if command_exists curl; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$deployment_url/api/health" || echo "000")
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ Health endpoint responding correctly${NC}"
        else
            echo -e "${YELLOW}⚠️  Health endpoint returned status: $response${NC}"
        fi
    else
        echo -e "${YELLOW}curl not available. Please manually test: $deployment_url/api/health${NC}"
    fi
    
    echo -e "${GREEN}✅ Deployment verification completed!${NC}"
    log "Deployment verification completed"
}

# Function to display final summary
display_summary() {
    echo ""
    echo -e "${GREEN}🎉 Production Setup Completed Successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    
    # Get deployment info
    deployment_url=$(vercel ls 2>/dev/null | grep -o 'https://[^[:space:]]*\.vercel\.app' | head -1)
    
    if [ ! -z "$deployment_url" ]; then
        echo -e "${CYAN}🌐 Your application is live at:${NC}"
        echo -e "${BLUE}   $deployment_url${NC}"
        echo ""
        echo -e "${CYAN}📊 Health check endpoints:${NC}"
        echo -e "${BLUE}   $deployment_url/api/health${NC}"
        echo -e "${BLUE}   $deployment_url/api/health/database${NC}"
        echo -e "${BLUE}   $deployment_url/api/health/redis${NC}"
        echo ""
    fi
    
    echo -e "${CYAN}📚 Important resources:${NC}"
    echo -e "${BLUE}   • Vercel Dashboard: https://vercel.com/dashboard${NC}"
    echo -e "${BLUE}   • Supabase Dashboard: https://app.supabase.com${NC}"
    echo -e "${BLUE}   • Upstash Console: https://console.upstash.com${NC}"
    echo ""
    
    echo -e "${CYAN}🔧 Useful commands:${NC}"
    echo -e "${BLUE}   • View logs: vercel logs${NC}"
    echo -e "${BLUE}   • Check env vars: vercel env ls${NC}"
    echo -e "${BLUE}   • Rollback: vercel rollback${NC}"
    echo ""
    
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Test all application features thoroughly"
    echo "2. Set up monitoring and alerting"
    echo "3. Configure custom domain (if needed)"
    echo "4. Set up SSL certificates (handled by Vercel)"
    echo "5. Review security settings and secrets"
    echo "6. Set up backup procedures"
    echo "7. Monitor performance metrics"
    echo ""
    
    echo -e "${YELLOW}🔒 Security reminders:${NC}"
    echo "• Delete generated-secrets.txt after copying secrets"
    echo "• Never commit .env.production to version control"
    echo "• Rotate secrets regularly (quarterly)"
    echo "• Monitor access logs and unusual activity"
    echo ""
    
    echo -e "${CYAN}📝 Setup log saved to: $SETUP_LOG${NC}"
    log "Production setup completed successfully"
}

# Function to handle cleanup on exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}Setup failed with exit code $exit_code${NC}"
        echo -e "${YELLOW}Check $SETUP_LOG for detailed logs${NC}"
        log "Setup failed with exit code $exit_code"
    fi
}

# Function to show help
show_help() {
    echo "AI Promote - Production Setup Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --skip-deps         Skip dependency checks"
    echo "  --env-only          Only setup environment and secrets"
    echo "  --db-only           Only setup database"
    echo "  --redis-only        Only setup Redis"
    echo "  --deploy-only       Only deploy to production"
    echo "  --verify-only       Only verify deployment"
    echo ""
    echo "Default: Run complete setup process"
}

# Main execution function
main() {
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Parse command line arguments
    case "${1:-}" in
        "--help"|"-h")
            show_help
            exit 0
            ;;
        "--skip-deps")
            echo -e "${YELLOW}Skipping dependency checks...${NC}"
            ;;
        "--env-only")
            setup_environment
            generate_secrets
            exit 0
            ;;
        "--db-only")
            setup_database
            exit 0
            ;;
        "--redis-only")
            setup_redis
            exit 0
            ;;
        "--deploy-only")
            deploy_to_production
            exit 0
            ;;
        "--verify-only")
            verify_deployment
            exit 0
            ;;
    esac
    
    # Start setup log
    log "Starting AI Promote production setup"
    
    echo -e "${CYAN}This script will guide you through setting up AI Promote for production.${NC}"
    echo -e "${CYAN}The process includes:${NC}"
    echo "  1. Prerequisites check"
    echo "  2. Environment configuration"
    echo "  3. Security secrets generation"
    echo "  4. Database setup (Supabase)"
    echo "  5. Redis setup (Upstash)"
    echo "  6. Production deployment (Vercel)"
    echo "  7. Post-deployment verification"
    echo ""
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
    
    # Run setup steps
    if [[ "${1:-}" != "--skip-deps" ]]; then
        check_prerequisites
    fi
    
    setup_environment
    generate_secrets
    setup_database
    setup_redis
    deploy_to_production
    verify_deployment
    display_summary
    
    echo -e "${GREEN}🚀 Production setup completed successfully!${NC}"
}

# Run main function with all arguments
main "$@"
