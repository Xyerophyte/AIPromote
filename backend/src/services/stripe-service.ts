import Stripe from 'stripe';
import { config } from '../config/config';
import { prisma } from './database';
import { 
  SubscriptionStatus, 
  InvoiceStatus, 
  BillingEventType, 
  UsageMetricType 
} from '@prisma/client';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  paymentMethodId?: string;
  trialPeriodDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPlanId?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
  }

  // Customer Management
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    const { userId, email, name } = params;
    
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer;
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  // Subscription Management
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    const { userId, planId, paymentMethodId, trialPeriodDays } = params;

    // Get user and plan data
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    
    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    // Create or get Stripe customer
    let customerId: string;
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await this.createCustomer({
        userId,
        email: user.email,
        name: user.name || undefined,
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: plan.stripePriceId! }],
      metadata: {
        userId,
        planId,
      },
    };

    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    if (trialPeriodDays) {
      subscriptionParams.trial_period_days = trialPeriodDays;
    }

    const subscription = await this.stripe.subscriptions.create(subscriptionParams);

    // Create subscription record in database
    await this.syncSubscriptionToDatabase(subscription);

    return subscription;
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    const { subscriptionId, newPlanId, cancelAtPeriodEnd } = params;

    const updateParams: Stripe.SubscriptionUpdateParams = {};

    if (newPlanId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } });
      if (!plan?.stripePriceId) {
        throw new Error('Plan not found or missing Stripe price ID');
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          price: plan.stripePriceId,
        },
      ];
      updateParams.proration_behavior = 'create_prorations';
    }

    if (cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = cancelAtPeriodEnd;
    }

    const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);
    await this.syncSubscriptionToDatabase(subscription);

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, cancelImmediately = false): Promise<Stripe.Subscription> {
    if (cancelImmediately) {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      await this.syncSubscriptionToDatabase(subscription);
      return subscription;
    } else {
      return this.updateSubscription({
        subscriptionId,
        cancelAtPeriodEnd: true,
      });
    }
  }

  // Payment Methods
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Sync to database
    await this.syncPaymentMethodToDatabase(paymentMethod, customerId);

    return paymentMethod;
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
    
    // Remove from database
    await prisma.paymentMethod.delete({
      where: { stripePaymentMethodId: paymentMethodId },
    });

    return paymentMethod;
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update database
    await prisma.paymentMethod.updateMany({
      where: { 
        user: { subscriptions: { some: { stripeCustomerId: customerId } } }
      },
      data: { isDefault: false },
    });

    await prisma.paymentMethod.update({
      where: { stripePaymentMethodId: paymentMethodId },
      data: { isDefault: true },
    });

    return customer;
  }

  // Checkout Sessions
  async createCheckoutSession(params: {
    userId: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    const { userId, planId, successUrl, cancelUrl, trialPeriodDays } = params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId!,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    };

    if (trialPeriodDays) {
      sessionParams.subscription_data!.trial_period_days = trialPeriodDays;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return session;
  }

  // Customer Portal
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  }

  // Usage Tracking
  async recordUsage(params: {
    subscriptionId: string;
    userId: string;
    metricType: UsageMetricType;
    quantity: number;
    timestamp?: Date;
  }): Promise<void> {
    const { subscriptionId, userId, metricType, quantity, timestamp = new Date() } = params;

    const startOfMonth = new Date(timestamp.getFullYear(), timestamp.getMonth(), 1);
    const endOfMonth = new Date(timestamp.getFullYear(), timestamp.getMonth() + 1, 0);

    await prisma.usageRecord.create({
      data: {
        subscriptionId,
        userId,
        metricType,
        quantity,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        recordedAt: timestamp,
      },
    });
  }

  // Invoice Management
  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  }

  async getUpcomingInvoice(subscriptionId: string): Promise<Stripe.Invoice> {
    const invoice = await this.stripe.invoices.retrieveUpcoming({
      subscription: subscriptionId,
    });

    return invoice;
  }

  // Webhook Handling
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      console.log('Stripe webhook received:', event.type);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionEvent(event);
          break;
        
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
        case 'invoice.created':
          await this.handleInvoiceEvent(event);
          break;
        
        case 'payment_method.attached':
        case 'payment_method.detached':
          await this.handlePaymentMethodEvent(event);
          break;
        
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event);
          break;
        
        default:
          console.log('Unhandled webhook event:', event.type);
      }

      // Log the event
      await this.logBillingEvent(event);
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  // Private methods for database synchronization
  private async syncSubscriptionToDatabase(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    const planId = subscription.metadata.planId;
    
    if (!userId || !planId) {
      console.error('Missing userId or planId in subscription metadata');
      return;
    }

    const status = this.mapStripeSubscriptionStatus(subscription.status);
    
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
      create: {
        userId,
        planId,
        status,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });
  }

  private async syncPaymentMethodToDatabase(paymentMethod: Stripe.PaymentMethod, customerId: string): Promise<void> {
    // Get user from customer ID
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
      include: { user: true },
    });

    if (!subscription) {
      console.error('No subscription found for customer:', customerId);
      return;
    }

    await prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: paymentMethod.id },
      update: {
        type: paymentMethod.type,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
        cardCountry: paymentMethod.card?.country,
        cardFunding: paymentMethod.card?.funding,
        isActive: true,
      },
      create: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        stripePaymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
        cardCountry: paymentMethod.card?.country,
        cardFunding: paymentMethod.card?.funding,
        isActive: true,
      },
    });
  }

  private async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    await this.syncSubscriptionToDatabase(subscription);
  }

  private async handleInvoiceEvent(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      console.error('No subscription found for invoice:', invoice.id);
      return;
    }

    const status = this.mapStripeInvoiceStatus(invoice.status);

    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status,
        amountPaid: invoice.amount_paid,
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        invoiceNumber: invoice.number || `INV-${invoice.id}`,
        status,
        subtotal: invoice.subtotal,
        tax: invoice.tax || 0,
        discount: invoice.discount?.amount || 0,
        total: invoice.total,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        issueDate: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      },
    });
  }

  private async handlePaymentMethodEvent(event: Stripe.Event): Promise<void> {
    // Handle payment method events if needed
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
      await this.syncSubscriptionToDatabase(subscription);
    }
  }

  private async logBillingEvent(event: Stripe.Event): Promise<void> {
    const eventType = this.mapStripeToBillingEventType(event.type);
    
    await prisma.billingEvent.create({
      data: {
        eventType,
        status: 'success',
        stripeEventId: event.id,
        stripeEventType: event.type,
        data: event.data.object as any,
        eventTime: new Date(event.created * 1000),
        processedAt: new Date(),
      },
    });
  }

  private mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELLED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private mapStripeInvoiceStatus(status: Stripe.Invoice.Status): InvoiceStatus {
    switch (status) {
      case 'draft':
        return InvoiceStatus.DRAFT;
      case 'open':
        return InvoiceStatus.OPEN;
      case 'paid':
        return InvoiceStatus.PAID;
      case 'void':
        return InvoiceStatus.VOID;
      case 'uncollectible':
        return InvoiceStatus.UNCOLLECTIBLE;
      default:
        return InvoiceStatus.DRAFT;
    }
  }

  private mapStripeToBillingEventType(eventType: string): BillingEventType {
    switch (eventType) {
      case 'customer.subscription.created':
        return BillingEventType.SUBSCRIPTION_CREATED;
      case 'customer.subscription.updated':
        return BillingEventType.SUBSCRIPTION_UPDATED;
      case 'customer.subscription.deleted':
        return BillingEventType.SUBSCRIPTION_CANCELLED;
      case 'invoice.payment_succeeded':
        return BillingEventType.PAYMENT_SUCCEEDED;
      case 'invoice.payment_failed':
        return BillingEventType.PAYMENT_FAILED;
      case 'invoice.created':
        return BillingEventType.INVOICE_CREATED;
      case 'invoice.paid':
        return BillingEventType.INVOICE_PAID;
      case 'payment_method.attached':
        return BillingEventType.PAYMENT_METHOD_ATTACHED;
      case 'payment_method.detached':
        return BillingEventType.PAYMENT_METHOD_DETACHED;
      default:
        return BillingEventType.SUBSCRIPTION_UPDATED;
    }
  }
}

export const stripeService = new StripeService();
