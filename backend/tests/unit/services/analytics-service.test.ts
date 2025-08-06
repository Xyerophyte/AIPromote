import { AnalyticsService, DashboardData, TimeSeriesData, PlatformData } from '../../../src/services/analytics-service';
import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

// Mock Prisma Client
const mockPrisma = {
  analytics: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  scheduledPost: {
    findMany: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
  },
} as any;

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(mockPrisma as PrismaClient);
  });

  describe('getDashboardData', () => {
    const mockOptions = {
      organizationId: 'org_123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day' as const,
      timeZone: 'UTC'
    };

    const mockAnalyticsData = [
      {
        id: '1',
        platform: 'TWITTER',
        metricType: 'IMPRESSIONS',
        value: 1000,
        collectedAt: new Date('2024-01-01'),
        postId: 'post_1'
      },
      {
        id: '2',
        platform: 'TWITTER',
        metricType: 'ENGAGEMENTS',
        value: 50,
        collectedAt: new Date('2024-01-01'),
        postId: 'post_1'
      },
      {
        id: '3',
        platform: 'LINKEDIN',
        metricType: 'IMPRESSIONS',
        value: 800,
        collectedAt: new Date('2024-01-02'),
        postId: 'post_2'
      }
    ];

    beforeEach(() => {
      // Mock common analytics data
      mockPrisma.analytics.findMany.mockResolvedValue(mockAnalyticsData);
      mockPrisma.analytics.groupBy.mockResolvedValue([
        { platform: 'TWITTER', _count: { id: 10 }, _sum: { value: 5000 } },
        { platform: 'LINKEDIN', _count: { id: 5 }, _sum: { value: 3000 } }
      ]);
      mockPrisma.analytics.count.mockResolvedValue(15);
      mockPrisma.scheduledPost.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
    });

    it('should return comprehensive dashboard data', async () => {
      const result = await service.getDashboardData(mockOptions);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('insights');
      
      expect(result.summary).toHaveProperty('totalPosts');
      expect(result.summary).toHaveProperty('totalImpressions');
      expect(result.summary).toHaveProperty('totalEngagements');
      expect(result.summary).toHaveProperty('averageEngagementRate');
      
      expect(result.chartData).toHaveProperty('timeSeriesData');
      expect(result.chartData).toHaveProperty('platformBreakdown');
      expect(result.chartData).toHaveProperty('engagementBreakdown');
      expect(result.chartData).toHaveProperty('contentTypePerformance');
    });

    it('should filter by platform when provided', async () => {
      const optionsWithPlatform = {
        ...mockOptions,
        platform: 'TWITTER'
      };

      await service.getDashboardData(optionsWithPlatform);

      expect(mockPrisma.analytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            platform: 'TWITTER'
          })
        })
      );
    });

    it('should handle date filtering correctly', async () => {
      await service.getDashboardData(mockOptions);

      expect(mockPrisma.analytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            collectedAt: {
              gte: mockOptions.startDate,
              lte: mockOptions.endDate
            }
          })
        })
      );
    });

    it('should handle empty analytics data gracefully', async () => {
      mockPrisma.analytics.findMany.mockResolvedValue([]);
      mockPrisma.analytics.groupBy.mockResolvedValue([]);
      mockPrisma.analytics.count.mockResolvedValue(0);

      const result = await service.getDashboardData(mockOptions);

      expect(result.summary.totalPosts).toBe(0);
      expect(result.summary.totalImpressions).toBe(0);
      expect(result.summary.totalEngagements).toBe(0);
      expect(result.chartData.timeSeriesData).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.analytics.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardData(mockOptions))
        .rejects
        .toThrow('Database error');
    });

    it('should group data by week when specified', async () => {
      const weeklyOptions = {
        ...mockOptions,
        groupBy: 'week' as const
      };

      await service.getDashboardData(weeklyOptions);

      // Should call analytics methods with appropriate grouping
      expect(mockPrisma.analytics.findMany).toHaveBeenCalled();
    });

    it('should group data by month when specified', async () => {
      const monthlyOptions = {
        ...mockOptions,
        groupBy: 'month' as const
      };

      await service.getDashboardData(monthlyOptions);

      expect(mockPrisma.analytics.findMany).toHaveBeenCalled();
    });
  });

  describe('getRealtimeMetrics', () => {
    beforeEach(() => {
      mockPrisma.analytics.findMany.mockResolvedValue([
        { value: 100, metricType: 'IMPRESSIONS', collectedAt: new Date() },
        { value: 10, metricType: 'ENGAGEMENTS', collectedAt: new Date() }
      ]);
      mockPrisma.scheduledPost.findMany.mockResolvedValue([
        { id: '1', status: 'PUBLISHED' }
      ]);
    });

    it('should return current realtime metrics', async () => {
      const result = await service.getRealtimeMetrics('org_123');

      expect(result).toHaveProperty('currentMetrics');
      expect(result).toHaveProperty('timeSeriesData');
      expect(result).toHaveProperty('alerts');
      
      expect(result.currentMetrics).toHaveProperty('activeUsers');
      expect(result.currentMetrics).toHaveProperty('recentEngagements');
      expect(result.currentMetrics).toHaveProperty('recentImpressions');
      expect(result.currentMetrics).toHaveProperty('livePostsCount');
    });

    it('should handle realtime data collection errors', async () => {
      mockPrisma.analytics.findMany.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.getRealtimeMetrics('org_123'))
        .rejects
        .toThrow('Connection timeout');
    });
  });

  describe('getGrowthMetrics', () => {
    const mockGrowthData = [
      { collectedAt: new Date('2024-01-01'), value: 1000 },
      { collectedAt: new Date('2024-01-02'), value: 1100 },
      { collectedAt: new Date('2024-01-03'), value: 1200 },
    ];

    beforeEach(() => {
      mockPrisma.analytics.findMany.mockResolvedValue(mockGrowthData);
    });

    it('should calculate growth metrics correctly', async () => {
      const result = await service.getGrowthMetrics({
        organizationId: 'org_123',
        metricType: 'FOLLOWERS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        platform: 'TWITTER'
      });

      expect(result).toHaveProperty('currentValue');
      expect(result).toHaveProperty('previousValue');
      expect(result).toHaveProperty('changePercent');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('milestones');
    });

    it('should identify upward trends correctly', async () => {
      const result = await service.getGrowthMetrics({
        organizationId: 'org_123',
        metricType: 'FOLLOWERS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        platform: 'TWITTER'
      });

      expect(result.trend).toBe('up');
      expect(result.changePercent).toBeGreaterThan(0);
    });

    it('should handle declining metrics', async () => {
      const decliningData = [
        { collectedAt: new Date('2024-01-01'), value: 1200 },
        { collectedAt: new Date('2024-01-02'), value: 1100 },
        { collectedAt: new Date('2024-01-03'), value: 1000 },
      ];
      mockPrisma.analytics.findMany.mockResolvedValue(decliningData);

      const result = await service.getGrowthMetrics({
        organizationId: 'org_123',
        metricType: 'FOLLOWERS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        platform: 'TWITTER'
      });

      expect(result.trend).toBe('down');
      expect(result.changePercent).toBeLessThan(0);
    });

    it('should handle stable metrics', async () => {
      const stableData = [
        { collectedAt: new Date('2024-01-01'), value: 1000 },
        { collectedAt: new Date('2024-01-02'), value: 1001 },
        { collectedAt: new Date('2024-01-03'), value: 999 },
      ];
      mockPrisma.analytics.findMany.mockResolvedValue(stableData);

      const result = await service.getGrowthMetrics({
        organizationId: 'org_123',
        metricType: 'FOLLOWERS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        platform: 'TWITTER'
      });

      expect(result.trend).toBe('stable');
      expect(Math.abs(result.changePercent)).toBeLessThan(5); // Less than 5% change is considered stable
    });
  });

  describe('exportAnalytics', () => {
    const mockExportData = [
      {
        date: '2024-01-01',
        platform: 'TWITTER',
        impressions: 1000,
        engagements: 50,
        engagementRate: 5.0
      }
    ];

    beforeEach(() => {
      mockPrisma.analytics.findMany.mockResolvedValue(mockExportData);
    });

    it('should export analytics data in CSV format', async () => {
      const result = await service.exportAnalytics({
        organizationId: 'org_123',
        format: 'csv',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('.csv');
      expect(typeof result.data).toBe('string');
    });

    it('should export analytics data in JSON format', async () => {
      const result = await service.exportAnalytics({
        organizationId: 'org_123',
        format: 'json',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('.json');
      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    it('should export analytics data in Excel format', async () => {
      const result = await service.exportAnalytics({
        organizationId: 'org_123',
        format: 'xlsx',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('.xlsx');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should include selected metrics only when specified', async () => {
      await service.exportAnalytics({
        organizationId: 'org_123',
        format: 'csv',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        metrics: ['impressions', 'engagements']
      });

      expect(mockPrisma.analytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            metricType: { in: ['impressions', 'engagements'] }
          })
        })
      );
    });

    it('should handle export errors gracefully', async () => {
      mockPrisma.analytics.findMany.mockRejectedValue(new Error('Export failed'));

      await expect(service.exportAnalytics({
        organizationId: 'org_123',
        format: 'csv',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      })).rejects.toThrow('Export failed');
    });
  });

  describe('getCompetitorAnalysis', () => {
    beforeEach(() => {
      mockPrisma.analytics.findMany.mockResolvedValue([
        { platform: 'TWITTER', metricType: 'FOLLOWERS', value: 1000 },
        { platform: 'LINKEDIN', metricType: 'FOLLOWERS', value: 500 }
      ]);
    });

    it('should return competitor analysis data', async () => {
      const result = await service.getCompetitorAnalysis({
        organizationId: 'org_123',
        competitors: ['competitor1', 'competitor2'],
        metrics: ['FOLLOWERS', 'ENGAGEMENT_RATE'],
        timeframe: '30d'
      });

      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('competitors');
      expect(result).toHaveProperty('insights');
      expect(Array.isArray(result.competitors)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should handle missing competitor data', async () => {
      mockPrisma.analytics.findMany.mockResolvedValue([]);

      const result = await service.getCompetitorAnalysis({
        organizationId: 'org_123',
        competitors: ['competitor1'],
        metrics: ['FOLLOWERS'],
        timeframe: '30d'
      });

      expect(result.competitors).toHaveLength(0);
      expect(result.insights).toContainEqual(
        expect.objectContaining({
          type: 'neutral',
          title: expect.stringContaining('No competitor data')
        })
      );
    });
  });

  describe('trackCustomEvent', () => {
    it('should track custom events successfully', async () => {
      mockPrisma.analytics.create = jest.fn().mockResolvedValue({ id: 'event_123' });

      await service.trackCustomEvent({
        organizationId: 'org_123',
        eventName: 'content_generated',
        eventData: { contentType: 'POST', platform: 'TWITTER' },
        userId: 'user_123'
      });

      expect(mockPrisma.analytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org_123',
          metricType: 'CUSTOM_EVENT',
          customEventName: 'content_generated'
        })
      });
    });

    it('should handle event tracking errors', async () => {
      mockPrisma.analytics.create = jest.fn().mockRejectedValue(new Error('Tracking failed'));

      await expect(service.trackCustomEvent({
        organizationId: 'org_123',
        eventName: 'test_event',
        eventData: {},
        userId: 'user_123'
      })).rejects.toThrow('Tracking failed');
    });
  });
});
