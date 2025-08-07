import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia', // Use the latest API version
})

export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: Record<string, string>
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  paymentMethodId?: string
  trialDays?: number
  metadata?: Record<string, string>
}

export interface CreatePaymentIntentParams {
  amount: number // in cents
  currency: string
  customerId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
  popular?: boolean
}

// Define subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals getting started with AI content',
    price: 1900, // $19.00
    currency: 'usd',
    interval: 'month',
    features: [
      'Generate up to 100 posts per month',
      '3 social media platforms',
      'Basic analytics',
      'Email support',
    ],
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses and creators',
    price: 4900, // $49.00
    currency: 'usd',
    interval: 'month',
    features: [
      'Generate up to 500 posts per month',
      'All social media platforms',
      'Advanced analytics & insights',
      'Content calendar & scheduling',
      'Priority email support',
      'Custom content pillars',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and agencies managing multiple brands',
    price: 9900, // $99.00
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited post generation',
      'All social media platforms',
      'Advanced analytics & reporting',
      'Team collaboration tools',
      'White-label options',
      'Custom integrations',
      'Dedicated account manager',
      'Phone & email support',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
  },
]

class StripeService {
  // Customer management
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      })
    } catch (error) {
      console.error('Stripe create customer error:', error)
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      return customer as Stripe.Customer
    } catch (error) {
      console.error('Stripe get customer error:', error)
      return null
    }
  }

  async updateCustomer(
    customerId: string, 
    params: Partial<CreateCustomerParams>
  ): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      })
    } catch (error) {
      console.error('Stripe update customer error:', error)
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await stripe.customers.del(customerId)
      return true
    } catch (error) {
      console.error('Stripe delete customer error:', error)
      return false
    }
  }

  // Subscription management
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata,
        expand: ['latest_invoice.payment_intent'],
      }

      if (params.paymentMethodId) {
        subscriptionParams.default_payment_method = params.paymentMethodId
      }

      if (params.trialDays) {
        subscriptionParams.trial_period_days = params.trialDays
      }

      return await stripe.subscriptions.create(subscriptionParams)
    } catch (error) {
      console.error('Stripe create subscription error:', error)
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent'],
      })
    } catch (error) {
      console.error('Stripe get subscription error:', error)
      return null
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        expand: ['data.latest_invoice.payment_intent'],
      })
      return subscriptions.data
    } catch (error) {
      console.error('Stripe get customer subscriptions error:', error)
      return []
    }
  }

  async updateSubscription(
    subscriptionId: string,
    params: {
      priceId?: string
      metadata?: Record<string, string>
      pauseCollection?: boolean
    }
  ): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        metadata: params.metadata,
      }

      if (params.priceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        updateParams.items = [{
          id: subscription.items.data[0].id,
          price: params.priceId,
        }]
      }

      if (params.pauseCollection !== undefined) {
        updateParams.pause_collection = params.pauseCollection ? { behavior: 'void' } : ''
      }

      return await stripe.subscriptions.update(subscriptionId, updateParams)
    } catch (error) {
      console.error('Stripe update subscription error:', error)
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId)
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })
      }
    } catch (error) {
      console.error('Stripe cancel subscription error:', error)
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Payment methods
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })
    } catch (error) {
      console.error('Stripe attach payment method error:', error)
      throw new Error(`Failed to attach payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })
      return paymentMethods.data
    } catch (error) {
      console.error('Stripe get payment methods error:', error)
      return []
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId)
      return true
    } catch (error) {
      console.error('Stripe detach payment method error:', error)
      return false
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    } catch (error) {
      console.error('Stripe set default payment method error:', error)
      throw new Error(`Failed to set default payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // One-time payments
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        description: params.description,
        metadata: params.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })
    } catch (error) {
      console.error('Stripe create payment intent error:', error)
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      })
    } catch (error) {
      console.error('Stripe confirm payment intent error:', error)
      throw new Error(`Failed to confirm payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Invoices
  async getCustomerInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      })
      return invoices.data
    } catch (error) {
      console.error('Stripe get customer invoices error:', error)
      return []
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      return await stripe.invoices.retrieve(invoiceId)
    } catch (error) {
      console.error('Stripe get invoice error:', error)
      return null
    }
  }

  // Usage tracking (for metered billing)
  async recordUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<Stripe.UsageRecord> {
    try {
      return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      })
    } catch (error) {
      console.error('Stripe record usage error:', error)
      throw new Error(`Failed to record usage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Proration preview
  async previewSubscriptionChange(
    subscriptionId: string,
    newPriceId: string
  ): Promise<{ prorationAmount: number; nextInvoiceAmount: number }> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
        subscription: subscriptionId,
        subscription_items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
      })

      const prorationAmount = upcomingInvoice.lines.data
        .filter(line => line.proration)
        .reduce((sum, line) => sum + line.amount, 0)

      return {
        prorationAmount,
        nextInvoiceAmount: upcomingInvoice.amount_due,
      }
    } catch (error) {
      console.error('Stripe preview subscription change error:', error)
      throw new Error(`Failed to preview subscription change: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Webhook handling
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook handling')
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (error) {
      console.error('Stripe webhook construction error:', error)
      throw new Error(`Invalid webhook signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Billing portal
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })
    } catch (error) {
      console.error('Stripe create billing portal session error:', error)
      throw new Error(`Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Checkout sessions
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    options?: {
      trialDays?: number
      allowPromotionCodes?: boolean
      metadata?: Record<string, string>
    }
  ): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: options?.allowPromotionCodes || true,
        metadata: options?.metadata,
      }

      if (options?.trialDays) {
        sessionParams.subscription_data = {
          trial_period_days: options.trialDays,
        }
      }

      return await stripe.checkout.sessions.create(sessionParams)
    } catch (error) {
      console.error('Stripe create checkout session error:', error)
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Plans and pricing
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS
  }

  getPlanByPriceId(priceId: string): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.stripePriceId === priceId) || null
  }

  getPlanById(planId: string): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null
  }

  // Utility functions
  formatAmount(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  isSubscriptionActive(subscription: Stripe.Subscription): boolean {
    return ['active', 'trialing'].includes(subscription.status)
  }

  getSubscriptionStatus(subscription: Stripe.Subscription): {
    isActive: boolean
    isPaused: boolean
    isCanceled: boolean
    willCancel: boolean
    currentPeriodEnd: Date
  } {
    return {
      isActive: this.isSubscriptionActive(subscription),
      isPaused: subscription.status === 'paused',
      isCanceled: subscription.status === 'canceled',
      willCancel: !!subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }
  }
}

export const stripeService = new StripeService()
export default stripeService
