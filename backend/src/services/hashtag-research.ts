import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import { AIProviderError, ValidationError } from '../utils/errors';

export interface HashtagResearchRequest {
  organizationId: string;
  platform: string;
  content?: string;
  topic?: string;
  keywords?: string[];
  targetAudience?: string;
  industry?: string;
  location?: string;
  contentType?: string;
  campaignType?: 'awareness' | 'engagement' | 'conversion' | 'growth';
  competitors?: string[];
  preferences?: {
    includeNiche: boolean;
    includeTrending: boolean;
    includeBranded: boolean;
    includeLocationBased: boolean;
    maxHashtagLength?: number;
    minHashtagLength?: number;
    excludeOverused: boolean;
  };
}

export interface HashtagSuggestion {
  hashtag: string;
  category: 'trending' | 'niche' | 'branded' | 'location' | 'industry' | 'general' | 'campaign';
  popularity: {
    volume: number; // estimated daily usage volume
    trend: 'rising' | 'stable' | 'declining';
    competitiveness: 'low' | 'medium' | 'high';
    trendScore: number; // 0-100 trending score
  };
  performance: {
    engagementRate: number; // estimated engagement rate
    reachPotential: number; // estimated reach potential
    conversionPotential: number; // estimated conversion potential
    saturationLevel: number; // 0-100, how saturated/overused
  };
  relevance: {
    contentScore: number; // 0-100 relevance to content
    audienceScore: number; // 0-100 relevance to target audience
    industryScore: number; // 0-100 relevance to industry
    overallScore: number; // weighted overall relevance score
  };
  usage: {
    recommendedFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    bestTimes: string[]; // optimal posting times
    seasonality?: string; // if seasonal relevance
  };
  related: string[]; // related hashtags
  demographics: {
    primaryAge: string;
    primaryGender?: string;
    primaryLocation?: string;
    interests: string[];
  };
  platforms: {
    [platform: string]: {
      supported: boolean;
      performance: number; // 0-100 performance score on this platform
      restrictions?: string[];
    };
  };
}

export interface HashtagResearchResult {
  suggestions: HashtagSuggestion[];
  recommendations: {
    optimal: string[]; // 5-10 optimal hashtags for this content
    trending: string[]; // trending hashtags to consider
    niche: string[]; // niche hashtags for better targeting
    avoid: string[]; // hashtags to avoid with reasons
  };
  strategy: {
    mix: {
      trending: number; // percentage
      niche: number;
      branded: number;
      general: number;
    };
    totalRecommended: number;
    reasoning: string;
  };
  insights: {
    trendingTopics: string[];
    competitorHashtags: string[];
    seasonalOpportunities: string[];
    platformSpecificTips: Record<string, string[]>;
  };
  analytics: {
    estimatedReach: number;
    estimatedEngagement: number;
    competitivenessLevel: 'low' | 'medium' | 'high';
    difficultyScore: number; // 0-100
  };
}

export interface HashtagPerformanceTracking {
  hashtagId: string;
  hashtag: string;
  organizationId: string;
  platform: string;
  trackingPeriod: {
    start: Date;
    end: Date;
  };
  metrics: {
    usage: {
      timesUsed: number;
      postsCount: number;
      lastUsed: Date;
    };
    performance: {
      totalImpressions: number;
      totalEngagement: number;
      avgEngagementRate: number;
      totalReach: number;
      totalClicks: number;
      conversionCount: number;
    };
    trends: Array<{
      date: Date;
      impressions: number;
      engagement: number;
      reach: number;
    }>;
  };
  analysis: {
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendation: 'increase_usage' | 'maintain_usage' | 'decrease_usage' | 'retire';
    insights: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagAnalytics {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  overview: {
    totalHashtagsUsed: number;
    avgHashtagsPerPost: number;
    topPerformingHashtags: HashtagSuggestion[];
    worstPerformingHashtags: HashtagSuggestion[];
  };
  trends: {
    popularityChanges: Array<{
      hashtag: string;
      change: number; // percentage change
      direction: 'up' | 'down' | 'stable';
    }>;
    emergingHashtags: string[];
    decliningHashtags: string[];
  };
  platformComparison: Record<string, {
    bestPerformers: string[];
    avgEngagement: number;
    optimalCount: number;
  }>;
  recommendations: {
    hashtagsToAdd: string[];
    hashtagsToRetire: string[];
    mixOptimization: {
      currentMix: Record<string, number>;
      recommendedMix: Record<string, number>;
    };
  };
}

const HashtagResearchRequestSchema = z.object({
  organizationId: z.string(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']),
  content: z.string().optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  contentType: z.string().optional(),
  campaignType: z.enum(['awareness', 'engagement', 'conversion', 'growth']).optional(),
  competitors: z.array(z.string()).optional(),
  preferences: z.object({
    includeNiche: z.boolean().default(true),
    includeTrending: z.boolean().default(true),
    includeBranded: z.boolean().default(true),
    includeLocationBased: z.boolean().default(false),
    maxHashtagLength: z.number().optional(),
    minHashtagLength: z.number().optional(),
    excludeOverused: z.boolean().default(true),
  }).optional(),
});

export class HashtagResearchService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });
  }

  async researchHashtags(
    request: HashtagResearchRequest,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<HashtagResearchResult> {
    try {
      const validatedRequest = HashtagResearchRequestSchema.parse(request);

      if (provider === 'openai') {
        return await this.researchWithOpenAI(validatedRequest);
      } else {
        return await this.researchWithAnthropic(validatedRequest);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid hashtag research request', 'request', error.errors);
      }
      throw error;
    }
  }

  private async researchWithOpenAI(request: HashtagResearchRequest): Promise<HashtagResearchResult> {
    try {
      const prompt = this.buildHashtagResearchPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are a social media hashtag research expert with deep knowledge of platform algorithms, trending topics, and audience behavior. You provide data-driven hashtag recommendations that maximize reach, engagement, and conversions while maintaining authenticity.

Return your response as a valid JSON object with the following structure:
{
  "suggestions": [
    {
      "hashtag": "example",
      "category": "trending",
      "popularity": {
        "volume": 50000,
        "trend": "rising",
        "competitiveness": "medium",
        "trendScore": 85
      },
      "performance": {
        "engagementRate": 0.05,
        "reachPotential": 0.15,
        "conversionPotential": 0.02,
        "saturationLevel": 60
      },
      "relevance": {
        "contentScore": 90,
        "audienceScore": 85,
        "industryScore": 80,
        "overallScore": 85
      },
      "usage": {
        "recommendedFrequency": "weekly",
        "bestTimes": ["9-10 AM", "7-8 PM"],
        "seasonality": "year-round"
      },
      "related": ["relatedhashtag1", "relatedhashtag2"],
      "demographics": {
        "primaryAge": "25-34",
        "primaryGender": "mixed",
        "primaryLocation": "global",
        "interests": ["interest1", "interest2"]
      },
      "platforms": {
        "INSTAGRAM": {
          "supported": true,
          "performance": 85,
          "restrictions": []
        }
      }
    }
  ],
  "recommendations": {
    "optimal": ["hashtag1", "hashtag2"],
    "trending": ["trending1", "trending2"],
    "niche": ["niche1", "niche2"],
    "avoid": ["avoid1", "avoid2"]
  },
  "strategy": {
    "mix": {
      "trending": 30,
      "niche": 40,
      "branded": 20,
      "general": 10
    },
    "totalRecommended": 8,
    "reasoning": "..."
  },
  "insights": {
    "trendingTopics": ["topic1", "topic2"],
    "competitorHashtags": ["comp1", "comp2"],
    "seasonalOpportunities": ["season1", "season2"],
    "platformSpecificTips": {
      "INSTAGRAM": ["tip1", "tip2"]
    }
  },
  "analytics": {
    "estimatedReach": 100000,
    "estimatedEngagement": 5000,
    "competitivenessLevel": "medium",
    "difficultyScore": 65
  }
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result;

    } catch (error: any) {
      throw new AIProviderError('OpenAI', error.message);
    }
  }

  private async researchWithAnthropic(request: HashtagResearchRequest): Promise<HashtagResearchResult> {
    try {
      const prompt = this.buildHashtagResearchPrompt(request);

      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are a social media hashtag research expert with deep knowledge of platform algorithms, trending topics, and audience behavior. You provide data-driven hashtag recommendations that maximize reach, engagement, and conversions while maintaining authenticity.

${prompt}

Please provide comprehensive hashtag research as a JSON object with suggestions, recommendations, strategy, insights, and analytics.`
          }
        ]
      });

      const result = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}');
      return result;

    } catch (error: any) {
      throw new AIProviderError('Anthropic', error.message);
    }
  }

  private buildHashtagResearchPrompt(request: HashtagResearchRequest): string {
    let prompt = `Research and recommend hashtags for ${request.platform} with the following requirements:\n\n`;

    if (request.content) {
      prompt += `CONTENT: "${request.content}"\n\n`;
    }

    if (request.topic) {
      prompt += `TOPIC: ${request.topic}\n\n`;
    }

    if (request.keywords && request.keywords.length > 0) {
      prompt += `KEYWORDS: ${request.keywords.join(', ')}\n\n`;
    }

    if (request.targetAudience) {
      prompt += `TARGET AUDIENCE: ${request.targetAudience}\n\n`;
    }

    if (request.industry) {
      prompt += `INDUSTRY: ${request.industry}\n\n`;
    }

    if (request.location) {
      prompt += `LOCATION: ${request.location}\n\n`;
    }

    if (request.contentType) {
      prompt += `CONTENT TYPE: ${request.contentType}\n\n`;
    }

    if (request.campaignType) {
      prompt += `CAMPAIGN TYPE: ${request.campaignType}\n\n`;
    }

    if (request.competitors && request.competitors.length > 0) {
      prompt += `COMPETITORS TO ANALYZE: ${request.competitors.join(', ')}\n\n`;
    }

    prompt += `PLATFORM SPECIFIC REQUIREMENTS FOR ${request.platform}:\n`;
    
    switch (request.platform) {
      case 'INSTAGRAM':
        prompt += `- Optimal hashtag count: 20-30 hashtags
- Mix trending, niche, and branded hashtags
- Consider Instagram-specific features (Reels, Stories, Posts)
- Focus on visual content hashtags
- Include location tags if relevant\n\n`;
        break;
      case 'TWITTER':
        prompt += `- Optimal hashtag count: 1-2 hashtags
- Focus on trending and timely hashtags
- Consider Twitter conversations and communities
- Keep hashtags concise and memorable
- Align with current Twitter trends\n\n`;
        break;
      case 'LINKEDIN':
        prompt += `- Optimal hashtag count: 3-5 hashtags
- Focus on professional and industry-specific hashtags
- Consider thought leadership positioning
- Include skill and expertise hashtags
- Target business professionals\n\n`;
        break;
      case 'TIKTOK':
        prompt += `- Optimal hashtag count: 3-8 hashtags
- Focus on trending challenges and sounds
- Include FYP optimization hashtags
- Consider niche communities
- Mix viral and discoverable hashtags\n\n`;
        break;
      case 'YOUTUBE_SHORTS':
        prompt += `- Optimal hashtag count: 3-5 hashtags
- Focus on Shorts-specific hashtags
- Include category and niche hashtags
- Consider YouTube search optimization
- Mix trending and evergreen hashtags\n\n`;
        break;
    }

    if (request.preferences) {
      prompt += `PREFERENCES:\n`;
      prompt += `- Include niche hashtags: ${request.preferences.includeNiche ? 'Yes' : 'No'}\n`;
      prompt += `- Include trending hashtags: ${request.preferences.includeTrending ? 'Yes' : 'No'}\n`;
      prompt += `- Include branded hashtags: ${request.preferences.includeBranded ? 'Yes' : 'No'}\n`;
      prompt += `- Include location-based hashtags: ${request.preferences.includeLocationBased ? 'Yes' : 'No'}\n`;
      prompt += `- Exclude overused hashtags: ${request.preferences.excludeOverused ? 'Yes' : 'No'}\n`;
      
      if (request.preferences.maxHashtagLength) {
        prompt += `- Maximum hashtag length: ${request.preferences.maxHashtagLength} characters\n`;
      }
      if (request.preferences.minHashtagLength) {
        prompt += `- Minimum hashtag length: ${request.preferences.minHashtagLength} characters\n`;
      }
      prompt += '\n';
    }

    prompt += `Please provide:
1. A diverse list of hashtag suggestions with detailed analytics
2. Optimal hashtag recommendations (5-10 best hashtags)
3. Strategic mix recommendations
4. Platform-specific insights and tips
5. Competitive analysis insights
6. Trend predictions and seasonal opportunities
7. Performance estimates and difficulty assessment

Focus on hashtags that will maximize reach and engagement while maintaining relevance to the content and target audience.`;

    return prompt;
  }

  async analyzeHashtagPerformance(
    organizationId: string,
    platform: string,
    hashtags: string[],
    dateRange: { start: Date; end: Date }
  ): Promise<HashtagPerformanceTracking[]> {
    const performanceData: HashtagPerformanceTracking[] = [];

    for (const hashtag of hashtags) {
      // Mock performance data - in real implementation, fetch from analytics APIs
      const performance: HashtagPerformanceTracking = {
        hashtagId: `ht_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hashtag,
        organizationId,
        platform,
        trackingPeriod: dateRange,
        metrics: {
          usage: {
            timesUsed: Math.floor(Math.random() * 50) + 1,
            postsCount: Math.floor(Math.random() * 30) + 1,
            lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
          performance: {
            totalImpressions: Math.floor(Math.random() * 100000) + 1000,
            totalEngagement: Math.floor(Math.random() * 5000) + 100,
            avgEngagementRate: Math.random() * 0.1 + 0.01,
            totalReach: Math.floor(Math.random() * 80000) + 800,
            totalClicks: Math.floor(Math.random() * 1000) + 10,
            conversionCount: Math.floor(Math.random() * 50),
          },
          trends: this.generateTrendData(dateRange),
        },
        analysis: {
          performanceGrade: this.calculatePerformanceGrade(),
          recommendation: this.generateRecommendation(),
          insights: this.generateInsights(hashtag, platform),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      performanceData.push(performance);
    }

    return performanceData;
  }

  async getHashtagAnalytics(
    organizationId: string,
    platform?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<HashtagAnalytics> {
    const defaultDateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    };

    const period = dateRange || defaultDateRange;

    // Mock analytics data - in real implementation, aggregate from database
    const analytics: HashtagAnalytics = {
      organizationId,
      period,
      overview: {
        totalHashtagsUsed: 150,
        avgHashtagsPerPost: 8.5,
        topPerformingHashtags: await this.getTopPerformingHashtags(organizationId, platform, 5),
        worstPerformingHashtags: await this.getWorstPerformingHashtags(organizationId, platform, 5),
      },
      trends: {
        popularityChanges: [
          { hashtag: 'aitools', change: 25.5, direction: 'up' },
          { hashtag: 'productivity', change: -10.2, direction: 'down' },
          { hashtag: 'startup', change: 15.8, direction: 'up' },
          { hashtag: 'innovation', change: 0.5, direction: 'stable' },
        ],
        emergingHashtags: ['airevolution', 'futureofwork', 'techstartup'],
        decliningHashtags: ['growthhacking', 'disrupt', 'unicorn'],
      },
      platformComparison: {
        INSTAGRAM: {
          bestPerformers: ['lifestyle', 'design', 'creativity'],
          avgEngagement: 0.045,
          optimalCount: 25,
        },
        LINKEDIN: {
          bestPerformers: ['leadership', 'innovation', 'business'],
          avgEngagement: 0.025,
          optimalCount: 3,
        },
        TWITTER: {
          bestPerformers: ['tech', 'ai', 'startup'],
          avgEngagement: 0.018,
          optimalCount: 2,
        },
      },
      recommendations: {
        hashtagsToAdd: ['sustainabletech', 'remotework', 'digitaltransformation'],
        hashtagsToRetire: ['synergy', 'leverage', 'disruptive'],
        mixOptimization: {
          currentMix: { trending: 20, niche: 30, branded: 25, general: 25 },
          recommendedMix: { trending: 30, niche: 40, branded: 20, general: 10 },
        },
      },
    };

    return analytics;
  }

  async suggestHashtagsForContent(
    content: string,
    platform: string,
    organizationId: string,
    options?: {
      count?: number;
      includePerformanceData?: boolean;
    }
  ): Promise<string[]> {
    const request: HashtagResearchRequest = {
      organizationId,
      platform: platform as any,
      content,
      preferences: {
        includeNiche: true,
        includeTrending: true,
        includeBranded: true,
        includeLocationBased: false,
        excludeOverused: true,
      },
    };

    const research = await this.researchHashtags(request);
    
    const count = options?.count || 10;
    return research.recommendations.optimal.slice(0, count);
  }

  async optimizeHashtagMix(
    currentHashtags: string[],
    platform: string,
    organizationId: string,
    targetMetric: 'reach' | 'engagement' | 'conversion' = 'engagement'
  ): Promise<{
    optimizedHashtags: string[];
    replacements: Array<{ old: string; new: string; reason: string }>;
    expectedImprovement: {
      reach: number; // percentage improvement
      engagement: number;
      conversion: number;
    };
  }> {
    // Analyze current hashtags performance
    const performance = await this.analyzeHashtagPerformance(
      organizationId,
      platform,
      currentHashtags,
      {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }
    );

    // Identify underperforming hashtags
    const underperforming = performance
      .filter(p => p.analysis.performanceGrade === 'D' || p.analysis.performanceGrade === 'F')
      .map(p => p.hashtag);

    // Generate replacement suggestions
    const replacements: Array<{ old: string; new: string; reason: string }> = [];
    const optimizedHashtags = [...currentHashtags];

    for (const hashtag of underperforming) {
      // Research better alternatives
      const research = await this.researchHashtags({
        organizationId,
        platform: platform as any,
        topic: hashtag,
        preferences: { includeNiche: true, includeTrending: true, includeBranded: false, includeLocationBased: false, excludeOverused: true },
      });

      if (research.suggestions.length > 0) {
        const bestAlternative = research.suggestions[0];
        const index = optimizedHashtags.indexOf(hashtag);
        if (index !== -1) {
          optimizedHashtags[index] = bestAlternative.hashtag;
          replacements.push({
            old: hashtag,
            new: bestAlternative.hashtag,
            reason: `Higher ${targetMetric} potential (${(bestAlternative.relevance.overallScore).toFixed(1)}% relevance vs lower performance)`,
          });
        }
      }
    }

    // Calculate expected improvements (mock data)
    const expectedImprovement = {
      reach: replacements.length * 15, // 15% improvement per replacement
      engagement: replacements.length * 12,
      conversion: replacements.length * 8,
    };

    return {
      optimizedHashtags,
      replacements,
      expectedImprovement,
    };
  }

  async getTrendingHashtags(
    platform: string,
    category?: string,
    location?: string,
    timeframe: '24h' | '7d' | '30d' = '24h'
  ): Promise<Array<{
    hashtag: string;
    trend: 'rising' | 'peaked' | 'declining';
    volume: number;
    growth: number; // percentage growth
    category: string;
    relatedTopics: string[];
  }>> {
    // Mock trending data - in real implementation, integrate with platform APIs
    const trendingHashtags = [
      {
        hashtag: 'airevolution',
        trend: 'rising' as const,
        volume: 125000,
        growth: 45.2,
        category: 'technology',
        relatedTopics: ['artificial intelligence', 'machine learning', 'automation'],
      },
      {
        hashtag: 'sustainabletech',
        trend: 'rising' as const,
        volume: 89000,
        growth: 28.7,
        category: 'environment',
        relatedTopics: ['green technology', 'renewable energy', 'sustainability'],
      },
      {
        hashtag: 'remotework',
        trend: 'stable' as const,
        volume: 234000,
        growth: 5.3,
        category: 'business',
        relatedTopics: ['work from home', 'digital nomad', 'hybrid work'],
      },
      {
        hashtag: 'nftart',
        trend: 'declining' as const,
        volume: 67000,
        growth: -15.8,
        category: 'art',
        relatedTopics: ['digital art', 'blockchain', 'cryptocurrency'],
      },
      {
        hashtag: 'mentalhealthawareness',
        trend: 'rising' as const,
        volume: 156000,
        growth: 22.1,
        category: 'health',
        relatedTopics: ['wellbeing', 'self care', 'mental health'],
      },
    ];

    // Filter by category if specified
    if (category) {
      return trendingHashtags.filter(h => h.category.toLowerCase() === category.toLowerCase());
    }

    return trendingHashtags;
  }

  private generateTrendData(dateRange: { start: Date; end: Date }): Array<{
    date: Date;
    impressions: number;
    engagement: number;
    reach: number;
  }> {
    const trends = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        impressions: Math.floor(Math.random() * 5000) + 500,
        engagement: Math.floor(Math.random() * 250) + 25,
        reach: Math.floor(Math.random() * 4000) + 400,
      });
    }

    return trends;
  }

  private calculatePerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = Math.random();
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  private generateRecommendation(): 'increase_usage' | 'maintain_usage' | 'decrease_usage' | 'retire' {
    const options: ('increase_usage' | 'maintain_usage' | 'decrease_usage' | 'retire')[] = [
      'increase_usage', 'maintain_usage', 'decrease_usage', 'retire'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateInsights(hashtag: string, platform: string): string[] {
    const insights = [
      `#${hashtag} performs best on ${platform} during evening hours (7-9 PM)`,
      `Engagement rate is 15% higher when used with complementary hashtags`,
      `This hashtag shows seasonal peaks in Q4 and Q1`,
      `Consider pairing with location-based hashtags for local reach`,
      `Performance improves when combined with trending topics`,
    ];

    // Return 2-3 random insights
    return insights.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 2);
  }

  private async getTopPerformingHashtags(
    organizationId: string, 
    platform?: string, 
    limit: number = 10
  ): Promise<HashtagSuggestion[]> {
    // Mock implementation - in real implementation, fetch from database
    return [];
  }

  private async getWorstPerformingHashtags(
    organizationId: string, 
    platform?: string, 
    limit: number = 10
  ): Promise<HashtagSuggestion[]> {
    // Mock implementation - in real implementation, fetch from database
    return [];
  }
}

export const hashtagResearchService = new HashtagResearchService();
