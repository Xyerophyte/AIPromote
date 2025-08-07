#!/bin/bash

# Production Deployment Script for Vercel
# This script helps you deploy the application to production with all required configurations

set -e

echo "🚀 Deploying to Production with Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}Error: Vercel CLI is not installed${NC}"
        echo "Install with: npm install -g vercel"
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}Error: .env.production file not found${NC}"
        echo "Please create .env.production with your production environment variables"
        exit 1
    fi
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        echo -e "${YELLOW}Please login to Vercel...${NC}"
        vercel login
    fi
    
    echo -e "${GREEN}Prerequisites check passed!${NC}"
}

# Function to setup Vercel project
setup_vercel_project() {
    echo -e "${BLUE}Setting up Vercel project...${NC}"
    
    # Initialize Vercel project if not already done
    if [ ! -f ".vercel/project.json" ]; then
        echo "Initializing Vercel project..."
        vercel link --confirm
    fi
    
    echo -e "${GREEN}Vercel project setup completed!${NC}"
}

# Function to set environment variables in Vercel
setup_environment_variables() {
    echo -e "${BLUE}Setting up environment variables in Vercel...${NC}"
    
    # Load environment variables from .env.production
    while IFS='=' read -r key value; do
        # Skip empty lines and comments
        if [[ -z "$key" || "$key" =~ ^# ]]; then
            continue
        fi
        
        # Remove quotes from value
        value=$(echo "$value" | sed 's/^"//' | sed 's/"$//')
        
        # Skip placeholder values (values with brackets)
        if [[ "$value" =~ \[.*\] ]]; then
            echo -e "${YELLOW}Skipping placeholder variable: $key${NC}"
            continue
        fi
        
        echo "Setting environment variable: $key"
        vercel env add "$key" production <<< "$value"
        
    done < .env.production
    
    echo -e "${GREEN}Environment variables setup completed!${NC}"
}

# Function to build and deploy
deploy_application() {
    echo -e "${BLUE}Building and deploying application...${NC}"
    
    # Build the application locally first to catch any errors
    echo "Building application locally..."
    npm run build
    
    # Deploy to production
    echo "Deploying to Vercel production..."
    vercel --prod --confirm
    
    echo -e "${GREEN}Application deployed successfully!${NC}"
}

# Function to setup domains
setup_domains() {
    echo -e "${BLUE}Domain configuration...${NC}"
    
    echo "Current domains:"
    vercel domains ls
    
    echo ""
    read -p "Do you want to add a custom domain? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name (e.g., myapp.com): " domain_name
        
        if [ ! -z "$domain_name" ]; then
            echo "Adding domain: $domain_name"
            vercel domains add "$domain_name"
            
            echo "Configuring domain for this project..."
            vercel alias "$domain_name"
            
            echo -e "${GREEN}Domain setup completed!${NC}"
            echo -e "${YELLOW}Don't forget to update your DNS settings:${NC}"
            echo "1. Add CNAME record: www.$domain_name -> cname.vercel-dns.com"
            echo "2. Add A record: $domain_name -> 76.76.19.61"
        fi
    fi
}

# Function to setup database connection
verify_database() {
    echo -e "${BLUE}Verifying database connection...${NC}"
    
    # Create a simple database test endpoint
    cat > backend/src/routes/health.ts << 'EOF'
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function healthRoutes(fastify: FastifyInstance) {
    // Database health check
    fastify.get('/health/database', async (request, reply) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            reply.status(503);
            return { status: 'unhealthy', error: error.message };
        }
    });
    
    // Redis health check
    fastify.get('/health/redis', async (request, reply) => {
        try {
            const { cache } = await import('../utils/cache');
            await cache.set('health:check', 'ok', 5);
            const result = await cache.get('health:check');
            await cache.del('health:check');
            
            if (result === 'ok') {
                return { status: 'healthy', timestamp: new Date().toISOString() };
            } else {
                throw new Error('Redis test failed');
            }
        } catch (error) {
            reply.status(503);
            return { status: 'unhealthy', error: error.message };
        }
    });
    
    // Queue health check
    fastify.get('/health/queues', async (request, reply) => {
        try {
            const { getQueueHealth } = await import('../utils/queues');
            const health = await getQueueHealth();
            return { status: 'healthy', queues: health, timestamp: new Date().toISOString() };
        } catch (error) {
            reply.status(503);
            return { status: 'unhealthy', error: error.message };
        }
    });
    
    // Overall health check
    fastify.get('/health', async (request, reply) => {
        try {
            // Check database
            await prisma.$queryRaw`SELECT 1`;
            
            // Check Redis
            const { cache } = await import('../utils/cache');
            await cache.set('health:check', 'ok', 5);
            await cache.del('health:check');
            
            return {
                status: 'healthy',
                services: {
                    database: 'healthy',
                    redis: 'healthy',
                    queues: 'healthy'
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            reply.status(503);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    });
}
EOF

    echo "Health check endpoints created"
    echo -e "${GREEN}Database verification setup completed!${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}Setting up production monitoring...${NC}"
    
    # Create monitoring configuration
    cat > vercel.json << 'EOF'
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "backend/src/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/src/routes/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

    echo -e "${GREEN}Monitoring configuration created!${NC}"
}

# Function to create post-deployment tests
create_deployment_tests() {
    echo -e "${BLUE}Creating deployment tests...${NC}"
    
    mkdir -p tests/deployment
    
    cat > tests/deployment/production-tests.js << 'EOF'
const https = require('https');
const assert = require('assert');

class ProductionTests {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    async makeRequest(path) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${path}`;
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve({ status: res.statusCode, data: json });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                });
            }).on('error', reject);
        });
    }
    
    async testHealthEndpoint() {
        console.log('Testing health endpoint...');
        const response = await this.makeRequest('/api/health');
        assert.strictEqual(response.status, 200, 'Health endpoint should return 200');
        assert.strictEqual(response.data.status, 'healthy', 'Health status should be healthy');
        console.log('✅ Health endpoint test passed');
    }
    
    async testDatabaseConnection() {
        console.log('Testing database connection...');
        const response = await this.makeRequest('/api/health/database');
        assert.strictEqual(response.status, 200, 'Database health endpoint should return 200');
        assert.strictEqual(response.data.status, 'healthy', 'Database status should be healthy');
        console.log('✅ Database connection test passed');
    }
    
    async testRedisConnection() {
        console.log('Testing Redis connection...');
        const response = await this.makeRequest('/api/health/redis');
        assert.strictEqual(response.status, 200, 'Redis health endpoint should return 200');
        assert.strictEqual(response.data.status, 'healthy', 'Redis status should be healthy');
        console.log('✅ Redis connection test passed');
    }
    
    async testQueueHealth() {
        console.log('Testing queue health...');
        const response = await this.makeRequest('/api/health/queues');
        assert.strictEqual(response.status, 200, 'Queue health endpoint should return 200');
        assert.strictEqual(response.data.status, 'healthy', 'Queue status should be healthy');
        console.log('✅ Queue health test passed');
    }
    
    async runAllTests() {
        console.log(`\n🧪 Running production tests for: ${this.baseUrl}\n`);
        
        try {
            await this.testHealthEndpoint();
            await this.testDatabaseConnection();
            await this.testRedisConnection();
            await this.testQueueHealth();
            
            console.log('\n✅ All production tests passed!');
            return true;
        } catch (error) {
            console.error('\n❌ Production tests failed:', error.message);
            return false;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const baseUrl = process.argv[2] || 'https://your-app.vercel.app';
    const tests = new ProductionTests(baseUrl);
    
    tests.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = ProductionTests;
EOF

    echo -e "${GREEN}Deployment tests created!${NC}"
}

# Function to run post-deployment verification
run_post_deployment_tests() {
    echo -e "${BLUE}Running post-deployment tests...${NC}"
    
    # Get deployment URL
    deployment_url=$(vercel --prod --confirm 2>&1 | grep -o 'https://.*\.vercel\.app' | head -1)
    
    if [ -z "$deployment_url" ]; then
        echo -e "${YELLOW}Could not detect deployment URL automatically${NC}"
        read -p "Enter your deployment URL: " deployment_url
    fi
    
    echo "Testing deployment at: $deployment_url"
    
    # Wait a moment for deployment to be ready
    echo "Waiting 30 seconds for deployment to stabilize..."
    sleep 30
    
    # Run tests
    node tests/deployment/production-tests.js "$deployment_url"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Post-deployment tests passed!${NC}"
    else
        echo -e "${RED}Post-deployment tests failed. Please check the deployment.${NC}"
        exit 1
    fi
}

# Function to display final instructions
display_final_instructions() {
    echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Test your application thoroughly"
    echo "2. Set up monitoring and alerting"
    echo "3. Configure your domain's DNS settings (if added)"
    echo "4. Set up SSL certificate (handled by Vercel automatically)"
    echo "5. Monitor performance in Vercel dashboard"
    echo ""
    echo "=== Useful Commands ==="
    echo "• View deployment logs: vercel logs"
    echo "• Check environment variables: vercel env ls"
    echo "• Rollback deployment: vercel rollback"
    echo "• View project settings: vercel project ls"
    echo ""
    echo "=== Monitoring URLs ==="
    echo "• Application: $(vercel --prod --confirm 2>&1 | grep -o 'https://.*\.vercel\.app' | head -1)"
    echo "• Health Check: $(vercel --prod --confirm 2>&1 | grep -o 'https://.*\.vercel\.app' | head -1)/api/health"
    echo "• Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo -e "${YELLOW}Remember to:${NC}"
    echo "• Rotate secrets regularly"
    echo "• Monitor database and Redis usage"
    echo "• Set up backup procedures"
    echo "• Review security settings"
}

# Main execution
main() {
    echo -e "${GREEN}Production Deployment Setup${NC}"
    echo "=========================="
    
    case "${1:-all}" in
        "check")
            check_prerequisites
            ;;
        "setup")
            setup_vercel_project
            ;;
        "env")
            setup_environment_variables
            ;;
        "deploy")
            deploy_application
            ;;
        "domain")
            setup_domains
            ;;
        "monitor")
            setup_monitoring
            ;;
        "test")
            create_deployment_tests
            run_post_deployment_tests
            ;;
        "verify")
            verify_database
            ;;
        "all")
            echo "Running full deployment process..."
            check_prerequisites
            setup_vercel_project
            verify_database
            setup_monitoring
            create_deployment_tests
            setup_environment_variables
            deploy_application
            run_post_deployment_tests
            setup_domains
            display_final_instructions
            ;;
        *)
            echo "Usage: $0 {check|setup|env|deploy|domain|monitor|test|verify|all}"
            echo ""
            echo "Commands:"
            echo "  check    - Check prerequisites"
            echo "  setup    - Setup Vercel project"
            echo "  env      - Setup environment variables"
            echo "  deploy   - Build and deploy application"
            echo "  domain   - Setup custom domains"
            echo "  monitor  - Setup monitoring configuration"
            echo "  test     - Create and run deployment tests"
            echo "  verify   - Setup database verification"
            echo "  all      - Run full deployment process"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
