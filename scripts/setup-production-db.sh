#!/bin/bash

# Production Database Setup Script for Supabase
# This script helps you set up and configure the production database

set -e

echo "🚀 Setting up Production Database with Supabase..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: Node.js and npx are required${NC}"
    exit 1
fi

echo -e "${BLUE}Checking Supabase CLI...${NC}"
npx supabase@latest --version

# Function to create Supabase project
create_supabase_project() {
    echo -e "${YELLOW}Setting up Supabase project...${NC}"
    echo "Please follow these steps manually:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Create a new project"
    echo "3. Choose your organization"
    echo "4. Set project name: aipromotdb-prod"
    echo "5. Set database password (save this securely)"
    echo "6. Choose region closest to your users"
    echo "7. Wait for project to be created"
    echo ""
    echo "After creation, get the following from Settings > Database:"
    echo "- Connection string (with pgbouncer)"
    echo "- Direct connection string"
    echo "- Project reference ID"
    echo ""
    echo "Get the following from Settings > API:"
    echo "- Project URL"
    echo "- Anonymous key"
    echo "- Service role key"
    echo ""
    read -p "Press Enter when you have created the project and gathered the credentials..."
}

# Function to initialize Supabase locally
init_supabase() {
    echo -e "${BLUE}Initializing Supabase configuration...${NC}"
    
    if [ ! -f "supabase/config.toml" ]; then
        npx supabase@latest init
    fi
    
    echo -e "${GREEN}Supabase initialized successfully!${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}Error: .env.production file not found${NC}"
        echo "Please create .env.production with your database credentials"
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Error: DATABASE_URL not set in .env.production${NC}"
        exit 1
    fi
    
    echo "Running Prisma migrations..."
    cd backend
    
    # Generate Prisma client
    npm run db:generate
    
    # Run migrations
    npx prisma migrate deploy
    
    echo -e "${GREEN}Database migrations completed!${NC}"
    cd ..
}

# Function to seed production database
seed_database() {
    echo -e "${YELLOW}Seeding production database...${NC}"
    
    read -p "Do you want to seed the production database with initial data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        
        # Run seed scripts
        npm run db:seed:billing
        
        echo -e "${GREEN}Database seeded successfully!${NC}"
        cd ..
    else
        echo "Skipping database seeding"
    fi
}

# Function to setup connection pooling
setup_connection_pooling() {
    echo -e "${BLUE}Connection pooling configuration...${NC}"
    echo "Supabase automatically provides connection pooling via PgBouncer"
    echo "Your DATABASE_URL should include ?pgbouncer=true&connection_limit=1"
    echo ""
    echo "For production, consider these settings:"
    echo "- Pool size: 10-20 connections"
    echo "- Pool mode: Transaction (for most use cases)"
    echo "- Max client connections: Based on your plan"
    echo ""
    echo -e "${GREEN}Connection pooling is handled by Supabase automatically${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}Setting up database monitoring...${NC}"
    
    echo "Supabase provides built-in monitoring:"
    echo "1. Database health metrics"
    echo "2. Connection monitoring" 
    echo "3. Query performance insights"
    echo "4. Resource usage tracking"
    echo ""
    echo "Access monitoring at: https://app.supabase.com/project/[PROJECT_ID]/settings/database"
    echo ""
    echo -e "${GREEN}Monitoring is available in Supabase dashboard${NC}"
}

# Function to setup backups
setup_backups() {
    echo -e "${BLUE}Setting up database backups...${NC}"
    
    echo "Supabase provides automatic backups:"
    echo "- Daily automated backups (retained for 7 days on Free tier)"
    echo "- Point-in-time recovery (Pro tier and above)"
    echo "- Manual backup options available"
    echo ""
    echo "For additional backup security, consider:"
    echo "1. Setting up a backup webhook"
    echo "2. Implementing application-level exports"
    echo "3. Using Supabase CLI for local backups"
    echo ""
    
    read -p "Do you want to create a manual backup script? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_backup_script
    fi
    
    echo -e "${GREEN}Backup configuration completed${NC}"
}

# Function to create backup script
create_backup_script() {
    cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

# Database Backup Script
set -e

echo "Creating database backup..."

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
fi

# Create backup directory
mkdir -p backups

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/aipromotdb_backup_${TIMESTAMP}.sql"

# Create backup using pg_dump
echo "Backing up database to ${BACKUP_FILE}..."

# Note: You'll need to install pg_dump locally or use Supabase CLI
npx supabase db dump --db-url="$DIRECT_DATABASE_URL" -f "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}"

# Optional: Upload to S3 or other storage
# aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/database-backups/

# Keep only last 30 days of backups
find backups/ -name "aipromotdb_backup_*.sql" -type f -mtime +30 -delete

echo "Backup process completed"
EOF

    chmod +x scripts/backup-database.sh
    echo "Created backup script: scripts/backup-database.sh"
}

# Main execution
main() {
    echo -e "${GREEN}Production Database Setup${NC}"
    echo "=========================="
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    case "${1:-all}" in
        "init")
            init_supabase
            ;;
        "create")
            create_supabase_project
            ;;
        "migrate")
            run_migrations
            ;;
        "seed")
            seed_database
            ;;
        "backup")
            setup_backups
            ;;
        "monitor")
            setup_monitoring
            ;;
        "pool")
            setup_connection_pooling
            ;;
        "all")
            echo "Running full setup..."
            create_supabase_project
            init_supabase
            run_migrations
            seed_database
            setup_connection_pooling
            setup_monitoring
            setup_backups
            ;;
        *)
            echo "Usage: $0 {init|create|migrate|seed|backup|monitor|pool|all}"
            echo ""
            echo "Commands:"
            echo "  init     - Initialize Supabase configuration"
            echo "  create   - Instructions for creating Supabase project"
            echo "  migrate  - Run database migrations"
            echo "  seed     - Seed the database with initial data"
            echo "  backup   - Setup backup configuration"
            echo "  monitor  - Setup monitoring"
            echo "  pool     - Setup connection pooling"
            echo "  all      - Run full setup process"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Database setup completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env.production with Supabase credentials"
    echo "2. Deploy your application to Vercel"
    echo "3. Set up environment variables in Vercel dashboard"
    echo "4. Test database connectivity"
}

# Run main function
main "$@"
