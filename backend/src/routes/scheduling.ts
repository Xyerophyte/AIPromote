import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient, Platform, EventType, ExportType, ExportFormat, ConflictType } from '@prisma/client';
import { SchedulingService } from '../services/scheduling-service';
import { CalendarExportService } from '../services/calendar-export-service';
import { parseISO } from 'date-fns';

// Validation schemas
const AnalyzeOptimalTimesSchema = z.object({
  organizationId: z.string(),
  platform: z.nativeEnum(Platform),
  timeZone: z.string(),
  analysisWindow: z.number().min(7).max(90).default(30), // 7-90 days
});

const GetOptimalTimesSchema = z.object({
  organizationId: z.string(),
  platform: z.nativeEnum(Platform),
  timeZone: z.string(),
  count: z.number().min(1).max(50).default(10),
});

const BulkScheduleSchema = z.object({
  organizationId: z.string(),
  contentPieceIds: z.array(z.string()),
  platforms: z.array(z.nativeEnum(Platform)),
  startDate: z.string().transform(val => parseISO(val)),
  endDate: z.string().transform(val => parseISO(val)),
  timeSlots: z.array(z.object({
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
  })),
  distribution: z.enum(['even', 'weighted', 'optimal']),
  spacing: z.number().min(0).max(1440).default(30), // minutes
  timeZone: z.string(),
});

const RecurringScheduleSchema = z.object({
  organizationId: z.string(),
  templateName: z.string().optional(),
  contentPieceIds: z.array(z.string()),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1).max(12).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  timeslots: z.array(z.object({
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
  })),
  startDate: z.string().transform(val => parseISO(val)),
  endDate: z.string().transform(val => parseISO(val)).optional(),
  timeZone: z.string(),
});

const CreateCalendarEventSchema = z.object({
  organizationId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string().transform(val => parseISO(val)),
  endTime: z.string().transform(val => parseISO(val)).optional(),
  eventType: z.nativeEnum(EventType).default(EventType.CUSTOM),
  isAllDay: z.boolean().default(false),
  timeZone: z.string(),
  tags: z.array(z.string()).default([]),
  color: z.string().optional(),
  metadata: z.any().optional(),
});

const DragDropUpdateSchema = z.object({
  eventId: z.string(),
  newStartTime: z.string().transform(val => parseISO(val)),
  newEndTime: z.string().transform(val => parseISO(val)).optional(),
  timeZone: z.string(),
});

const GetCalendarEventsSchema = z.object({
  organizationId: z.string(),
  startDate: z.string().transform(val => parseISO(val)),
  endDate: z.string().transform(val => parseISO(val)),
  timeZone: z.string(),
  eventTypes: z.array(z.nativeEnum(EventType)).optional(),
});

const DetectConflictsSchema = z.object({
  organizationId: z.string(),
  startDate: z.string().transform(val => parseISO(val)),
  endDate: z.string().transform(val => parseISO(val)),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  checkTypes: z.array(z.nativeEnum(ConflictType)).default([
    ConflictType.TIME_OVERLAP,
    ConflictType.PLATFORM_LIMIT,
    ConflictType.CONTENT_SIMILAR,
  ]),
});

const CreateExportSchema = z.object({
  organizationId: z.string(),
  exportType: z.nativeEnum(ExportType),
  format: z.nativeEnum(ExportFormat),
  startDate: z.string().transform(val => parseISO(val)),
  endDate: z.string().transform(val => parseISO(val)),
  timeZone: z.string(),
  includeEvents: z.array(z.nativeEnum(EventType)).default([]),
  platforms: z.array(z.nativeEnum(Platform)).default([]),
  fileName: z.string().optional(),
});

export async function schedulingRoutes(fastify: FastifyInstance) {
  const prisma: PrismaClient = fastify.prisma;
  const schedulingService = new SchedulingService(prisma);
  const calendarExportService = new CalendarExportService(prisma);

  // ============================================
  // OPTIMAL POSTING TIMES
  // ============================================

  /**
   * Analyze optimal posting times for an organization
   */
  fastify.post('/optimal-times/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = AnalyzeOptimalTimesSchema.parse(request.body);
      
      const results = await schedulingService.analyzeOptimalPostingTimes(data);
      
      reply.send({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error('Analyze optimal times error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to analyze optimal posting times',
      });
    }
  });

  /**
   * Get optimal posting time suggestions
   */
  fastify.get('/optimal-times/:organizationId/:platform', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId, platform } = request.params as { organizationId: string; platform: Platform };
      const { timeZone, count } = request.query as { timeZone?: string; count?: string };
      
      if (!timeZone) {
        return reply.status(400).send({
          success: false,
          error: 'timeZone parameter is required',
        });
      }
      
      const results = await schedulingService.getOptimalPostingTimes(
        organizationId,
        platform,
        timeZone,
        count ? parseInt(count) : 10
      );
      
      reply.send({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error('Get optimal times error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get optimal posting times',
      });
    }
  });

  // ============================================
  // BULK SCHEDULING
  // ============================================

  /**
   * Create bulk schedule
   */
  fastify.post('/bulk-schedule', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = BulkScheduleSchema.parse(request.body);
      
      const scheduledPostIds = await schedulingService.createBulkSchedule(data);
      
      reply.send({
        success: true,
        data: {
          scheduledPostIds,
          count: scheduledPostIds.length,
        },
      });
    } catch (error: any) {
      console.error('Bulk schedule error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create bulk schedule',
      });
    }
  });

  // ============================================
  // RECURRING SCHEDULING
  // ============================================

  /**
   * Create recurring schedule
   */
  fastify.post('/recurring-schedule', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = RecurringScheduleSchema.parse(request.body);
      
      const scheduledPostIds = await schedulingService.createRecurringSchedule({
        ...data,
        templateId: data.templateName || 'auto-generated',
      });
      
      reply.send({
        success: true,
        data: {
          scheduledPostIds,
          count: scheduledPostIds.length,
        },
      });
    } catch (error: any) {
      console.error('Recurring schedule error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create recurring schedule',
      });
    }
  });

  // ============================================
  // CALENDAR MANAGEMENT
  // ============================================

  /**
   * Create calendar event
   */
  fastify.post('/calendar/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateCalendarEventSchema.parse(request.body);
      
      const eventId = await schedulingService.createCalendarEvent(data.organizationId, data);
      
      reply.status(201).send({
        success: true,
        data: { eventId },
      });
    } catch (error: any) {
      console.error('Create calendar event error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create calendar event',
      });
    }
  });

  /**
   * Get calendar events
   */
  fastify.get('/calendar/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = GetCalendarEventsSchema.parse(request.query);
      
      const events = await schedulingService.getCalendarEvents(
        data.organizationId,
        data.startDate,
        data.endDate,
        data.timeZone,
        data.eventTypes
      );
      
      reply.send({
        success: true,
        data: events,
      });
    } catch (error: any) {
      console.error('Get calendar events error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get calendar events',
      });
    }
  });

  /**
   * Update calendar event via drag and drop
   */
  fastify.put('/calendar/events/drag-drop', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = DragDropUpdateSchema.parse(request.body);
      
      await schedulingService.updateCalendarEventDragDrop(data);
      
      reply.send({
        success: true,
        message: 'Event updated successfully',
      });
    } catch (error: any) {
      console.error('Drag drop update error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update event',
      });
    }
  });

  /**
   * Delete calendar event
   */
  fastify.delete('/calendar/events/:eventId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { eventId } = request.params as { eventId: string };
      
      await prisma.calendarEvent.update({
        where: { id: eventId },
        data: { status: 'CANCELLED' },
      });
      
      reply.send({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete calendar event error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete event',
      });
    }
  });

  // ============================================
  // CONFLICT DETECTION
  // ============================================

  /**
   * Detect scheduling conflicts
   */
  fastify.post('/conflicts/detect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = DetectConflictsSchema.parse(request.body);
      
      await schedulingService.detectSchedulingConflicts({
        organizationId: data.organizationId,
        timeRange: { start: data.startDate, end: data.endDate },
        platforms: data.platforms,
        checkTypes: data.checkTypes,
      });
      
      reply.send({
        success: true,
        message: 'Conflict detection completed',
      });
    } catch (error: any) {
      console.error('Conflict detection error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to detect conflicts',
      });
    }
  });

  /**
   * Get scheduling conflicts
   */
  fastify.get('/conflicts/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { status, severity, limit, offset } = request.query as {
        status?: string;
        severity?: string;
        limit?: string;
        offset?: string;
      };
      
      const conflicts = await prisma.schedulingConflict.findMany({
        where: {
          organizationId,
          status: status as any,
          severity: severity as any,
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit ? parseInt(limit) : 50,
        skip: offset ? parseInt(offset) : 0,
      });
      
      reply.send({
        success: true,
        data: conflicts,
      });
    } catch (error: any) {
      console.error('Get conflicts error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get conflicts',
      });
    }
  });

  /**
   * Resolve scheduling conflict
   */
  fastify.put('/conflicts/:conflictId/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { conflictId } = request.params as { conflictId: string };
      const { resolution, resolvedBy } = request.body as { resolution: string; resolvedBy: string };
      
      await prisma.schedulingConflict.update({
        where: { id: conflictId },
        data: {
          status: 'RESOLVED',
          resolution,
          resolvedBy,
          resolvedAt: new Date(),
        },
      });
      
      reply.send({
        success: true,
        message: 'Conflict resolved successfully',
      });
    } catch (error: any) {
      console.error('Resolve conflict error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to resolve conflict',
      });
    }
  });

  // ============================================
  // SCHEDULE TEMPLATES
  // ============================================

  /**
   * Get schedule templates
   */
  fastify.get('/templates/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { scheduleType, isActive } = request.query as { scheduleType?: string; isActive?: string };
      
      const templates = await prisma.scheduleTemplate.findMany({
        where: {
          organizationId,
          scheduleType: scheduleType as any,
          isActive: isActive ? isActive === 'true' : undefined,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      reply.send({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error('Get templates error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get templates',
      });
    }
  });

  /**
   * Update schedule template
   */
  fastify.put('/templates/:templateId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { templateId } = request.params as { templateId: string };
      const updateData = request.body as any;
      
      const template = await prisma.scheduleTemplate.update({
        where: { id: templateId },
        data: updateData,
      });
      
      reply.send({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error('Update template error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update template',
      });
    }
  });

  /**
   * Delete schedule template
   */
  fastify.delete('/templates/:templateId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { templateId } = request.params as { templateId: string };
      
      await prisma.scheduleTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });
      
      reply.send({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete template error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete template',
      });
    }
  });

  // ============================================
  // CALENDAR EXPORT
  // ============================================

  /**
   * Create calendar export
   */
  fastify.post('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateExportSchema.parse(request.body);
      
      const exportId = await calendarExportService.createExport(data);
      
      reply.status(201).send({
        success: true,
        data: { exportId },
      });
    } catch (error: any) {
      console.error('Create export error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create export',
      });
    }
  });

  /**
   * Get export status
   */
  fastify.get('/export/:exportId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { exportId } = request.params as { exportId: string };
      
      const exportData = await calendarExportService.getExport(exportId);
      
      reply.send({
        success: true,
        data: exportData,
      });
    } catch (error: any) {
      console.error('Get export error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get export',
      });
    }
  });

  /**
   * Get export history
   */
  fastify.get('/export/history/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { limit } = request.query as { limit?: string };
      
      const exports = await calendarExportService.getExportHistory(
        organizationId,
        limit ? parseInt(limit) : 50
      );
      
      reply.send({
        success: true,
        data: exports,
      });
    } catch (error: any) {
      console.error('Get export history error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get export history',
      });
    }
  });

  /**
   * Delete export
   */
  fastify.delete('/export/:exportId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { exportId } = request.params as { exportId: string };
      
      await calendarExportService.deleteExport(exportId);
      
      reply.send({
        success: true,
        message: 'Export deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete export error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete export',
      });
    }
  });

  // ============================================
  // ANALYTICS AND INSIGHTS
  // ============================================

  /**
   * Get scheduling analytics
   */
  fastify.get('/analytics/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { startDate, endDate, timeZone } = request.query as {
        startDate?: string;
        endDate?: string;
        timeZone?: string;
      };
      
      const start = startDate ? parseISO(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? parseISO(endDate) : new Date();
      const tz = timeZone || 'UTC';
      
      // Get scheduling stats
      const [
        totalScheduled,
        published,
        conflicts,
        optimalTimes,
        templates
      ] = await Promise.all([
        prisma.scheduledPost.count({
          where: {
            organizationId,
            scheduledAt: { gte: start, lte: end },
          },
        }),
        prisma.scheduledPost.count({
          where: {
            organizationId,
            scheduledAt: { gte: start, lte: end },
            status: 'PUBLISHED',
          },
        }),
        prisma.schedulingConflict.count({
          where: {
            organizationId,
            affectedTime: { gte: start, lte: end },
            status: 'ACTIVE',
          },
        }),
        prisma.optimalPostingTime.count({
          where: { organizationId },
        }),
        prisma.scheduleTemplate.count({
          where: { organizationId, isActive: true },
        }),
      ]);
      
      reply.send({
        success: true,
        data: {
          totalScheduled,
          published,
          conflicts,
          optimalTimes,
          templates,
          period: { start, end, timeZone: tz },
        },
      });
    } catch (error: any) {
      console.error('Get scheduling analytics error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get analytics',
      });
    }
  });

  /**
   * Get calendar overview
   */
  fastify.get('/calendar/overview/:organizationId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      const { month, year, timeZone } = request.query as {
        month?: string;
        year?: string;
        timeZone?: string;
      };
      
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) : currentDate.getMonth();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      const tz = timeZone || 'UTC';
      
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
      
      const events = await schedulingService.getCalendarEvents(
        organizationId,
        startOfMonth,
        endOfMonth,
        tz
      );
      
      // Group events by day
      const eventsByDay: Record<string, any[]> = {};
      
      for (const event of events) {
        const dayKey = event.startTime.toISOString().split('T')[0];
        if (!eventsByDay[dayKey]) {
          eventsByDay[dayKey] = [];
        }
        eventsByDay[dayKey].push(event);
      }
      
      reply.send({
        success: true,
        data: {
          month: targetMonth,
          year: targetYear,
          timeZone: tz,
          totalEvents: events.length,
          eventsByDay,
        },
      });
    } catch (error: any) {
      console.error('Get calendar overview error:', error);
      reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get calendar overview',
      });
    }
  });
}
