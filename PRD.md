# AIPromote – Done-for-you Marketing OS for AI Startups  
## Founder-in, Marketing-out  
**Product Requirements Document (PRD)**  
*Version 1.0*  
*Date: April 5, 2025*

---

## 📌 Executive Summary

AIPromote turns a founder’s startup brief into an end-to-end marketing engine: audience and positioning, content strategy, channel plan, content calendar, creative assets, post copy, and automated scheduling across social platforms. Founders describe their startup once; the platform keeps publishing, learning from performance, and iterating to maximize reach.

---

## 🎯 MVP Goals

### ✅ In Scope
- **Intake**: Rich founder interview (company, product, ICP, USP, competitors, voice, goals, assets).
- **Strategy**: Auto-generate a 90-day marketing plan (audiences, positioning, pillars, channels, cadence).
- **Content Engine**: Generate channel-specific post series mapped to a content calendar.
- **Distribution**: Connect social accounts; schedule/publish automatically.
- **Feedback Loop**: Basic analytics; AI iterates strategy and content.
- **Founder Control**: Review queue and guardrails for brand/voice.

### ❌ Non-Goals (MVP)
- Video generation or advanced media editing.
- Agency multi-tenant or white-label support.
- Deep audience demographic analytics.
- Long-form blog generation.
- Team collaboration or multi-user roles (post-MVP).

---

## 👥 Personas

| Persona | Needs |
|--------|-------|
| **Indie/Solo AI Builder** | Need quick content and consistent posting with minimal effort. |
| **Small Product Team** | Planning campaign timelines, approvals, predictable posting. |
| **Growth Marketer** | Analytics, A/B testing, optimization levers. |

---

## 🔁 Key User Flows

### 1. Founder Intake
Founder completes a multi-step onboarding flow:
- **Startup basics**: Name, category, URL, pricing, GTM stage, geography, languages.
- **ICP**: Personas, jobs-to-be-done, pain points, industries, priority segments.
- **Positioning**: USP, differentiators, proof points (metrics, customers), competitors.
- **Brand**: Tone/voice, taboo phrases, words to use/avoid, example content.
- **Goals**: KPIs (followers, signups, demos), target platforms, posting frequency.
- **Assets**: Logos, screenshots, demo videos, case studies, blog links.
- **Constraints**: Compliance, claims to avoid, brand guidelines.

> *Optional: Upload files or provide URL for auto-scraping.*

---

### 2. Strategy Generation
**AI Output**:
- Positioning brief & messaging hierarchy
- Audience segments + key messages
- 3–5 content pillars (e.g., educational, product, founder story)
- Channel strategy per platform (X, LinkedIn, Instagram, TikTok, YouTube Shorts, Reddit)
- Cadence plan with optimal posting windows (by ICP timezone)
- 90-day content calendar skeleton (JSON)

> Editable in-app with diff tracking.

---

### 3. Content Generation
For each pillar and platform:
- **Series templates**: 10-part thread, weekly founder logs, customer stories.
- **Draft posts**: Platform-optimized (length, hooks, CTAs, hashtags, emojis, links).
- **Creative**: Headline, copy, image prompts; optional caption cards.
- **Bulk generation**: First 2 weeks auto-generated; future weeks generated weekly.
- **Review modes**: Auto-publish or queue for approval.

---

### 4. Distribution & Scheduling
- **OAuth Connect**: Twitter/X, LinkedIn (MVP); stubs for IG, TikTok, YouTube Shorts, Reddit.
- **Smart Scheduler**: Best-time models, conflict avoidance, timezone-aware.
- **Publishing Workers**: Retry logic, error surfacing, idempotent attempts.

---

### 5. Analytics & Learning
- Metrics per post: impressions, likes, comments, shares, clicks, follower delta.
- Weekly performance summary: what worked, what didn’t, suggested pivots.
- **Auto-iteration**: AI adjusts hooks, formats, cadence, CTAs based on performance.

---

### 6. Founder Controls
- **Strategy Editor**: Accept or reject AI-proposed strategy changes.
- **Brand Guardrails**: Forbidden topics/phrases, compliance notes.
- **Approval Pipelines**: Thresholds (e.g., founder must approve any performance claims).

---

## 🧩 Feature Scope (MVP)

### Intake & Knowledge Graph
- Multi-step intake wizard with file upload + website scrape.
- Structured startup profile stored in DB.
- Semantic memory for AI prompt context.

### Strategy Engine
- LLM chain generates strategy document + calendar skeleton (JSON).
- In-app editing with change tracking.
- Accept/reject proposed strategy diffs.

### Content Engine
- Prompt templates per platform.
- JSON output with variants, rationale, hooks, CTAs.
- Content library: drafts, approved, scheduled, published, failed.
- Series planner (e.g., 4-week education series).

### Scheduling & Publishing
- Calendar/list view.
- One-click approve all for the week.
- OAuth + publishing for X and LinkedIn.
- Retry logic, idempotent attempts, failure alerts.

### Analytics & Feedback
- Pull and aggregate post metrics.
- Weekly “AI Growth Coach” summary with proposed changes.
- Auto-iteration trigger from performance data.

### Brand & Compliance
- Phrase filters (forbidden/allowed).
- Tone constraints.
- PII and compliance guardrails.
- Review gates per pillar or platform.

### Plans & Limits
| Tier | Startups | Platforms | Posts/Month | Approval | Analytics | Auto-Iteration |
|------|---------|----------|-------------|----------|----------|----------------|
| Free | 1 | X, LinkedIn | 20 | Manual | 14-day | ❌ |
| Pro | 3 | All | 200 | Auto-opt-in | 90-day | ✅ |

> Overages: Warning → hard stop → upgrade CTA.

---

## ⚙️ System Architecture

### Frontend
- **Framework**: Next.js 15 + React 19
- **UI**: Shadcn UI + Tailwind CSS
- **Pages**:
  - `/intake` – Multi-step interview wizard
  - `/strategy` – Editable plan with diff view
  - `/content` – Library, editor, series planner
  - `/schedule` – Calendar/list view
  - `/analytics` – Performance + AI coach
  - `/settings` – Brand rules, connections, billing

### Backend
- **Runtime**: Node.js 20 + Fastify (or Next API routes)
- **Language**: TypeScript
- **Validation**: Zod
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Redis + BullMQ
- **Storage**: S3 (for assets)
- **LLM Providers**: OpenAI, Anthropic
- **Social APIs**: Twitter/X, LinkedIn (MVP)
- **Webhooks**: Stripe, OAuth, cron triggers

### Workers
- `generateWeekPlan(startup_id, week)` – Generate next week’s content
- `publish(content_item_id)` – Publish to platform
- `collectMetrics(content_item_id)` – Pull and upsert metrics
- `weeklySummary(startup_id)` – Generate AI coach report + recommendations

---

## 🗃️ Data Model (Prisma)

```prisma
model User {
  id               String       @id @default(cuid())
  email            String       @unique
  passwordHash     String?
  name             String?
  plan             String       @default("free")
  createdAt        DateTime     @default(now())
  startups         Startup[]
  subscriptions    Subscription[]
  usage            Usage[]
}

model Startup {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id])
  name             String
  url              String?
  stage            String       // e.g., pre-seed, growth
  pricing          String?
  description      String?
  tagline          String?
  category         String?
  markets          String[]     // e.g., ["US", "EU"]
  languages        String[]     // e.g., ["en", "es"]
  createdAt        DateTime     @default(now())
  brandRules       BrandRule?
  assets           Asset[]
  strategyDocs     StrategyDoc[]
  contentPillars   ContentPillar[]
  contentItems     ContentItem[]
  series           Series[]
  socialAccounts   SocialAccount[]
  metrics          Metric[]
  weeklySummaries  WeeklySummary[]
}

model BrandRule {
  id               String       @id @default(cuid())
  startupId        String
  startup          Startup      @relation(fields: [startupId], references: [id])
  tone             String?      // e.g., "casual", "professional"
  allowedPhrases   String[]
  forbiddenPhrases String[]
  complianceNotes  String?
  approvalMode     String       @default("manual") // "auto", "manual"
}

model Asset {
  id           String   @id @default(cuid())
  startupId    String
  startup      Startup  @relation(fields: [startupId], references: [id])
  type         String   // logo, screenshot, video, case_study
  s3Key        String
  mime         String
  size         Int
  createdAt    DateTime @default(now())
}

model StrategyDoc {
  id          String    @id @default(cuid())
  startupId   String
  startup     Startup   @relation(fields: [startupId], references: [id])
  version     Int       @default(1)
  contentJson Json
  status      String    @default("proposed") // "active", "proposed"
  createdAt   DateTime  @default(now())
}

model ContentPillar {
  id          String   @id @default(cuid())
  startupId   String
  startup     Startup  @relation(fields: [startupId], references: [id])
  name        String   // e.g., "Education"
  description String?
}

model ContentItem {
  id             String       @id @default(cuid())
  startupId      String
  startup        Startup      @relation(fields: [startupId], references: [id])
  pillarId       String?
  pillar         ContentPillar? @relation(fields: [pillarId], references: [id])
  platform       String       // "x", "linkedin", "instagram"
  status         String       @default("draft") // draft, approved, scheduled, published, failed
  scheduledAt    DateTime?
  publishedAt    DateTime?
  body           String
  mediaRefs      Json?        // { image: s3Key, prompt: string }
  rationale      String?      // Why this hook/format
  seriesId       String?
  sequenceNo     Int?
  createdAt      DateTime     @default(now())
  postAttempts   PostAttempt[]
  metrics        Metric[]
}

model Series {
  id          String         @id @default(cuid())
  startupId   String
  startup     Startup        @relation(fields: [startupId], references: [id])
  name        String         // e.g., "AI Tips Series"
  platform    String
  cadence     String         // weekly, biweekly
  totalPosts  Int
  createdAt   DateTime       @default(now())
  contentItems ContentItem[]
}

model PostAttempt {
  id             String     @id @default(cuid())
  contentItemId  String
  contentItem    ContentItem @relation(fields: [contentItemId], references: [id])
  platformPostId String?
  status         String     // success, failed
  errorMessage   String?
  attemptNo      Int        @default(1)
  createdAt      DateTime   @default(now())
}

model SocialAccount {
  id                  String   @id @default(cuid())
  startupId           String
  startup             Startup  @relation(fields: [startupId], references: [id])
  platform            String   // "x", "linkedin"
  handle              String
  accessTokenEncrypted String
  refreshTokenEncrypted String?
  expiresAt           DateTime?
}

model Metric {
  id               String    @id @default(cuid())
  contentItemId    String
  contentItem      ContentItem @relation(fields: [contentItemId], references: [id])
  platform         String
  impressions      Int       @default(0)
  likes            Int       @default(0)
  comments         Int       @default(0)
  shares           Int       @default(0)
  clicks           Int       @default(0)
  followersDelta   Int       @default(0)
  collectedAt      DateTime  @default(now())
}

model WeeklySummary {
  id              String   @id @default(cuid())
  startupId       String
  startup         Startup  @relation(fields: [startupId], references: [id])
  weekStart       DateTime
  reportMd        String   // Markdown summary
  recommendations Json?    // { strategyChanges, contentPivots }
  accepted        Boolean  @default(false)
  createdAt       DateTime @default(now())
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  planId      String
  status      String   // active, canceled
  stripeId    String
  createdAt   DateTime @default(now())
}

model Usage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  month     DateTime @default(now())
  postsGenerated Int @default(0)
  postsPublished Int @default(0)
}

Key API Endpoints
Intake & Strategy
GET/POST /api/startups – CRUD startup
POST /api/startups/:id/strategy/generate – Generate strategy
GET /api/startups/:id/strategy – Get active/proposed strategy
POST /api/strategy/:id/accept – Accept strategy diff
Content
POST /api/startups/:id/content/generate – Generate content (by pillars, platforms, weeks)
GET /api/startups/:id/content?status=&platform=&series_id= – List content
PATCH /api/content/:id – Edit body, status, schedule
POST /api/content/:id/approve – Approve for scheduling
Scheduling & Publishing
POST /api/content/:id/schedule – Set publish time
POST /api/content/:id/publish-now – Immediate publish
Social Connections
GET /api/social/:startupId/accounts – List connected accounts
POST /api/social/:startupId/connect/:platform/start – Initiate OAuth
GET /api/social/:startupId/connect/:platform/callback – Handle callback
Analytics & Learning
GET /api/startups/:id/analytics/summary – Weekly performance
GET /api/content/:id/metrics – Post-level metrics
POST /api/startups/:id/weekly-summary/generate – Run AI coach
POST /api/startups/:id/strategy/propose-from-summary/:summaryId – Propose strategy update
Billing & Usage
POST /api/billing/checkout – Upgrade via Stripe
GET /api/usage – Current usage
Auth
POST /api/auth/signup|login|logout|reset-password
OAuth: Google/GitHub (app), platform OAuth (per startup)

System: Senior growth marketer for AI startups. Produce a concise marketing strategy tailored to the startup details and ICP. Output JSON: {
  positioning,
  audience_segments[],
  content_pillars[],
  channel_plan[],
  cadence,
  calendar_skeleton[]
}

System: Social media copywriter. Given startup profile, pillar, platform, generate N variants with platform constraints. Output JSON: [
  {
    platform,
    pillar,
    body,
    hashtags[],
    cta,
    hook,
    notes,
    estimated_length
  }
]

System: Growth analyst. Given last week’s posts and metrics, summarize patterns and propose strategy/content changes. Output: markdown summary + JSON recommendations.

⏱ Scheduling Logic
Best-time windows per platform (based on ICP timezone).
Avoid duplicate posts.
Idempotency keys for retries.
Auto-shift on conflicts.
Retry up to 3 times; surface errors in UI.
📊 Analytics (MVP)
Per-Post Metrics
Impressions, likes, comments, shares, clicks, follower delta
Weekly Aggregates
Posts published
Avg. engagement rate
Follower growth trend
Insights
Top-performing hooks and formats
Underperforming pillars
Channel mix efficiency
🔒 Security & Brand Safety
Encrypt OAuth tokens at rest (AES-GCM), rotate keys.
Profanity, claim, and PII filters.
Tone and brand guardrails enforced.
Approval gates ON by default; auto-publish opt-in.
Logging with redaction.
Scoped tokens; RBAC planned post-MVP.