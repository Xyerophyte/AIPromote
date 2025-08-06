import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@aipromotapp.com' },
    update: {},
    create: {
      email: 'test@aipromotapp.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      plan: 'free',
      role: 'USER',
      verified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aipromotapp.com' },
    update: {},
    create: {
      email: 'admin@aipromotapp.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      plan: 'pro',
      role: 'ADMIN',
      verified: true,
    },
  });

  console.log('👤 Created users:', { testUser: testUser.email, adminUser: adminUser.email });

  // Create test organization
  const testOrganization = await prisma.organization.create({
    data: {
      userId: testUser.id,
      name: 'AI Startup Demo',
      url: 'https://aistartup.com',
      stage: 'pre-seed',
      pricing: 'freemium',
      description: 'An AI-powered productivity tool for remote teams',
      tagline: 'Boost your team productivity with AI',
      category: 'B2B SaaS',
      markets: ['US', 'EU', 'Canada'],
      languages: ['en'],
    },
  });

  console.log('🏢 Created organization:', testOrganization.name);

  // Create founder
  const founder = await prisma.founder.create({
    data: {
      organizationId: testOrganization.id,
      name: 'John Doe',
      role: 'CEO & Co-founder',
      email: 'john@aistartup.com',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      twitterHandle: '@johndoe',
      bio: 'Serial entrepreneur passionate about AI and productivity. Previously built and sold 2 startups.',
      isPrimary: true,
    },
  });

  console.log('👨‍💼 Created founder:', founder.name);

  // Create brand rules
  const brandRules = await prisma.brandRule.create({
    data: {
      organizationId: testOrganization.id,
      tone: 'professional',
      voice: 'Friendly, helpful, and knowledgeable. We speak to busy professionals who value efficiency.',
      allowedPhrases: [
        'boost productivity',
        'streamline workflows',
        'AI-powered',
        'time-saving',
        'seamless integration'
      ],
      forbiddenPhrases: [
        'disruptive',
        'revolutionary',
        'game-changing',
        'ninja',
        'rockstar'
      ],
      allowedHashtags: ['#productivity', '#AI', '#remotework', '#SaaS', '#startups'],
      forbiddenHashtags: ['#blessed', '#hustle', '#grind'],
      complianceNotes: 'No false claims about ROI or performance improvements without data.',
      approvalMode: 'MANUAL',
    },
  });

  console.log('📋 Created brand rules');

  // Create content pillars
  const educationPillar = await prisma.contentPillar.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Education',
      description: 'Tips, best practices, and educational content about productivity and AI',
      color: '#3B82F6',
      emoji: '📚',
      isActive: true,
      sortOrder: 1,
    },
  });

  const productPillar = await prisma.contentPillar.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Product Updates',
      description: 'New features, improvements, and product announcements',
      color: '#10B981',
      emoji: '🚀',
      isActive: true,
      sortOrder: 2,
    },
  });

  const founderPillar = await prisma.contentPillar.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Founder Story',
      description: 'Personal stories, lessons learned, and behind-the-scenes content',
      color: '#F59E0B',
      emoji: '👨‍💼',
      isActive: true,
      sortOrder: 3,
    },
  });

  const customerPillar = await prisma.contentPillar.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Customer Success',
      description: 'Case studies, testimonials, and customer spotlights',
      color: '#8B5CF6',
      emoji: '⭐',
      isActive: true,
      sortOrder: 4,
    },
  });

  console.log('🎯 Created content pillars');

  // Create AI strategy
  const aiStrategy = await prisma.aIStrategy.create({
    data: {
      organizationId: testOrganization.id,
      version: 1,
      status: 'ACTIVE',
      positioning: {
        primaryMessage: 'AI Startup Demo helps remote teams boost productivity by 40% through intelligent automation',
        valueProps: [
          'Save 2+ hours daily with AI automation',
          'Seamless integration with existing tools',
          'Real-time team collaboration insights'
        ],
        differentiators: [
          'First AI tool built specifically for remote teams',
          'No-code automation setup',
          'Privacy-first approach'
        ]
      },
      audienceSegments: [
        {
          name: 'Remote Team Leaders',
          size: 'Primary (60%)',
          painPoints: ['Managing distributed teams', 'Tracking productivity', 'Tool sprawl'],
          messages: ['Unify your team workflows', 'Get visibility without micromanaging']
        },
        {
          name: 'Operations Managers',
          size: 'Secondary (25%)',
          painPoints: ['Process inefficiency', 'Manual reporting', 'Cross-team coordination'],
          messages: ['Automate repetitive processes', 'Real-time operational insights']
        },
        {
          name: 'Startup Founders',
          size: 'Tertiary (15%)',
          painPoints: ['Limited resources', 'Scaling challenges', 'Overhead costs'],
          messages: ['Do more with less', 'Scale efficiently without hiring']
        }
      ],
      contentPillars: [
        { name: 'Education', percentage: 40, topics: ['Remote work best practices', 'Productivity tips', 'AI basics'] },
        { name: 'Product', percentage: 25, topics: ['Feature announcements', 'Use cases', 'Integrations'] },
        { name: 'Founder Story', percentage: 20, topics: ['Journey insights', 'Lessons learned', 'Industry thoughts'] },
        { name: 'Customer Success', percentage: 15, topics: ['Case studies', 'Results achieved', 'Testimonials'] }
      ],
      channelPlan: {
        linkedin: { frequency: 'Daily', bestTimes: ['9:00 AM', '1:00 PM', '5:00 PM'], focus: 'B2B networking' },
        twitter: { frequency: '2x Daily', bestTimes: ['8:00 AM', '12:00 PM', '6:00 PM'], focus: 'Thought leadership' },
        reddit: { frequency: '3x Weekly', communities: ['r/startups', 'r/remotework', 'r/productivity'], focus: 'Community engagement' }
      },
      cadence: {
        weekly: 21,
        breakdown: {
          linkedin: 7,
          twitter: 14,
          reddit: 3
        }
      },
      calendarSkeleton: {
        week1: ['Product announcement', 'Educational thread', 'Founder insight', 'Customer story'],
        week2: ['Industry trend', 'Feature highlight', 'Behind-the-scenes', 'User tip'],
        recurring: true
      },
      generatedBy: 'gpt-4',
      confidence: 0.85,
      acceptedAt: new Date(),
    },
  });

  console.log('🧠 Created AI strategy');

  // Create sample content pieces
  const contentPieces = await prisma.contentPiece.createMany({
    data: [
      {
        organizationId: testOrganization.id,
        pillarId: educationPillar.id,
        platform: 'LINKEDIN',
        status: 'PUBLISHED',
        type: 'POST',
        title: '5 Remote Work Productivity Tips',
        body: '🏠 Working remotely? Here are 5 productivity tips that actually work:\n\n1️⃣ Set clear boundaries between work and personal time\n2️⃣ Use the Pomodoro Technique for focused work sessions\n3️⃣ Create a dedicated workspace, even if it\'s small\n4️⃣ Schedule regular check-ins with your team\n5️⃣ Take breaks and move your body throughout the day\n\nWhich tip resonates most with you? 👇\n\n#remotework #productivity #tips #workfromhome',
        hashtags: ['remotework', 'productivity', 'tips', 'workfromhome'],
        mentions: [],
        cta: 'Which tip resonates most with you?',
        hook: '🏠 Working remotely? Here are 5 productivity tips that actually work:',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        rationale: 'Educational content performs well on LinkedIn, especially with numbered lists and actionable tips',
        confidence: 0.9,
        generatedBy: 'gpt-4',
      },
      {
        organizationId: testOrganization.id,
        pillarId: productPillar.id,
        platform: 'TWITTER',
        status: 'SCHEDULED',
        type: 'THREAD',
        title: 'New AI Integration Feature',
        body: '🚀 Excited to announce our new AI integration feature!\n\nNow you can connect your existing tools and let AI handle the repetitive tasks.\n\nThread below on how it works 👇\n\n1/7',
        hashtags: ['AI', 'productivity', 'integration', 'automation'],
        mentions: [],
        cta: 'Try it out and let us know what you think!',
        hook: '🚀 Excited to announce our new AI integration feature!',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        rationale: 'Product announcements work well as Twitter threads, allowing for detailed explanation',
        confidence: 0.85,
        generatedBy: 'gpt-4',
      },
    ],
  });

  console.log('📝 Created sample content pieces');

  // Create usage tracking for test user
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.usage.upsert({
    where: {
      userId_month: {
        userId: testUser.id,
        month: currentMonth,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      month: currentMonth,
      postsGenerated: 12,
      postsPublished: 8,
      strategiesGenerated: 1,
      organizationsCreated: 1,
    },
  });

  console.log('📊 Created usage tracking');

  // Create subscription for admin user
  const subscription = await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      planId: 'pro',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('💳 Created subscription for admin user');

  console.log('✅ Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
