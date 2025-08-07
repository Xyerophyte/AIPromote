import { PrismaClient, Platform, ABTestStatus, ABTestType } from '@prisma/client';
import { AnalyticsCollector } from './analytics-collector';

export interface ABTestConfig {
  organizationId: string;
  testName: string;
  testType: ABTestType;
  description?: string;
  platforms: Platform[];
  variants: ABTestVariant[];
  trafficSplit?: number[]; // Percentage split for each variant [50, 50] or [33, 33, 34]
  duration: number; // Test duration in hours
  startDate?: Date;
  endDate?: Date;
  successMetric: 'ENGAGEMENT_RATE' | 'CLICK_THROUGH_RATE' | 'REACH' | 'IMPRESSIONS' | 'CONVERSIONS';
  minimumSampleSize?: number;
  confidenceLevel?: number; // Default 95%
}

export interface ABTestVariant {
  name: string;
  description?: string;
  content?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  postingTime?: Date;
  metadata?: any; // For storing variant-specific data like image versions, CTA buttons, etc.
}

export interface ABTestResult {
  testId: string;
  status: ABTestStatus;
  winner?: string;
  confidence?: number;
  statisticalSignificance: boolean;
  variants: Array<{
    name: string;
    metrics: {
      impressions: number;
      engagementRate: number;
      clickThroughRate: number;
      reach: number;
      conversions: number;
      cost?: number;
    };
    sampleSize: number;
    conversionRate: number;
    performanceScore: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export class ABTestingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new A/B test
   */
  async createABTest(config: ABTestConfig): Promise<string> {
    try {
      // Validate configuration
      this.validateABTestConfig(config);

      // Calculate traffic split if not provided
      const trafficSplit = config.trafficSplit || this.calculateEvenSplit(config.variants.length);

      // Calculate end date if not provided
      const startDate = config.startDate || new Date();
      const endDate = config.endDate || new Date(startDate.getTime() + config.duration * 60 * 60 * 1000);

      // Create the A/B test
      const abTest = await this.prisma.aBTest.create({
        data: {
          organizationId: config.organizationId,
          name: config.testName,
          description: config.description,
          testType: config.testType,
          status: ABTestStatus.DRAFT,
          platforms: config.platforms,
          successMetric: config.successMetric,
          startDate,
          endDate,
          duration: config.duration,
          trafficSplit,
          minimumSampleSize: config.minimumSampleSize || 100,
          confidenceLevel: config.confidenceLevel || 95,
          variants: {
            create: config.variants.map((variant, index) => ({
              name: variant.name,
              description: variant.description,
              content: variant.content,
              hashtags: variant.hashtags || [],
              mediaUrls: variant.mediaUrls || [],
              postingTime: variant.postingTime,
              metadata: variant.metadata || {},
              trafficPercentage: trafficSplit[index],
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      console.log(`Created A/B test: ${abTest.id} with ${config.variants.length} variants`);
      return abTest.id;
    } catch (error: any) {
      console.error('Error creating A/B test:', error);
      throw new Error(`Failed to create A/B test: ${error.message}`);
    }
  }

  /**
   * Start an A/B test
   */
  async startABTest(testId: string): Promise<void> {
    try {
      const abTest = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          organization: true,
        },
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      if (abTest.status !== ABTestStatus.DRAFT) {
        throw new Error('A/B test can only be started from DRAFT status');
      }

      // Update test status
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: ABTestStatus.RUNNING,
          actualStartDate: new Date(),
        },
      });

      // Create scheduled posts for each variant
      await this.createVariantPosts(abTest);

      // Schedule automatic test completion
      this.scheduleTestCompletion(testId, abTest.endDate);

      console.log(`Started A/B test: ${testId}`);
    } catch (error: any) {
      console.error('Error starting A/B test:', error);
      throw new Error(`Failed to start A/B test: ${error.message}`);
    }
  }

  /**
   * Stop an A/B test
   */
  async stopABTest(testId: string, reason?: string): Promise<void> {
    try {
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: ABTestStatus.COMPLETED,
          actualEndDate: new Date(),
          stopReason: reason,
        },
      });

      // Analyze results and determine winner
      await this.analyzeABTestResults(testId);

      console.log(`Stopped A/B test: ${testId}`);
    } catch (error: any) {
      console.error('Error stopping A/B test:', error);
      throw new Error(`Failed to stop A/B test: ${error.message}`);
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTestResult> {
    try {
      const abTest = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: {
            include: {
              scheduledPosts: {
                include: {
                  analytics: true,
                },
              },
            },
          },
        },
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      // Calculate metrics for each variant
      const variantResults = await Promise.all(
        abTest.variants.map(async (variant) => {
          const metrics = await this.calculateVariantMetrics(variant);
          return {
            name: variant.name,
            metrics,
            sampleSize: variant.scheduledPosts.length,
            conversionRate: this.calculateConversionRate(metrics),
            performanceScore: this.calculatePerformanceScore(metrics, abTest.successMetric),
          };
        })
      );

      // Determine statistical significance and winner
      const statisticalAnalysis = this.performStatisticalAnalysis(variantResults, abTest.confidenceLevel);

      // Generate insights and recommendations
      const insights = this.generateInsights(variantResults, abTest);
      const recommendations = this.generateRecommendations(variantResults, abTest);

      return {
        testId: abTest.id,
        status: abTest.status,
        winner: statisticalAnalysis.winner,
        confidence: statisticalAnalysis.confidence,
        statisticalSignificance: statisticalAnalysis.significant,
        variants: variantResults,
        insights,
        recommendations,
      };
    } catch (error: any) {
      console.error('Error getting A/B test results:', error);
      throw new Error(`Failed to get A/B test results: ${error.message}`);
    }
  }

  /**
   * Get all A/B tests for an organization
   */
  async getOrganizationABTests(
    organizationId: string,
    options: {
      status?: ABTestStatus;
      platform?: Platform;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const where: any = { organizationId };

      if (options.status) {
        where.status = options.status;
      }

      if (options.platform) {
        where.platforms = {
          has: options.platform,
        };
      }

      const tests = await this.prisma.aBTest.findMany({
        where,
        include: {
          variants: true,
          _count: {
            select: {
              variants: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return tests;
    } catch (error: any) {
      console.error('Error fetching organization A/B tests:', error);
      throw new Error(`Failed to fetch A/B tests: ${error.message}`);
    }
  }

  /**
   * Analyze A/B test results and update database
   */
  private async analyzeABTestResults(testId: string): Promise<void> {
    try {
      const results = await this.getABTestResults(testId);

      // Update test with results
      await this.prisma.aBTest.update({
        where: { id: testId },
        data: {
          winner: results.winner,
          confidence: results.confidence,
          statisticalSignificance: results.statisticalSignificance,
          results: results as any,
        },
      });

      // If there's a clear winner, create recommendations
      if (results.winner && results.statisticalSignificance) {
        await this.createWinnerRecommendations(testId, results.winner, results);
      }
    } catch (error: any) {
      console.error('Error analyzing A/B test results:', error);
    }
  }

  /**
   * Create scheduled posts for A/B test variants
   */
  private async createVariantPosts(abTest: any): Promise<void> {
    const analyticsCollector = new AnalyticsCollector(this.prisma);

    for (const variant of abTest.variants) {
      // Get active social accounts for the platforms
      const socialAccounts = await this.prisma.socialAccount.findMany({
        where: {
          organizationId: abTest.organizationId,
          platform: { in: abTest.platforms },
          isActive: true,
        },
      });

      // Create content piece for variant
      const contentPiece = await this.prisma.contentPiece.create({
        data: {
          organizationId: abTest.organizationId,
          title: `A/B Test: ${abTest.name} - ${variant.name}`,
          body: variant.content || '',
          platform: abTest.platforms[0], // Use first platform as primary
          type: 'SOCIAL_POST',
          status: 'APPROVED',
          hashtags: variant.hashtags,
          mediaUrls: variant.mediaUrls,
          metadata: {
            abTestId: abTest.id,
            variantId: variant.id,
            ...variant.metadata,
          },
        },
      });

      // Create scheduled posts for each social account
      for (const socialAccount of socialAccounts) {
        const scheduledPost = await this.prisma.scheduledPost.create({
          data: {
            organizationId: abTest.organizationId,
            contentPieceId: contentPiece.id,
            socialAccountId: socialAccount.id,
            scheduledAt: variant.postingTime || abTest.startDate,
            status: 'SCHEDULED',
            idempotencyKey: `ab-test-${abTest.id}-${variant.id}-${socialAccount.id}`,
            metadata: {
              abTestId: abTest.id,
              variantId: variant.id,
            },
          },
        });

        // Link scheduled post to variant
        await this.prisma.aBTestVariant.update({
          where: { id: variant.id },
          data: {
            scheduledPosts: {
              connect: { id: scheduledPost.id },
            },
          },
        });
      }
    }
  }

  /**
   * Calculate metrics for a variant
   */
  private async calculateVariantMetrics(variant: any): Promise<any> {
    const analytics = variant.scheduledPosts.flatMap((post: any) => post.analytics || []);

    if (analytics.length === 0) {
      return {
        impressions: 0,
        engagementRate: 0,
        clickThroughRate: 0,
        reach: 0,
        conversions: 0,
      };
    }

    const totalImpressions = analytics.reduce((sum: number, a: any) => sum + (a.impressions || 0), 0);
    const totalLikes = analytics.reduce((sum: number, a: any) => sum + (a.likes || 0), 0);
    const totalComments = analytics.reduce((sum: number, a: any) => sum + (a.comments || 0), 0);
    const totalShares = analytics.reduce((sum: number, a: any) => sum + (a.shares || 0), 0);
    const totalClicks = analytics.reduce((sum: number, a: any) => sum + (a.clicks || 0), 0);
    const totalReach = analytics.reduce((sum: number, a: any) => sum + (a.reach || 0), 0);

    const totalEngagements = totalLikes + totalComments + totalShares;
    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      impressions: totalImpressions,
      engagementRate,
      clickThroughRate,
      reach: totalReach,
      conversions: totalClicks, // Simplified - in reality, would track actual conversions
    };
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(metrics: any): number {
    if (metrics.impressions === 0) return 0;
    return (metrics.conversions / metrics.impressions) * 100;
  }

  /**
   * Calculate performance score based on success metric
   */
  private calculatePerformanceScore(metrics: any, successMetric: string): number {
    switch (successMetric) {
      case 'ENGAGEMENT_RATE':
        return metrics.engagementRate;
      case 'CLICK_THROUGH_RATE':
        return metrics.clickThroughRate;
      case 'REACH':
        return metrics.reach;
      case 'IMPRESSIONS':
        return metrics.impressions;
      case 'CONVERSIONS':
        return metrics.conversions;
      default:
        return metrics.engagementRate;
    }
  }

  /**
   * Perform statistical analysis to determine significance
   */
  private performStatisticalAnalysis(variants: any[], confidenceLevel: number): {
    winner?: string;
    confidence?: number;
    significant: boolean;
  } {
    if (variants.length < 2) {
      return { significant: false };
    }

    // Sort variants by performance score
    const sortedVariants = [...variants].sort((a, b) => b.performanceScore - a.performanceScore);
    const winner = sortedVariants[0];
    const runner = sortedVariants[1];

    // Simple statistical significance test (in practice, would use proper statistical tests)
    const improvement = ((winner.performanceScore - runner.performanceScore) / runner.performanceScore) * 100;
    const minSampleSize = 100;
    const hasMinimumSample = winner.sampleSize >= minSampleSize && runner.sampleSize >= minSampleSize;

    // Simplified significance check - in production, use proper statistical tests like t-test or chi-square
    const significant = hasMinimumSample && improvement > 20; // 20% improvement threshold
    const confidence = Math.min(95, 70 + improvement); // Simplified confidence calculation

    return {
      winner: significant ? winner.name : undefined,
      confidence: significant ? confidence : undefined,
      significant,
    };
  }

  /**
   * Generate insights from A/B test results
   */
  private generateInsights(variants: any[], abTest: any): string[] {
    const insights: string[] = [];

    // Performance comparison
    const sortedVariants = [...variants].sort((a, b) => b.performanceScore - a.performanceScore);
    const best = sortedVariants[0];
    const worst = sortedVariants[sortedVariants.length - 1];

    if (best.performanceScore > worst.performanceScore) {
      const improvement = ((best.performanceScore - worst.performanceScore) / worst.performanceScore) * 100;
      insights.push(`${best.name} performed ${improvement.toFixed(1)}% better than ${worst.name}`);
    }

    // Engagement patterns
    const avgEngagement = variants.reduce((sum, v) => sum + v.metrics.engagementRate, 0) / variants.length;
    const highEngagementVariants = variants.filter(v => v.metrics.engagementRate > avgEngagement);
    
    if (highEngagementVariants.length > 0) {
      insights.push(`${highEngagementVariants.map(v => v.name).join(' and ')} had above-average engagement rates`);
    }

    // Click-through analysis
    const avgCTR = variants.reduce((sum, v) => sum + v.metrics.clickThroughRate, 0) / variants.length;
    const highCTRVariants = variants.filter(v => v.metrics.clickThroughRate > avgCTR);
    
    if (highCTRVariants.length > 0) {
      insights.push(`${highCTRVariants.map(v => v.name).join(' and ')} drove higher click-through rates`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(variants: any[], abTest: any): string[] {
    const recommendations: string[] = [];

    const sortedVariants = [...variants].sort((a, b) => b.performanceScore - a.performanceScore);
    const winner = sortedVariants[0];

    // Winner recommendation
    if (sortedVariants.length > 1) {
      const improvement = ((winner.performanceScore - sortedVariants[1].performanceScore) / sortedVariants[1].performanceScore) * 100;
      
      if (improvement > 10) {
        recommendations.push(`Use ${winner.name} approach for future campaigns - it shows ${improvement.toFixed(1)}% better performance`);
      }
    }

    // Engagement recommendations
    if (winner.metrics.engagementRate > 5) {
      recommendations.push('High engagement rates suggest your audience resonates well with this content style');
    }

    // CTR recommendations
    if (winner.metrics.clickThroughRate > 2) {
      recommendations.push('Strong click-through rates indicate effective call-to-action and content relevance');
    }

    // Sample size recommendations
    const lowSampleVariants = variants.filter(v => v.sampleSize < 100);
    if (lowSampleVariants.length > 0) {
      recommendations.push('Increase sample size in future tests for more reliable statistical significance');
    }

    return recommendations;
  }

  /**
   * Create recommendations based on winning variant
   */
  private async createWinnerRecommendations(testId: string, winner: string, results: ABTestResult): Promise<void> {
    try {
      // Store recommendations in database for future reference
      await this.prisma.aBTestRecommendation.create({
        data: {
          aBTestId: testId,
          winningVariant: winner,
          recommendations: results.recommendations,
          insights: results.insights,
          confidence: results.confidence || 0,
          createdAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Error creating winner recommendations:', error);
    }
  }

  /**
   * Schedule automatic test completion
   */
  private scheduleTestCompletion(testId: string, endDate: Date): void {
    const delay = endDate.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        try {
          const test = await this.prisma.aBTest.findUnique({
            where: { id: testId },
          });

          if (test && test.status === ABTestStatus.RUNNING) {
            await this.stopABTest(testId, 'Automatic completion - test duration reached');
          }
        } catch (error) {
          console.error('Error in automatic test completion:', error);
        }
      }, delay);
    }
  }

  /**
   * Validate A/B test configuration
   */
  private validateABTestConfig(config: ABTestConfig): void {
    if (!config.organizationId) {
      throw new Error('Organization ID is required');
    }

    if (!config.testName || config.testName.length < 3) {
      throw new Error('Test name must be at least 3 characters long');
    }

    if (!config.variants || config.variants.length < 2) {
      throw new Error('At least 2 variants are required for A/B testing');
    }

    if (config.variants.length > 5) {
      throw new Error('Maximum 5 variants allowed per test');
    }

    if (config.trafficSplit) {
      const totalSplit = config.trafficSplit.reduce((sum, split) => sum + split, 0);
      if (Math.abs(totalSplit - 100) > 0.1) {
        throw new Error('Traffic split must sum to 100%');
      }

      if (config.trafficSplit.length !== config.variants.length) {
        throw new Error('Traffic split array must match number of variants');
      }
    }

    if (config.duration < 1) {
      throw new Error('Test duration must be at least 1 hour');
    }

    if (config.duration > 24 * 7) { // 1 week
      throw new Error('Test duration cannot exceed 1 week');
    }

    if (config.confidenceLevel && (config.confidenceLevel < 80 || config.confidenceLevel > 99)) {
      throw new Error('Confidence level must be between 80% and 99%');
    }
  }

  /**
   * Calculate even traffic split for variants
   */
  private calculateEvenSplit(variantCount: number): number[] {
    const basePercentage = Math.floor(100 / variantCount);
    const remainder = 100 - (basePercentage * variantCount);
    
    const split = new Array(variantCount).fill(basePercentage);
    
    // Distribute remainder to first variants
    for (let i = 0; i < remainder; i++) {
      split[i] += 1;
    }
    
    return split;
  }
}
