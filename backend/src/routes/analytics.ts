import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics-service';
import { AnalyticsCollector } from '../services/analytics-collector';

// Request schemas
const dashboardQuerySchema = z.object({
  organizationId: z.string().cuid(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  timeZone: z.string().default('UTC'),
});

const engagementTrackingSchema = z.object({
  organizationId: z.string().cuid(),
  postId: z.string().cuid().optional(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const growthMetricsSchema = z.object({
  organizationId: z.string().cuid(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
  metric: z.enum(['followers', 'engagement', 'reach', 'impressions']).default('followers'),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

const performanceComparisonSchema = z.object({
  organizationId: z.string().cuid(),
  compareWith: z.enum(['previous_period', 'competitors', 'industry_average']).default('previous_period'),
  platforms: z.array(z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS'])).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum(['likes', 'comments', 'shares', 'impressions', 'reach', 'engagement_rate', 'ctr'])).default(['engagement_rate']),
});

const reportGenerationSchema = z.object({
  organizationId: z.string().cuid(),
  reportType: z.enum(['summary', 'detailed', 'performance', 'growth', 'competitor']),
  format: z.enum(['json', 'pdf', 'csv', 'excel']).default('json'),
  platforms: z.array(z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS'])).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeCharts: z.boolean().default(true),
  includeComparisons: z.boolean().default(false),
});

const competitorAnalysisSchema = z.object({
  organizationId: z.string().cuid(),
  competitors: z.array(z.object({
    name: z.string(),
    handles: z.record(z.string()), // platform -> handle mapping
  })),
  platforms: z.array(z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS'])),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum(['engagement_rate', 'posting_frequency', 'content_type', 'hashtag_usage'])).default(['engagement_rate']),
});

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify.prisma);
  const analyticsCollector = new AnalyticsCollector(fastify.prisma);

  // Real-time dashboard endpoint
  fastify.get('/dashboard', {
    schema: {
      querystring: dashboardQuerySchema,
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof dashboardQuerySchema> }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, startDate, endDate, groupBy, timeZone } = request.query;

      const dashboardData = await analyticsService.getDashboardData({
        organizationId,
        platform,
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
        endDate: endDate ? new Date(endDate) : new Date(),
        groupBy,
        timeZone,
      });

      return {
        success: true,
        data: dashboardData,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching dashboard data:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard data',
        details: error.message,
      });
    }
  });

  // Real-time analytics data (for charts)
  fastify.get('/realtime', {
    schema: {
      querystring: z.object({
        organizationId: z.string().cuid(),
        platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
        interval: z.enum(['1m', '5m', '15m', '1h']).default('5m'),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { organizationId: string; platform?: string; interval?: string }
  }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, interval = '5m' } = request.query;

      const realtimeData = await analyticsService.getRealtimeMetrics({
        organizationId,
        platform,
        interval,
      });

      return {
        success: true,
        data: realtimeData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Error fetching realtime data:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch realtime data',
        details: error.message,
      });
    }
  });

  // Engagement tracking
  fastify.get('/engagement', {
    schema: {
      querystring: engagementTrackingSchema,
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof engagementTrackingSchema> }>, reply: FastifyReply) => {
    try {
      const { organizationId, postId, platform, startDate, endDate } = request.query;

      const engagementData = await analyticsService.getEngagementMetrics({
        organizationId,
        postId,
        platform,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return {
        success: true,
        data: engagementData,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching engagement data:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch engagement data',
        details: error.message,
      });
    }
  });

  // Growth metrics visualization
  fastify.get('/growth', {
    schema: {
      querystring: growthMetricsSchema,
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof growthMetricsSchema> }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, metric, period } = request.query;

      const growthData = await analyticsService.getGrowthMetrics({
        organizationId,
        platform,
        metric,
        period,
      });

      return {
        success: true,
        data: growthData,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching growth metrics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch growth metrics',
        details: error.message,
      });
    }
  });

  // Performance comparison tools
  fastify.get('/comparison', {
    schema: {
      querystring: performanceComparisonSchema,
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof performanceComparisonSchema> }>, reply: FastifyReply) => {
    try {
      const { organizationId, compareWith, platforms, startDate, endDate, metrics } = request.query;

      const comparisonData = await analyticsService.getPerformanceComparison({
        organizationId,
        compareWith,
        platforms,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        metrics,
      });

      return {
        success: true,
        data: comparisonData,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching comparison data:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch comparison data',
        details: error.message,
      });
    }
  });

  // Custom date range filtering
  fastify.get('/custom-range', {
    schema: {
      querystring: z.object({
        organizationId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        platforms: z.array(z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS'])).optional(),
        metrics: z.array(z.string()).optional(),
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      organizationId: string; 
      startDate: string; 
      endDate: string; 
      platforms?: string[]; 
      metrics?: string[];
      groupBy?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { organizationId, startDate, endDate, platforms, metrics, groupBy = 'day' } = request.query;

      const customRangeData = await analyticsService.getCustomRangeAnalytics({
        organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        platforms,
        metrics,
        groupBy,
      });

      return {
        success: true,
        data: customRangeData,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error: any) {
      fastify.log.error('Error fetching custom range data:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch custom range data',
        details: error.message,
      });
    }
  });

  // Report generation
  fastify.post('/reports/generate', {
    schema: {
      body: reportGenerationSchema,
    },
  }, async (request: FastifyRequest<{ Body: z.infer<typeof reportGenerationSchema> }>, reply: FastifyReply) => {
    try {
      const reportConfig = request.body;

      const reportId = await analyticsService.generateReport({
        ...reportConfig,
        startDate: new Date(reportConfig.startDate),
        endDate: new Date(reportConfig.endDate),
      });

      return {
        success: true,
        reportId,
        message: 'Report generation started',
        estimatedTime: '2-5 minutes',
      };
    } catch (error: any) {
      fastify.log.error('Error generating report:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate report',
        details: error.message,
      });
    }
  });

  // Get report status
  fastify.get('/reports/:reportId/status', async (request: FastifyRequest<{ 
    Params: { reportId: string }
  }>, reply: FastifyReply) => {
    try {
      const { reportId } = request.params;

      const reportStatus = await analyticsService.getReportStatus(reportId);

      return {
        success: true,
        data: reportStatus,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching report status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch report status',
        details: error.message,
      });
    }
  });

  // Download report
  fastify.get('/reports/:reportId/download', async (request: FastifyRequest<{ 
    Params: { reportId: string }
  }>, reply: FastifyReply) => {
    try {
      const { reportId } = request.params;

      const reportFile = await analyticsService.downloadReport(reportId);

      reply.type(reportFile.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${reportFile.filename}"`);
      
      return reportFile.data;
    } catch (error: any) {
      fastify.log.error('Error downloading report:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to download report',
        details: error.message,
      });
    }
  });

  // Competitor analysis
  fastify.post('/competitor-analysis', {
    schema: {
      body: competitorAnalysisSchema,
    },
  }, async (request: FastifyRequest<{ Body: z.infer<typeof competitorAnalysisSchema> }>, reply: FastifyReply) => {
    try {
      const analysisConfig = request.body;

      const competitorData = await analyticsService.analyzeCompetitors({
        ...analysisConfig,
        startDate: new Date(analysisConfig.startDate),
        endDate: new Date(analysisConfig.endDate),
      });

      return {
        success: true,
        data: competitorData,
      };
    } catch (error: any) {
      fastify.log.error('Error performing competitor analysis:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to perform competitor analysis',
        details: error.message,
      });
    }
  });

  // Top performing content
  fastify.get('/top-content', {
    schema: {
      querystring: z.object({
        organizationId: z.string().cuid(),
        platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
        metric: z.enum(['likes', 'comments', 'shares', 'impressions', 'engagement_rate']).default('engagement_rate'),
        period: z.enum(['7d', '30d', '90d']).default('30d'),
        limit: z.number().min(1).max(50).default(10),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { 
      organizationId: string; 
      platform?: string; 
      metric?: string; 
      period?: string;
      limit?: number;
    }
  }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, metric = 'engagement_rate', period = '30d', limit = 10 } = request.query;

      const topContent = await analyticsService.getTopPerformingContent({
        organizationId,
        platform,
        metric,
        period,
        limit,
      });

      return {
        success: true,
        data: topContent,
      };
    } catch (error: any) {
      fastify.log.error('Error fetching top content:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch top content',
        details: error.message,
      });
    }
  });

  // Analytics insights and recommendations
  fastify.get('/insights', {
    schema: {
      querystring: z.object({
        organizationId: z.string().cuid(),
        platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
        period: z.enum(['7d', '30d', '90d']).default('30d'),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { organizationId: string; platform?: string; period?: string }
  }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, period = '30d' } = request.query;

      const insights = await analyticsService.generateInsights({
        organizationId,
        platform,
        period,
      });

      return {
        success: true,
        data: insights,
      };
    } catch (error: any) {
      fastify.log.error('Error generating insights:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate insights',
        details: error.message,
      });
    }
  });

  // Trigger manual analytics collection
  fastify.post('/collect', {
    schema: {
      body: z.object({
        organizationId: z.string().cuid(),
        platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']).optional(),
        forceRefresh: z.boolean().default(false),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Body: { organizationId: string; platform?: string; forceRefresh?: boolean }
  }>, reply: FastifyReply) => {
    try {
      const { organizationId, platform, forceRefresh = false } = request.body;

      // Trigger analytics collection
      await analyticsCollector.collectOrganizationAnalytics({
        organizationId,
        platform,
        forceRefresh,
      });

      return {
        success: true,
        message: 'Analytics collection started',
      };
    } catch (error: any) {
      fastify.log.error('Error triggering analytics collection:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to trigger analytics collection',
        details: error.message,
      });
    }
  });
};
