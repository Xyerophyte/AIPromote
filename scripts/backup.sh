#!/bin/bash

# =============================================================================
# AI Promote Backup and Disaster Recovery Script
# =============================================================================
# Usage: ./scripts/backup.sh [backup_name] [type]
# Types: full, database, files, incremental
# Example: ./scripts/backup.sh daily-backup-20240115 full

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_NAME="${1:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_TYPE="${2:-full}"
ENVIRONMENT="${NODE_ENV:-production}"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
  source "$PROJECT_ROOT/.env.$ENVIRONMENT"
elif [[ -f "$PROJECT_ROOT/.env.production" ]]; then
  source "$PROJECT_ROOT/.env.production"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
S3_BACKUP_BUCKET="${BACKUP_S3_BUCKET:-aipromotbackups-prod}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-90}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-aipromotdb_prod}"
UPLOADS_DIR="${UPLOADS_DIR:-$PROJECT_ROOT/uploads}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

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

# Get database connection details
get_db_connection() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    # Parse DATABASE_URL
    DB_URL="$DATABASE_URL"
    DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
    DB_PASS=$(echo "$DB_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\).*/\1/p')
  else
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_NAME="${POSTGRES_DB:-aipromotdb}"
    DB_USER="${POSTGRES_USER:-aipromotuser}"
    DB_PASS="${POSTGRES_PASSWORD:-}"
  fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

backup_database() {
  log "Creating database backup..."
  
  get_db_connection
  
  local dump_file="$BACKUP_DIR/${BACKUP_NAME}-database.sql"
  local compressed_file="$dump_file.gz"
  
  # Check if we should use docker or direct connection
  if docker ps --format "table {{.Names}}" | grep -q "$POSTGRES_CONTAINER"; then
    # Use docker exec
    docker exec "$POSTGRES_CONTAINER" pg_dump \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      --verbose \
      --clean \
      --no-owner \
      --no-privileges \
      --format=custom > "$dump_file"
  else
    # Use direct connection
    PGPASSWORD="$DB_PASS" pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      --verbose \
      --clean \
      --no-owner \
      --no-privileges \
      --format=custom > "$dump_file"
  fi
  
  # Compress the dump
  gzip "$dump_file"
  
  log "✅ Database backup created: $compressed_file"
  echo "$compressed_file"
}

backup_files() {
  log "Creating file system backup..."
  
  local files_backup="$BACKUP_DIR/${BACKUP_NAME}-files.tar.gz"
  
  # Backup uploads and other important directories
  local backup_paths=(
    "$UPLOADS_DIR"
    "$PROJECT_ROOT/logs"
    "$PROJECT_ROOT/config"
  )
  
  # Create tar archive
  tar -czf "$files_backup" \
    --exclude="*.log" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude="build" \
    "${backup_paths[@]}" 2>/dev/null || true
  
  log "✅ Files backup created: $files_backup"
  echo "$files_backup"
}

backup_redis() {
  log "Creating Redis backup..."
  
  local redis_backup="$BACKUP_DIR/${BACKUP_NAME}-redis.rdb"
  
  # Get Redis container name
  local redis_container="${REDIS_CONTAINER:-aipromot_redis_prod}"
  
  if docker ps --format "table {{.Names}}" | grep -q "$redis_container"; then
    # Save Redis data
    docker exec "$redis_container" redis-cli BGSAVE
    
    # Wait for background save to complete
    while docker exec "$redis_container" redis-cli LASTSAVE | grep -q "$(docker exec "$redis_container" redis-cli LASTSAVE)"; do
      sleep 1
    done
    
    # Copy the dump file
    docker cp "$redis_container:/data/dump.rdb" "$redis_backup"
    
    log "✅ Redis backup created: $redis_backup"
    echo "$redis_backup"
  else
    warn "Redis container not found, skipping Redis backup"
  fi
}

backup_configuration() {
  log "Creating configuration backup..."
  
  local config_backup="$BACKUP_DIR/${BACKUP_NAME}-config.tar.gz"
  
  # Backup configuration files (excluding sensitive data)
  tar -czf "$config_backup" \
    "$PROJECT_ROOT/docker-compose.prod.yml" \
    "$PROJECT_ROOT/docker-compose.staging.yml" \
    "$PROJECT_ROOT/config" \
    "$PROJECT_ROOT/scripts" \
    "$PROJECT_ROOT/package.json" \
    "$PROJECT_ROOT/backend/package.json" \
    "$PROJECT_ROOT/frontend/package.json" \
    "$PROJECT_ROOT/backend/prisma/schema.prisma" 2>/dev/null || true
  
  log "✅ Configuration backup created: $config_backup"
  echo "$config_backup"
}

# =============================================================================
# INCREMENTAL BACKUP
# =============================================================================

backup_incremental() {
  log "Creating incremental backup..."
  
  local last_backup_file="$BACKUP_DIR/.last_backup_timestamp"
  local current_time=$(date +%s)
  
  # Get timestamp of last backup
  local last_backup_time=0
  if [[ -f "$last_backup_file" ]]; then
    last_backup_time=$(cat "$last_backup_file")
  fi
  
  # Find files modified since last backup
  local incremental_files="$BACKUP_DIR/${BACKUP_NAME}-incremental.tar.gz"
  
  find "$UPLOADS_DIR" "$PROJECT_ROOT/logs" -type f -newer "$last_backup_file" 2>/dev/null | \
    tar -czf "$incremental_files" -T - || true
  
  # Update last backup timestamp
  echo "$current_time" > "$last_backup_file"
  
  log "✅ Incremental backup created: $incremental_files"
  echo "$incremental_files"
}

# =============================================================================
# CLOUD SYNC
# =============================================================================

sync_to_s3() {
  local backup_files=("$@")
  
  if ! command_exists aws; then
    warn "AWS CLI not found, skipping S3 sync"
    return
  fi
  
  log "Syncing backups to S3..."
  
  for file in "${backup_files[@]}"; do
    if [[ -f "$file" ]]; then
      local s3_key="backups/$ENVIRONMENT/$(basename "$file")"
      
      aws s3 cp "$file" "s3://$S3_BACKUP_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
      
      log "✅ Uploaded to S3: s3://$S3_BACKUP_BUCKET/$s3_key"
    fi
  done
  
  log "✅ S3 sync completed"
}

# =============================================================================
# BACKUP VERIFICATION
# =============================================================================

verify_backup() {
  local backup_file="$1"
  
  log "Verifying backup: $backup_file"
  
  case "$backup_file" in
    *.sql.gz)
      # Verify database dump
      if gzip -t "$backup_file" 2>/dev/null; then
        log "✅ Database backup integrity verified"
      else
        error "❌ Database backup integrity check failed"
      fi
      ;;
    *.tar.gz)
      # Verify tar archive
      if tar -tzf "$backup_file" >/dev/null 2>&1; then
        log "✅ Archive integrity verified"
      else
        error "❌ Archive integrity check failed"
      fi
      ;;
    *.rdb)
      # Verify Redis dump
      if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        log "✅ Redis backup verified"
      else
        error "❌ Redis backup verification failed"
      fi
      ;;
  esac
}

# =============================================================================
# CLEANUP OLD BACKUPS
# =============================================================================

cleanup_old_backups() {
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  
  # Local cleanup
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
  find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
  find "$BACKUP_DIR" -type f -name "*.rdb" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
  
  # S3 cleanup (if configured)
  if command_exists aws && [[ -n "$S3_BACKUP_BUCKET" ]]; then
    aws s3api list-objects-v2 \
      --bucket "$S3_BACKUP_BUCKET" \
      --prefix "backups/$ENVIRONMENT/" \
      --query "Contents[?LastModified<='$(date -d "$RETENTION_DAYS days ago" --iso-8601)'].Key" \
      --output text | \
    while IFS=$'\t' read -r key; do
      if [[ -n "$key" ]]; then
        aws s3 rm "s3://$S3_BACKUP_BUCKET/$key"
        log "Deleted old S3 backup: $key"
      fi
    done
  fi
  
  log "✅ Cleanup completed"
}

# =============================================================================
# MAIN BACKUP FUNCTION
# =============================================================================

create_backup() {
  log "Starting $BACKUP_TYPE backup: $BACKUP_NAME"
  
  local backup_files=()
  
  case "$BACKUP_TYPE" in
    "full")
      backup_files+=($(backup_database))
      backup_files+=($(backup_files))
      backup_files+=($(backup_redis))
      backup_files+=($(backup_configuration))
      ;;
    "database")
      backup_files+=($(backup_database))
      ;;
    "files")
      backup_files+=($(backup_files))
      ;;
    "incremental")
      backup_files+=($(backup_incremental))
      ;;
    "redis")
      backup_files+=($(backup_redis))
      ;;
    "config")
      backup_files+=($(backup_configuration))
      ;;
    *)
      error "Invalid backup type: $BACKUP_TYPE. Use: full, database, files, incremental, redis, config"
      ;;
  esac
  
  # Verify all backups
  for file in "${backup_files[@]}"; do
    verify_backup "$file"
  done
  
  # Sync to cloud storage
  sync_to_s3 "${backup_files[@]}"
  
  # Generate backup report
  generate_backup_report "${backup_files[@]}"
  
  log "✅ Backup '$BACKUP_NAME' completed successfully"
}

# =============================================================================
# BACKUP REPORTING
# =============================================================================

generate_backup_report() {
  local backup_files=("$@")
  local report_file="$BACKUP_DIR/${BACKUP_NAME}-report.json"
  
  # Create JSON report
  cat > "$report_file" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "backup_type": "$BACKUP_TYPE",
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date --iso-8601=seconds)",
  "files": [
$(for file in "${backup_files[@]}"; do
    if [[ -f "$file" ]]; then
      local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
      local hash=$(sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
      echo "    {"
      echo "      \"path\": \"$file\","
      echo "      \"size\": $size,"
      echo "      \"checksum\": \"$hash\""
      echo "    },"
    fi
done | sed '$ s/,$//')
  ],
  "retention_until": "$(date -d "+$RETENTION_DAYS days" --iso-8601=seconds)"
}
EOF
  
  log "✅ Backup report generated: $report_file"
}

# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

main() {
  # Pre-flight checks
  if [[ ! -d "$PROJECT_ROOT" ]]; then
    error "Project root directory not found: $PROJECT_ROOT"
  fi
  
  # Create backup
  create_backup
  
  # Cleanup old backups
  cleanup_old_backups
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
