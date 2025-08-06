#!/bin/bash

# =============================================================================
# AI Promote Production Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh [environment] [version]
# Environments: staging, production
# Example: ./scripts/deploy.sh production v1.0.0

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-$(date +%Y%m%d-%H%M%S)}"
BUILD_ID="${VERSION}-${GITHUB_SHA:-local}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_PREFIX="aipromotapp"
BACKEND_IMAGE="${IMAGE_PREFIX}-backend:${VERSION}"
FRONTEND_IMAGE="${IMAGE_PREFIX}-frontend:${VERSION}"
WORKER_IMAGE="${IMAGE_PREFIX}-worker:${VERSION}"

# Environment-specific configurations
case "$ENVIRONMENT" in
  "staging")
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE=".env.staging"
    DOMAIN="staging.aipromotapp.com"
    ;;
  "production")
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    DOMAIN="aipromotapp.com"
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Use 'staging' or 'production'.${NC}"
    exit 1
    ;;
esac

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
  exit 1
}

info() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Wait for service to be healthy
wait_for_service() {
  local service_name=$1
  local max_attempts=${2:-30}
  local attempt=1
  
  log "Waiting for $service_name to become healthy..."
  
  while [ $attempt -le $max_attempts ]; do
    if docker-compose -f "$COMPOSE_FILE" ps "$service_name" | grep -q "healthy\|Up"; then
      log "$service_name is healthy!"
      return 0
    fi
    
    info "Attempt $attempt/$max_attempts: $service_name not ready yet..."
    sleep 10
    ((attempt++))
  done
  
  error "$service_name failed to become healthy after $max_attempts attempts"
}

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

pre_deployment_checks() {
  log "Running pre-deployment checks..."
  
  # Check required commands
  local required_commands=("docker" "docker-compose" "jq" "curl")
  for cmd in "${required_commands[@]}"; do
    if ! command_exists "$cmd"; then
      error "Required command '$cmd' not found"
    fi
  done
  
  # Check if we're in the project root
  if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    error "Script must be run from project root"
  fi
  
  # Check if environment file exists
  if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
    error "Environment file '$ENV_FILE' not found"
  fi
  
  # Check if compose file exists
  if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
    error "Compose file '$COMPOSE_FILE' not found"
  fi
  
  # Check Docker daemon
  if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running"
  fi
  
  # Validate environment variables
  source "$PROJECT_ROOT/$ENV_FILE"
  local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      error "Required environment variable '$var' is not set"
    fi
  done
  
  log "✅ Pre-deployment checks passed"
}

# =============================================================================
# BUILD PHASE
# =============================================================================

build_images() {
  log "Building Docker images..."
  
  cd "$PROJECT_ROOT"
  
  # Build backend image
  log "Building backend image: $BACKEND_IMAGE"
  docker build \
    -f backend/Dockerfile.prod \
    -t "$BACKEND_IMAGE" \
    --build-arg NODE_ENV="$ENVIRONMENT" \
    --build-arg BUILD_ID="$BUILD_ID" \
    --build-arg VERSION="$VERSION" \
    backend/
  
  # Build frontend image
  log "Building frontend image: $FRONTEND_IMAGE"
  docker build \
    -f frontend/Dockerfile.prod \
    -t "$FRONTEND_IMAGE" \
    --build-arg NODE_ENV="$ENVIRONMENT" \
    --build-arg BUILD_ID="$BUILD_ID" \
    --build-arg VERSION="$VERSION" \
    frontend/
  
  # Tag worker image (same as backend)
  docker tag "$BACKEND_IMAGE" "$WORKER_IMAGE"
  
  log "✅ Docker images built successfully"
}

# Push images to registry if configured
push_images() {
  if [[ -n "$DOCKER_REGISTRY" ]]; then
    log "Pushing images to registry: $DOCKER_REGISTRY"
    
    # Tag with registry prefix
    docker tag "$BACKEND_IMAGE" "$DOCKER_REGISTRY/$BACKEND_IMAGE"
    docker tag "$FRONTEND_IMAGE" "$DOCKER_REGISTRY/$FRONTEND_IMAGE"
    docker tag "$WORKER_IMAGE" "$DOCKER_REGISTRY/$WORKER_IMAGE"
    
    # Push images
    docker push "$DOCKER_REGISTRY/$BACKEND_IMAGE"
    docker push "$DOCKER_REGISTRY/$FRONTEND_IMAGE"
    docker push "$DOCKER_REGISTRY/$WORKER_IMAGE"
    
    log "✅ Images pushed to registry"
  else
    info "No registry configured, skipping image push"
  fi
}

# =============================================================================
# DATABASE MIGRATION
# =============================================================================

run_migrations() {
  log "Running database migrations..."
  
  # Start only the database for migrations
  docker-compose -f "$COMPOSE_FILE" up -d postgres redis
  
  # Wait for database to be ready
  wait_for_service postgres
  
  # Run migrations using a temporary container
  docker run --rm \
    --network "$(docker-compose -f "$COMPOSE_FILE" ps -q postgres | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}')" \
    -e DATABASE_URL="$DATABASE_URL" \
    "$BACKEND_IMAGE" \
    npx prisma migrate deploy
  
  log "✅ Database migrations completed"
}

# =============================================================================
# DEPLOYMENT PHASE
# =============================================================================

deploy_application() {
  log "Deploying application..."
  
  cd "$PROJECT_ROOT"
  
  # Set environment variables
  export VERSION="$VERSION"
  export BUILD_ID="$BUILD_ID"
  export COMPOSE_PROJECT_NAME="aipromotapp-$ENVIRONMENT"
  
  # Deploy using docker-compose
  docker-compose -f "$COMPOSE_FILE" up -d
  
  log "✅ Application deployed"
}

# =============================================================================
# POST-DEPLOYMENT VERIFICATION
# =============================================================================

verify_deployment() {
  log "Verifying deployment..."
  
  # Wait for services to be healthy
  wait_for_service backend
  wait_for_service frontend
  wait_for_service worker
  
  # Health check endpoints
  local backend_url="http://localhost:3001/health"
  local frontend_url="http://localhost:3000"
  
  # Backend health check
  if curl -f -s "$backend_url" | jq -e '.status == "healthy"' >/dev/null; then
    log "✅ Backend health check passed"
  else
    error "❌ Backend health check failed"
  fi
  
  # Frontend health check
  if curl -f -s "$frontend_url" >/dev/null; then
    log "✅ Frontend health check passed"
  else
    error "❌ Frontend health check failed"
  fi
  
  # Database connectivity check
  docker-compose -f "$COMPOSE_FILE" exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`.then(() => {
      console.log('Database connection successful');
      process.exit(0);
    }).catch((error) => {
      console.error('Database connection failed:', error);
      process.exit(1);
    });
  "
  
  log "✅ Post-deployment verification completed"
}

# =============================================================================
# BACKUP PHASE
# =============================================================================

create_backup() {
  if [[ "$ENVIRONMENT" == "production" ]]; then
    log "Creating pre-deployment backup..."
    
    # Run backup script
    if [[ -f "$SCRIPT_DIR/backup.sh" ]]; then
      "$SCRIPT_DIR/backup.sh" "pre-deployment-$VERSION"
      log "✅ Backup created"
    else
      warn "Backup script not found, skipping backup"
    fi
  else
    info "Skipping backup for non-production environment"
  fi
}

# =============================================================================
# ROLLBACK FUNCTION
# =============================================================================

rollback() {
  warn "Rolling back deployment..."
  
  # Stop current deployment
  docker-compose -f "$COMPOSE_FILE" down
  
  # Restore from backup if available
  if [[ "$ENVIRONMENT" == "production" && -f "$SCRIPT_DIR/restore.sh" ]]; then
    "$SCRIPT_DIR/restore.sh" "pre-deployment-$VERSION"
  fi
  
  # Start previous version (this would need to be implemented based on your versioning strategy)
  warn "Manual intervention required to restore previous version"
  
  error "Deployment rolled back"
}

# =============================================================================
# CLEANUP
# =============================================================================

cleanup() {
  log "Cleaning up old images and containers..."
  
  # Remove old images (keep last 3 versions)
  docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    grep "$IMAGE_PREFIX" | \
    sort -k2 -r | \
    tail -n +4 | \
    awk '{print $1}' | \
    xargs -r docker rmi -f || true
  
  # Remove unused containers and networks
  docker system prune -f --filter "until=24h" || true
  
  log "✅ Cleanup completed"
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

main() {
  log "Starting deployment of AI Promote $ENVIRONMENT environment"
  log "Version: $VERSION"
  log "Build ID: $BUILD_ID"
  
  # Trap to handle failures
  trap rollback ERR
  
  # Deployment steps
  pre_deployment_checks
  create_backup
  build_images
  push_images
  run_migrations
  deploy_application
  verify_deployment
  cleanup
  
  log "🚀 Deployment completed successfully!"
  log "Application is available at: https://$DOMAIN"
  
  # Disable rollback trap on success
  trap - ERR
}

# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
