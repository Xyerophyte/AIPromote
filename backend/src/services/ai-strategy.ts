import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import { StrategyGenerationError, AIProviderError } from '../utils/errors';

// Types for strategy generation
export interface FounderData {
  id: string;
  name: string;
  role: string;
  bio?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  url?: string;
  stage?: string;
  pricing?: string;
  description?: string;
  tagline?: string;
  category?: string;
  markets: string[];
  languages: string[];
  founders: FounderData[];
}

export interface StrategyGenerationRequest {
  organization: OrganizationData;
  preferences?: {
    tone?: string;
    platforms?: string[];
    focusAreas?: string[];
    brandSafety?: boolean;
  };
  previousStrategies?: any[];
}

// Validation schemas
const StrategyGenerationRequestSchema = z.object({
  organization: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().optional(),
    stage: z.string().optional(),
    pricing: z.string().optional(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    category: z.string().optional(),
    markets: z.array(z.string()),
    languages: z.array(z.string()),
    founders: z.array(z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      bio: z.string().optional(),
      linkedinUrl: z.string().optional(),
      twitterHandle: z.string().optional(),
    }))
  }),
  preferences: z.object({
    tone: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    focusAreas: z.array(z.string()).optional(),
    brandSafety: z.boolean().optional(),
  }).optional(),
  previousStrategies: z.array(z.any()).optional(),
});

export class AIStrategyService {
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

  async generateStrategy(request: StrategyGenerationRequest, provider: 'openai' | 'anthropic' = 'openai'): Promise<{
    positioning: any;
    audienceSegments: any;
    contentPillars: any;
    channelPlan: any;
    cadence: any;
    calendarSkeleton: any;
    generatedBy: string;
    confidence: number;
  }> {
    try {
      // Validate input
      const validatedRequest = StrategyGenerationRequestSchema.parse(request);

      // Generate strategy based on provider
      if (provider === 'openai') {
        return await this.generateWithOpenAI(validatedRequest);
      } else {
        return await this.generateWithAnthropic(validatedRequest);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StrategyGenerationError('Invalid request data', error.errors);
      }
      throw error;
    }
  }

  private async generateWithOpenAI(request: StrategyGenerationRequest): Promise<any> {
    try {
      const prompt = this.buildStrategyPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert marketing strategist specializing in startup growth and content marketing. You create comprehensive, data-driven marketing strategies that are tailored to each startup's unique position, target audience, and business goals. Your strategies are actionable, measurable, and designed to drive sustainable growth.

Return your response as a valid JSON object with the following structure:
{
  "positioning": { "brief": "...", "messagingHierarchy": {...}, "uniqueValueProposition": "...", "keyDifferentiators": [...] },
  "audienceSegments": [{ "name": "...", "description": "...", "painPoints": [...], "keyMessages": [...], "platforms": [...] }],
  "contentPillars": [{ "name": "...", "description": "...", "percentage": 0, "examples": [...] }],
  "channelPlan": { "primary": [...], "secondary": [...], "experimental": [...] },
  "cadence": { "daily": {...}, "weekly": {...}, "monthly": {...} },
  "calendarSkeleton": { "week1": {...}, "week2": {...}, "week3": {...}, "week4": {...} },
  "confidence": 0.85
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
      
      return {
        ...result,
        generatedBy: `openai-${config.ai.openai.model}`,
        confidence: result.confidence || 0.8
      };

    } catch (error: any) {
      throw new AIProviderError('OpenAI', error.message);
    }
  }

  private async generateWithAnthropic(request: StrategyGenerationRequest): Promise<any> {
    try {
      const prompt = this.buildStrategyPrompt(request);

      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are an expert marketing strategist specializing in startup growth and content marketing. You create comprehensive, data-driven marketing strategies that are tailored to each startup's unique position, target audience, and business goals.

${prompt}

Please provide a comprehensive marketing strategy as a JSON object with the following structure:
{
  "positioning": { "brief": "...", "messagingHierarchy": {...}, "uniqueValueProposition": "...", "keyDifferentiators": [...] },
  "audienceSegments": [{ "name": "...", "description": "...", "painPoints": [...], "keyMessages": [...], "platforms": [...] }],
  "contentPillars": [{ "name": "...", "description": "...", "percentage": 0, "examples": [...] }],
  "channelPlan": { "primary": [...], "secondary": [...], "experimental": [...] },
  "cadence": { "daily": {...}, "weekly": {...}, "monthly": {...} },
  "calendarSkeleton": { "week1": {...}, "week2": {...}, "week3": {...}, "week4": {...} },
  "confidence": 0.85
}`
          }
        ]
      });

      const result = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}');
      
      return {
        ...result,
        generatedBy: `anthropic-${config.ai.anthropic.model}`,
        confidence: result.confidence || 0.8
      };

    } catch (error: any) {
      throw new AIProviderError('Anthropic', error.message);
    }
  }

  private buildStrategyPrompt(request: StrategyGenerationRequest): string {
    const { organization, preferences, previousStrategies } = request;
    
    let prompt = `Generate a comprehensive marketing strategy for the following startup:

COMPANY INFORMATION:
- Name: ${organization.name}
- Category: ${organization.category || 'Not specified'}
- Stage: ${organization.stage || 'Not specified'}
- Description: ${organization.description || 'Not provided'}
- Tagline: ${organization.tagline || 'Not provided'}
- Website: ${organization.url || 'Not provided'}
- Pricing: ${organization.pricing || 'Not specified'}
- Markets: ${organization.markets.join(', ') || 'Not specified'}
- Languages: ${organization.languages.join(', ') || 'Not specified'}

FOUNDER INFORMATION:`;

    organization.founders.forEach(founder => {
      prompt += `
- ${founder.name} (${founder.role}): ${founder.bio || 'No bio provided'}
  ${founder.linkedinUrl ? `LinkedIn: ${founder.linkedinUrl}` : ''}
  ${founder.twitterHandle ? `Twitter: ${founder.twitterHandle}` : ''}`;
    });

    if (preferences) {
      prompt += `

PREFERENCES:`;
      if (preferences.tone) {
        prompt += `\n- Brand Tone: ${preferences.tone}`;
      }
      if (preferences.platforms?.length) {
        prompt += `\n- Preferred Platforms: ${preferences.platforms.join(', ')}`;
      }
      if (preferences.focusAreas?.length) {
        prompt += `\n- Focus Areas: ${preferences.focusAreas.join(', ')}`;
      }
      if (preferences.brandSafety) {
        prompt += `\n- Brand Safety: High priority - avoid controversial topics and maintain professional standards`;
      }
    }

    if (previousStrategies?.length) {
      prompt += `\n\nPREVIOUS STRATEGIES: Consider these past strategies for improvement and evolution (but don't repeat them):
${previousStrategies.map((strategy, index) => `Strategy ${index + 1}: ${JSON.stringify(strategy, null, 2)}`).join('\n')}`;
    }

    prompt += `

Please create a marketing strategy that includes:
1. Positioning and messaging hierarchy
2. Target audience segments with specific pain points and key messages
3. 3-5 content pillars with distribution percentages
4. Channel strategy (primary, secondary, experimental)
5. Content cadence recommendations
6. 90-day content calendar skeleton
7. Confidence score (0-1) for the strategy`;

    return prompt;
  }

  // Method to compare strategies
  async compareStrategies(strategy1: any, strategy2: any, provider: 'openai' | 'anthropic' = 'openai'): Promise<{
    comparison: any;
    recommendation: string;
    confidence: number;
  }> {
    try {
      const prompt = `Compare these two marketing strategies and provide insights:

STRATEGY 1:
${JSON.stringify(strategy1, null, 2)}

STRATEGY 2:
${JSON.stringify(strategy2, null, 2)}

Please provide a detailed comparison including:
1. Key differences in positioning
2. Audience targeting variations
3. Content pillar differences
4. Channel strategy comparisons
5. Overall recommendation on which strategy to pursue and why
6. Suggestions for combining the best elements

Return as JSON with structure:
{
  "comparison": {
    "positioning": "...",
    "audience": "...",
    "content": "...",
    "channels": "..."
  },
  "recommendation": "...",
  "confidence": 0.85
}`;

      if (provider === 'openai') {
        const completion = await this.openai.chat.completions.create({
          model: config.ai.openai.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
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

        return JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}');
      }
    } catch (error: any) {
      throw new AIProviderError(provider, error.message);
    }
  }
}

export const aiStrategyService = new AIStrategyService();
