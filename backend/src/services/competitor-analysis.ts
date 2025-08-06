import { PrismaClient, Platform } from '@prisma/client';
import { TwitterService } from './twitter-api';
import { LinkedInService } from './linkedin-api';

export interface CompetitorData {
  name: string;
  handles: Record<string, string>; // platform -> handle mapping
  platforms: Platform[];
  verified: boolean;
}

export interface CompetitorMetrics {
  platform: Platform;
  handle: string;
  metrics: {
    followers_count: number;
    following_count: number;
    posts_count: number;
    avg_engagement_rate: number;
    avg_likes: number;
    avg_comments: number;
    avg_shares: number;
    posting_frequency: number; // posts per day
    top_hashtags: string[];
    content_themes: string[];
  };
  recent_posts: Array<{
    id: string;
    content: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    published_at: Date;
    hashtags: string[];
    content_type: string;
  }>;
}

export interface CompetitorAnalysisResult {
  organization: {
    name: string;
    metrics: CompetitorMetrics[];
  };
  competitors: Array<{
    name: string;
    metrics: CompetitorMetrics[];
    comparison: CompetitorComparison;
  }>;
  insights: CompetitorInsight[];
  recommendations: string[];
  market_position: MarketPosition;
}

export interface CompetitorComparison {
  follower_growth: {
    organization: number;
    competitor: number;
    difference: number;
    percentage_difference: number;
  };
  engagement_rate: {
    organization: number;
    competitor: number;
    difference: number;
    percentage_difference: number;
  };
  posting_frequency: {
    organization: number;
    competitor: number;
    difference: number;
    percentage_difference: number;
  };
  content_strategy: {
    similar_hashtags: string[];
    unique_hashtags: {
      organization: string[];
      competitor: string[];
    };
    content_gaps: string[];
  };
}

export interface CompetitorInsight {
  type: 'opportunity' | 'threat' | 'strength' | 'weakness';
  category: 'content' | 'engagement' | 'audience' | 'frequency' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  competitor?: string;
}

export interface MarketPosition {
  ranking: {
    by_followers: number;
    by_engagement: number;
    by_content_volume: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export class CompetitorAnalysisService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Perform comprehensive competitor analysis
   */
  async analyzeCompetitors(options: {
    organizationId: string;
    competitors: CompetitorData[];
    platforms: Platform[];
    startDate: Date;
    endDate: Date;
    includeContentAnalysis: boolean;
  }): Promise<CompetitorAnalysisResult> {
    try {
      const { organizationId, competitors, platforms, startDate, endDate, includeContentAnalysis } = options;

      // Get organization's metrics
      const organizationMetrics = await this.getOrganizationMetrics(organizationId, platforms, startDate, endDate);
      
      // Get organization info
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });

      // Analyze each competitor
      const competitorAnalyses = await Promise.all(
        competitors.map(async (competitor) => {
          const competitorMetrics = await this.getCompetitorMetrics(
            competitor, 
            platforms, 
            startDate, 
            endDate, 
            includeContentAnalysis
          );

          const comparison = this.generateComparison(organizationMetrics, competitorMetrics);

          return {
            name: competitor.name,
            metrics: competitorMetrics,
            comparison,
          };
        })
      );

      // Generate insights and recommendations
      const insights = this.generateInsights(organizationMetrics, competitorAnalyses);
      const recommendations = this.generateRecommendations(organizationMetrics, competitorAnalyses);
      const marketPosition = this.calculateMarketPosition(organizationMetrics, competitorAnalyses);

      return {
        organization: {
          name: organization?.name || 'Your Organization',
          metrics: organizationMetrics,
        },
        competitors: competitorAnalyses,
        insights,
        recommendations,
        market_position: marketPosition,
      };
    } catch (error: any) {
      console.error('Error performing competitor analysis:', error);
      throw new Error(`Failed to perform competitor analysis: ${error.message}`);
    }
  }

  /**
   * Get competitor metrics from external APIs
   */
  private async getCompetitorMetrics(
    competitor: CompetitorData,
    platforms: Platform[],
    startDate: Date,
    endDate: Date,
    includeContentAnalysis: boolean
  ): Promise<CompetitorMetrics[]> {
    const metrics: CompetitorMetrics[] = [];

    for (const platform of platforms) {
      const handle = competitor.handles[platform.toLowerCase()];
      if (!handle) continue;

      try {
        let platformMetrics: CompetitorMetrics;

        switch (platform) {
          case Platform.TWITTER:
            platformMetrics = await this.getTwitterCompetitorMetrics(handle, startDate, endDate, includeContentAnalysis);
            break;
          case Platform.LINKEDIN:
            platformMetrics = await this.getLinkedInCompetitorMetrics(handle, startDate, endDate, includeContentAnalysis);
            break;
          case Platform.INSTAGRAM:
            platformMetrics = await this.getInstagramCompetitorMetrics(handle, startDate, endDate, includeContentAnalysis);
            break;
          default:
            continue;
        }

        metrics.push(platformMetrics);
      } catch (error) {
        console.error(`Failed to get metrics for ${competitor.name} on ${platform}:`, error);
        // Continue with other platforms
      }
    }

    return metrics;
  }

  /**
   * Get organization metrics for comparison
   */
  private async getOrganizationMetrics(
    organizationId: string,
    platforms: Platform[],
    startDate: Date,
    endDate: Date
  ): Promise<CompetitorMetrics[]> {
    const metrics: CompetitorMetrics[] = [];

    for (const platform of platforms) {
      try {
        // Get social account for this platform
        const socialAccount = await this.prisma.socialAccount.findFirst({
          where: {
            organizationId,
            platform,
            isActive: true,
          },
        });

        if (!socialAccount) continue;

        // Get analytics data for the period
        const analytics = await this.prisma.analytics.findMany({
          where: {
            organizationId,
            platform,
            collectedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            contentPiece: {
              select: {
                body: true,
                hashtags: true,
                type: true,
                publishedAt: true,
              },
            },
          },
          orderBy: {
            collectedAt: 'desc',
          },
        });

        // Calculate metrics
        const platformMetrics = this.calculateOrganizationPlatformMetrics(socialAccount, analytics);
        metrics.push(platformMetrics);
      } catch (error) {
        console.error(`Failed to get organization metrics for ${platform}:`, error);
      }
    }

    return metrics;
  }

  /**
   * Get Twitter competitor metrics
   */
  private async getTwitterCompetitorMetrics(
    handle: string,
    startDate: Date,
    endDate: Date,
    includeContent: boolean
  ): Promise<CompetitorMetrics> {
    // This would use Twitter API v2 to get public metrics
    // For now, returning mock data
    return {
      platform: Platform.TWITTER,
      handle: handle,
      metrics: {
        followers_count: 12500,
        following_count: 850,
        posts_count: 1200,
        avg_engagement_rate: 2.8,
        avg_likes: 45,
        avg_comments: 8,
        avg_shares: 12,
        posting_frequency: 3.2,
        top_hashtags: ['#startups', '#tech', '#ai', '#growth', '#marketing'],
        content_themes: ['Product Updates', 'Industry News', 'Thought Leadership'],
      },
      recent_posts: includeContent ? [
        {
          id: 'tweet-123',
          content: 'Excited to announce our latest feature...',
          engagement: { likes: 67, comments: 12, shares: 23 },
          published_at: new Date(),
          hashtags: ['#product', '#announcement'],
          content_type: 'text',
        },
      ] : [],
    };
  }

  /**
   * Get LinkedIn competitor metrics
   */
  private async getLinkedInCompetitorMetrics(
    handle: string,
    startDate: Date,
    endDate: Date,
    includeContent: boolean
  ): Promise<CompetitorMetrics> {
    // This would use LinkedIn API to get public company/profile metrics
    return {
      platform: Platform.LINKEDIN,
      handle: handle,
      metrics: {
        followers_count: 8900,
        following_count: 1200,
        posts_count: 890,
        avg_engagement_rate: 4.2,
        avg_likes: 78,
        avg_comments: 15,
        avg_shares: 22,
        posting_frequency: 2.1,
        top_hashtags: ['#leadership', '#business', '#innovation', '#networking'],
        content_themes: ['Leadership Insights', 'Company Culture', 'Industry Trends'],
      },
      recent_posts: includeContent ? [
        {
          id: 'post-456',
          content: 'Leadership lessons from our recent quarter...',
          engagement: { likes: 89, comments: 18, shares: 31 },
          published_at: new Date(),
          hashtags: ['#leadership', '#growth'],
          content_type: 'article',
        },
      ] : [],
    };
  }

  /**
   * Get Instagram competitor metrics
   */
  private async getInstagramCompetitorMetrics(
    handle: string,
    startDate: Date,
    endDate: Date,
    includeContent: boolean
  ): Promise<CompetitorMetrics> {
    // This would use Instagram Basic Display API or Instagram Graph API
    return {
      platform: Platform.INSTAGRAM,
      handle: handle,
      metrics: {
        followers_count: 25600,
        following_count: 450,
        posts_count: 2100,
        avg_engagement_rate: 3.5,
        avg_likes: 120,
        avg_comments: 18,
        avg_shares: 5,
        posting_frequency: 1.8,
        top_hashtags: ['#design', '#creative', '#brand', '#visual', '#inspiration'],
        content_themes: ['Visual Content', 'Behind the Scenes', 'Product Showcases'],
      },
      recent_posts: includeContent ? [
        {
          id: 'post-789',
          content: 'New design inspiration from our team...',
          engagement: { likes: 156, comments: 24, shares: 8 },
          published_at: new Date(),
          hashtags: ['#design', '#creative'],
          content_type: 'image',
        },
      ] : [],
    };
  }

  /**
   * Calculate organization platform metrics from analytics data
   */
  private calculateOrganizationPlatformMetrics(
    socialAccount: any,
    analytics: any[]
  ): CompetitorMetrics {
    const totalEngagements = analytics.reduce((sum, item) => 
      sum + item.likes + item.comments + item.shares, 0
    );
    const totalImpressions = analytics.reduce((sum, item) => sum + item.impressions, 0);
    const avgEngagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    // Extract hashtags from content
    const allHashtags = analytics
      .flatMap(item => item.contentPiece?.hashtags || [])
      .reduce((acc: Record<string, number>, hashtag) => {
        acc[hashtag] = (acc[hashtag] || 0) + 1;
        return acc;
      }, {});

    const topHashtags = Object.entries(allHashtags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => hashtag);

    return {
      platform: socialAccount.platform,
      handle: socialAccount.handle,
      metrics: {
        followers_count: socialAccount.followersCount || 0,
        following_count: socialAccount.followingCount || 0,
        posts_count: socialAccount.postsCount || 0,
        avg_engagement_rate: avgEngagementRate,
        avg_likes: analytics.length > 0 ? Math.round(analytics.reduce((sum, item) => sum + item.likes, 0) / analytics.length) : 0,
        avg_comments: analytics.length > 0 ? Math.round(analytics.reduce((sum, item) => sum + item.comments, 0) / analytics.length) : 0,
        avg_shares: analytics.length > 0 ? Math.round(analytics.reduce((sum, item) => sum + item.shares, 0) / analytics.length) : 0,
        posting_frequency: this.calculatePostingFrequency(analytics),
        top_hashtags: topHashtags,
        content_themes: this.extractContentThemes(analytics),
      },
      recent_posts: analytics.slice(0, 10).map(item => ({
        id: item.id,
        content: item.contentPiece?.body?.substring(0, 100) + '...' || '',
        engagement: {
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
        },
        published_at: item.contentPiece?.publishedAt || item.periodStart,
        hashtags: item.contentPiece?.hashtags || [],
        content_type: item.contentPiece?.type || 'POST',
      })),
    };
  }

  /**
   * Generate comparison between organization and competitor
   */
  private generateComparison(
    organizationMetrics: CompetitorMetrics[],
    competitorMetrics: CompetitorMetrics[]
  ): CompetitorComparison {
    // For simplicity, comparing first platform metrics
    const orgMetric = organizationMetrics[0];
    const compMetric = competitorMetrics[0];

    if (!orgMetric || !compMetric) {
      return this.getEmptyComparison();
    }

    return {
      follower_growth: {
        organization: orgMetric.metrics.followers_count,
        competitor: compMetric.metrics.followers_count,
        difference: orgMetric.metrics.followers_count - compMetric.metrics.followers_count,
        percentage_difference: this.calculatePercentageDifference(
          orgMetric.metrics.followers_count,
          compMetric.metrics.followers_count
        ),
      },
      engagement_rate: {
        organization: orgMetric.metrics.avg_engagement_rate,
        competitor: compMetric.metrics.avg_engagement_rate,
        difference: orgMetric.metrics.avg_engagement_rate - compMetric.metrics.avg_engagement_rate,
        percentage_difference: this.calculatePercentageDifference(
          orgMetric.metrics.avg_engagement_rate,
          compMetric.metrics.avg_engagement_rate
        ),
      },
      posting_frequency: {
        organization: orgMetric.metrics.posting_frequency,
        competitor: compMetric.metrics.posting_frequency,
        difference: orgMetric.metrics.posting_frequency - compMetric.metrics.posting_frequency,
        percentage_difference: this.calculatePercentageDifference(
          orgMetric.metrics.posting_frequency,
          compMetric.metrics.posting_frequency
        ),
      },
      content_strategy: {
        similar_hashtags: this.findCommonHashtags(
          orgMetric.metrics.top_hashtags,
          compMetric.metrics.top_hashtags
        ),
        unique_hashtags: {
          organization: this.findUniqueHashtags(
            orgMetric.metrics.top_hashtags,
            compMetric.metrics.top_hashtags
          ),
          competitor: this.findUniqueHashtags(
            compMetric.metrics.top_hashtags,
            orgMetric.metrics.top_hashtags
          ),
        },
        content_gaps: this.identifyContentGaps(orgMetric, compMetric),
      },
    };
  }

  /**
   * Generate competitive insights
   */
  private generateInsights(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): CompetitorInsight[] {
    const insights: CompetitorInsight[] = [];

    competitorAnalyses.forEach(competitor => {
      const comparison = competitor.comparison;

      // Engagement rate insights
      if (comparison.engagement_rate.difference > 1) {
        insights.push({
          type: 'strength',
          category: 'engagement',
          title: 'Superior Engagement Rate',
          description: `Your engagement rate is ${comparison.engagement_rate.difference.toFixed(1)} percentage points higher than ${competitor.name}`,
          impact: 'high',
          actionable: false,
          competitor: competitor.name,
        });
      } else if (comparison.engagement_rate.difference < -1) {
        insights.push({
          type: 'opportunity',
          category: 'engagement',
          title: 'Engagement Rate Gap',
          description: `${competitor.name} has ${Math.abs(comparison.engagement_rate.difference).toFixed(1)} percentage points higher engagement rate`,
          impact: 'high',
          actionable: true,
          competitor: competitor.name,
        });
      }

      // Posting frequency insights
      if (comparison.posting_frequency.difference < -1) {
        insights.push({
          type: 'opportunity',
          category: 'frequency',
          title: 'Increase Posting Frequency',
          description: `${competitor.name} posts ${Math.abs(comparison.posting_frequency.difference).toFixed(1)} times more frequently`,
          impact: 'medium',
          actionable: true,
          competitor: competitor.name,
        });
      }

      // Content strategy insights
      if (comparison.content_strategy.unique_hashtags.competitor.length > 0) {
        insights.push({
          type: 'opportunity',
          category: 'strategy',
          title: 'Untapped Hashtag Opportunities',
          description: `${competitor.name} uses hashtags like ${comparison.content_strategy.unique_hashtags.competitor.slice(0, 3).join(', ')} that you could explore`,
          impact: 'medium',
          actionable: true,
          competitor: competitor.name,
        });
      }
    });

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): string[] {
    const recommendations: string[] = [];

    // Analyze posting frequency
    const avgCompetitorFrequency = competitorAnalyses.reduce((sum, comp) => {
      const firstPlatform = comp.metrics[0];
      return sum + (firstPlatform?.metrics.posting_frequency || 0);
    }, 0) / competitorAnalyses.length;

    const orgFrequency = organizationMetrics[0]?.metrics.posting_frequency || 0;

    if (orgFrequency < avgCompetitorFrequency * 0.8) {
      recommendations.push(`Increase posting frequency to match industry average (${avgCompetitorFrequency.toFixed(1)} posts per day)`);
    }

    // Analyze engagement rates
    const avgCompetitorEngagement = competitorAnalyses.reduce((sum, comp) => {
      const firstPlatform = comp.metrics[0];
      return sum + (firstPlatform?.metrics.avg_engagement_rate || 0);
    }, 0) / competitorAnalyses.length;

    const orgEngagement = organizationMetrics[0]?.metrics.avg_engagement_rate || 0;

    if (orgEngagement < avgCompetitorEngagement * 0.9) {
      recommendations.push('Focus on creating more engaging content to match competitor performance');
    }

    // Content strategy recommendations
    const uniqueHashtags = new Set<string>();
    competitorAnalyses.forEach(comp => {
      comp.metrics.forEach(metric => {
        metric.metrics.top_hashtags.forEach(hashtag => uniqueHashtags.add(hashtag));
      });
    });

    const orgHashtags = new Set(organizationMetrics.flatMap(m => m.metrics.top_hashtags));
    const newHashtagOpportunities = Array.from(uniqueHashtags).filter(tag => !orgHashtags.has(tag));

    if (newHashtagOpportunities.length > 0) {
      recommendations.push(`Explore new hashtag opportunities: ${newHashtagOpportunities.slice(0, 5).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Calculate market position
   */
  private calculateMarketPosition(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): MarketPosition {
    const allEntities = [
      { name: 'Your Organization', metrics: organizationMetrics },
      ...competitorAnalyses.map(c => ({ name: c.name, metrics: c.metrics }))
    ];

    // Calculate rankings
    const followerRanking = this.calculateRanking(allEntities, 'followers_count');
    const engagementRanking = this.calculateRanking(allEntities, 'avg_engagement_rate');
    const contentVolumeRanking = this.calculateRanking(allEntities, 'posting_frequency');

    return {
      ranking: {
        by_followers: followerRanking,
        by_engagement: engagementRanking,
        by_content_volume: contentVolumeRanking,
      },
      strengths: this.identifyStrengths(organizationMetrics, competitorAnalyses),
      weaknesses: this.identifyWeaknesses(organizationMetrics, competitorAnalyses),
      opportunities: this.identifyOpportunities(organizationMetrics, competitorAnalyses),
      threats: this.identifyThreats(organizationMetrics, competitorAnalyses),
    };
  }

  // Helper methods

  private calculatePercentageDifference(value1: number, value2: number): number {
    if (value2 === 0) return value1 > 0 ? 100 : 0;
    return ((value1 - value2) / value2) * 100;
  }

  private findCommonHashtags(hashtags1: string[], hashtags2: string[]): string[] {
    return hashtags1.filter(tag => hashtags2.includes(tag));
  }

  private findUniqueHashtags(hashtags1: string[], hashtags2: string[]): string[] {
    return hashtags1.filter(tag => !hashtags2.includes(tag));
  }

  private identifyContentGaps(orgMetric: CompetitorMetrics, compMetric: CompetitorMetrics): string[] {
    const gaps: string[] = [];
    
    // Compare content themes
    const orgThemes = new Set(orgMetric.metrics.content_themes);
    compMetric.metrics.content_themes.forEach(theme => {
      if (!orgThemes.has(theme)) {
        gaps.push(theme);
      }
    });

    return gaps;
  }

  private calculatePostingFrequency(analytics: any[]): number {
    if (analytics.length === 0) return 0;
    
    const firstPost = analytics[analytics.length - 1];
    const lastPost = analytics[0];
    const daysDiff = Math.ceil((lastPost.periodStart.getTime() - firstPost.periodStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff > 0 ? analytics.length / daysDiff : 0;
  }

  private extractContentThemes(analytics: any[]): string[] {
    // Simple content theme extraction based on content types and hashtags
    const themes = new Set<string>();
    
    analytics.forEach(item => {
      if (item.contentPiece?.type) {
        themes.add(item.contentPiece.type);
      }
      
      // Add themes based on hashtags
      item.contentPiece?.hashtags?.forEach((hashtag: string) => {
        if (hashtag.includes('product')) themes.add('Product Updates');
        if (hashtag.includes('tip') || hashtag.includes('how')) themes.add('Educational Content');
        if (hashtag.includes('news') || hashtag.includes('trend')) themes.add('Industry News');
      });
    });

    return Array.from(themes);
  }

  private getEmptyComparison(): CompetitorComparison {
    return {
      follower_growth: { organization: 0, competitor: 0, difference: 0, percentage_difference: 0 },
      engagement_rate: { organization: 0, competitor: 0, difference: 0, percentage_difference: 0 },
      posting_frequency: { organization: 0, competitor: 0, difference: 0, percentage_difference: 0 },
      content_strategy: {
        similar_hashtags: [],
        unique_hashtags: { organization: [], competitor: [] },
        content_gaps: [],
      },
    };
  }

  private calculateRanking(entities: any[], metric: string): number {
    const values = entities.map(entity => {
      const firstPlatform = entity.metrics[0];
      return firstPlatform?.metrics[metric] || 0;
    });

    const sortedValues = [...values].sort((a, b) => b - a);
    const orgValue = values[0]; // First entity is always the organization
    
    return sortedValues.indexOf(orgValue) + 1;
  }

  private identifyStrengths(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): string[] {
    const strengths: string[] = [];

    competitorAnalyses.forEach(competitor => {
      if (competitor.comparison.engagement_rate.difference > 0) {
        strengths.push(`Higher engagement rate than ${competitor.name}`);
      }
      if (competitor.comparison.follower_growth.difference > 0) {
        strengths.push(`Larger audience than ${competitor.name}`);
      }
    });

    return strengths;
  }

  private identifyWeaknesses(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): string[] {
    const weaknesses: string[] = [];

    competitorAnalyses.forEach(competitor => {
      if (competitor.comparison.posting_frequency.difference < -1) {
        weaknesses.push(`Lower posting frequency than ${competitor.name}`);
      }
      if (competitor.comparison.follower_growth.difference < -1000) {
        weaknesses.push(`Significantly smaller audience than ${competitor.name}`);
      }
    });

    return weaknesses;
  }

  private identifyOpportunities(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): string[] {
    const opportunities: string[] = [];

    // Find content gaps
    const allCompetitorHashtags = new Set<string>();
    competitorAnalyses.forEach(comp => {
      comp.metrics.forEach(metric => {
        metric.metrics.top_hashtags.forEach(tag => allCompetitorHashtags.add(tag));
      });
    });

    const orgHashtags = new Set(organizationMetrics.flatMap(m => m.metrics.top_hashtags));
    const newHashtags = Array.from(allCompetitorHashtags).filter(tag => !orgHashtags.has(tag));

    if (newHashtags.length > 0) {
      opportunities.push(`Explore untapped hashtag categories: ${newHashtags.slice(0, 3).join(', ')}`);
    }

    return opportunities;
  }

  private identifyThreats(
    organizationMetrics: CompetitorMetrics[],
    competitorAnalyses: Array<{ name: string; metrics: CompetitorMetrics[]; comparison: CompetitorComparison }>
  ): string[] {
    const threats: string[] = [];

    // Identify competitors with significantly better performance
    competitorAnalyses.forEach(competitor => {
      if (competitor.comparison.engagement_rate.percentage_difference > 50) {
        threats.push(`${competitor.name} has significantly higher engagement rates`);
      }
      if (competitor.comparison.follower_growth.percentage_difference > 100) {
        threats.push(`${competitor.name} has a much larger and potentially growing audience`);
      }
    });

    return threats;
  }
}
