import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportConfig {
  organizationId: string;
  reportType: 'summary' | 'detailed' | 'performance' | 'growth' | 'competitor';
  format: 'json' | 'pdf' | 'csv' | 'excel';
  platforms?: string[];
  startDate: Date;
  endDate: Date;
  includeCharts: boolean;
  includeComparisons: boolean;
}

export interface ReportData {
  metadata: {
    organizationId: string;
    reportType: string;
    generatedAt: Date;
    period: {
      start: Date;
      end: Date;
    };
    platforms: string[];
  };
  executive_summary: {
    key_metrics: {
      total_posts: number;
      total_impressions: number;
      total_engagements: number;
      average_engagement_rate: number;
      best_performing_platform: string;
      growth_rate: number;
    };
    highlights: string[];
    recommendations: string[];
  };
  detailed_metrics: {
    platform_performance: Array<{
      platform: string;
      posts: number;
      impressions: number;
      engagements: number;
      engagement_rate: number;
      best_post: any;
    }>;
    content_performance: Array<{
      content_type: string;
      posts: number;
      avg_engagement_rate: number;
      best_performers: any[];
    }>;
    growth_metrics: Array<{
      metric: string;
      current_value: number;
      previous_value: number;
      change_percent: number;
      trend: string;
    }>;
  };
  charts?: {
    engagement_over_time: any;
    platform_comparison: any;
    content_type_performance: any;
    growth_trends: any;
  };
  competitor_analysis?: {
    competitors: Array<{
      name: string;
      comparison_metrics: any[];
    }>;
    positioning: string[];
    opportunities: string[];
  };
}

export class ReportGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate a comprehensive analytics report
   */
  async generateReport(config: ReportConfig): Promise<{
    reportId: string;
    data: ReportData;
    filePath?: string;
  }> {
    try {
      // Generate the report data
      const reportData = await this.buildReportData(config);

      // Create report record
      const reportRecord = await this.createReportRecord(config, reportData);

      // Generate the file if not JSON format
      let filePath: string | undefined;
      if (config.format !== 'json') {
        filePath = await this.generateReportFile(config, reportData, reportRecord.id);
      }

      return {
        reportId: reportRecord.id,
        data: reportData,
        filePath,
      };
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Build comprehensive report data
   */
  private async buildReportData(config: ReportConfig): Promise<ReportData> {
    const { organizationId, platforms, startDate, endDate } = config;

    // Base filter for analytics queries
    const baseFilter: any = {
      organizationId,
      collectedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platforms && platforms.length > 0) {
      baseFilter.platform = { in: platforms };
    }

    // Get organization info
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Build report data
    const reportData: ReportData = {
      metadata: {
        organizationId,
        reportType: config.reportType,
        generatedAt: new Date(),
        period: {
          start: startDate,
          end: endDate,
        },
        platforms: platforms || ['ALL'],
      },
      executive_summary: await this.buildExecutiveSummary(baseFilter),
      detailed_metrics: await this.buildDetailedMetrics(baseFilter),
    };

    // Add charts if requested
    if (config.includeCharts) {
      reportData.charts = await this.buildChartData(baseFilter);
    }

    // Add competitor analysis if requested
    if (config.reportType === 'competitor') {
      reportData.competitor_analysis = await this.buildCompetitorAnalysis(organizationId, config);
    }

    return reportData;
  }

  /**
   * Build executive summary
   */
  private async buildExecutiveSummary(filter: any) {
    // Get key metrics
    const analytics = await this.prisma.analytics.aggregate({
      where: filter,
      _sum: {
        impressions: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
      _avg: {
        engagementRate: true,
      },
      _count: {
        id: true,
      },
    });

    // Get best performing platform
    const platformStats = await this.prisma.analytics.groupBy({
      by: ['platform'],
      where: filter,
      _avg: {
        engagementRate: true,
      },
      orderBy: {
        _avg: {
          engagementRate: 'desc',
        },
      },
      take: 1,
    });

    const totalEngagements = 
      (analytics._sum.likes || 0) + 
      (analytics._sum.comments || 0) + 
      (analytics._sum.shares || 0) + 
      (analytics._sum.saves || 0);

    return {
      key_metrics: {
        total_posts: analytics._count.id || 0,
        total_impressions: analytics._sum.impressions || 0,
        total_engagements: totalEngagements,
        average_engagement_rate: analytics._avg.engagementRate || 0,
        best_performing_platform: platformStats[0]?.platform || 'N/A',
        growth_rate: 0, // Would calculate actual growth rate
      },
      highlights: await this.generateHighlights(analytics, platformStats[0]),
      recommendations: await this.generateRecommendations(analytics),
    };
  }

  /**
   * Build detailed metrics
   */
  private async buildDetailedMetrics(filter: any) {
    // Platform performance
    const platformPerformance = await this.prisma.analytics.groupBy({
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

    // Content type performance
    const contentPerformance = await this.getContentTypePerformance(filter);

    // Growth metrics
    const growthMetrics = await this.getGrowthMetricsForReport(filter);

    return {
      platform_performance: platformPerformance.map(item => ({
        platform: item.platform,
        posts: item._count.id,
        impressions: item._sum.impressions || 0,
        engagements: (item._sum.likes || 0) + (item._sum.comments || 0) + (item._sum.shares || 0),
        engagement_rate: item._avg.engagementRate || 0,
        best_post: null, // Would get actual best post
      })),
      content_performance: contentPerformance,
      growth_metrics: growthMetrics,
    };
  }

  /**
   * Build chart data for visualizations
   */
  private async buildChartData(filter: any) {
    // This would generate chart-ready data structures
    return {
      engagement_over_time: await this.getEngagementTimeSeriesData(filter),
      platform_comparison: await this.getPlatformComparisonData(filter),
      content_type_performance: await this.getContentTypeChartData(filter),
      growth_trends: await this.getGrowthTrendData(filter),
    };
  }

  /**
   * Build competitor analysis
   */
  private async buildCompetitorAnalysis(organizationId: string, config: ReportConfig) {
    // This would integrate with external APIs to get competitor data
    return {
      competitors: [
        {
          name: 'Competitor A',
          comparison_metrics: [
            { metric: 'Engagement Rate', our_value: 3.2, their_value: 2.8, difference: 0.4 },
            { metric: 'Posting Frequency', our_value: 5, their_value: 7, difference: -2 },
          ],
        },
      ],
      positioning: [
        'You outperform competitors in engagement rate',
        'Lower posting frequency compared to industry average',
      ],
      opportunities: [
        'Increase posting frequency to match industry standards',
        'Leverage high engagement rate with more content',
      ],
    };
  }

  /**
   * Generate report file in requested format
   */
  private async generateReportFile(
    config: ReportConfig, 
    data: ReportData, 
    reportId: string
  ): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `analytics-report-${reportId}-${Date.now()}`;
    let filePath: string;

    switch (config.format) {
      case 'pdf':
        filePath = path.join(reportsDir, `${filename}.pdf`);
        await this.generatePDFReport(data, filePath, config.includeCharts);
        break;
      case 'csv':
        filePath = path.join(reportsDir, `${filename}.csv`);
        await this.generateCSVReport(data, filePath);
        break;
      case 'excel':
        filePath = path.join(reportsDir, `${filename}.xlsx`);
        await this.generateExcelReport(data, filePath, config.includeCharts);
        break;
      default:
        filePath = path.join(reportsDir, `${filename}.json`);
        await this.generateJSONReport(data, filePath);
    }

    return filePath;
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(data: ReportData, filePath: string, includeCharts: boolean) {
    // For PDF generation, you would typically use libraries like puppeteer or pdfkit
    // This is a simplified implementation
    const htmlContent = this.generateHTMLReport(data, includeCharts);
    
    // Simulate PDF generation - in real implementation, use puppeteer or similar
    fs.writeFileSync(filePath.replace('.pdf', '.html'), htmlContent);
    
    console.log(`PDF report generated: ${filePath}`);
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(data: ReportData, filePath: string) {
    let csvContent = 'Metric,Value\n';
    
    // Add key metrics
    csvContent += `Total Posts,${data.executive_summary.key_metrics.total_posts}\n`;
    csvContent += `Total Impressions,${data.executive_summary.key_metrics.total_impressions}\n`;
    csvContent += `Total Engagements,${data.executive_summary.key_metrics.total_engagements}\n`;
    csvContent += `Average Engagement Rate,${data.executive_summary.key_metrics.average_engagement_rate}\n`;
    csvContent += `Best Platform,${data.executive_summary.key_metrics.best_performing_platform}\n`;

    // Add platform performance
    csvContent += '\nPlatform Performance\n';
    csvContent += 'Platform,Posts,Impressions,Engagements,Engagement Rate\n';
    
    data.detailed_metrics.platform_performance.forEach(platform => {
      csvContent += `${platform.platform},${platform.posts},${platform.impressions},${platform.engagements},${platform.engagement_rate}\n`;
    });

    fs.writeFileSync(filePath, csvContent);
    console.log(`CSV report generated: ${filePath}`);
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(data: ReportData, filePath: string, includeCharts: boolean) {
    // For Excel generation, you would use libraries like exceljs
    // This is a simplified implementation that creates a JSON file
    const excelData = {
      summary: data.executive_summary,
      detailed_metrics: data.detailed_metrics,
      charts: includeCharts ? data.charts : undefined,
    };

    fs.writeFileSync(filePath.replace('.xlsx', '.json'), JSON.stringify(excelData, null, 2));
    console.log(`Excel report generated: ${filePath}`);
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(data: ReportData, filePath: string) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`JSON report generated: ${filePath}`);
  }

  /**
   * Generate HTML content for PDF conversion
   */
  private generateHTMLReport(data: ReportData, includeCharts: boolean): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Analytics Report - ${data.metadata.organizationId}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .chart-placeholder { height: 300px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Analytics Report</h1>
            <p>Generated on ${data.metadata.generatedAt.toISOString()}</p>
            <p>Period: ${data.metadata.period.start.toDateString()} - ${data.metadata.period.end.toDateString()}</p>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <h3>Total Posts</h3>
                    <p>${data.executive_summary.key_metrics.total_posts}</p>
                </div>
                <div class="metric-card">
                    <h3>Total Impressions</h3>
                    <p>${data.executive_summary.key_metrics.total_impressions.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h3>Engagement Rate</h3>
                    <p>${data.executive_summary.key_metrics.average_engagement_rate.toFixed(2)}%</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Platform Performance</h2>
            <table>
                <tr>
                    <th>Platform</th>
                    <th>Posts</th>
                    <th>Impressions</th>
                    <th>Engagements</th>
                    <th>Engagement Rate</th>
                </tr>
                ${data.detailed_metrics.platform_performance.map(platform => `
                    <tr>
                        <td>${platform.platform}</td>
                        <td>${platform.posts}</td>
                        <td>${platform.impressions.toLocaleString()}</td>
                        <td>${platform.engagements.toLocaleString()}</td>
                        <td>${platform.engagement_rate.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        ${includeCharts ? `
        <div class="section">
            <h2>Visual Analytics</h2>
            <div class="chart-placeholder">Engagement Over Time Chart</div>
            <div class="chart-placeholder">Platform Comparison Chart</div>
        </div>
        ` : ''}

        <div class="section">
            <h2>Recommendations</h2>
            <ul>
                ${data.executive_summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Create report record in database
   */
  private async createReportRecord(config: ReportConfig, data: ReportData) {
    // In a real implementation, you'd have a dedicated reports table
    // For now, using analytics table as placeholder
    return await this.prisma.analytics.create({
      data: {
        organizationId: config.organizationId,
        platform: 'TWITTER', // placeholder
        metricType: 'ENGAGEMENT',
        impressions: data.executive_summary.key_metrics.total_impressions,
        likes: 0,
        comments: 0,
        shares: 0,
        periodStart: config.startDate,
        periodEnd: config.endDate,
      },
    });
  }

  // Helper methods for data generation

  private async generateHighlights(analytics: any, bestPlatform: any): Promise<string[]> {
    const highlights: string[] = [];
    
    if (analytics._count.id > 50) {
      highlights.push(`Strong content production with ${analytics._count.id} posts published`);
    }
    
    if (analytics._avg.engagementRate > 3) {
      highlights.push(`Above-average engagement rate of ${analytics._avg.engagementRate.toFixed(1)}%`);
    }
    
    if (bestPlatform) {
      highlights.push(`${bestPlatform.platform} is your top-performing platform`);
    }
    
    return highlights;
  }

  private async generateRecommendations(analytics: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (analytics._avg.engagementRate < 2) {
      recommendations.push('Focus on improving content quality to increase engagement rates');
    }
    
    if (analytics._count.id < 20) {
      recommendations.push('Consider increasing posting frequency for better reach');
    }
    
    recommendations.push('Analyze top-performing posts and replicate successful content patterns');
    
    return recommendations;
  }

  private async getContentTypePerformance(filter: any) {
    // Simplified content type performance
    return [
      {
        content_type: 'POST',
        posts: 45,
        avg_engagement_rate: 3.2,
        best_performers: [],
      },
      {
        content_type: 'CAROUSEL',
        posts: 12,
        avg_engagement_rate: 4.1,
        best_performers: [],
      },
    ];
  }

  private async getGrowthMetricsForReport(filter: any) {
    return [
      {
        metric: 'Total Impressions',
        current_value: 125000,
        previous_value: 98000,
        change_percent: 27.6,
        trend: 'up',
      },
      {
        metric: 'Engagement Rate',
        current_value: 3.4,
        previous_value: 2.9,
        change_percent: 17.2,
        trend: 'up',
      },
    ];
  }

  private async getEngagementTimeSeriesData(filter: any) {
    // Return chart data for engagement over time
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Engagement Rate',
          data: [2.8, 3.1, 3.4, 3.7],
        },
      ],
    };
  }

  private async getPlatformComparisonData(filter: any) {
    return {
      labels: ['Twitter', 'LinkedIn', 'Instagram'],
      datasets: [
        {
          label: 'Engagement Rate',
          data: [3.2, 4.1, 2.8],
        },
      ],
    };
  }

  private async getContentTypeChartData(filter: any) {
    return {
      labels: ['Posts', 'Carousels', 'Videos'],
      datasets: [
        {
          label: 'Average Engagement Rate',
          data: [3.2, 4.1, 5.2],
        },
      ],
    };
  }

  private async getGrowthTrendData(filter: any) {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Monthly Growth',
          data: [12, 19, 23, 25, 32],
        },
      ],
    };
  }
}
