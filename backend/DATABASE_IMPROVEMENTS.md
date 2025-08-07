# Database Schema Fixes and Optimization

This document outlines the database improvements implemented to fix schema inconsistencies, optimize performance, and implement production-ready features.

## Summary of Changes

### 1. **Prisma Schema Corrections**

#### Missing Fields Added
- **User Model**: Added `emailVerificationToken` and `emailVerificationExpiry` fields
  ```prisma
  emailVerificationToken String?  @unique
  emailVerificationExpiry DateTime?
  ```

#### Optimized Indexes
- Added comprehensive indexes for all frequently queried fields
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### 2. **Database Connection Pooling**

#### Configuration (`src/config/database.ts`)
- Connection pool with configurable limits
- Query timeout settings
- Connection lifecycle management
- Health monitoring and metrics

#### Environment Variables
```env
DB_CONNECTION_LIMIT=20
DB_MAX_IDLE_TIME=30000
DB_MAX_LIFE_TIME=1800000
DB_QUERY_TIMEOUT=20000
```

### 3. **Migration Files**

#### Manual Migration SQL
- **File**: `migrations/manual_add_email_verification_and_optimize_indexes.sql`
- Adds missing fields and creates optimized indexes
- Safe to run on existing databases with `IF NOT EXISTS` checks

#### Prisma Migrations
- Updated schema ready for `prisma migrate dev`
- Production deployment ready

### 4. **Database Backup Automation**

#### Features
- Automated daily/weekly backups
- S3 cloud storage integration
- Compression and encryption support
- Backup verification and integrity checks
- Retention policy management

#### Scripts
- `scripts/backup-database.ts` - Core backup functionality
- `scripts/backup-scheduler.ts` - Cron job scheduling
- Configurable via environment variables

### 5. **Data Integrity**

#### Cascade Delete Rules
- Proper foreign key constraints
- Orphaned data prevention
- Referential integrity enforcement

#### Indexes for Data Integrity
- Unique constraints where needed
- Composite indexes for relationship consistency

## Implementation Guide

### 1. **Environment Setup**

Copy the sample environment file:
```bash
cp .env.sample .env
```

Update with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/aipromotdb"
```

### 2. **Apply Schema Changes**

#### Option A: Manual Migration (Recommended for existing databases)
```bash
# Run the manual migration SQL
npm run db:migrate:manual
```

#### Option B: Prisma Migration (For new setups)
```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 3. **Enable Backup Automation**

#### Daily Backups
```bash
# Run immediate backup
npm run db:backup

# Start backup scheduler (runs in background)
npm run db:backup:schedule
```

#### Configure Backup Settings
```env
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_S3_BUCKET="your-backup-bucket"
```

### 4. **Health Monitoring**

#### Database Health Check
```bash
npm run db:health
```

#### Index Optimization
```bash
npm run db:optimize
```

## Performance Optimizations

### 1. **Indexes Added**

#### User Table
- `users_emailVerificationToken_idx`
- `users_verified_idx`
- `users_role_idx`
- `users_plan_idx`
- `users_email_verified_idx` (composite)

#### Content Management
- `content_pieces_organizationId_status_idx`
- `content_pieces_platform_publishedAt_idx`
- `scheduled_posts_organizationId_scheduledAt_idx`

#### Analytics
- `analytics_organizationId_collectedAt_idx`
- `analytics_platform_metricType_idx`

### 2. **Query Optimization**

#### Composite Indexes
- Optimized for common WHERE clauses
- Multi-column sorting support
- Join performance improvements

#### Partial Indexes
- Filtered indexes for boolean conditions
- Reduced index size and improved performance

### 3. **Connection Pooling Benefits**

- Reduced connection overhead
- Better resource utilization
- Configurable connection limits
- Query performance monitoring

## Backup and Recovery

### 1. **Backup Features**

#### Automated Backups
- **Daily**: 2 AM (configurable)
- **Weekly**: Sunday 3 AM (configurable)
- **Cleanup**: Daily 4 AM (configurable)

#### Backup Verification
- File integrity checks
- SQL dump validation
- Size verification

#### Cloud Storage
- S3 integration with metadata
- Cost-effective storage classes
- Encryption support

### 2. **Recovery Process**

#### Local Restore
```bash
# Uncompress and restore
gunzip -c backup-file.sql.gz | psql $DATABASE_URL
```

#### S3 Restore
```bash
# Download from S3 and restore
aws s3 cp s3://bucket/database-backups/backup.sql.gz ./
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### 3. **Monitoring**

#### Health Checks
- Database connectivity
- Response time monitoring
- Connection pool status
- Query performance metrics

#### Alerts (Future Enhancement)
- Failed backup notifications
- Database health alerts
- Performance degradation warnings

## Production Deployment

### 1. **Database Configuration**

#### Connection Settings
```env
DATABASE_URL="postgresql://user:pass@prod-db:5432/aipromotdb"
DATABASE_READ_REPLICA_URL="postgresql://user:pass@read-replica:5432/aipromotdb"
```

#### Security Settings
```env
DB_SSL_REJECT_UNAUTHORIZED=true
NODE_ENV=production
```

### 2. **Scaling Considerations**

#### Read Replicas
- Configuration ready in `database.ts`
- Automatic read query routing (planned)
- Load balancing support

#### Connection Pooling
- Production-optimized defaults
- Resource monitoring
- Automatic scaling

### 3. **Maintenance Schedule**

#### Automated Tasks
- **Index Optimization**: Weekly (Saturday 1 AM)
- **Health Checks**: Every 6 hours
- **Backup Cleanup**: Daily (4 AM)
- **Statistics Update**: During optimization

## Troubleshooting

### 1. **Common Issues**

#### Migration Errors
```bash
# Check database connection
npm run db:health

# Verify schema
npx prisma validate
```

#### Backup Failures
```bash
# Test backup manually
npm run db:backup

# Check permissions and disk space
df -h && ls -la ./backups
```

### 2. **Performance Issues**

#### Query Performance
```bash
# Analyze slow queries
npm run db:optimize

# Check index usage
EXPLAIN ANALYZE your_query;
```

#### Connection Pool
```bash
# Monitor connections
npm run db:health

# Adjust pool settings in .env
```

### 3. **Recovery Scenarios**

#### Data Loss
1. Stop application
2. Identify latest backup
3. Restore from backup
4. Verify data integrity
5. Restart application

#### Corruption
1. Run integrity checks
2. Restore from known good backup
3. Apply recent changes manually
4. Update backup schedule if needed

## Best Practices

### 1. **Schema Changes**
- Always backup before migrations
- Test migrations on staging first
- Use transactions for complex changes
- Verify indexes after deployment

### 2. **Backup Management**
- Test restores regularly
- Monitor backup sizes
- Verify S3 uploads
- Document recovery procedures

### 3. **Performance Monitoring**
- Regular health checks
- Index usage analysis
- Query performance monitoring
- Connection pool optimization

## Next Steps

### 1. **Immediate Actions**
1. Apply schema migrations
2. Configure backup automation
3. Set up health monitoring
4. Test backup/restore procedures

### 2. **Future Enhancements**
1. Read replica implementation
2. Advanced monitoring dashboard
3. Automated alerting system
4. Performance optimization automation

### 3. **Production Readiness**
1. Load testing with new indexes
2. Backup/restore testing
3. Disaster recovery procedures
4. Monitoring and alerting setup

---

## Support

For issues with database improvements:
1. Check logs in backup and health check scripts
2. Verify environment configuration
3. Test individual components
4. Review migration SQL for conflicts

All improvements are backward compatible and can be applied incrementally.
