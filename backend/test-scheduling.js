const { PrismaClient } = require('@prisma/client');
const { SchedulingService } = require('./dist/services/scheduling-service');
const { CalendarExportService } = require('./dist/services/calendar-export-service');

const prisma = new PrismaClient();
const schedulingService = new SchedulingService(prisma);
const exportService = new CalendarExportService(prisma);

async function testSchedulingSystem() {
  try {
    console.log('🚀 Testing Scheduling System...\n');

    // Test 1: Create a test organization (if it doesn't exist)
    console.log('1. Creating test organization...');
    
    let org;
    try {
      org = await prisma.organization.findFirst();
      if (!org) {
        const user = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
          },
        });

        org = await prisma.organization.create({
          data: {
            userId: user.id,
            name: 'Test Organization',
            description: 'Test organization for scheduling system',
          },
        });
      }
      console.log('✅ Organization ready:', org.name);
    } catch (error) {
      console.log('⚠️  Using existing organization or skipping org creation');
    }

    if (!org) {
      console.log('❌ No organization found, cannot continue tests');
      return;
    }

    // Test 2: Create a calendar event
    console.log('\n2. Testing calendar event creation...');
    try {
      const eventId = await schedulingService.createCalendarEvent(org.id, {
        title: 'Test Social Media Post',
        description: 'Testing the scheduling system',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        eventType: 'POST_SCHEDULED',
        timeZone: 'UTC',
        tags: ['test', 'twitter'],
        color: '#1DA1F2',
      });
      console.log('✅ Calendar event created:', eventId);
    } catch (error) {
      console.log('❌ Calendar event creation failed:', error.message);
    }

    // Test 3: Get calendar events
    console.log('\n3. Testing calendar events retrieval...');
    try {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      const events = await schedulingService.getCalendarEvents(
        org.id,
        startDate,
        endDate,
        'UTC'
      );
      console.log(`✅ Retrieved ${events.length} calendar events`);
    } catch (error) {
      console.log('❌ Calendar events retrieval failed:', error.message);
    }

    // Test 4: Test optimal posting times (will be empty without analytics data)
    console.log('\n4. Testing optimal posting times...');
    try {
      const optimalTimes = await schedulingService.getOptimalPostingTimes(
        org.id,
        'TWITTER',
        'UTC',
        5
      );
      console.log(`✅ Retrieved ${optimalTimes.length} optimal posting times`);
    } catch (error) {
      console.log('❌ Optimal posting times failed:', error.message);
    }

    // Test 5: Test conflict detection
    console.log('\n5. Testing conflict detection...');
    try {
      await schedulingService.detectSchedulingConflicts({
        organizationId: org.id,
        timeRange: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        checkTypes: ['TIME_OVERLAP', 'PLATFORM_LIMIT']
      });
      console.log('✅ Conflict detection completed');
    } catch (error) {
      console.log('❌ Conflict detection failed:', error.message);
    }

    // Test 6: Test calendar export
    console.log('\n6. Testing calendar export...');
    try {
      const exportId = await exportService.createExport({
        organizationId: org.id,
        exportType: 'CALENDAR',
        format: 'JSON',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        timeZone: 'UTC',
        includeEvents: ['POST_SCHEDULED'],
        platforms: ['TWITTER', 'LINKEDIN']
      });
      console.log('✅ Calendar export created:', exportId);

      // Wait a bit and check export status
      setTimeout(async () => {
        try {
          const exportData = await exportService.getExport(exportId);
          console.log('✅ Export status:', exportData.status);
        } catch (error) {
          console.log('⚠️  Export status check failed:', error.message);
        }
      }, 2000);
    } catch (error) {
      console.log('❌ Calendar export failed:', error.message);
    }

    console.log('\n🎉 Scheduling system test completed!');
    console.log('\nNext steps:');
    console.log('- Run database migrations: npx prisma db push');
    console.log('- Start the server: npm run dev');
    console.log('- Test the API endpoints using the examples in SCHEDULING_SYSTEM_README.md');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSchedulingSystem();
