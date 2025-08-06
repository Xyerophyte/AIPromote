import { PrismaClient, Platform, MetricType } from '@prisma/client';
import { addDays, subDays, startOfDay, endOfDay, format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

export interface DashboardData {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalEngagements: number;
    averageEngagementRate: number;
    followerGrowth: number;
    topPlatform: string;
  };
  chartData: {
    timeSeriesData: TimeSeriesData[];
    platformBreakdown: PlatformData[];
    engagementBreakdown: EngagementData[];
    contentTypePerformance: ContentTypeData[];
  };
  recentActivity: ActivityData[];
  insights: InsightData[];
}

export interface TimeSeriesData {
  date: string;
  impressions: number;
  engagements: number;
  reach: number;
  engagementRate: number;
  platform?: string;
}

export interface PlatformData {
  platform: string;
  impressions: number;
  engagements: number;
  posts: number;
  avgEngagementRate: number;
  followerCount?: number;
  growth?: number;
}

export interface EngagementData {
  type: 'likes' | 'comments' | 'shares' | 'saves';
  count: number;
  percentage: number;
  trend: number; // percentage change from previous period
}

export interface ContentTypeData {
  type: string;
  posts: number;
  avgEngagementRate: number;
  totalImpressions: number;
  bestPerforming?: any;
}

export interface ActivityData {
  id: string;
  type: 'post_published' | 'milestone_reached' | 'trend_spotted';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface InsightData {
  type: 'positive' | 'negative' | 'neutral' | 'action';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  metadata?: any;
}

export interface RealtimeMetrics {
  currentMetrics: {
    activeUsers: number;
    recentEngagements: number;
    recentImpressions: number;
    livePostsCount: number;
  };
  timeSeriesData: {
    timestamp: string;
    engagements: number;
    impressions: number;
    reach: number;
  }[];
  alerts: {
    type: 'spike' | 'drop' | 'milestone' | 'anomaly';
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[];
}

export interface GrowthMetrics {
  currentValue: number;
  previousValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  chartData: {
    date: string;
    value: number;
    benchmark?: number;
  }[];
  milestones: {
    value: number;
    label: string;
    achieved: boolean;
    estimatedDate?: Date;
  }[];
}

export interface CompetitorAnalysis {
  organization: {
    name: string;
    metrics: any;
  };
  competitors: {
    name: string;
    handles: Record<string, string>;
    metrics: any;
    comparison: {
      metric: string;
      ourValue: number;
      theirValue: number;
      difference: number;
      percentDifference: number;
    }[];
  }[];
  insights: InsightData[];
}

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(options: {
    organizationId: string;
    platform?: string;
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
    timeZone: string;
  }): Promise<DashboardData> {
    try {
      const { organizationId, platform, startDate, endDate, groupBy, timeZone } = options;

      // Build base filter
      const baseFilter: any = {
        organizationId,
        collectedAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (platform) {
        baseFilter.platform = platform;
      }

      // Get summary data
      const summary = await this.getSummaryMetrics(baseFilter);

      // Get time series data for charts
      const timeSeriesData = await this.getTimeSeriesData(baseFilter, groupBy, timeZone);

      // Get platform breakdown
      const platformBreakdown = await this.getPlatformBreakdown(baseFilter);

      // Get engagement breakdown
      const engagementBreakdown = await this.getEngagementBreakdown(baseFilter, startDate, endDate);

      // Get content type performance
      const contentTypePerformance = await this.getContentTypePerformance(baseFilter);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(organizationId, 10);

      // Generate insights
      const insights = await this.generateDashboardInsights({
        organizationId,
        platform,
        startDate,
        endDate,
        summary,
        timeSeriesData,
        platformBreakdown,
      });

      return {
        summary,
        chartData: {
          timeSeriesData,
          platformBreakdown,
          engagementBreakdown,
          contentTypePerformance,
        },
        recentActivity,
        insights,
      };
    } catch (error: any) {
      console.error('Error getting dashboard data:', error);
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  /**
   * Get real-time metrics for live dashboard updates
   */
  async getRealtimeMetrics(options: {
    organizationId: string;
    platform?: string;
    interval: string;
  }): Promise<RealtimeMetrics> {
    try {
      const { organizationId, platform, interval } = options;
      const now = new Date();
      const intervalMs = this.parseInterval(interval);
      const startTime = new Date(now.getTime() - (12 * intervalMs)); // Last 12 intervals

      const filter: any = {
        organizationId,
        collectedAt: {
          gte: startTime,
          lte: now,
        },
      };

      if (platform) {
        filter.platform = platform;
      }

      // Get current metrics (last interval)
      const currentPeriodStart = new Date(now.getTime() - intervalMs);
      const currentMetrics = await this.prisma.analytics.aggregate({
        where: {
          ...filter,
          collectedAt: {
            gte: currentPeriodStart,
            lte: now,
          },
        },
        _sum: {
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          impressions: true,
          reach: true,
        },
        _count: {
          id: true,
        },
      });

      // Get time series data
      const timeSeriesData = await this.getRealtimeTimeSeriesData(filter, intervalMs);

      // Detect anomalies and generate alerts
      const alerts = await this.detectAnomalies(organizationId, timeSeriesData);

      return {
        currentMetrics: {
          activeUsers: 0, // This would come from real-time tracking
          recentEngagements: (currentMetrics._sum.likes || 0) + 
                            (currentMetrics._sum.comments || 0) + 
                            (currentMetrics._sum.shares || 0),
          recentImpressions: currentMetrics._sum.impressions || 0,
          livePostsCount: currentMetrics._count.id || 0,
        },
        timeSeriesData,
        alerts,
      };
    } catch (error: any) {
      console.error('Error getting realtime metrics:', error);
      throw new Error(`Failed to get realtime metrics: ${error.message}`);
    }
  }

  /**
   * Get engagement tracking metrics
   */
  async getEngagementMetrics(options: {
    organizationId: string;
    postId?: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const { organizationId, postId, platform, startDate, endDate } = options;

      const filter: any = { organizationId };
      
      if (postId) {
        const contentPiece = await this.prisma.contentPiece.findUnique({
          where: { id: postId },
        });
        if (contentPiece) {
          filter.contentPieceId = postId;
        }
      }

      if (platform) {
        filter.platform = platform;
      }

      if (startDate || endDate) {
        filter.collectedAt = {};
        if (startDate) filter.collectedAt.gte = startDate;
        if (endDate) filter.collectedAt.lte = endDate;
      }

      const engagementData = await this.prisma.analytics.findMany({
        where: filter,
        include: {
          contentPiece: {
            select: {
              id: true,
              title: true,
              body: true,
              platform: true,
              publishedAt: true,
            },
          },
          scheduledPost: {
            select: {
              platformUrl: true,
              publishedAt: true,
            },
          },
        },
        orderBy: {
          collectedAt: 'desc',
        },
      });

      // Calculate engagement trends
      const trends = this.calculateEngagementTrends(engagementData);

      return {
        metrics: engagementData,
        trends,
        summary: {
          totalLikes: engagementData.reduce((sum, item) => sum + item.likes, 0),
          totalComments: engagementData.reduce((sum, item) => sum + item.comments, 0),
          totalShares: engagementData.reduce((sum, item) => sum + item.shares, 0),
          totalImpressions: engagementData.reduce((sum, item) => sum + item.impressions, 0),
          averageEngagementRate: this.calculateAverageEngagementRate(engagementData),
        },
      };
    } catch (error: any) {
      console.error('Error getting engagement metrics:', error);
      throw new Error(`Failed to get engagement metrics: ${error.message}`);
    }
  }

  /**
   * Get growth metrics visualization data
   */
  async getGrowthMetrics(options: {
    organizationId: string;
    platform?: string;
    metric: 'followers' | 'engagement' | 'reach' | 'impressions';
    period: '7d' | '30d' | '90d' | '1y';
  }): Promise<GrowthMetrics> {
    try {
      const { organizationId, platform, metric, period } = options;
      
      const endDate = new Date();
      const startDate = this.getPeriodStartDate(period, endDate);
      const previousEndDate = new Date(startDate.getTime() - 1);
      const previousStartDate = this.getPeriodStartDate(period, previousEndDate);

      // Get current period data
      const currentData = await this.getMetricData(organizationId, platform, metric, startDate, endDate);
      
      // Get previous period data for comparison
      const previousData = await this.getMetricData(organizationId, platform, metric, previousStartDate, previousEndDate);

      // Calculate growth
      const currentValue = this.aggregateMetricData(currentData, metric);
      const previousValue = this.aggregateMetricData(previousData, metric);
      const changePercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

      // Generate chart data
      const chartData = await this.generateGrowthChartData(organizationId, platform, metric, startDate, endDate);

      // Calculate milestones
      const milestones = this.calculateGrowthMilestones(currentValue, metric);

      return {
        currentValue,
        previousValue,
        changePercent,
        trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
        chartData,
        milestones,
      };
    } catch (error: any) {
      console.error('Error getting growth metrics:', error);
      throw new Error(`Failed to get growth metrics: ${error.message}`);
    }
  }

  /**
   * Get performance comparison data
   */
  async getPerformanceComparison(options: {
    organizationId: string;
    compareWith: 'previous_period' | 'competitors' | 'industry_average';
    platforms?: string[];
    startDate: Date;
    endDate: Date;
    metrics: string[];
  }) {
    try {
      const { organizationId, compareWith, platforms, startDate, endDate, metrics } = options;

      // Get current period data
      const currentData = await this.getPerformanceData(organizationId, platforms, startDate, endDate, metrics);

      let comparisonData: any = {};

      switch (compareWith) {
        case 'previous_period':
          comparisonData = await this.getPreviousPeriodComparison(organizationId, platforms, startDate, endDate, metrics);
          break;
        case 'competitors':
          comparisonData = await this.getCompetitorComparison(organizationId, platforms, startDate, endDate, metrics);
          break;
        case 'industry_average':
          comparisonData = await this.getIndustryAverageComparison(organizationId, platforms, startDate, endDate, metrics);
          break;
      }

      return {
        current: currentData,
        comparison: comparisonData,
        insights: this.generateComparisonInsights(currentData, comparisonData, compareWith),
      };
    } catch (error: any) {
      console.error('Error getting performance comparison:', error);
      throw new Error(`Failed to get performance comparison: ${error.message}`);
    }
  }

  /**
   * Get custom date range analytics
   */
  async getCustomRangeAnalytics(options: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    platforms?: string[];
    metrics?: string[];
    groupBy: 'day' | 'week' | 'month';
  }) {
    try {
      const { organizationId, startDate, endDate, platforms, metrics, groupBy } = options;

      const filter: any = {
        organizationId,
        collectedAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (platforms && platforms.length > 0) {
        filter.platform = { in: platforms };
      }

      // Get aggregated data
      const aggregatedData = await this.prisma.analytics.groupBy({
        by: ['platform', this.getDateGroupField(groupBy)],
        where: filter,
        _sum: {
          impressions: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          clicks: true,
          reach: true,
        },
        _avg: {
          engagementRate: true,
          ctr: true,
        },
        _count: {
          id: true,
        },
      });

      // Get detailed metrics if specific metrics requested
      const detailedMetrics = metrics ? await this.getDetailedMetrics(filter, metrics) : null;

      // Format data for charts
      const chartData = this.formatCustomRangeChartData(aggregatedData, groupBy);

      return {
        summary: this.calculateCustomRangeSummary(aggregatedData),
        chartData,
        detailedMetrics,
        dateRange: {
          start: startDate,
          end: endDate,
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
      };
    } catch (error: any) {
      console.error('Error getting custom range analytics:', error);
      throw new Error(`Failed to get custom range analytics: ${error.message}`);
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(config: {
    organizationId: string;
    reportType: 'summary' | 'detailed' | 'performance' | 'growth' | 'competitor';
    format: 'json' | 'pdf' | 'csv' | 'excel';
    platforms?: string[];
    startDate: Date;
    endDate: Date;
    includeCharts: boolean;
    includeComparisons: boolean;
  }): Promise<string> {
    try {
      // Create report record
      const report = await this.prisma.analytics.create({
        data: {
          // This would be stored in a reports table - for now using analytics table as example
          organizationId: config.organizationId,
          platform: 'TWITTER', // placeholder
          metricType: 'ENGAGEMENT',
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          periodStart: config.startDate,
          periodEnd: config.endDate,
        },
      });

      // Generate report data based on type
      let reportData: any = {};

      switch (config.reportType) {
        case 'summary':
          reportData = await this.generateSummaryReport(config);
          break;
        case 'detailed':
          reportData = await this.generateDetailedReport(config);
          break;
        case 'performance':
          reportData = await this.generatePerformanceReport(config);
          break;
        case 'growth':
          reportData = await this.generateGrowthReport(config);
          break;
        case 'competitor':
          reportData = await this.generateCompetitorReport(config);
          break;
      }

      // Format report based on requested format
      const formattedReport = await this.formatReport(reportData, config.format, config.includeCharts);

      // Store report file (would typically save to S3 or similar)
      // For now, return the report ID
      return report.id;
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Get report status
   */
  async getReportStatus(reportId: string) {
    try {
      // This would check actual report status from reports table
      return {
        id: reportId,
        status: 'completed', // 'pending' | 'processing' | 'completed' | 'failed'
        progress: 100,
        createdAt: new Date(),
        completedAt: new Date(),
        downloadUrl: `/api/v1/analytics/reports/${reportId}/download`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    } catch (error: any) {
      console.error('Error getting report status:', error);
      throw new Error(`Failed to get report status: ${error.message}`);
    }
  }

  /**
   * Download report
   */
  async downloadReport(reportId: string) {
    try {
      // This would retrieve the actual report file
      return {
        filename: `analytics-report-${reportId}.json`,
        mimeType: 'application/json',
        data: JSON.stringify({ reportId, data: 'sample report data' }),
      };
    } catch (error: any) {
      console.error('Error downloading report:', error);
      throw new Error(`Failed to download report: ${error.message}`);
    }
  }

  /**
   * Analyze competitors
   */
  async analyzeCompetitors(config: {
    organizationId: string;
    competitors: Array<{
      name: string;
      handles: Record<string, string>;
    }>;
    platforms: string[];
    startDate: Date;
    endDate: Date;
    metrics: string[];
  }): Promise<CompetitorAnalysis> {
    try {
      // Get organization's data
      const orgData = await this.getOrganizationMetrics(config.organizationId, config.platforms, config.startDate, config.endDate, config.metrics);

      // Get competitor data (this would typically involve external API calls)
      const competitorData = await Promise.all(
        config.competitors.map(async (competitor) => {
          const metrics = await this.getCompetitorMetrics(competitor, config.platforms, config.startDate, config.endDate, config.metrics);
          
          return {
            name: competitor.name,
            handles: competitor.handles,
            metrics,
            comparison: this.generateCompetitorComparison(orgData, metrics, config.metrics),
          };
        })
      );

      // Generate insights
      const insights = this.generateCompetitorInsights(orgData, competitorData);

      return {
        organization: {
          name: 'Your Organization', // Would get from database
          metrics: orgData,
        },
        competitors: competitorData,
        insights,
      };
    } catch (error: any) {
      console.error('Error analyzing competitors:', error);
      throw new Error(`Failed to analyze competitors: ${error.message}`);
    }
  }

  /**
   * Get top performing content
   */
  async getTopPerformingContent(options: {
    organizationId: string;
    platform?: string;
    metric: string;
    period: string;
    limit: number;
  }) {
    try {
      const { organizationId, platform, metric, period, limit } = options;
      
      const endDate = new Date();
      const startDate = this.getPeriodStartDate(period as any, endDate);

      const filter: any = {
        organizationId,
        collectedAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (platform) {
        filter.platform = platform;
      }

      const orderBy: any = {};
      orderBy[metric === 'engagement_rate' ? 'engagementRate' : metric] = 'desc';

      const topContent = await this.prisma.analytics.findMany({
        where: filter,
        include: {
          contentPiece: {
            select: {
              id: true,
              title: true,
              body: true,
              platform: true,
              type: true,
              hashtags: true,
            },
          },
          scheduledPost: {
            select: {
              platformUrl: true,
              publishedAt: true,
            },
          },
        },
        orderBy,
        take: limit,
      });

      return topContent.map(item => ({
        ...item,
        metricValue: item[metric === 'engagement_rate' ? 'engagementRate' : metric] || 0,
      }));
    } catch (error: any) {
      console.error('Error getting top performing content:', error);
      throw new Error(`Failed to get top performing content: ${error.message}`);
    }
  }

  /**
   * Generate insights and recommendations
   */
  async generateInsights(options: {
    organizationId: string;
    platform?: string;
    period: string;
  }): Promise<InsightData[]> {
    try {
      const insights: InsightData[] = [];
      
      // Get data for analysis
      const endDate = new Date();
      const startDate = this.getPeriodStartDate(options.period as any, endDate);
      const dashboardData = await this.getDashboardData({
        organizationId: options.organizationId,
        platform: options.platform,
        startDate,
        endDate,
        groupBy: 'day',
        timeZone: 'UTC',
      });

      // Analyze engagement trends
      if (dashboardData.summary.averageEngagementRate > 5) {
        insights.push({
          type: 'positive',
          title: 'Strong Engagement Performance',
          description: `Your content is performing well with ${dashboardData.summary.averageEngagementRate.toFixed(1)}% average engagement rate.`,
          impact: 'high',
        });
      } else if (dashboardData.summary.averageEngagementRate < 2) {
        insights.push({
          type: 'negative',
          title: 'Low Engagement Rate',
          description: `Your engagement rate of ${dashboardData.summary.averageEngagementRate.toFixed(1)}% is below average. Consider reviewing your content strategy.`,
          impact: 'high',
          actionRequired: true,
        });
      }

      // Analyze posting consistency
      const postingConsistency = this.analyzePostingConsistency(dashboardData.chartData.timeSeriesData);
      if (postingConsistency.score < 0.5) {
        insights.push({
          type: 'action',
          title: 'Inconsistent Posting Schedule',
          description: 'Your posting schedule varies significantly. Consistent posting can improve audience engagement.',
          impact: 'medium',
          actionRequired: true,
        });
      }

      // Analyze platform performance
      const bestPlatform = dashboardData.chartData.platformBreakdown.reduce((best, current) => 
        current.avgEngagementRate > best.avgEngagementRate ? current : best
      );

      if (bestPlatform) {
        insights.push({
          type: 'positive',
          title: `${bestPlatform.platform} is Your Top Platform`,
          description: `${bestPlatform.platform} shows the highest engagement rate at ${bestPlatform.avgEngagementRate.toFixed(1)}%. Consider focusing more content here.`,
          impact: 'medium',
        });
      }

      return insights;
    } catch (error: any) {
      console.error('Error generating insights:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  // Private helper methods

  private async getSummaryMetrics(filter: any) {
    const analytics = await this.prisma.analytics.aggregate({
      where: filter,
      _sum: {
        impressions: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
        clicks: true,
        reach: true,
      },
      _avg: {
        engagementRate: true,
      },
      _count: {
        id: true,
      },
    });

    // Get platform with most posts
    const platformStats = await this.prisma.analytics.groupBy({
      by: ['platform'],
      where: filter,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    });

    return {
      totalPosts: analytics._count.id || 0,
      totalImpressions: analytics._sum.impressions || 0,
      totalEngagements: (analytics._sum.likes || 0) + (analytics._sum.comments || 0) + (analytics._sum.shares || 0),
      averageEngagementRate: analytics._avg.engagementRate || 0,
      followerGrowth: 0, // Would calculate from follower data
      topPlatform: platformStats[0]?.platform || 'N/A',
    };
  }

  private async getTimeSeriesData(filter: any, groupBy: string, timeZone: string): Promise<TimeSeriesData[]> {
    // This would implement proper date grouping based on groupBy parameter
    const rawData = await this.prisma.analytics.findMany({
      where: filter,
      orderBy: {
        collectedAt: 'asc',
      },
    });

    // Group data by time period
    const groupedData = new Map<string, any>();

    rawData.forEach(item => {
      const dateKey = this.formatDateByGroup(item.collectedAt, groupBy);
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          date: dateKey,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0,
          count: 0,
        });
      }

      const existing = groupedData.get(dateKey);
      existing.impressions += item.impressions;
      existing.likes += item.likes;
      existing.comments += item.comments;
      existing.shares += item.shares;
      existing.reach += item.reach || 0;
      existing.count += 1;
    });

    return Array.from(groupedData.values()).map(item => ({
      date: item.date,
      impressions: item.impressions,
      engagements: item.likes + item.comments + item.shares,
      reach: item.reach,
      engagementRate: item.impressions > 0 ? ((item.likes + item.comments + item.shares) / item.impressions) * 100 : 0,
    }));
  }

  private async getPlatformBreakdown(filter: any): Promise<PlatformData[]> {
    const platformData = await this.prisma.analytics.groupBy({
      by: ['platform'],
      where: filter,
      _sum: {
        impressions: true,
        likes: true,
        comments: true,
        shares: true,
      },
      _avg: {
        engagementRate: true,
      },
      _count: {
        id: true,
      },
    });

    return platformData.map(item => ({
      platform: item.platform,
      impressions: item._sum.impressions || 0,
      engagements: (item._sum.likes || 0) + (item._sum.comments || 0) + (item._sum.shares || 0),
      posts: item._count.id,
      avgEngagementRate: item._avg.engagementRate || 0,
    }));
  }

  private async getEngagementBreakdown(filter: any, startDate: Date, endDate: Date): Promise<EngagementData[]> {
    const current = await this.prisma.analytics.aggregate({
      where: filter,
      _sum: {
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
    });

    // Get previous period for trend calculation
    const previousPeriod = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - previousPeriod);
    const previous = await this.prisma.analytics.aggregate({
      where: {
        ...filter,
        collectedAt: {
          gte: previousStart,
          lte: startDate,
        },
      },
      _sum: {
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
    });

    const totalEngagements = (current._sum.likes || 0) + (current._sum.comments || 0) + (current._sum.shares || 0) + (current._sum.saves || 0);
    const previousTotal = (previous._sum.likes || 0) + (previous._sum.comments || 0) + (previous._sum.shares || 0) + (previous._sum.saves || 0);

    return [
      {
        type: 'likes',
        count: current._sum.likes || 0,
        percentage: totalEngagements > 0 ? ((current._sum.likes || 0) / totalEngagements) * 100 : 0,
        trend: this.calculateTrend(current._sum.likes || 0, previous._sum.likes || 0),
      },
      {
        type: 'comments',
        count: current._sum.comments || 0,
        percentage: totalEngagements > 0 ? ((current._sum.comments || 0) / totalEngagements) * 100 : 0,
        trend: this.calculateTrend(current._sum.comments || 0, previous._sum.comments || 0),
      },
      {
        type: 'shares',
        count: current._sum.shares || 0,
        percentage: totalEngagements > 0 ? ((current._sum.shares || 0) / totalEngagements) * 100 : 0,
        trend: this.calculateTrend(current._sum.shares || 0, previous._sum.shares || 0),
      },
      {
        type: 'saves',
        count: current._sum.saves || 0,
        percentage: totalEngagements > 0 ? ((current._sum.saves || 0) / totalEngagements) * 100 : 0,
        trend: this.calculateTrend(current._sum.saves || 0, previous._sum.saves || 0),
      },
    ];
  }

  private async getContentTypePerformance(filter: any): Promise<ContentTypeData[]> {
    // This would join with content pieces to get type information
    const contentData = await this.prisma.analytics.findMany({
      where: filter,
      include: {
        contentPiece: {
          select: {
            type: true,
          },
        },
      },
    });

    // Group by content type
    const typeGroups = new Map<string, any>();
    
    contentData.forEach(item => {
      const type = item.contentPiece?.type || 'UNKNOWN';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, {
          type,
          posts: 0,
          totalImpressions: 0,
          totalEngagements: 0,
        });
      }

      const group = typeGroups.get(type);
      group.posts += 1;
      group.totalImpressions += item.impressions;
      group.totalEngagements += item.likes + item.comments + item.shares;
    });

    return Array.from(typeGroups.values()).map(item => ({
      type: item.type,
      posts: item.posts,
      avgEngagementRate: item.totalImpressions > 0 ? (item.totalEngagements / item.totalImpressions) * 100 : 0,
      totalImpressions: item.totalImpressions,
    }));
  }

  private async getRecentActivity(organizationId: string, limit: number): Promise<ActivityData[]> {
    // This would get recent posts, milestones, etc.
    const recentPosts = await this.prisma.scheduledPost.findMany({
      where: {
        organizationId,
        status: 'PUBLISHED',
      },
      include: {
        contentPiece: {
          select: {
            title: true,
            body: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return recentPosts.map(post => ({
      id: post.id,
      type: 'post_published' as const,
      title: 'Post Published',
      description: post.contentPiece?.title || 'New post published',
      timestamp: post.publishedAt || post.createdAt,
    }));
  }

  private async generateDashboardInsights(data: any): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Add performance insights based on the dashboard data
    if (data.summary.averageEngagementRate > 5) {
      insights.push({
        type: 'positive',
        title: 'Excellent Engagement',
        description: 'Your content is performing exceptionally well.',
        impact: 'high',
      });
    }

    return insights;
  }

  // Utility methods
  private parseInterval(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000; // Default 5 minutes
    }
  }

  private async getRealtimeTimeSeriesData(filter: any, intervalMs: number): Promise<any[]> {
    // Implementation for real-time time series data
    return [];
  }

  private async detectAnomalies(organizationId: string, timeSeriesData: any[]): Promise<any[]> {
    // Implementation for anomaly detection
    return [];
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private formatDateByGroup(date: Date, groupBy: string): string {
    switch (groupBy) {
      case 'day': return format(date, 'yyyy-MM-dd');
      case 'week': return format(startOfWeek(date), 'yyyy-MM-dd');
      case 'month': return format(startOfMonth(date), 'yyyy-MM');
      default: return format(date, 'yyyy-MM-dd');
    }
  }

  private getPeriodStartDate(period: '7d' | '30d' | '90d' | '1y', endDate: Date): Date {
    switch (period) {
      case '7d': return subDays(endDate, 7);
      case '30d': return subDays(endDate, 30);
      case '90d': return subDays(endDate, 90);
      case '1y': return subDays(endDate, 365);
      default: return subDays(endDate, 30);
    }
  }

  private getDateGroupField(groupBy: string): any {
    // This would return the appropriate Prisma groupBy field
    return 'collectedAt';
  }

  private calculateAverageEngagementRate(data: any[]): number {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + (item.engagementRate || 0), 0);
    return total / data.length;
  }

  private calculateEngagementTrends(data: any[]): any {
    // Implementation for calculating engagement trends
    return {};
  }

  private async getMetricData(organizationId: string, platform: string | undefined, metric: string, startDate: Date, endDate: Date): Promise<any> {
    // Implementation for getting specific metric data
    return {};
  }

  private aggregateMetricData(data: any, metric: string): number {
    // Implementation for aggregating metric data
    return 0;
  }

  private async generateGrowthChartData(organizationId: string, platform: string | undefined, metric: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Implementation for generating growth chart data
    return [];
  }

  private calculateGrowthMilestones(currentValue: number, metric: string): any[] {
    // Implementation for calculating growth milestones
    return [];
  }

  private async getPerformanceData(organizationId: string, platforms: string[] | undefined, startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting performance data
    return {};
  }

  private async getPreviousPeriodComparison(organizationId: string, platforms: string[] | undefined, startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting previous period comparison
    return {};
  }

  private async getCompetitorComparison(organizationId: string, platforms: string[] | undefined, startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting competitor comparison
    return {};
  }

  private async getIndustryAverageComparison(organizationId: string, platforms: string[] | undefined, startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting industry average comparison
    return {};
  }

  private generateComparisonInsights(currentData: any, comparisonData: any, compareWith: string): InsightData[] {
    // Implementation for generating comparison insights
    return [];
  }

  private async getDetailedMetrics(filter: any, metrics: string[]): Promise<any> {
    // Implementation for getting detailed metrics
    return {};
  }

  private formatCustomRangeChartData(aggregatedData: any[], groupBy: string): any {
    // Implementation for formatting custom range chart data
    return {};
  }

  private calculateCustomRangeSummary(aggregatedData: any[]): any {
    // Implementation for calculating custom range summary
    return {};
  }

  private async generateSummaryReport(config: any): Promise<any> {
    // Implementation for generating summary report
    return {};
  }

  private async generateDetailedReport(config: any): Promise<any> {
    // Implementation for generating detailed report
    return {};
  }

  private async generatePerformanceReport(config: any): Promise<any> {
    // Implementation for generating performance report
    return {};
  }

  private async generateGrowthReport(config: any): Promise<any> {
    // Implementation for generating growth report
    return {};
  }

  private async generateCompetitorReport(config: any): Promise<any> {
    // Implementation for generating competitor report
    return {};
  }

  private async formatReport(reportData: any, format: string, includeCharts: boolean): Promise<any> {
    // Implementation for formatting report
    return {};
  }

  private async getOrganizationMetrics(organizationId: string, platforms: string[], startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting organization metrics
    return {};
  }

  private async getCompetitorMetrics(competitor: any, platforms: string[], startDate: Date, endDate: Date, metrics: string[]): Promise<any> {
    // Implementation for getting competitor metrics (would involve external APIs)
    return {};
  }

  private generateCompetitorComparison(orgData: any, competitorData: any, metrics: string[]): any[] {
    // Implementation for generating competitor comparison
    return [];
  }

  private generateCompetitorInsights(orgData: any, competitorData: any[]): InsightData[] {
    // Implementation for generating competitor insights
    return [];
  }

  private analyzePostingConsistency(timeSeriesData: TimeSeriesData[]): { score: number } {
    // Implementation for analyzing posting consistency
    return { score: 0.8 };
  }
}
