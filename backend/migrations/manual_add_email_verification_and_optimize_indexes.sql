-- Migration: Add Email Verification Fields and Optimize Indexes
-- Date: 2025-01-11
-- Description: Adds missing email verification fields to User model and optimizes database indexes

BEGIN;

-- Add email verification fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

-- Add unique constraint for email verification token
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_emailVerificationToken_key" UNIQUE ("emailVerificationToken");

-- Add optimized indexes for User table
CREATE INDEX IF NOT EXISTS "users_emailVerificationToken_idx" ON "users"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "users_verified_idx" ON "users"("verified");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_plan_idx" ON "users"("plan");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");
CREATE INDEX IF NOT EXISTS "users_updatedAt_idx" ON "users"("updatedAt");

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "users"("email", "verified");
CREATE INDEX IF NOT EXISTS "users_role_plan_idx" ON "users"("role", "plan");

-- Add indexes for other frequently queried fields across tables

-- Organizations table optimizations
CREATE INDEX IF NOT EXISTS "organizations_userId_name_idx" ON "organizations"("userId", "name");
CREATE INDEX IF NOT EXISTS "organizations_category_createdAt_idx" ON "organizations"("category", "createdAt");

-- Content pieces optimizations
CREATE INDEX IF NOT EXISTS "content_pieces_organizationId_status_idx" ON "content_pieces"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "content_pieces_platform_publishedAt_idx" ON "content_pieces"("platform", "publishedAt");
CREATE INDEX IF NOT EXISTS "content_pieces_scheduledAt_status_idx" ON "content_pieces"("scheduledAt", "status");

-- Scheduled posts optimizations
CREATE INDEX IF NOT EXISTS "scheduled_posts_organizationId_scheduledAt_idx" ON "scheduled_posts"("organizationId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "scheduled_posts_status_scheduledAt_idx" ON "scheduled_posts"("status", "scheduledAt");

-- Analytics optimizations
CREATE INDEX IF NOT EXISTS "analytics_organizationId_collectedAt_idx" ON "analytics"("organizationId", "collectedAt");
CREATE INDEX IF NOT EXISTS "analytics_platform_metricType_idx" ON "analytics"("platform", "metricType");
CREATE INDEX IF NOT EXISTS "analytics_contentPieceId_metricType_idx" ON "analytics"("contentPieceId", "metricType");

-- Social accounts optimizations
CREATE INDEX IF NOT EXISTS "social_accounts_organizationId_platform_idx" ON "social_accounts"("organizationId", "platform");
CREATE INDEX IF NOT EXISTS "social_accounts_platform_isActive_idx" ON "social_accounts"("platform", "isActive");

-- Subscriptions optimizations
CREATE INDEX IF NOT EXISTS "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");
CREATE INDEX IF NOT EXISTS "subscriptions_status_currentPeriodEnd_idx" ON "subscriptions"("status", "currentPeriodEnd");

-- Usage records optimizations
CREATE INDEX IF NOT EXISTS "usage_records_userId_metricType_idx" ON "usage_records"("userId", "metricType");
CREATE INDEX IF NOT EXISTS "usage_records_subscriptionId_recordedAt_idx" ON "usage_records"("subscriptionId", "recordedAt");

-- Payment methods optimizations
CREATE INDEX IF NOT EXISTS "payment_methods_userId_isDefault_idx" ON "payment_methods"("userId", "isDefault");

-- Support tickets optimizations
CREATE INDEX IF NOT EXISTS "support_tickets_status_priority_idx" ON "support_tickets"("status", "priority");
CREATE INDEX IF NOT EXISTS "support_tickets_userId_status_idx" ON "support_tickets"("userId", "status");
CREATE INDEX IF NOT EXISTS "support_tickets_assignedTo_status_idx" ON "support_tickets"("assignedTo", "status");

-- Audit logs optimizations
CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- Calendar events optimizations
CREATE INDEX IF NOT EXISTS "calendar_events_organizationId_startTime_idx" ON "calendar_events"("organizationId", "startTime");
CREATE INDEX IF NOT EXISTS "calendar_events_eventType_status_idx" ON "calendar_events"("eventType", "status");

-- Assets optimizations
CREATE INDEX IF NOT EXISTS "assets_organizationId_type_idx" ON "assets"("organizationId", "type");
CREATE INDEX IF NOT EXISTS "assets_type_createdAt_idx" ON "assets"("type", "createdAt");

-- Series optimizations
CREATE INDEX IF NOT EXISTS "series_organizationId_status_idx" ON "series"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "series_platform_status_idx" ON "series"("platform", "status");

-- Weekly summaries optimizations
CREATE INDEX IF NOT EXISTS "weekly_summaries_organizationId_weekStart_idx" ON "weekly_summaries"("organizationId", "weekStart");

-- Feature flags optimizations
CREATE INDEX IF NOT EXISTS "feature_flags_enabled_name_idx" ON "feature_flags"("enabled", "name");

-- Billing events optimizations
CREATE INDEX IF NOT EXISTS "billing_events_eventType_eventTime_idx" ON "billing_events"("eventType", "eventTime");
CREATE INDEX IF NOT EXISTS "billing_events_userId_eventTime_idx" ON "billing_events"("userId", "eventTime");

-- Invoices optimizations
CREATE INDEX IF NOT EXISTS "invoices_status_issueDate_idx" ON "invoices"("status", "issueDate");
CREATE INDEX IF NOT EXISTS "invoices_subscriptionId_issueDate_idx" ON "invoices"("subscriptionId", "issueDate");

-- Add partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS "users_active_verified_idx" ON "users"("email") WHERE "verified" = true;
CREATE INDEX IF NOT EXISTS "scheduled_posts_pending_idx" ON "scheduled_posts"("scheduledAt") WHERE "status" IN ('SCHEDULED', 'PUBLISHING');
CREATE INDEX IF NOT EXISTS "content_pieces_published_idx" ON "content_pieces"("publishedAt") WHERE "status" = 'PUBLISHED';

-- Update table statistics for query planner optimization
ANALYZE "users";
ANALYZE "organizations";
ANALYZE "content_pieces";
ANALYZE "scheduled_posts";
ANALYZE "analytics";
ANALYZE "social_accounts";
ANALYZE "subscriptions";
ANALYZE "usage_records";
ANALYZE "audit_logs";

COMMIT;

-- Optional: Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Email verification fields added and indexes optimized at %', NOW();
END
$$;
