import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import { OrganizationData } from './ai-strategy';

export interface ContentPillarRequest {
  organization: OrganizationData;
  existingContent?: Array<{
    platform: string;
    content: string;
    engagement?: number;
    impressions?: number;
  }>;
  competitors?: Array<{
    name: string;
    contentExamples: string[];
  }>;
  preferences?: {
    pillarsCount?: number;
    focusAreas?: string[];
    avoidTopics?: string[];
  };
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  percentage: number;
  keywords: string[];
  contentTypes: string[];
  platforms: string[];
  examples: {
    headlines: string[];
    hooks: string[];
    topics: string[];
  };
  metrics: {
    expectedEngagement: number;
    difficulty: 'low' | 'medium' | 'high';
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  };
  audience: {
    segments: string[];
    painPoints: string[];
    interests: string[];
  };
}

export interface PillarAnalysisResult {
  pillars: ContentPillar[];
  distribution: {
    recommended: { [pillarId: string]: number };
    rationale: string;
  };
  contentGaps: {
    identified: string[];
    opportunities: string[];
  };
  competitiveAnalysis: {
    commonPillars: string[];
    uniqueOpportunities: string[];
    differentiationStrategy: string;
  };
  confidence: number;
  generatedBy: string;
}

const ContentPillarRequestSchema = z.object({
  organization: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    stage: z.string().optional(),
    markets: z.array(z.string()),
    founders: z.array(z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string().optional(),
    }))
  }),
  existingContent: z.array(z.object({
    platform: z.string(),
    content: z.string(),
    engagement: z.number().optional(),
    impressions: z.number().optional(),
  })).optional(),
  competitors: z.array(z.object({
    name: z.string(),
    contentExamples: z.array(z.string()),
  })).optional(),
  preferences: z.object({
    pillarsCount: z.number().min(3).max(7).optional(),
    focusAreas: z.array(z.string()).optional(),
    avoidTopics: z.array(z.string()).optional(),
  }).optional(),
});

export class ContentPillarService {
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

  async identifyPillars(request: ContentPillarRequest, provider: 'openai' | 'anthropic' = 'openai'): Promise<PillarAnalysisResult> {
    const validatedRequest = ContentPillarRequestSchema.parse(request);

    if (provider === 'openai') {
      return await this.identifyWithOpenAI(validatedRequest);
    } else {
      return await this.identifyWithAnthropic(validatedRequest);
    }
  }

  private async identifyWithOpenAI(request: ContentPillarRequest): Promise<PillarAnalysisResult> {
    const prompt = this.buildPillarIdentificationPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are a content strategist specializing in pillar-based content marketing. You analyze companies and create strategic content pillars that drive engagement, build authority, and support business goals. Each pillar should be distinct, valuable to the target audience, and aligned with the company's expertise and objectives.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      ...result,
      generatedBy: `openai-${config.ai.openai.model}`
    };
  }

  private async identifyWithAnthropic(request: ContentPillarRequest): Promise<PillarAnalysisResult> {
    const prompt = this.buildPillarIdentificationPrompt(request);

    const message = await this.anthropic.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a content strategist specializing in pillar-based content marketing. ${prompt}`
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        ...result,
        generatedBy: `anthropic-${config.ai.anthropic.model}`
      };
    }
    
    throw new Error('Failed to identify content pillars');
  }

  private buildPillarIdentificationPrompt(request: ContentPillarRequest): string {
    const { organization, existingContent, competitors, preferences } = request;

    let prompt = `Identify and create strategic content pillars for the following organization:

ORGANIZATION:
- Name: ${organization.name}
- Description: ${organization.description || 'Not provided'}
- Category: ${organization.category || 'Not specified'}
- Stage: ${organization.stage || 'Not specified'}
- Markets: ${organization.markets.join(', ')}

FOUNDERS:`;
    organization.founders.forEach(founder => {
      prompt += `\n- ${founder.name} (${founder.role}): ${founder.bio || 'No bio provided'}`;
    });

    if (existingContent?.length) {
      prompt += `\n\nEXISTING CONTENT ANALYSIS:`;
      existingContent.forEach((content, index) => {
        prompt += `\n${index + 1}. [${content.platform}] "${content.content}"`;
        if (content.engagement) prompt += ` (${content.engagement} engagements)`;
        if (content.impressions) prompt += ` (${content.impressions} impressions)`;
      });
    }

    if (competitors?.length) {
      prompt += `\n\nCOMPETITOR ANALYSIS:`;
      competitors.forEach(competitor => {
        prompt += `\n- ${competitor.name}:`;
        competitor.contentExamples.forEach(example => {
          prompt += `\n  • "${example}"`;
        });
      });
    }

    if (preferences) {
      prompt += `\n\nPREFERENCES:`;
      if (preferences.pillarsCount) {
        prompt += `\n- Number of pillars: ${preferences.pillarsCount}`;
      }
      if (preferences.focusAreas?.length) {
        prompt += `\n- Focus areas: ${preferences.focusAreas.join(', ')}`;
      }
      if (preferences.avoidTopics?.length) {
        prompt += `\n- Topics to avoid: ${preferences.avoidTopics.join(', ')}`;
      }
    }

    prompt += `

Please provide a comprehensive content pillar analysis in JSON format:
{
  "pillars": [
    {
      "id": "pillar-1",
      "name": "Pillar Name",
      "description": "Detailed description of what this pillar covers",
      "emoji": "🚀",
      "color": "#FF6B6B",
      "percentage": 25,
      "keywords": ["keyword1", "keyword2"],
      "contentTypes": ["blog posts", "tutorials", "case studies"],
      "platforms": ["linkedin", "twitter", "blog"],
      "examples": {
        "headlines": ["Example headline 1", "Example headline 2"],
        "hooks": ["Hook 1", "Hook 2"],
        "topics": ["Topic 1", "Topic 2"]
      },
      "metrics": {
        "expectedEngagement": 75,
        "difficulty": "medium",
        "frequency": "weekly"
      },
      "audience": {
        "segments": ["developers", "founders"],
        "painPoints": ["pain point 1", "pain point 2"],
        "interests": ["interest 1", "interest 2"]
      }
    }
  ],
  "distribution": {
    "recommended": {
      "pillar-1": 25,
      "pillar-2": 30
    },
    "rationale": "Explanation of why this distribution works"
  },
  "contentGaps": {
    "identified": ["gap 1", "gap 2"],
    "opportunities": ["opportunity 1", "opportunity 2"]
  },
  "competitiveAnalysis": {
    "commonPillars": ["pillar type 1", "pillar type 2"],
    "uniqueOpportunities": ["unique angle 1", "unique angle 2"],
    "differentiationStrategy": "How to stand out from competitors"
  },
  "confidence": 0.85
}

Guidelines:
1. Create ${preferences?.pillarsCount || '4-5'} distinct but complementary pillars
2. Each pillar should align with business goals and audience needs
3. Include specific, actionable examples for each pillar
4. Consider the company's unique expertise and positioning
5. Ensure pillars cover different content themes but support overall strategy
6. Balance evergreen content with timely/trending topics
7. Consider platform-specific adaptations`;

    return prompt;
  }

  // Method to optimize existing pillars based on performance data
  async optimizePillars(
    existingPillars: ContentPillar[],
    performanceData: Array<{
      pillarId: string;
      metrics: {
        avgEngagement: number;
        avgImpressions: number;
        conversionRate: number;
        contentVolume: number;
      };
    }>,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<{
    optimizedPillars: ContentPillar[];
    recommendations: {
      redistribute: { from: string; to: string; percentage: number }[];
      improve: { pillarId: string; suggestions: string[] }[];
      retire: { pillarId: string; reason: string }[];
      new: ContentPillar[];
    };
  }> {
    const prompt = `Optimize the following content pillars based on performance data:

CURRENT PILLARS:
${JSON.stringify(existingPillars, null, 2)}

PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

Please provide optimization recommendations in JSON format:
{
  "optimizedPillars": [...updated pillars...],
  "recommendations": {
    "redistribute": [
      {
        "from": "pillar-id",
        "to": "pillar-id", 
        "percentage": 5
      }
    ],
    "improve": [
      {
        "pillarId": "pillar-id",
        "suggestions": ["suggestion1", "suggestion2"]
      }
    ],
    "retire": [
      {
        "pillarId": "pillar-id",
        "reason": "Low performance and poor audience fit"
      }
    ],
    "new": [...new pillar objects...]
  }
}`;

    if (provider === 'openai') {
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } else {
      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to optimize content pillars');
    }
  }

  // Method to generate content ideas for a specific pillar
  async generatePillarContent(
    pillar: ContentPillar,
    count: number = 10,
    platforms: string[] = ['twitter', 'linkedin'],
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<{
    ideas: Array<{
      title: string;
      hook: string;
      platform: string;
      contentType: string;
      expectedEngagement: number;
      difficulty: 'low' | 'medium' | 'high';
    }>;
  }> {
    const prompt = `Generate ${count} content ideas for the following content pillar:

PILLAR:
${JSON.stringify(pillar, null, 2)}

TARGET PLATFORMS: ${platforms.join(', ')}

Please provide content ideas in JSON format:
{
  "ideas": [
    {
      "title": "Content title/headline",
      "hook": "Opening hook to grab attention",
      "platform": "twitter/linkedin/etc",
      "contentType": "post/thread/article/video",
      "expectedEngagement": 75,
      "difficulty": "low/medium/high"
    }
  ]
}

Guidelines:
1. Ideas should align with the pillar's theme and keywords
2. Vary content types and approaches
3. Include platform-specific adaptations
4. Focus on value-driven content that serves the target audience
5. Balance educational, entertaining, and promotional content`;

    if (provider === 'openai') {
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } else {
      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to generate pillar content');
    }
  }

  // Method to analyze content distribution across pillars
  analyzeContentDistribution(
    contentItems: Array<{
      id: string;
      pillarId: string;
      engagement: number;
      impressions: number;
      createdAt: Date;
    }>,
    pillars: ContentPillar[]
  ): {
    currentDistribution: { [pillarId: string]: number };
    recommendedDistribution: { [pillarId: string]: number };
    insights: {
      overPerforming: string[];
      underPerforming: string[];
      balanced: string[];
    };
    recommendations: string[];
  } {
    const totalContent = contentItems.length;
    const pillarCounts = pillars.reduce((acc, pillar) => {
      acc[pillar.id] = 0;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate current distribution
    contentItems.forEach(item => {
      if (pillarCounts.hasOwnProperty(item.pillarId)) {
        pillarCounts[item.pillarId]++;
      }
    });

    const currentDistribution = Object.keys(pillarCounts).reduce((acc, pillarId) => {
      acc[pillarId] = Math.round((pillarCounts[pillarId] / totalContent) * 100);
      return acc;
    }, {} as { [key: string]: number });

    // Get recommended distribution from pillars
    const recommendedDistribution = pillars.reduce((acc, pillar) => {
      acc[pillar.id] = pillar.percentage;
      return acc;
    }, {} as { [key: string]: number });

    // Analyze performance vs distribution
    const insights = {
      overPerforming: [] as string[],
      underPerforming: [] as string[],
      balanced: [] as string[]
    };

    pillars.forEach(pillar => {
      const current = currentDistribution[pillar.id] || 0;
      const recommended = pillar.percentage;
      const difference = Math.abs(current - recommended);

      if (difference <= 5) {
        insights.balanced.push(pillar.id);
      } else if (current > recommended) {
        insights.overPerforming.push(pillar.id);
      } else {
        insights.underPerforming.push(pillar.id);
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (insights.overPerforming.length > 0) {
      recommendations.push(`Consider reducing content volume for: ${insights.overPerforming.join(', ')}`);
    }
    
    if (insights.underPerforming.length > 0) {
      recommendations.push(`Increase content creation for: ${insights.underPerforming.join(', ')}`);
    }
    
    if (insights.balanced.length === pillars.length) {
      recommendations.push('Content distribution is well-balanced across all pillars');
    }

    return {
      currentDistribution,
      recommendedDistribution,
      insights,
      recommendations
    };
  }
}

export const contentPillarService = new ContentPillarService();
