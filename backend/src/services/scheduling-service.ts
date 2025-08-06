import { PrismaClient, Platform, ScheduleType, EventType, ConflictType, ConflictSeverity, ConflictStatus, EventStatus } from '@prisma/client';
import { format, addDays, addWeeks, addMonths, startOfDay, endOfDay, isAfter, isBefore, parseISO } from 'date-fns';
// @ts-ignore - date-fns-tz may not have full type definitions
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { v4 as uuidv4 } from 'uuid';

interface OptimalTimeAnalysis {
  organizationId: string;
  platform: Platform;
  timeZone: string;
  analysisWindow: number; // days
}

interface OptimalTimeResult {
  dayOfWeek: number;
  hour: number;
  score: number;
  confidence: number;
  metrics: {
    avgEngagement: number;
    avgReach: number;
    avgClicks: number;
    sampleSize: number;
  };
}

interface BulkScheduleRequest {
  organizationId: string;
  contentPieceIds: string[];
  platforms: Platform[];
  startDate: Date;
  endDate: Date;
  timeSlots: Array<{ hour: number; minute: number }>;
  distribution: 'even' | 'weighted' | 'optimal';
  spacing: number; // minutes between posts
  timeZone: string;
}

interface RecurringScheduleRequest {
  organizationId: string;
  templateId: string;
  contentPieceIds: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  timeslots: Array<{ hour: number; minute: number }>;
  startDate: Date;
  endDate?: Date;
  timeZone: string;
}

interface ConflictDetectionOptions {
  organizationId: string;
  timeRange: { start: Date; end: Date };
  platforms?: Platform[];
  checkTypes: ConflictType[];
}

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  eventType: EventType;
  isAllDay?: boolean;
  timeZone: string;
  tags?: string[];
  color?: string;
  metadata?: any;
}

interface DragDropUpdate {
  eventId: string;
  newStartTime: Date;
  newEndTime?: Date;
  timeZone: string;
}

export class SchedulingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Analyze optimal posting times for an organization and platform
   */
  async analyzeOptimalPostingTimes(options: OptimalTimeAnalysis): Promise<OptimalTimeResult[]> {
    const { organizationId, platform, timeZone, analysisWindow } = options;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - analysisWindow);
    
    // Get historical analytics data
    const analytics = await this.prisma.analytics.findMany({
      where: {
        organizationId,
        platform,
        collectedAt: {
          gte: startDate,
        },
      },
      include: {
        scheduledPost: true,
      },
    });

    // Group by day of week and hour
    const timeSlotData = new Map<string, {
      engagement: number[];
      reach: number[];
      clicks: number[];
      count: number;
    }>();

    for (const analytic of analytics) {
      if (!analytic.scheduledPost?.scheduledAt) continue;
      
      const scheduledTime = utcToZonedTime(analytic.scheduledPost.scheduledAt, timeZone);
      const dayOfWeek = scheduledTime.getDay();
      const hour = scheduledTime.getHours();
      const key = `${dayOfWeek}-${hour}`;
      
      if (!timeSlotData.has(key)) {
        timeSlotData.set(key, {
          engagement: [],
          reach: [],
          clicks: [],
          count: 0,
        });
      }
      
      const data = timeSlotData.get(key)!;
      data.engagement.push(analytic.engagementRate || 0);
      data.reach.push(analytic.reach);
      data.clicks.push(analytic.clicks);
      data.count++;
    }

    // Calculate scores for each time slot
    const results: OptimalTimeResult[] = [];
    
    for (const [key, data] of timeSlotData.entries()) {
      if (data.count < 3) continue; // Need minimum sample size
      
      const [dayOfWeek, hour] = key.split('-').map(Number);
      
      const avgEngagement = data.engagement.reduce((sum, val) => sum + val, 0) / data.count;
      const avgReach = data.reach.reduce((sum, val) => sum + val, 0) / data.count;
      const avgClicks = data.clicks.reduce((sum, val) => sum + val, 0) / data.count;
      
      // Calculate composite score (weighted average)
      const score = (avgEngagement * 0.5) + (avgReach * 0.0001) + (avgClicks * 0.01);
      const confidence = Math.min(data.count / 10, 1); // Max confidence at 10+ samples
      
      results.push({
        dayOfWeek,
        hour,
        score: Math.min(score, 1),
        confidence,
        metrics: {
          avgEngagement,
          avgReach,
          avgClicks,
          sampleSize: data.count,
        },
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    // Store in database
    for (const result of results) {
      await this.prisma.optimalPostingTime.upsert({
        where: {
          organizationId_platform_dayOfWeek_hour_timeZone: {
            organizationId,
            platform,
            dayOfWeek: result.dayOfWeek,
            hour: result.hour,
            timeZone,
          },
        },
        update: {
          score: result.score,
          avgEngagement: result.metrics.avgEngagement,
          avgReach: result.metrics.avgReach,
          avgClicks: result.metrics.avgClicks,
          sampleSize: result.metrics.sampleSize,
          confidence: result.confidence,
          lastAnalyzed: new Date(),
        },
        create: {
          organizationId,
          platform,
          dayOfWeek: result.dayOfWeek,
          hour: result.hour,
          timeZone,
          score: result.score,
          avgEngagement: result.metrics.avgEngagement,
          avgReach: result.metrics.avgReach,
          avgClicks: result.metrics.avgClicks,
          sampleSize: result.metrics.sampleSize,
          confidence: result.confidence,
          lastAnalyzed: new Date(),
        },
      });
    }

    return results;
  }

  /**
   * Get optimal posting time suggestions
   */
  async getOptimalPostingTimes(
    organizationId: string,
    platform: Platform,
    timeZone: string,
    count: number = 10
  ): Promise<OptimalTimeResult[]> {
    const optimalTimes = await this.prisma.optimalPostingTime.findMany({
      where: {
        organizationId,
        platform,
        timeZone,
      },
      orderBy: [
        { score: 'desc' },
        { confidence: 'desc' },
      ],
      take: count,
    });

    return optimalTimes.map(time => ({
      dayOfWeek: time.dayOfWeek,
      hour: time.hour,
      score: time.score,
      confidence: time.confidence,
      metrics: {
        avgEngagement: time.avgEngagement,
        avgReach: time.avgReach,
        avgClicks: time.avgClicks,
        sampleSize: time.sampleSize,
      },
    }));
  }

  /**
   * Create bulk schedule for multiple posts
   */
  async createBulkSchedule(request: BulkScheduleRequest): Promise<string[]> {
    const {
      organizationId,
      contentPieceIds,
      platforms,
      startDate,
      endDate,
      timeSlots,
      distribution,
      spacing,
      timeZone,
    } = request;

    // Get content pieces and social accounts
    const [contentPieces, socialAccounts] = await Promise.all([
      this.prisma.contentPiece.findMany({
        where: {
          id: { in: contentPieceIds },
          organizationId,
        },
      }),
      this.prisma.socialAccount.findMany({
        where: {
          organizationId,
          platform: { in: platforms },
          isActive: true,
        },
      }),
    ]);

    if (contentPieces.length === 0) {
      throw new Error('No content pieces found');
    }

    if (socialAccounts.length === 0) {
      throw new Error('No active social accounts found for specified platforms');
    }

    // Generate time slots based on distribution strategy
    let scheduledTimes: Date[] = [];
    
    if (distribution === 'optimal') {
      // Use optimal posting times
      const optimalTimes = await this.getOptimalPostingTimes(organizationId, platforms[0], timeZone, 20);
      scheduledTimes = this.generateOptimalSchedule(startDate, endDate, optimalTimes, timeZone, spacing);
    } else {
      // Use provided time slots
      scheduledTimes = this.generateTimeSlots(startDate, endDate, timeSlots, distribution, spacing, timeZone);
    }

    // Check for conflicts
    await this.detectSchedulingConflicts({
      organizationId,
      timeRange: { start: startDate, end: endDate },
      platforms,
      checkTypes: [ConflictType.TIME_OVERLAP, ConflictType.PLATFORM_LIMIT],
    });

    // Create scheduled posts
    const scheduledPostIds: string[] = [];
    let timeIndex = 0;

    for (const contentPiece of contentPieces) {
      for (const socialAccount of socialAccounts) {
        if (socialAccount.platform !== contentPiece.platform) continue;
        if (timeIndex >= scheduledTimes.length) break;

        const scheduledAt = scheduledTimes[timeIndex];
        const scheduledPost = await this.prisma.scheduledPost.create({
          data: {
            organizationId,
            contentPieceId: contentPiece.id,
            socialAccountId: socialAccount.id,
            scheduledAt,
            status: 'SCHEDULED',
            idempotencyKey: uuidv4(),
          },
        });

        scheduledPostIds.push(scheduledPost.id);
        
        // Create calendar event
        await this.createCalendarEvent(organizationId, {
          title: `Post: ${contentPiece.title || 'Untitled'}`,
          description: contentPiece.body.substring(0, 100) + '...',
          startTime: scheduledAt,
          eventType: EventType.POST_SCHEDULED,
          timeZone,
          tags: [socialAccount.platform.toLowerCase()],
          metadata: {
            scheduledPostId: scheduledPost.id,
            contentPieceId: contentPiece.id,
            platform: socialAccount.platform,
          },
        });

        timeIndex++;
      }
    }

    return scheduledPostIds;
  }

  /**
   * Create recurring schedule
   */
  async createRecurringSchedule(request: RecurringScheduleRequest): Promise<string[]> {
    const {
      organizationId,
      templateId,
      contentPieceIds,
      frequency,
      interval,
      daysOfWeek,
      timeslots,
      startDate,
      endDate,
      timeZone,
    } = request;

    // Create schedule template
    const template = await this.prisma.scheduleTemplate.create({
      data: {
        organizationId,
        name: `Recurring ${frequency} schedule`,
        scheduleType: ScheduleType.RECURRING,
        platforms: [],
        timeZone,
        recurringConfig: {
          frequency,
          interval,
          daysOfWeek,
          timeslots,
          endDate: endDate?.toISOString(),
        },
        isActive: true,
      },
    });

    // Generate recurring dates
    const recurringDates = this.generateRecurringDates(
      startDate,
      endDate,
      frequency,
      interval,
      daysOfWeek,
      timeZone
    );

    // Create scheduled posts for each date and timeslot
    const scheduledPostIds: string[] = [];
    const contentPieces = await this.prisma.contentPiece.findMany({
      where: {
        id: { in: contentPieceIds },
        organizationId,
      },
    });

    let contentIndex = 0;
    
    for (const date of recurringDates) {
      for (const timeslot of timeslots) {
        const scheduledAt = new Date(date);
        scheduledAt.setHours(timeslot.hour, timeslot.minute, 0, 0);
        
        const content = contentPieces[contentIndex % contentPieces.length];
        
        // Get social account for this platform
        const socialAccount = await this.prisma.socialAccount.findFirst({
          where: {
            organizationId,
            platform: content.platform,
            isActive: true,
          },
        });

        if (!socialAccount) continue;

        const scheduledPost = await this.prisma.scheduledPost.create({
          data: {
            organizationId,
            contentPieceId: content.id,
            socialAccountId: socialAccount.id,
            scheduledAt: zonedTimeToUtc(scheduledAt, timeZone),
            status: 'SCHEDULED',
            idempotencyKey: uuidv4(),
            scheduleTemplateId: template.id,
          },
        });

        scheduledPostIds.push(scheduledPost.id);

        // Create recurring calendar event
        await this.createCalendarEvent(organizationId, {
          title: `Recurring: ${content.title || 'Untitled'}`,
          description: content.body.substring(0, 100) + '...',
          startTime: scheduledAt,
          eventType: EventType.POST_SCHEDULED,
          timeZone,
          tags: ['recurring', content.platform.toLowerCase()],
          metadata: {
            scheduledPostId: scheduledPost.id,
            templateId: template.id,
          },
        });

        contentIndex++;
      }
    }

    return scheduledPostIds;
  }

  /**
   * Detect scheduling conflicts
   */
  async detectSchedulingConflicts(options: ConflictDetectionOptions): Promise<void> {
    const { organizationId, timeRange, platforms, checkTypes } = options;

    // Get existing scheduled posts in time range
    const existingPosts = await this.prisma.scheduledPost.findMany({
      where: {
        organizationId,
        scheduledAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        socialAccount: true,
        contentPiece: true,
      },
    });

    const conflicts: Array<{
      type: ConflictType;
      severity: ConflictSeverity;
      description: string;
      affectedTime: Date;
      relatedPosts: string[];
    }> = [];

    // Check for time overlap conflicts
    if (checkTypes.includes(ConflictType.TIME_OVERLAP)) {
      const timeGroups = new Map<string, typeof existingPosts>();
      
      for (const post of existingPosts) {
        const timeKey = format(post.scheduledAt, 'yyyy-MM-dd HH');
        if (!timeGroups.has(timeKey)) {
          timeGroups.set(timeKey, []);
        }
        timeGroups.get(timeKey)!.push(post);
      }

      for (const [timeKey, posts] of timeGroups) {
        if (posts.length > 3) { // More than 3 posts in same hour
          conflicts.push({
            type: ConflictType.TIME_OVERLAP,
            severity: ConflictSeverity.HIGH,
            description: `${posts.length} posts scheduled within the same hour (${timeKey})`,
            affectedTime: posts[0].scheduledAt,
            relatedPosts: posts.map(p => p.id),
          });
        }
      }
    }

    // Check for platform limits
    if (checkTypes.includes(ConflictType.PLATFORM_LIMIT)) {
      const platformGroups = new Map<string, typeof existingPosts>();
      
      for (const post of existingPosts) {
        const dayKey = format(post.scheduledAt, 'yyyy-MM-dd');
        const platformKey = `${dayKey}-${post.socialAccount.platform}`;
        
        if (!platformGroups.has(platformKey)) {
          platformGroups.set(platformKey, []);
        }
        platformGroups.get(platformKey)!.push(post);
      }

      for (const [platformKey, posts] of platformGroups) {
        const platform = posts[0].socialAccount.platform;
        const dailyLimit = this.getPlatformDailyLimit(platform);
        
        if (posts.length > dailyLimit) {
          conflicts.push({
            type: ConflictType.PLATFORM_LIMIT,
            severity: ConflictSeverity.CRITICAL,
            description: `Exceeding daily limit for ${platform} (${posts.length}/${dailyLimit})`,
            affectedTime: posts[0].scheduledAt,
            relatedPosts: posts.map(p => p.id),
          });
        }
      }
    }

    // Check for similar content conflicts
    if (checkTypes.includes(ConflictType.CONTENT_SIMILAR)) {
      // Simple content similarity check (could be enhanced with ML)
      const contentGroups = new Map<string, typeof existingPosts>();
      
      for (const post of existingPosts) {
        const contentWords = post.contentPiece.body.toLowerCase().split(' ').slice(0, 5).join(' ');
        if (!contentGroups.has(contentWords)) {
          contentGroups.set(contentWords, []);
        }
        contentGroups.get(contentWords)!.push(post);
      }

      for (const [contentKey, posts] of contentGroups) {
        if (posts.length > 1) {
          const timeDiff = Math.abs(posts[0].scheduledAt.getTime() - posts[1].scheduledAt.getTime());
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 24) { // Similar content within 24 hours
            conflicts.push({
              type: ConflictType.CONTENT_SIMILAR,
              severity: ConflictSeverity.MEDIUM,
              description: `Similar content scheduled within 24 hours`,
              affectedTime: posts[0].scheduledAt,
              relatedPosts: posts.map(p => p.id),
            });
          }
        }
      }
    }

    // Save conflicts to database
    for (const conflict of conflicts) {
      await this.prisma.schedulingConflict.create({
        data: {
          organizationId,
          conflictType: conflict.type,
          severity: conflict.severity,
          status: ConflictStatus.ACTIVE,
          description: conflict.description,
          affectedTime: conflict.affectedTime,
          timeZone: 'UTC',
          relatedPosts: conflict.relatedPosts,
          relatedEvents: [],
        },
      });
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    organizationId: string,
    event: CalendarEvent
  ): Promise<string> {
    const calendarEvent = await this.prisma.calendarEvent.create({
      data: {
        organizationId,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        status: EventStatus.ACTIVE,
        startTime: zonedTimeToUtc(event.startTime, event.timeZone),
        endTime: event.endTime ? zonedTimeToUtc(event.endTime, event.timeZone) : undefined,
        timeZone: event.timeZone,
        isAllDay: event.isAllDay || false,
        tags: event.tags || [],
        color: event.color,
        metadata: event.metadata,
        scheduledPostId: event.metadata?.scheduledPostId,
        contentPieceId: event.metadata?.contentPieceId,
      },
    });

    return calendarEvent.id;
  }

  /**
   * Update calendar event via drag and drop
   */
  async updateCalendarEventDragDrop(update: DragDropUpdate): Promise<void> {
    const { eventId, newStartTime, newEndTime, timeZone } = update;
    
    // Get the event
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { scheduledPost: true },
    });

    if (!event) {
      throw new Error('Calendar event not found');
    }

    // Update calendar event
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        startTime: zonedTimeToUtc(newStartTime, timeZone),
        endTime: newEndTime ? zonedTimeToUtc(newEndTime, timeZone) : undefined,
      },
    });

    // Update associated scheduled post if exists
    if (event.scheduledPostId) {
      await this.prisma.scheduledPost.update({
        where: { id: event.scheduledPostId },
        data: {
          scheduledAt: zonedTimeToUtc(newStartTime, timeZone),
        },
      });
    }

    // Check for new conflicts
    await this.detectSchedulingConflicts({
      organizationId: event.organizationId,
      timeRange: {
        start: startOfDay(newStartTime),
        end: endOfDay(newStartTime),
      },
      checkTypes: [ConflictType.TIME_OVERLAP, ConflictType.PLATFORM_LIMIT],
    });
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    timeZone: string,
    eventTypes?: EventType[]
  ) {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        eventType: eventTypes ? { in: eventTypes } : undefined,
        status: { not: EventStatus.CANCELLED },
      },
      include: {
        scheduledPost: {
          include: {
            socialAccount: true,
            contentPiece: true,
          },
        },
        contentPiece: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return events.map(event => ({
      ...event,
      startTime: utcToZonedTime(event.startTime, timeZone),
      endTime: event.endTime ? utcToZonedTime(event.endTime, timeZone) : null,
    }));
  }

  // Helper methods

  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    timeSlots: Array<{ hour: number; minute: number }>,
    distribution: 'even' | 'weighted',
    spacing: number,
    timeZone: string
  ): Date[] {
    const slots: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      for (const timeSlot of timeSlots) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        if (slotTime >= startDate && slotTime <= endDate) {
          slots.push(zonedTimeToUtc(slotTime, timeZone));
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  }

  private generateOptimalSchedule(
    startDate: Date,
    endDate: Date,
    optimalTimes: OptimalTimeResult[],
    timeZone: string,
    spacing: number
  ): Date[] {
    const slots: Date[] = [];
    const currentDate = new Date(startDate);
    let optimalIndex = 0;
    
    while (currentDate <= endDate && optimalIndex < optimalTimes.length) {
      const optimal = optimalTimes[optimalIndex];
      
      // Find next occurrence of this day/hour
      while (currentDate.getDay() !== optimal.dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (currentDate <= endDate) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(optimal.hour, 0, 0, 0);
        slots.push(zonedTimeToUtc(slotTime, timeZone));
      }
      
      optimalIndex++;
      if (optimalIndex >= optimalTimes.length) {
        optimalIndex = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return slots;
  }

  private generateRecurringDates(
    startDate: Date,
    endDate: Date | undefined,
    frequency: 'daily' | 'weekly' | 'monthly',
    interval: number,
    daysOfWeek?: number[],
    timeZone: string
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const maxDate = endDate || addMonths(startDate, 6); // Default 6 months if no end date
    
    while (currentDate <= maxDate) {
      if (frequency === 'daily') {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, interval);
      } else if (frequency === 'weekly') {
        if (!daysOfWeek || daysOfWeek.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
        
        // Skip to next week after going through all days
        if (currentDate.getDay() === 0) {
          currentDate = addWeeks(currentDate, interval - 1);
        }
      } else if (frequency === 'monthly') {
        if (!daysOfWeek || daysOfWeek.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate = addMonths(currentDate, interval);
      }
    }
    
    return dates;
  }

  private getPlatformDailyLimit(platform: Platform): number {
    const limits: Record<Platform, number> = {
      TWITTER: 50,
      LINKEDIN: 20,
      INSTAGRAM: 25,
      FACEBOOK: 25,
      TIKTOK: 10,
      YOUTUBE_SHORTS: 5,
      REDDIT: 10,
      THREADS: 30,
    };
    
    return limits[platform] || 10;
  }
}
