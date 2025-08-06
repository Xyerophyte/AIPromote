import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBillingPlans() {
  console.log('Seeding subscription plans...');

  // Create subscription plans
  const plans = [
    {
      name: 'Starter',
      displayName: 'Starter Plan',
      description: 'Perfect for individual creators and small businesses just getting started with AI-powered social media marketing.',
      priceMonthly: 2900, // $29.00
      priceYearly: 290000, // $290.00 (2 months free)
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
      stripeProductId: 'prod_starter',
      limits: {
        postsPerMonth: 50,
        strategies: 2,
        organizations: 1,
        analytics: true,
        teamMembers: 1,
        autoScheduling: true,
        advancedAnalytics: false,
        prioritySupport: false,
        customIntegrations: false,
      },
      features: [
        '50 AI-generated posts per month',
        '2 marketing strategies',
        '1 organization/brand',
        'Basic analytics',
        'Auto-scheduling',
        'Content calendar',
        'Email support',
      ],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Growth',
      displayName: 'Growth Plan',
      description: 'Ideal for growing businesses and marketing teams that need more content and advanced features.',
      priceMonthly: 7900, // $79.00
      priceYearly: 790000, // $790.00 (2 months free)
      stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_monthly',
      stripeProductId: 'prod_growth',
      limits: {
        postsPerMonth: 200,
        strategies: 5,
        organizations: 3,
        analytics: true,
        teamMembers: 3,
        autoScheduling: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customIntegrations: false,
      },
      features: [
        '200 AI-generated posts per month',
        '5 marketing strategies',
        '3 organizations/brands',
        'Advanced analytics & reporting',
        'Auto-scheduling with optimal timing',
        'Content calendar with collaboration',
        'Team collaboration (3 members)',
        'Priority email support',
        'A/B testing for content',
        'Custom content pillars',
      ],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Scale',
      displayName: 'Scale Plan',
      description: 'For large businesses and agencies that need unlimited content and premium features.',
      priceMonthly: 19900, // $199.00
      priceYearly: 1990000, // $1,990.00 (2 months free)
      stripePriceId: process.env.STRIPE_SCALE_PRICE_ID || 'price_scale_monthly',
      stripeProductId: 'prod_scale',
      limits: {
        postsPerMonth: 1000,
        strategies: 20,
        organizations: 10,
        analytics: true,
        teamMembers: 10,
        autoScheduling: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customIntegrations: true,
      },
      features: [
        '1,000 AI-generated posts per month',
        '20 marketing strategies',
        '10 organizations/brands',
        'Advanced analytics & reporting',
        'Auto-scheduling with optimal timing',
        'Content calendar with collaboration',
        'Team collaboration (10 members)',
        'Priority support (phone + email)',
        'A/B testing for content',
        'Custom content pillars',
        'Custom integrations',
        'Dedicated account manager',
        'White-label options',
        'API access',
      ],
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const planData of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });
    console.log(`✓ Created/updated plan: ${planData.name}`);
  }

  console.log('✅ Subscription plans seeded successfully!');
}

async function main() {
  try {
    await seedBillingPlans();
  } catch (error) {
    console.error('Error seeding billing plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('Billing seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Billing seed failed:', error);
      process.exit(1);
    });
}

export { seedBillingPlans };
