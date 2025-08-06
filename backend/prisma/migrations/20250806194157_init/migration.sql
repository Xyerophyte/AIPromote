-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS');

-- CreateEnum
CREATE TYPE "public"."ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('POST', 'THREAD', 'STORY', 'REEL', 'SHORT', 'CAROUSEL', 'POLL');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."StrategyStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MetricType" AS ENUM ('ENGAGEMENT', 'REACH', 'CONVERSION', 'GROWTH');

-- CreateEnum
CREATE TYPE "public"."ApprovalMode" AS ENUM ('AUTO', 'MANUAL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('LOGO', 'SCREENSHOT', 'VIDEO', 'DOCUMENT', 'IMAGE', 'AVATAR', 'BANNER', 'CASE_STUDY');

-- CreateEnum
CREATE TYPE "public"."SeriesStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."ScheduleType" AS ENUM ('RECURRING', 'BULK', 'OPTIMAL_TIME', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('POST_SCHEDULED', 'POST_PUBLISHED', 'CONTENT_DEADLINE', 'CAMPAIGN_START', 'CAMPAIGN_END', 'REVIEW_DUE', 'MEETING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."ConflictType" AS ENUM ('TIME_OVERLAP', 'PLATFORM_LIMIT', 'CONTENT_SIMILAR', 'AUDIENCE_FATIGUE', 'RATE_LIMIT', 'RESOURCE_CONFLICT');

-- CreateEnum
CREATE TYPE "public"."ConflictSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ConflictStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'IGNORED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."ExportType" AS ENUM ('CALENDAR', 'SCHEDULE', 'ANALYTICS', 'FULL_REPORT');

-- CreateEnum
CREATE TYPE "public"."ExportFormat" AS ENUM ('ICAL', 'CSV', 'JSON', 'PDF');

-- CreateEnum
CREATE TYPE "public"."ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "public"."UsageMetricType" AS ENUM ('POSTS_GENERATED', 'POSTS_PUBLISHED', 'STRATEGIES_GENERATED', 'API_CALLS', 'ORGANIZATIONS_CREATED', 'ANALYTICS_REQUESTS');

-- CreateEnum
CREATE TYPE "public"."BillingEventType" AS ENUM ('SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'INVOICE_CREATED', 'INVOICE_PAID', 'INVOICE_FAILED', 'TRIAL_STARTED', 'TRIAL_ENDED', 'PLAN_CHANGED', 'PAYMENT_METHOD_ATTACHED', 'PAYMENT_METHOD_DETACHED');

-- CreateEnum
CREATE TYPE "public"."SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."SupportCategory" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'ACCOUNT', 'CONTENT');

-- CreateEnum
CREATE TYPE "public"."ResponseUserType" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ModerationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."ModerationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."SystemMetricType" AS ENUM ('CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'DATABASE_CONNECTIONS', 'RESPONSE_TIME', 'ERROR_RATE', 'ACTIVE_USERS', 'QUEUE_SIZE', 'FAILED_JOBS');

-- CreateEnum
CREATE TYPE "public"."HealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."AdminNotificationType" AS ENUM ('SYSTEM_ALERT', 'MODERATION_REQUIRED', 'SUPPORT_TICKET', 'USER_REPORT', 'PAYMENT_ISSUE', 'FEATURE_FLAG', 'SECURITY_ALERT', 'PERFORMANCE_ALERT');

-- CreateEnum
CREATE TYPE "public"."NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "stage" TEXT,
    "pricing" TEXT,
    "description" TEXT,
    "tagline" TEXT,
    "category" TEXT,
    "markets" TEXT[],
    "languages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."founders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_strategies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."StrategyStatus" NOT NULL DEFAULT 'PROPOSED',
    "positioning" JSONB NOT NULL,
    "audienceSegments" JSONB NOT NULL,
    "contentPillars" JSONB NOT NULL,
    "channelPlan" JSONB NOT NULL,
    "cadence" JSONB NOT NULL,
    "calendarSkeleton" JSONB NOT NULL,
    "generatedBy" TEXT,
    "confidence" DOUBLE PRECISION,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_pieces" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pillarId" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "status" "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."ContentType" NOT NULL DEFAULT 'POST',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "cta" TEXT,
    "hook" TEXT,
    "mediaRefs" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "seriesId" TEXT,
    "sequenceNo" INTEGER,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accountId" TEXT,
    "followersCount" INTEGER DEFAULT 0,
    "followingCount" INTEGER DEFAULT 0,
    "postsCount" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_posts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contentPieceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "status" "public"."PostStatus" NOT NULL DEFAULT 'SCHEDULED',
    "platformPostId" TEXT,
    "platformUrl" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleTemplateId" TEXT,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contentPieceId" TEXT,
    "scheduledPostId" TEXT,
    "socialAccountId" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "metricType" "public"."MetricType" NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "followersDelta" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "demos" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engagementRate" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brand_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tone" TEXT,
    "voice" TEXT,
    "allowedPhrases" TEXT[],
    "forbiddenPhrases" TEXT[],
    "allowedHashtags" TEXT[],
    "forbiddenHashtags" TEXT[],
    "complianceNotes" TEXT,
    "legalDisclaimer" TEXT,
    "claimsToAvoid" TEXT[],
    "approvalMode" "public"."ApprovalMode" NOT NULL DEFAULT 'MANUAL',
    "autoApprovalRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_pillars" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "emoji" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."series" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "cadence" TEXT NOT NULL,
    "totalPosts" INTEGER NOT NULL,
    "publishedPosts" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."SeriesStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weekly_summaries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "reportMd" TEXT NOT NULL,
    "recommendations" JSONB,
    "keyInsights" JSONB,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION DEFAULT 0,
    "topPerformer" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" INTEGER NOT NULL,
    "priceYearly" INTEGER,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "limits" JSONB NOT NULL,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSessionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "billingCycleAnchor" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL,
    "description" TEXT,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "amountDue" INTEGER NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "paymentMethod" TEXT,
    "hostedInvoiceUrl" TEXT,
    "invoicePdf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "cardFingerprint" TEXT,
    "cardCountry" TEXT,
    "cardFunding" TEXT,
    "bankName" TEXT,
    "accountType" TEXT,
    "routingNumber" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_records" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" "public"."UsageMetricType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER,
    "totalAmount" INTEGER,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "eventType" "public"."BillingEventType" NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "stripeEventId" TEXT,
    "stripeEventType" TEXT,
    "data" JSONB,
    "errorMessage" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "postsGenerated" INTEGER NOT NULL DEFAULT 0,
    "postsPublished" INTEGER NOT NULL DEFAULT 0,
    "strategiesGenerated" INTEGER NOT NULL DEFAULT 0,
    "organizationsCreated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedule_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "platforms" "public"."Platform"[],
    "scheduleType" "public"."ScheduleType" NOT NULL,
    "timeZone" TEXT NOT NULL,
    "recurringConfig" JSONB,
    "optimalTimeConfig" JSONB,
    "bulkConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "public"."EventType" NOT NULL DEFAULT 'POST_SCHEDULED',
    "status" "public"."EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "timeZone" TEXT NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "parentEventId" TEXT,
    "scheduledPostId" TEXT,
    "contentPieceId" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "color" TEXT,
    "hasConflicts" BOOLEAN NOT NULL DEFAULT false,
    "conflictsWith" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."optimal_posting_times" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "avgEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgReach" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgClicks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audienceActivity" JSONB,
    "competitorData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optimal_posting_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduling_conflicts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conflictType" "public"."ConflictType" NOT NULL,
    "severity" "public"."ConflictSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ConflictStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT NOT NULL,
    "affectedTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "relatedEvents" TEXT[],
    "relatedPosts" TEXT[],
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_exports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "exportType" "public"."ExportType" NOT NULL,
    "format" "public"."ExportFormat" NOT NULL,
    "status" "public"."ExportStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "includeEvents" "public"."EventType"[],
    "platforms" "public"."Platform"[],
    "fileName" TEXT,
    "fileSize" INTEGER,
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "targetUsers" TEXT[],
    "conditions" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'OPEN',
    "category" "public"."SupportCategory" NOT NULL DEFAULT 'GENERAL',
    "assignedTo" TEXT,
    "tags" TEXT[],
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_ticket_responses" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "userType" "public"."ResponseUserType" NOT NULL DEFAULT 'CUSTOMER',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_moderation_queue" (
    "id" TEXT NOT NULL,
    "contentPieceId" TEXT NOT NULL,
    "status" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."ModerationPriority" NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT,
    "automatedFlags" JSONB,
    "assignedTo" TEXT,
    "moderatedBy" TEXT,
    "moderationNote" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_health_metrics" (
    "id" TEXT NOT NULL,
    "metric" "public"."SystemMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "status" "public"."HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "details" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_notifications" (
    "id" TEXT NOT NULL,
    "type" "public"."AdminNotificationType" NOT NULL,
    "severity" "public"."NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetRoles" TEXT[],
    "targetUsers" TEXT[],
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readBy" TEXT[],
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "public"."accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "public"."sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "organizations_userId_idx" ON "public"."organizations"("userId");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_category_idx" ON "public"."organizations"("category");

-- CreateIndex
CREATE INDEX "founders_organizationId_idx" ON "public"."founders"("organizationId");

-- CreateIndex
CREATE INDEX "founders_isPrimary_idx" ON "public"."founders"("isPrimary");

-- CreateIndex
CREATE INDEX "ai_strategies_organizationId_idx" ON "public"."ai_strategies"("organizationId");

-- CreateIndex
CREATE INDEX "ai_strategies_status_idx" ON "public"."ai_strategies"("status");

-- CreateIndex
CREATE INDEX "ai_strategies_version_idx" ON "public"."ai_strategies"("version");

-- CreateIndex
CREATE INDEX "content_pieces_organizationId_idx" ON "public"."content_pieces"("organizationId");

-- CreateIndex
CREATE INDEX "content_pieces_platform_idx" ON "public"."content_pieces"("platform");

-- CreateIndex
CREATE INDEX "content_pieces_status_idx" ON "public"."content_pieces"("status");

-- CreateIndex
CREATE INDEX "content_pieces_scheduledAt_idx" ON "public"."content_pieces"("scheduledAt");

-- CreateIndex
CREATE INDEX "content_pieces_publishedAt_idx" ON "public"."content_pieces"("publishedAt");

-- CreateIndex
CREATE INDEX "content_pieces_seriesId_idx" ON "public"."content_pieces"("seriesId");

-- CreateIndex
CREATE INDEX "social_accounts_organizationId_idx" ON "public"."social_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "social_accounts_platform_idx" ON "public"."social_accounts"("platform");

-- CreateIndex
CREATE INDEX "social_accounts_isActive_idx" ON "public"."social_accounts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_organizationId_platform_handle_key" ON "public"."social_accounts"("organizationId", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_posts_idempotencyKey_key" ON "public"."scheduled_posts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "scheduled_posts_organizationId_idx" ON "public"."scheduled_posts"("organizationId");

-- CreateIndex
CREATE INDEX "scheduled_posts_contentPieceId_idx" ON "public"."scheduled_posts"("contentPieceId");

-- CreateIndex
CREATE INDEX "scheduled_posts_socialAccountId_idx" ON "public"."scheduled_posts"("socialAccountId");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_idx" ON "public"."scheduled_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_posts_status_idx" ON "public"."scheduled_posts"("status");

-- CreateIndex
CREATE INDEX "scheduled_posts_idempotencyKey_idx" ON "public"."scheduled_posts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "analytics_organizationId_idx" ON "public"."analytics"("organizationId");

-- CreateIndex
CREATE INDEX "analytics_contentPieceId_idx" ON "public"."analytics"("contentPieceId");

-- CreateIndex
CREATE INDEX "analytics_platform_idx" ON "public"."analytics"("platform");

-- CreateIndex
CREATE INDEX "analytics_metricType_idx" ON "public"."analytics"("metricType");

-- CreateIndex
CREATE INDEX "analytics_collectedAt_idx" ON "public"."analytics"("collectedAt");

-- CreateIndex
CREATE INDEX "analytics_periodStart_periodEnd_idx" ON "public"."analytics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "brand_rules_organizationId_key" ON "public"."brand_rules"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_s3Key_key" ON "public"."assets"("s3Key");

-- CreateIndex
CREATE INDEX "assets_organizationId_idx" ON "public"."assets"("organizationId");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "public"."assets"("type");

-- CreateIndex
CREATE INDEX "assets_tags_idx" ON "public"."assets"("tags");

-- CreateIndex
CREATE INDEX "content_pillars_organizationId_idx" ON "public"."content_pillars"("organizationId");

-- CreateIndex
CREATE INDEX "content_pillars_isActive_idx" ON "public"."content_pillars"("isActive");

-- CreateIndex
CREATE INDEX "series_organizationId_idx" ON "public"."series"("organizationId");

-- CreateIndex
CREATE INDEX "series_platform_idx" ON "public"."series"("platform");

-- CreateIndex
CREATE INDEX "series_status_idx" ON "public"."series"("status");

-- CreateIndex
CREATE INDEX "weekly_summaries_organizationId_idx" ON "public"."weekly_summaries"("organizationId");

-- CreateIndex
CREATE INDEX "weekly_summaries_weekStart_idx" ON "public"."weekly_summaries"("weekStart");

-- CreateIndex
CREATE INDEX "weekly_summaries_accepted_idx" ON "public"."weekly_summaries"("accepted");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "public"."subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripePriceId_key" ON "public"."subscription_plans"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripeProductId_key" ON "public"."subscription_plans"("stripeProductId");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "public"."subscription_plans"("isActive");

-- CreateIndex
CREATE INDEX "subscription_plans_sortOrder_idx" ON "public"."subscription_plans"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "public"."subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "public"."subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "public"."subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripeInvoiceId_key" ON "public"."invoices"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "public"."invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "public"."invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoices_stripeInvoiceId_idx" ON "public"."invoices"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripePaymentMethodId_key" ON "public"."payment_methods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "public"."payment_methods"("userId");

-- CreateIndex
CREATE INDEX "payment_methods_subscriptionId_idx" ON "public"."payment_methods"("subscriptionId");

-- CreateIndex
CREATE INDEX "payment_methods_stripePaymentMethodId_idx" ON "public"."payment_methods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "payment_methods_isDefault_idx" ON "public"."payment_methods"("isDefault");

-- CreateIndex
CREATE INDEX "usage_records_subscriptionId_idx" ON "public"."usage_records"("subscriptionId");

-- CreateIndex
CREATE INDEX "usage_records_userId_idx" ON "public"."usage_records"("userId");

-- CreateIndex
CREATE INDEX "usage_records_metricType_idx" ON "public"."usage_records"("metricType");

-- CreateIndex
CREATE INDEX "usage_records_periodStart_periodEnd_idx" ON "public"."usage_records"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "usage_records_recordedAt_idx" ON "public"."usage_records"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_stripeEventId_key" ON "public"."billing_events"("stripeEventId");

-- CreateIndex
CREATE INDEX "billing_events_userId_idx" ON "public"."billing_events"("userId");

-- CreateIndex
CREATE INDEX "billing_events_subscriptionId_idx" ON "public"."billing_events"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_events_eventType_idx" ON "public"."billing_events"("eventType");

-- CreateIndex
CREATE INDEX "billing_events_eventTime_idx" ON "public"."billing_events"("eventTime");

-- CreateIndex
CREATE INDEX "billing_events_stripeEventId_idx" ON "public"."billing_events"("stripeEventId");

-- CreateIndex
CREATE INDEX "usage_userId_idx" ON "public"."usage"("userId");

-- CreateIndex
CREATE INDEX "usage_month_idx" ON "public"."usage"("month");

-- CreateIndex
CREATE UNIQUE INDEX "usage_userId_month_key" ON "public"."usage"("userId", "month");

-- CreateIndex
CREATE INDEX "schedule_templates_organizationId_idx" ON "public"."schedule_templates"("organizationId");

-- CreateIndex
CREATE INDEX "schedule_templates_isActive_idx" ON "public"."schedule_templates"("isActive");

-- CreateIndex
CREATE INDEX "schedule_templates_scheduleType_idx" ON "public"."schedule_templates"("scheduleType");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_scheduledPostId_key" ON "public"."calendar_events"("scheduledPostId");

-- CreateIndex
CREATE INDEX "calendar_events_organizationId_idx" ON "public"."calendar_events"("organizationId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "public"."calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_eventType_idx" ON "public"."calendar_events"("eventType");

-- CreateIndex
CREATE INDEX "calendar_events_status_idx" ON "public"."calendar_events"("status");

-- CreateIndex
CREATE INDEX "calendar_events_isRecurring_idx" ON "public"."calendar_events"("isRecurring");

-- CreateIndex
CREATE INDEX "calendar_events_parentEventId_idx" ON "public"."calendar_events"("parentEventId");

-- CreateIndex
CREATE INDEX "calendar_events_tags_idx" ON "public"."calendar_events"("tags");

-- CreateIndex
CREATE INDEX "optimal_posting_times_organizationId_idx" ON "public"."optimal_posting_times"("organizationId");

-- CreateIndex
CREATE INDEX "optimal_posting_times_platform_idx" ON "public"."optimal_posting_times"("platform");

-- CreateIndex
CREATE INDEX "optimal_posting_times_score_idx" ON "public"."optimal_posting_times"("score");

-- CreateIndex
CREATE UNIQUE INDEX "optimal_posting_times_organizationId_platform_dayOfWeek_hou_key" ON "public"."optimal_posting_times"("organizationId", "platform", "dayOfWeek", "hour", "timeZone");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_organizationId_idx" ON "public"."scheduling_conflicts"("organizationId");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_conflictType_idx" ON "public"."scheduling_conflicts"("conflictType");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_status_idx" ON "public"."scheduling_conflicts"("status");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_affectedTime_idx" ON "public"."scheduling_conflicts"("affectedTime");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_severity_idx" ON "public"."scheduling_conflicts"("severity");

-- CreateIndex
CREATE INDEX "calendar_exports_organizationId_idx" ON "public"."calendar_exports"("organizationId");

-- CreateIndex
CREATE INDEX "calendar_exports_status_idx" ON "public"."calendar_exports"("status");

-- CreateIndex
CREATE INDEX "calendar_exports_createdAt_idx" ON "public"."calendar_exports"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "public"."audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "public"."audit_logs"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "public"."feature_flags"("name");

-- CreateIndex
CREATE INDEX "feature_flags_name_idx" ON "public"."feature_flags"("name");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "public"."feature_flags"("enabled");

-- CreateIndex
CREATE INDEX "feature_flags_createdBy_idx" ON "public"."feature_flags"("createdBy");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "public"."support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "public"."support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_assignedTo_idx" ON "public"."support_tickets"("assignedTo");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "public"."support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_createdAt_idx" ON "public"."support_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "support_ticket_responses_ticketId_idx" ON "public"."support_ticket_responses"("ticketId");

-- CreateIndex
CREATE INDEX "support_ticket_responses_userId_idx" ON "public"."support_ticket_responses"("userId");

-- CreateIndex
CREATE INDEX "support_ticket_responses_createdAt_idx" ON "public"."support_ticket_responses"("createdAt");

-- CreateIndex
CREATE INDEX "support_ticket_responses_userType_idx" ON "public"."support_ticket_responses"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "content_moderation_queue_contentPieceId_key" ON "public"."content_moderation_queue"("contentPieceId");

-- CreateIndex
CREATE INDEX "content_moderation_queue_status_idx" ON "public"."content_moderation_queue"("status");

-- CreateIndex
CREATE INDEX "content_moderation_queue_priority_idx" ON "public"."content_moderation_queue"("priority");

-- CreateIndex
CREATE INDEX "content_moderation_queue_assignedTo_idx" ON "public"."content_moderation_queue"("assignedTo");

-- CreateIndex
CREATE INDEX "content_moderation_queue_createdAt_idx" ON "public"."content_moderation_queue"("createdAt");

-- CreateIndex
CREATE INDEX "system_health_metrics_metric_idx" ON "public"."system_health_metrics"("metric");

-- CreateIndex
CREATE INDEX "system_health_metrics_status_idx" ON "public"."system_health_metrics"("status");

-- CreateIndex
CREATE INDEX "system_health_metrics_createdAt_idx" ON "public"."system_health_metrics"("createdAt");

-- CreateIndex
CREATE INDEX "admin_notifications_type_idx" ON "public"."admin_notifications"("type");

-- CreateIndex
CREATE INDEX "admin_notifications_severity_idx" ON "public"."admin_notifications"("severity");

-- CreateIndex
CREATE INDEX "admin_notifications_read_idx" ON "public"."admin_notifications"("read");

-- CreateIndex
CREATE INDEX "admin_notifications_createdAt_idx" ON "public"."admin_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."founders" ADD CONSTRAINT "founders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_strategies" ADD CONSTRAINT "ai_strategies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_pieces" ADD CONSTRAINT "content_pieces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_pieces" ADD CONSTRAINT "content_pieces_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "public"."content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_pieces" ADD CONSTRAINT "content_pieces_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_accounts" ADD CONSTRAINT "social_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_scheduleTemplateId_fkey" FOREIGN KEY ("scheduleTemplateId") REFERENCES "public"."schedule_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "public"."scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "public"."social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."brand_rules" ADD CONSTRAINT "brand_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_pillars" ADD CONSTRAINT "content_pillars_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."series" ADD CONSTRAINT "series_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weekly_summaries" ADD CONSTRAINT "weekly_summaries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_records" ADD CONSTRAINT "usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage" ADD CONSTRAINT "usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_templates" ADD CONSTRAINT "schedule_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "public"."calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "public"."scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "public"."content_pieces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."optimal_posting_times" ADD CONSTRAINT "optimal_posting_times_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_exports" ADD CONSTRAINT "calendar_exports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feature_flags" ADD CONSTRAINT "feature_flags_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_ticket_responses" ADD CONSTRAINT "support_ticket_responses_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_ticket_responses" ADD CONSTRAINT "support_ticket_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_moderation_queue" ADD CONSTRAINT "content_moderation_queue_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "public"."content_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_moderation_queue" ADD CONSTRAINT "content_moderation_queue_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_moderation_queue" ADD CONSTRAINT "content_moderation_queue_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
