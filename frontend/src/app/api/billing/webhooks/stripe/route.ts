import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
      case 'customer.updated':
        await handleCustomerUpdate(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const stripeCustomerId = subscription.customer as string
    
    await prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date()
      }
    })

    console.log(`Subscription updated: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const stripeCustomerId = subscription.customer as string
    
    await prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`Subscription deleted: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const stripeCustomerId = invoice.customer as string
    
    // Create invoice record
    await prisma.invoice.create({
      data: {
        subscription: {
          connect: {
            stripeCustomerId
          }
        },
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'PAID',
        issueDate: new Date(invoice.created * 1000),
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      }
    })

    // Update user's plan based on successful payment
    if (invoice.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id }
      })

      if (subscription) {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: subscription.planId }
        })
      }
    }

    console.log(`Payment succeeded: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const stripeCustomerId = invoice.customer as string
    
    // Create invoice record
    await prisma.invoice.create({
      data: {
        subscription: {
          connect: {
            stripeCustomerId
          }
        },
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'FAILED',
        issueDate: new Date(invoice.created * 1000),
        invoiceUrl: invoice.hosted_invoice_url,
      }
    })

    console.log(`Payment failed: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleCustomerUpdate(customer: Stripe.Customer) {
  try {
    // Update any user info if needed
    if (customer.metadata.userId) {
      await prisma.user.update({
        where: { id: customer.metadata.userId },
        data: {
          email: customer.email || undefined,
          updatedAt: new Date()
        }
      })
    }

    console.log(`Customer updated: ${customer.id}`)
  } catch (error) {
    console.error('Error handling customer update:', error)
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active': return 'ACTIVE'
    case 'trialing': return 'TRIALING'
    case 'incomplete': return 'PENDING'
    case 'incomplete_expired': return 'EXPIRED'
    case 'past_due': return 'PAST_DUE'
    case 'canceled': return 'CANCELED'
    case 'unpaid': return 'UNPAID'
    default: return 'PENDING'
  }
}
