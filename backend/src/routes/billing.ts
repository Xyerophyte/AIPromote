import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripeService } from '../services/stripe-service';
import { config } from '../config/config';
import { UsageMetricType } from '@prisma/client';

// Request body schemas
interface CreateSubscriptionBody {
  planId: string;
  paymentMethodId?: string;
}

interface UpdateSubscriptionBody {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}

interface CreateCheckoutSessionBody {
  planId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface AttachPaymentMethodBody {
  paymentMethodId: string;
}

interface RecordUsageBody {
  metricType: UsageMetricType;
  quantity: number;
}

export async function billingRoutes(fastify: FastifyInstance) {
  // Get all subscription plans
  fastify.get('/plans', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const plans = await fastify.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return { plans };
    } catch (error) {
      fastify.log.error('Error fetching subscription plans:', error);
      reply.status(500).send({ error: 'Failed to fetch subscription plans' });
    }
  });

  // Get current user's subscription details
  fastify.get('/subscription', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
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
      });

      if (!subscription) {
        return { subscription: null };
      }

      // Get upcoming invoice if subscription is active
      let upcomingInvoice = null;
      if (subscription.status === 'ACTIVE' && subscription.stripeSubscriptionId) {
        try {
          upcomingInvoice = await stripeService.getUpcomingInvoice(
            subscription.stripeSubscriptionId
          );
        } catch (error) {
          fastify.log.warn('Could not fetch upcoming invoice:', error);
        }
      }

      return {
        subscription: {
          ...subscription,
          upcomingInvoice,
        },
      };
    } catch (error) {
      fastify.log.error('Error fetching subscription:', error);
      reply.status(500).send({ error: 'Failed to fetch subscription' });
    }
  });

  // Create a new subscription
  fastify.post('/subscription', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: CreateSubscriptionBody}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { planId, paymentMethodId } = request.body;

      // Check if user already has an active subscription
      const existingSubscription = await fastify.prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      });

      if (existingSubscription) {
        reply.status(400).send({ error: 'User already has an active subscription' });
        return;
      }

      const subscription = await stripeService.createSubscription({
        userId,
        planId,
        paymentMethodId,
        trialPeriodDays: config.billing.trialPeriodDays,
      });

      return { subscription };
    } catch (error) {
      fastify.log.error('Error creating subscription:', error);
      reply.status(500).send({ error: 'Failed to create subscription' });
    }
  });

  // Update subscription (upgrade/downgrade or cancel)
  fastify.put('/subscription', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: UpdateSubscriptionBody}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { planId, cancelAtPeriodEnd } = request.body;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription?.stripeSubscriptionId) {
        reply.status(404).send({ error: 'No subscription found' });
        return;
      }

      const updatedSubscription = await stripeService.updateSubscription({
        subscriptionId: subscription.stripeSubscriptionId,
        newPlanId: planId,
        cancelAtPeriodEnd,
      });

      return { subscription: updatedSubscription };
    } catch (error) {
      fastify.log.error('Error updating subscription:', error);
      reply.status(500).send({ error: 'Failed to update subscription' });
    }
  });

  // Cancel subscription
  fastify.delete('/subscription', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription?.stripeSubscriptionId) {
        reply.status(404).send({ error: 'No subscription found' });
        return;
      }

      const cancelledSubscription = await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        false // Cancel at period end
      );

      return { subscription: cancelledSubscription };
    } catch (error) {
      fastify.log.error('Error cancelling subscription:', error);
      reply.status(500).send({ error: 'Failed to cancel subscription' });
    }
  });

  // Create Stripe Checkout session
  fastify.post('/checkout-session', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: CreateCheckoutSessionBody}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { planId, successUrl, cancelUrl } = request.body;

      const session = await stripeService.createCheckoutSession({
        userId,
        planId,
        successUrl: successUrl || config.billing.checkoutSuccessUrl,
        cancelUrl: cancelUrl || config.billing.checkoutCancelUrl,
        trialPeriodDays: config.billing.trialPeriodDays,
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      fastify.log.error('Error creating checkout session:', error);
      reply.status(500).send({ error: 'Failed to create checkout session' });
    }
  });

  // Create billing portal session
  fastify.post('/portal-session', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        reply.status(404).send({ error: 'No customer found' });
        return;
      }

      const session = await stripeService.createPortalSession(
        subscription.stripeCustomerId,
        config.billing.portalReturnUrl
      );

      return { url: session.url };
    } catch (error) {
      fastify.log.error('Error creating portal session:', error);
      reply.status(500).send({ error: 'Failed to create portal session' });
    }
  });

  // Get payment methods
  fastify.get('/payment-methods', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      const paymentMethods = await fastify.prisma.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return { paymentMethods };
    } catch (error) {
      fastify.log.error('Error fetching payment methods:', error);
      reply.status(500).send({ error: 'Failed to fetch payment methods' });
    }
  });

  // Attach payment method
  fastify.post('/payment-methods', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: AttachPaymentMethodBody}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { paymentMethodId } = request.body;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        reply.status(404).send({ error: 'No customer found' });
        return;
      }

      const paymentMethod = await stripeService.attachPaymentMethod(
        paymentMethodId,
        subscription.stripeCustomerId
      );

      return { paymentMethod };
    } catch (error) {
      fastify.log.error('Error attaching payment method:', error);
      reply.status(500).send({ error: 'Failed to attach payment method' });
    }
  });

  // Set default payment method
  fastify.put('/payment-methods/:paymentMethodId/default', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Params: {paymentMethodId: string}}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { paymentMethodId } = request.params;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        reply.status(404).send({ error: 'No customer found' });
        return;
      }

      await stripeService.setDefaultPaymentMethod(
        subscription.stripeCustomerId,
        paymentMethodId
      );

      return { success: true };
    } catch (error) {
      fastify.log.error('Error setting default payment method:', error);
      reply.status(500).send({ error: 'Failed to set default payment method' });
    }
  });

  // Remove payment method
  fastify.delete('/payment-methods/:paymentMethodId', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Params: {paymentMethodId: string}}>, reply: FastifyReply) => {
    try {
      const { paymentMethodId } = request.params;

      await stripeService.detachPaymentMethod(paymentMethodId);

      return { success: true };
    } catch (error) {
      fastify.log.error('Error removing payment method:', error);
      reply.status(500).send({ error: 'Failed to remove payment method' });
    }
  });

  // Get invoices
  fastify.get('/invoices', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
        include: {
          invoices: {
            orderBy: { issueDate: 'desc' },
            take: 50,
          },
        },
      });

      return { invoices: subscription?.invoices || [] };
    } catch (error) {
      fastify.log.error('Error fetching invoices:', error);
      reply.status(500).send({ error: 'Failed to fetch invoices' });
    }
  });

  // Get usage statistics
  fastify.get('/usage', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // Get current month usage
      const usage = await fastify.prisma.usage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      // Get usage records for detailed tracking
      const usageRecords = await fastify.prisma.usageRecord.findMany({
        where: {
          userId,
          periodStart: { gte: currentMonth },
        },
        orderBy: { recordedAt: 'desc' },
      });

      // Get plan limits
      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
        include: { plan: true },
      });

      const planLimits = subscription?.plan.limits as any || {};

      return {
        usage: usage || {
          postsGenerated: 0,
          postsPublished: 0,
          strategiesGenerated: 0,
          organizationsCreated: 0,
        },
        usageRecords,
        planLimits,
        currentMonth,
      };
    } catch (error) {
      fastify.log.error('Error fetching usage:', error);
      reply.status(500).send({ error: 'Failed to fetch usage' });
    }
  });

  // Record usage (for internal API calls)
  fastify.post('/usage', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: RecordUsageBody}>, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;
      const { metricType, quantity } = request.body;

      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription) {
        reply.status(404).send({ error: 'No subscription found' });
        return;
      }

      await stripeService.recordUsage({
        subscriptionId: subscription.id,
        userId,
        metricType,
        quantity,
      });

      // Update monthly usage counter
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const updateData: any = {};
      switch (metricType) {
        case 'POSTS_GENERATED':
          updateData.postsGenerated = { increment: quantity };
          break;
        case 'POSTS_PUBLISHED':
          updateData.postsPublished = { increment: quantity };
          break;
        case 'STRATEGIES_GENERATED':
          updateData.strategiesGenerated = { increment: quantity };
          break;
        case 'ORGANIZATIONS_CREATED':
          updateData.organizationsCreated = { increment: quantity };
          break;
      }

      await fastify.prisma.usage.upsert({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
        update: updateData,
        create: {
          userId,
          month: currentMonth,
          ...Object.keys(updateData).reduce((acc, key) => {
            acc[key] = quantity;
            return acc;
          }, {} as any),
        },
      });

      return { success: true };
    } catch (error) {
      fastify.log.error('Error recording usage:', error);
      reply.status(500).send({ error: 'Failed to record usage' });
    }
  });

  // Stripe webhook handler
  fastify.post('/webhooks/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers['stripe-signature'] as string;
      const payload = request.rawBody as string;

      if (!signature || !payload) {
        reply.status(400).send({ error: 'Missing signature or payload' });
        return;
      }

      await stripeService.handleWebhook(payload, signature);

      return { received: true };
    } catch (error) {
      fastify.log.error('Webhook error:', error);
      reply.status(400).send({ error: 'Webhook processing failed' });
    }
  });

  // Get billing dashboard data
  fastify.get('/dashboard', {
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).id;

      // Get subscription with all related data
      const subscription = await fastify.prisma.subscription.findFirst({
        where: { userId },
        include: {
          plan: true,
          invoices: {
            orderBy: { issueDate: 'desc' },
            take: 5,
          },
          paymentMethods: {
            where: { isActive: true },
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      // Get current month usage
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usage = await fastify.prisma.usage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      // Get usage trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);

      const usageTrend = await fastify.prisma.usage.findMany({
        where: {
          userId,
          month: { gte: sixMonthsAgo },
        },
        orderBy: { month: 'asc' },
      });

      // Get upcoming invoice
      let upcomingInvoice = null;
      if (subscription?.status === 'ACTIVE' && subscription.stripeSubscriptionId) {
        try {
          upcomingInvoice = await stripeService.getUpcomingInvoice(
            subscription.stripeSubscriptionId
          );
        } catch (error) {
          fastify.log.warn('Could not fetch upcoming invoice:', error);
        }
      }

      return {
        subscription,
        usage: usage || {
          postsGenerated: 0,
          postsPublished: 0,
          strategiesGenerated: 0,
          organizationsCreated: 0,
        },
        usageTrend,
        upcomingInvoice,
      };
    } catch (error) {
      fastify.log.error('Error fetching billing dashboard:', error);
      reply.status(500).send({ error: 'Failed to fetch billing dashboard' });
    }
  });
}
