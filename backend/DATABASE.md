# Database Setup and Management

This document provides comprehensive information about the database schema, setup, and management for the AIPromote application.

## Overview

The application uses **PostgreSQL** as the primary database with **Prisma** as the ORM, and **Redis** for queue management and caching.

## Database Schema

### Core Entities

1. **Users** - Authentication and user management
2. **Organizations** - Company/startup profiles (renamed from Startups)
3. **Founders** - Founder information and profiles
4. **AIStrategies** - AI-generated marketing strategies
5. **ContentPieces** - Generated content items (renamed from ContentItems)
6. **SocialAccounts** - Connected social media accounts
7. **ScheduledPosts** - Posts scheduled for publishing
8. **Analytics** - Performance metrics and analytics data

### Supporting Entities

- **BrandRules** - Brand guidelines and compliance rules
- **Assets** - Media files and assets
- **ContentPillars** - Content categorization
- **Series** - Content series management
- **WeeklySummaries** - AI coach reports
- **Subscriptions** - Billing and plan management
- **Usage** - Plan limit tracking

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ 
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### 1. Environment Setup

Copy and configure the environment file:
```bash
cp .env.example .env
```

Update the following variables in `.env`:
```bash
DATABASE_URL="postgresql://aipromotuser:aipromotpass@localhost:5432/aipromotdb?schema=public"
REDIS_URL="redis://:aipromotredis@localhost:6379"
```

### 2. Start Services (Docker)

From the root directory:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis server on port 6379
- Redis Commander (GUI) on port 8081

### 3. Database Migration

```bash
cd backend
npm install
npx prisma migrate dev --name init_comprehensive_schema
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

## Schema Details

### Key Relationships

```
User (1) -> (N) Organization
Organization (1) -> (N) Founder
Organization (1) -> (N) AIStrategy
Organization (1) -> (N) ContentPiece
Organization (1) -> (N) SocialAccount
ContentPiece (1) -> (N) ScheduledPost
ScheduledPost (1) -> (N) Analytics
```

### Enum Types

- **Platform**: TWITTER, LINKEDIN, INSTAGRAM, TIKTOK, etc.
- **ContentStatus**: DRAFT, APPROVED, SCHEDULED, PUBLISHED, FAILED
- **PostStatus**: SCHEDULED, PUBLISHING, PUBLISHED, FAILED, RETRYING
- **UserRole**: USER, ADMIN, MODERATOR

### JSON Fields

Several models use JSON fields for flexible data storage:

- **AIStrategy**: `positioning`, `audienceSegments`, `contentPillars`, `channelPlan`, `cadence`, `calendarSkeleton`
- **ContentPiece**: `mediaRefs`
- **BrandRule**: `autoApprovalRules`
- **WeeklySummary**: `recommendations`, `keyInsights`

## Database Operations

### Common Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes without migration
npm run db:push

# Create and run migration
npm run db:migrate

# Reset database (careful!)
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Run seed script
npm run db:seed
```

### Custom Database Service

The `DatabaseService` class provides additional utilities:

```typescript
import { DatabaseService } from './services/database';

// Pagination
const result = await DatabaseService.paginate('organization', {
  page: 1,
  limit: 10,
  where: { userId: 'user123' },
  orderBy: { createdAt: 'desc' }
});

// Search
const searchResult = await DatabaseService.search(
  'contentPiece',
  'productivity',
  ['title', 'body'],
  { page: 1, limit: 20 }
);

// Transactions
await DatabaseService.runInTransaction(async (tx) => {
  await tx.contentPiece.create({ data: {...} });
  await tx.scheduledPost.create({ data: {...} });
});
```

## Redis Queue Management

### Queue Types

1. **content-generation** - AI content generation
2. **publishing** - Social media publishing
3. **analytics** - Metrics collection
4. **strategy-generation** - AI strategy generation
5. **email** - Email notifications

### Queue Configuration

```typescript
import { 
  addContentGenerationJob,
  addPublishingJob,
  getQueueHealth 
} from './config/redis';

// Add jobs
await addContentGenerationJob({
  organizationId: 'org123',
  platform: 'LINKEDIN',
  contentType: 'POST',
  count: 5
});

// Monitor queues
const health = await getQueueHealth();
console.log(health);
```

## Performance Optimization

### Indexes

The schema includes strategic indexes on:
- Foreign keys for relationships
- Frequently queried fields (email, status, platform)
- Composite indexes for common query patterns

### Connection Pooling

Prisma automatically handles connection pooling. For production, consider:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

### Query Optimization

- Use `select` to limit returned fields
- Use `include` sparingly and only for necessary relationships
- Implement proper pagination for large datasets
- Use database-level filtering instead of application-level filtering

## Backup and Recovery

### Automated Backups

Set up automated PostgreSQL backups:

```bash
# Daily backup script
pg_dump -h localhost -U aipromotuser -d aipromotdb > backup_$(date +%Y%m%d).sql
```

### Data Migration

For production deployments:

```bash
# 1. Backup existing data
pg_dump > backup.sql

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify integrity
npm run db:seed -- --verify
```

## Monitoring

### Health Checks

The application provides health check endpoints:

- Database: `/health/database`
- Redis: `/health/redis`
- Overall: `/health`

### Metrics

Monitor these key metrics:
- Database connection pool usage
- Query execution time
- Queue job processing rate
- Failed job count

## Troubleshooting

### Common Issues

1. **Connection refused**
   ```bash
   # Check if PostgreSQL is running
   docker ps
   # or
   sudo systemctl status postgresql
   ```

2. **Migration conflicts**
   ```bash
   # Reset and re-run migrations
   npx prisma migrate reset
   npx prisma migrate dev
   ```

3. **Schema drift**
   ```bash
   # Generate new migration for changes
   npx prisma migrate dev --name describe_your_changes
   ```

4. **Seed data issues**
   ```bash
   # Clear and re-seed
   npm run db:reset
   npm run db:seed
   ```

### Performance Issues

1. **Slow queries**
   - Check query logs in development
   - Add indexes for frequently queried fields
   - Use `EXPLAIN ANALYZE` for complex queries

2. **Connection pool exhaustion**
   - Increase `connection_limit` in DATABASE_URL
   - Ensure proper connection cleanup
   - Monitor active connections

## Security Considerations

- All OAuth tokens are encrypted at rest
- Sensitive data uses appropriate field types (`@db.Text` for tokens)
- User roles and permissions are enforced at the database level
- SQL injection protection via Prisma's type-safe queries

## Development Workflow

1. **Schema changes**: Update `schema.prisma`
2. **Generate migration**: `npm run db:migrate`
3. **Update types**: `npm run db:generate`
4. **Update seed data**: Modify `prisma/seed.ts`
5. **Test changes**: `npm run db:seed`

## Production Deployment

### Environment Variables

```bash
DATABASE_URL="postgresql://user:pass@prod-host:5432/prod-db"
REDIS_URL="redis://user:pass@prod-redis:6379"
NODE_ENV="production"
```

### Migration Strategy

```bash
# 1. Deploy code (without starting)
# 2. Run migrations
npx prisma migrate deploy
# 3. Start application
npm start
```

### Monitoring

Set up monitoring for:
- Database performance (query time, connections)
- Queue health (job processing rate, failures)
- Application errors (failed migrations, connection issues)
