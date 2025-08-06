import { PrismaClient, ExportType, ExportFormat, ExportStatus, EventType, Platform } from '@prisma/client';
import { format, formatISO } from 'date-fns';
// @ts-ignore - date-fns-tz may not have full type definitions
import { utcToZonedTime } from 'date-fns-tz';
// @ts-ignore - ical-generator may not have full type definitions
import * as ical from 'ical-generator';
import { v4 as uuidv4 } from 'uuid';

interface ExportRequest {
  organizationId: string;
  exportType: ExportType;
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  includeEvents: EventType[];
  platforms: Platform[];
  fileName?: string;
}

interface CalendarExportData {
  events: Array<{
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime?: Date;
    eventType: string;
    platform?: string;
    tags: string[];
    url?: string;
    location?: string;
  }>;
  metadata: {
    organizationName: string;
    exportDate: Date;
    timeZone: string;
    totalEvents: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

export class CalendarExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create calendar export
   */
  async createExport(request: ExportRequest): Promise<string> {
    const {
      organizationId,
      exportType,
      format,
      startDate,
      endDate,
      timeZone,
      includeEvents,
      platforms,
      fileName,
    } = request;

    // Create export record
    const exportRecord = await this.prisma.calendarExport.create({
      data: {
        organizationId,
        exportType,
        format,
        status: ExportStatus.PENDING,
        startDate,
        endDate,
        timeZone,
        includeEvents,
        platforms,
        fileName: fileName || this.generateFileName(exportType, format, organizationId),
      },
    });

    // Process export asynchronously
    this.processExportAsync(exportRecord.id);

    return exportRecord.id;
  }

  /**
   * Get export status and download URL
   */
  async getExport(exportId: string) {
    const exportRecord = await this.prisma.calendarExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new Error('Export not found');
    }

    return {
      id: exportRecord.id,
      status: exportRecord.status,
      fileName: exportRecord.fileName,
      fileSize: exportRecord.fileSize,
      downloadUrl: exportRecord.downloadUrl,
      expiresAt: exportRecord.expiresAt,
      errorMessage: exportRecord.errorMessage,
      createdAt: exportRecord.createdAt,
    };
  }

  /**
   * Process export asynchronously
   */
  private async processExportAsync(exportId: string): Promise<void> {
    try {
      await this.prisma.calendarExport.update({
        where: { id: exportId },
        data: { status: ExportStatus.PROCESSING },
      });

      const exportRecord = await this.prisma.calendarExport.findUnique({
        where: { id: exportId },
      });

      if (!exportRecord) {
        throw new Error('Export record not found');
      }

      // Get calendar data
      const calendarData = await this.getCalendarData(exportRecord);

      // Generate export content
      let exportContent: string | Buffer;
      let mimeType: string;

      switch (exportRecord.format) {
        case ExportFormat.ICAL:
          exportContent = this.generateICalExport(calendarData);
          mimeType = 'text/calendar';
          break;
        case ExportFormat.CSV:
          exportContent = this.generateCSVExport(calendarData);
          mimeType = 'text/csv';
          break;
        case ExportFormat.JSON:
          exportContent = this.generateJSONExport(calendarData);
          mimeType = 'application/json';
          break;
        case ExportFormat.PDF:
          exportContent = await this.generatePDFExport(calendarData);
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // In a real implementation, you would upload to S3 or similar storage
      // For now, we'll simulate the file storage
      const downloadUrl = await this.uploadExportFile(
        exportRecord.fileName!,
        exportContent,
        mimeType
      );

      // Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update export record
      await this.prisma.calendarExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.COMPLETED,
          fileSize: Buffer.isBuffer(exportContent) ? exportContent.length : Buffer.byteLength(exportContent),
          downloadUrl,
          expiresAt,
        },
      });
    } catch (error: any) {
      console.error('Export processing error:', error);
      
      await this.prisma.calendarExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Get calendar data for export
   */
  private async getCalendarData(exportRecord: any): Promise<CalendarExportData> {
    const {
      organizationId,
      startDate,
      endDate,
      timeZone,
      includeEvents,
      platforms,
      exportType,
    } = exportRecord;

    // Get organization info
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get calendar events
    const calendarEvents = await this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        eventType: includeEvents.length > 0 ? { in: includeEvents } : undefined,
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

    // Get scheduled posts if not covered by calendar events
    let scheduledPosts: any[] = [];
    if (exportType === ExportType.SCHEDULE || exportType === ExportType.FULL_REPORT) {
      scheduledPosts = await this.prisma.scheduledPost.findMany({
        where: {
          organizationId,
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
          socialAccount: {
            platform: platforms.length > 0 ? { in: platforms } : undefined,
          },
          // Only include posts without calendar events to avoid duplicates
          calendarEvent: null,
        },
        include: {
          socialAccount: true,
          contentPiece: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    // Transform events
    const events = [
      // Calendar events
      ...calendarEvents
        .filter(event => {
          if (platforms.length > 0 && event.scheduledPost) {
            return platforms.includes(event.scheduledPost.socialAccount.platform);
          }
          return true;
        })
        .map(event => ({
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          startTime: utcToZonedTime(event.startTime, timeZone),
          endTime: event.endTime ? utcToZonedTime(event.endTime, timeZone) : undefined,
          eventType: event.eventType,
          platform: event.scheduledPost?.socialAccount.platform,
          tags: event.tags,
          url: event.scheduledPost?.platformUrl || undefined,
          location: event.scheduledPost ? `${event.scheduledPost.socialAccount.platform} - @${event.scheduledPost.socialAccount.handle}` : undefined,
        })),
      
      // Scheduled posts without calendar events
      ...scheduledPosts.map(post => ({
        id: post.id,
        title: `Post: ${post.contentPiece.title || 'Untitled'}`,
        description: post.contentPiece.body.substring(0, 200) + (post.contentPiece.body.length > 200 ? '...' : ''),
        startTime: utcToZonedTime(post.scheduledAt, timeZone),
        endTime: undefined,
        eventType: 'POST_SCHEDULED',
        platform: post.socialAccount.platform,
        tags: [post.socialAccount.platform.toLowerCase()],
        url: post.platformUrl || undefined,
        location: `${post.socialAccount.platform} - @${post.socialAccount.handle}`,
      })),
    ];

    // Sort by start time
    events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return {
      events,
      metadata: {
        organizationName: organization.name,
        exportDate: new Date(),
        timeZone,
        totalEvents: events.length,
        dateRange: {
          start: utcToZonedTime(startDate, timeZone),
          end: utcToZonedTime(endDate, timeZone),
        },
      },
    };
  }

  /**
   * Generate iCal export
   */
  private generateICalExport(data: CalendarExportData): string {
    const calendar = ical({
      name: `${data.metadata.organizationName} Content Calendar`,
      description: `Content calendar export for ${data.metadata.organizationName}`,
      timezone: data.metadata.timeZone,
      prodId: '//AI Promote//Content Calendar//EN',
    });

    for (const event of data.events) {
      const icalEvent = calendar.createEvent({
        uid: event.id,
        start: event.startTime,
        end: event.endTime || new Date(event.startTime.getTime() + 30 * 60 * 1000), // 30 min default duration
        summary: event.title,
        description: event.description,
        location: event.location,
        url: event.url,
        categories: event.tags.map(tag => ({ name: tag })),
      });

      // Add custom properties (simplified for now)
      // Note: Custom properties need proper ical-generator implementation
      // if (event.platform) {
      //   icalEvent.property('X-PLATFORM', event.platform);
      // }
      // icalEvent.property('X-EVENT-TYPE', event.eventType);
    }

    return calendar.toString();
  }

  /**
   * Generate CSV export
   */
  private generateCSVExport(data: CalendarExportData): string {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Start Time',
      'End Time',
      'Event Type',
      'Platform',
      'Tags',
      'URL',
      'Location',
    ];

    const rows = data.events.map(event => [
      event.id,
      `"${(event.title || '').replace(/"/g, '""')}"`,
      `"${(event.description || '').replace(/"/g, '""')}"`,
      formatISO(event.startTime),
      event.endTime ? formatISO(event.endTime) : '',
      event.eventType,
      event.platform || '',
      `"${event.tags.join(', ')}"`,
      event.url || '',
      `"${(event.location || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Generate JSON export
   */
  private generateJSONExport(data: CalendarExportData): string {
    return JSON.stringify({
      metadata: {
        ...data.metadata,
        exportVersion: '1.0',
        format: 'JSON',
      },
      events: data.events.map(event => ({
        ...event,
        startTime: formatISO(event.startTime),
        endTime: event.endTime ? formatISO(event.endTime) : null,
      })),
    }, null, 2);
  }

  /**
   * Generate PDF export (simplified implementation)
   */
  private async generatePDFExport(data: CalendarExportData): Promise<Buffer> {
    // In a real implementation, you would use a PDF library like puppeteer, pdfkit, or jsPDF
    // For now, we'll create a simple text-based PDF placeholder
    
    const pdfContent = this.generatePDFContent(data);
    
    // This is a placeholder - in reality you'd use a proper PDF library
    return Buffer.from(pdfContent, 'utf8');
  }

  /**
   * Generate PDF content (text representation)
   */
  private generatePDFContent(data: CalendarExportData): string {
    let content = `Content Calendar Report\n`;
    content += `Organization: ${data.metadata.organizationName}\n`;
    content += `Date Range: ${format(data.metadata.dateRange.start, 'yyyy-MM-dd')} to ${format(data.metadata.dateRange.end, 'yyyy-MM-dd')}\n`;
    content += `Timezone: ${data.metadata.timeZone}\n`;
    content += `Total Events: ${data.metadata.totalEvents}\n`;
    content += `Export Date: ${format(data.metadata.exportDate, 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    content += `Events:\n`;
    content += `========\n\n`;

    for (const event of data.events) {
      content += `Title: ${event.title}\n`;
      content += `Date: ${format(event.startTime, 'yyyy-MM-dd HH:mm')}\n`;
      if (event.endTime) {
        content += `End: ${format(event.endTime, 'yyyy-MM-dd HH:mm')}\n`;
      }
      content += `Type: ${event.eventType}\n`;
      if (event.platform) {
        content += `Platform: ${event.platform}\n`;
      }
      if (event.description) {
        content += `Description: ${event.description}\n`;
      }
      if (event.tags.length > 0) {
        content += `Tags: ${event.tags.join(', ')}\n`;
      }
      if (event.location) {
        content += `Location: ${event.location}\n`;
      }
      if (event.url) {
        content += `URL: ${event.url}\n`;
      }
      content += `\n`;
    }

    return content;
  }

  /**
   * Upload export file (simulated)
   */
  private async uploadExportFile(
    fileName: string,
    content: string | Buffer,
    mimeType: string
  ): Promise<string> {
    // In a real implementation, this would upload to S3, Google Cloud Storage, etc.
    // For now, we'll return a simulated URL
    const fileId = uuidv4();
    return `https://storage.example.com/exports/${fileId}/${fileName}`;
  }

  /**
   * Generate filename for export
   */
  private generateFileName(exportType: ExportType, format: ExportFormat, organizationId: string): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const extension = format.toLowerCase();
    const typePrefix = exportType.toLowerCase().replace('_', '-');
    
    return `${typePrefix}-${organizationId}-${timestamp}.${extension}`;
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<void> {
    const now = new Date();
    
    // Find expired exports
    const expiredExports = await this.prisma.calendarExport.findMany({
      where: {
        status: ExportStatus.COMPLETED,
        expiresAt: {
          lt: now,
        },
      },
    });

    for (const exportRecord of expiredExports) {
      try {
        // In a real implementation, delete the file from storage
        // await deleteFileFromStorage(exportRecord.downloadUrl);
        
        // Update status to expired
        await this.prisma.calendarExport.update({
          where: { id: exportRecord.id },
          data: {
            status: ExportStatus.EXPIRED,
            downloadUrl: null,
          },
        });
      } catch (error) {
        console.error(`Failed to cleanup export ${exportRecord.id}:`, error);
      }
    }
  }

  /**
   * Get export history for organization
   */
  async getExportHistory(organizationId: string, limit: number = 50) {
    return this.prisma.calendarExport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        exportType: true,
        format: true,
        status: true,
        fileName: true,
        fileSize: true,
        downloadUrl: true,
        expiresAt: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        startDate: true,
        endDate: true,
      },
    });
  }

  /**
   * Delete export
   */
  async deleteExport(exportId: string): Promise<void> {
    const exportRecord = await this.prisma.calendarExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new Error('Export not found');
    }

    // In a real implementation, delete the file from storage
    // if (exportRecord.downloadUrl) {
    //   await deleteFileFromStorage(exportRecord.downloadUrl);
    // }

    // Delete from database
    await this.prisma.calendarExport.delete({
      where: { id: exportId },
    });
  }
}
