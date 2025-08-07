import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { withErrorHandling, ConflictError, NotFoundError } from '@/lib/api-errors'
import { withRateLimit, CommonRateLimiters } from '@/lib/rate-limit'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const CreateSubscriptionSchema = z.object({
  planId: z.string(),
  paymentMethodId: z.string().optional(),
})

const UpdateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

// GET /api/billing/subscription - Get current user's subscription
async function getSubscriptionHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    include: {
      plan: true,
      invoices: {
        orderBy: { issueDate: 'desc' },
        take: 10,
      },
      paymentMethods: {
        where: { isActive: true },
        orderBy: { isDefault: 'desc' },
      },
    },
  })

  if (!subscription) {
    return NextResponse.json({
      success: true,
      data: { subscription: null }
    })
  }

  // Get upcoming invoice if subscription is active
  let upcomingInvoice = null
  if (subscription.status === 'ACTIVE' && subscription.stripeSubscriptionId) {
    try {
      const stripeInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: subscription.stripeSubscriptionId,
      })
      upcomingInvoice = {
        amount: stripeInvoice.amount_due,
        currency: stripeInvoice.currency,
        periodEnd: new Date(stripeInvoice.period_end * 1000),
      }
    } catch (error) {
      console.warn('Could not fetch upcoming invoice:', error)
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      subscription: {
        ...subscription,
        upcomingInvoice,
      },
    }
  })
}

// POST /api/billing/subscription - Create new subscription
async function createSubscriptionHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  const body = CreateSubscriptionSchema.parse(await request.json())

  // Check if user already has an active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  })

  if (existingSubscription) {
    throw new ConflictError('User already has an active subscription')
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: body.planId }
  })

  if (!plan) {
    throw new NotFoundError('Subscription plan not found')
  }

  // Create or retrieve Stripe customer
  let stripeCustomer
  try {
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length > 0) {
      stripeCustomer = customers.data[0]
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      })
    }
  } catch (error) {
    console.error('Stripe customer error:', error)
    throw new Error('Failed to create customer')
  }

  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: stripeCustomer.id,
    items: [{ price: plan.stripePriceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: process.env.BILLING_TRIAL_DAYS ? parseInt(process.env.BILLING_TRIAL_DAYS) : undefined,
  })

  // Create subscription record in database
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: body.planId,
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: stripeSubscription.id,
      status: 'PENDING',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
    },
    include: { plan: true }
  })

  const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice
  
  return NextResponse.json({
    success: true,
    data: {
      subscription,
      clientSecret: (latestInvoice.payment_intent as Stripe.PaymentIntent)?.client_secret,
    }
  }, { status: 201 })
}

// PUT /api/billing/subscription - Update subscription
async function updateSubscriptionHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  const body = UpdateSubscriptionSchema.parse(await request.json())

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
  })

  if (!subscription?.stripeSubscriptionId) {
    throw new NotFoundError('No subscription found')
  }

  const updateData: any = {}
  
  if (body.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: body.planId }
    })

    if (!plan) {
      throw new NotFoundError('Subscription plan not found')
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: plan.stripePriceId,
      }],
      proration_behavior: 'create_prorations',
    })

    updateData.planId = body.planId
  }

  if (body.cancelAtPeriodEnd !== undefined) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: body.cancelAtPeriodEnd
    })

    updateData.cancelAtPeriodEnd = body.cancelAtPeriodEnd
  }

  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscription.id },
    data: updateData,
    include: { plan: true }
  })

  return NextResponse.json({
    success: true,
    data: { subscription: updatedSubscription }
  })
}

// DELETE /api/billing/subscription - Cancel subscription
async function cancelSubscriptionHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
  })

  if (!subscription?.stripeSubscriptionId) {
    throw new NotFoundError('No subscription found')
  }

  // Cancel Stripe subscription at period end
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true
  })

  const cancelledSubscription = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { 
      cancelAtPeriodEnd: true,
      updatedAt: new Date()
    },
    include: { plan: true }
  })

  return NextResponse.json({
    success: true,
    data: { subscription: cancelledSubscription }
  })
}

export const GET = withRateLimit(
  withErrorHandling(getSubscriptionHandler),
  CommonRateLimiters.api
)

export const POST = withRateLimit(
  withErrorHandling(createSubscriptionHandler),
  CommonRateLimiters.api
)

export const PUT = withRateLimit(
  withErrorHandling(updateSubscriptionHandler),
  CommonRateLimiters.api
)

export const DELETE = withRateLimit(
  withErrorHandling(cancelSubscriptionHandler),
  CommonRateLimiters.api
)
