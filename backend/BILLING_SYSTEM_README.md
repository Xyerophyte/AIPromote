# AI Promote - Billing & Subscription System

This document outlines the comprehensive billing and subscription system implemented for AI Promote, including Stripe integration, subscription management, usage tracking, and billing dashboard functionality.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Subscription Plans](#subscription-plans)
5. [API Endpoints](#api-endpoints)
6. [Usage Tracking & Metering](#usage-tracking--metering)
7. [Stripe Integration](#stripe-integration)
8. [Database Schema](#database-schema)
9. [Setup Instructions](#setup-instructions)
10. [Frontend Integration](#frontend-integration)
11. [Webhooks](#webhooks)
12. [Testing](#testing)

## Overview

The billing system provides a complete subscription-based SaaS solution with:
- Multiple subscription tiers (Starter, Growth, Scale)
- Stripe payment processing
- Usage tracking and metering
- Billing dashboard with invoice history
- Trial period management
- Payment method management
- Upgrade/downgrade flows
- Webhook handling for real-time synchronization

## Features

### Core Features
- ✅ **Subscription Management**: Create, update, cancel subscriptions
- ✅ **Payment Processing**: Secure payment handling via Stripe
- ✅ **Usage Tracking**: Real-time tracking of feature usage
- ✅ **Plan Limits**: Enforce usage limits based on subscription tiers
- ✅ **Billing Dashboard**: Comprehensive billing interface
- ✅ **Invoice Management**: Invoice history and downloads
- ✅ **Trial Periods**: 14-day free trial for all plans
- ✅ **Payment Methods**: Add, remove, and set default payment methods
- ✅ **Stripe Customer Portal**: Self-service billing management
- ✅ **Webhook Processing**: Real-time synchronization with Stripe

### Advanced Features
- ✅ **Usage Metering**: Track posts, strategies, organizations created
- ✅ **Plan Comparison**: Feature-based plan differentiation
- ✅ **Billing Analytics**: Usage trends and billing insights
- ✅ **Automatic Syncing**: Database sync with Stripe events
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Security**: Webhook signature verification

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   Stripe API    │
│                 │    │                 │    │                 │
│ Billing Pages   │◄──►│ Billing Routes  │◄──►│ Subscriptions   │
│ Payment Forms   │    │ Stripe Service  │    │ Payments        │
│ Usage Display   │    │ Usage Tracking  │    │ Webhooks        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │                 │
                    │ Subscriptions   │
                    │ Invoices        │
                    │ Usage Records   │
                    │ Payment Methods │
                    └─────────────────┘
```

## Subscription Plans

### Starter Plan - $29/month
- 50 AI-generated posts per month
- 2 marketing strategies
- 1 organization/brand
- Basic analytics
- Auto-scheduling
- Content calendar
- Email support

### Growth Plan - $79/month
- 200 AI-generated posts per month
- 5 marketing strategies
- 3 organizations/brands
- Advanced analytics & reporting
- Auto-scheduling with optimal timing
- Team collaboration (3 members)
- Priority email support
- A/B testing for content
- Custom content pillars

### Scale Plan - $199/month
- 1,000 AI-generated posts per month
- 20 marketing strategies
- 10 organizations/brands
- Advanced analytics & reporting
- Team collaboration (10 members)
- Priority support (phone + email)
- Custom integrations
- Dedicated account manager
- White-label options
- API access

## API Endpoints

### Subscription Plans
```
GET /api/v1/billing/plans
```
Get all available subscription plans.

### Subscription Management
```
GET /api/v1/billing/subscription
POST /api/v1/billing/subscription
PUT /api/v1/billing/subscription
DELETE /api/v1/billing/subscription
```

### Checkout & Portal
```
POST /api/v1/billing/checkout-session
POST /api/v1/billing/portal-session
```

### Payment Methods
```
GET /api/v1/billing/payment-methods
POST /api/v1/billing/payment-methods
PUT /api/v1/billing/payment-methods/:id/default
DELETE /api/v1/billing/payment-methods/:id
```

### Usage & Analytics
```
GET /api/v1/billing/usage
POST /api/v1/billing/usage
GET /api/v1/billing/dashboard
GET /api/v1/billing/invoices
```

### Webhooks
```
POST /api/v1/billing/webhooks/stripe
```

## Usage Tracking & Metering

### Metrics Tracked
- **POSTS_GENERATED**: AI-generated content pieces
- **POSTS_PUBLISHED**: Published social media posts
- **STRATEGIES_GENERATED**: Marketing strategies created
- **ORGANIZATIONS_CREATED**: Organizations/brands added

### Usage Enforcement
```typescript
// Check usage limits before action
const usageCheck = await usageTrackingService.checkUsageLimit(
  userId,
  'POSTS_GENERATED',
  1
);

if (!usageCheck.allowed) {
  throw new Error('Usage limit exceeded');
}

// Track usage after successful action
await usageTrackingService.trackUsage(
  userId,
  'POSTS_GENERATED',
  1
);
```

### Usage Middleware
```typescript
// Apply to protected routes
fastify.register(async function(fastify) {
  fastify.addHook('preHandler', 
    usageTrackingService.createUsageLimitMiddleware('POSTS_GENERATED')
  );
  
  fastify.post('/create-post', async (request, reply) => {
    // Create post logic
    await request.trackUsage(); // Track after success
  });
});
```

## Stripe Integration

### Configuration
Set up the following environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_STARTER_PRICE_ID=price_starter_monthly
STRIPE_GROWTH_PRICE_ID=price_growth_monthly
STRIPE_SCALE_PRICE_ID=price_scale_monthly

TRIAL_PERIOD_DAYS=14
```

### Key Services
1. **Customer Management**: Create and manage Stripe customers
2. **Subscription Lifecycle**: Handle subscription creation, updates, cancellation
3. **Payment Methods**: Manage customer payment methods
4. **Webhook Processing**: Sync Stripe events with local database
5. **Invoice Management**: Track and display billing history

## Database Schema

### Key Models
- `SubscriptionPlan`: Plan definitions and pricing
- `Subscription`: User subscription records
- `Invoice`: Billing history
- `PaymentMethod`: Stored payment methods
- `UsageRecord`: Detailed usage tracking
- `Usage`: Monthly usage aggregates
- `BillingEvent`: Audit trail of billing events

### Relationships
```
User ──► Subscription ──► SubscriptionPlan
  │           │
  ▼           ▼
Usage    PaymentMethod
  │           │
  ▼           ▼
UsageRecord Invoice
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install stripe @types/stripe
```

### 2. Environment Configuration
Copy `.env.example` and configure Stripe variables:
```bash
cp .env.example .env
# Edit .env with your Stripe keys
```

### 3. Database Migration
```bash
npm run db:push
```

### 4. Seed Subscription Plans
```bash
npx ts-node prisma/seed-billing.ts
```

### 5. Create Stripe Products
1. Log into Stripe Dashboard
2. Create products for each plan
3. Create price objects for monthly/yearly billing
4. Update environment variables with price IDs

### 6. Configure Webhooks
1. Create webhook endpoint in Stripe Dashboard
2. Point to: `https://yourdomain.com/api/v1/billing/webhooks/stripe`
3. Select relevant events:
   - `customer.subscription.*`
   - `invoice.*`
   - `payment_method.*`
   - `checkout.session.completed`

## Frontend Integration

### Checkout Flow
```javascript
// Create checkout session
const response = await fetch('/api/v1/billing/checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'starter_plan_id' })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

### Billing Dashboard
```javascript
// Get billing dashboard data
const response = await fetch('/api/v1/billing/dashboard');
const {
  subscription,
  usage,
  usageTrend,
  upcomingInvoice
} = await response.json();

// Display subscription status, usage meters, billing history
```

### Customer Portal
```javascript
// Open Stripe Customer Portal
const response = await fetch('/api/v1/billing/portal-session', {
  method: 'POST'
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Portal
```

## Webhooks

### Supported Events
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.created`
- `payment_method.attached`
- `payment_method.detached`
- `checkout.session.completed`

### Webhook Security
All webhooks are verified using Stripe's signature verification:
```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);
```

## Testing

### Test Cards
Use Stripe test cards for development:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Require 3DS: `4000002500003155`

### Test Webhooks
Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe
```

### Usage Testing
```typescript
// Test usage tracking
await usageTrackingService.trackUsage(userId, 'POSTS_GENERATED', 5);

// Test limit checking
const check = await usageTrackingService.checkUsageLimit(
  userId, 
  'POSTS_GENERATED', 
  1
);
console.log('Usage allowed:', check.allowed);
```

## Security Considerations

1. **Webhook Verification**: All webhooks verify Stripe signatures
2. **Environment Variables**: Sensitive keys stored in environment variables
3. **Rate Limiting**: API endpoints protected with rate limiting
4. **Input Validation**: All inputs validated before processing
5. **Error Handling**: Comprehensive error handling without exposing sensitive data

## Monitoring & Analytics

### Key Metrics to Monitor
- Subscription conversion rates
- Churn rates by plan
- Usage patterns
- Payment failures
- Trial to paid conversion

### Logging
All billing events are logged for audit trails:
- Subscription changes
- Payment events
- Usage tracking
- Webhook processing

## Troubleshooting

### Common Issues
1. **Webhook Failures**: Check endpoint URL and signature verification
2. **Payment Failures**: Monitor payment method status and customer notifications
3. **Usage Sync**: Verify usage tracking middleware is applied to relevant endpoints
4. **Trial Extensions**: Check trial period configuration in Stripe

### Debug Mode
Enable detailed logging in development:
```env
LOG_LEVEL=debug
```

This comprehensive billing system provides a solid foundation for a subscription-based SaaS application with proper usage tracking, payment processing, and customer management.
