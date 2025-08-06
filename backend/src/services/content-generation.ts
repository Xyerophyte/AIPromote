import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import { AIProviderError, ValidationError } from '../utils/errors';

/**
 * Platform-specific optimization rules for content generation.
 * These rules define character limits, hashtag requirements, supported features,
 * and best practices for each social media platform.
 */
export interface PlatformOptimizationRules {
  /** Character limits for different content types on the platform */
  characterLimits: {
    post: number;
    title?: number;
    caption?: number;
    description?: number;
  };
  hashtagLimits: {
    min: number;
    max: number;
    recommended: number;
  };
  features: {
    supportsThreads: boolean;
    supportsMedia: boolean;
    supportsPolls: boolean;
    supportsLinks: boolean;
    supportsEmojis: boolean;
    supportsMentions: boolean;
  };
  bestPractices: {
    hookPatterns: string[];
    ctaPatterns: string[];
    engagementTactics: string[];
    optimalPostingTimes: string[];
  };
}

export interface ContentGenerationRequest {
  organizationId: string;
  platform: string;
  contentType: 'POST' | 'THREAD' | 'STORY' | 'REEL' | 'SHORT' | 'CAROUSEL' | 'POLL';
  pillarId?: string;
  seriesId?: string;
  prompt?: string;
  context?: {
    targetAudience?: string;
    tone?: string;
    objective?: string;
    keywords?: string[];
    contentIdeas?: string[];
    referencePosts?: string[];
  };
  variations: {
    count: number;
    diversityLevel: 'low' | 'medium' | 'high';
  };
  optimization: {
    seo: boolean;
    engagement: boolean;
    conversion: boolean;
    brandSafety: boolean;
  };
}

export interface GeneratedContent {
  id: string;
  platform: string;
  contentType: string;
  content: {
    title?: string;
    body: string;
    hook?: string;
    cta?: string;
    hashtags: string[];
    mentions: string[];
  };
  metadata: {
    rationale: string;
    confidence: number;
    keywordsUsed: string[];
    targetAudience: string;
    estimatedEngagement: number;
    brandSafetyScore: number;
  };
  variations: Array<{
    id: string;
    content: {
      title?: string;
      body: string;
      hook?: string;
      cta?: string;
      hashtags: string[];
      mentions: string[];
    };
    differentiator: string;
    confidence: number;
  }>;
  optimization: {
    seoScore: number;
    engagementPotential: number;
    conversionPotential: number;
    readabilityScore: number;
  };
}

const ContentGenerationRequestSchema = z.object({
  organizationId: z.string(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']),
  contentType: z.enum(['POST', 'THREAD', 'STORY', 'REEL', 'SHORT', 'CAROUSEL', 'POLL']),
  pillarId: z.string().optional(),
  seriesId: z.string().optional(),
  prompt: z.string().optional(),
  context: z.object({
    targetAudience: z.string().optional(),
    tone: z.string().optional(),
    objective: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    contentIdeas: z.array(z.string()).optional(),
    referencePosts: z.array(z.string()).optional(),
  }).optional(),
  variations: z.object({
    count: z.number().min(1).max(10).default(3),
    diversityLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  optimization: z.object({
    seo: z.boolean().default(true),
    engagement: z.boolean().default(true),
    conversion: z.boolean().default(false),
    brandSafety: z.boolean().default(true),
  }),
});

/**
 * Service for generating AI-powered social media content optimized for different platforms.
 * 
 * This service provides intelligent content generation using OpenAI and Anthropic models,
 * with platform-specific optimization rules and content validation capabilities.
 * 
 * @example
 * ```typescript
 * const service = new ContentGenerationService();
 * const content = await service.generateContent({
 *   organizationId: 'org_123',
 *   platform: 'TWITTER',
 *   contentType: 'POST',
 *   prompt: 'Generate a post about AI development',
 *   variations: { count: 3, diversityLevel: 'medium' },
 *   optimization: { seo: true, engagement: true }
 * });
 * ```
 */
export class ContentGenerationService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private platformRules: Map<string, PlatformOptimizationRules>;

  /**
   * Initialize the content generation service with AI providers and platform rules.
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });

    this.platformRules = this.initializePlatformRules();
  }

  private initializePlatformRules(): Map<string, PlatformOptimizationRules> {
    const rules = new Map<string, PlatformOptimizationRules>();

    // Twitter/X optimization rules
    rules.set('TWITTER', {
      characterLimits: { post: 280 },
      hashtagLimits: { min: 1, max: 5, recommended: 2 },
      features: {
        supportsThreads: true,
        supportsMedia: true,
        supportsPolls: true,
        supportsLinks: true,
        supportsEmojis: true,
        supportsMentions: true,
      },
      bestPractices: {
        hookPatterns: [
          'Question hooks',
          'Statistical hooks',
          'Contrarian statements',
          'Thread announcements'
        ],
        ctaPatterns: [
          'Retweet if you agree',
          'What are your thoughts?',
          'Thread below 👇',
          'Save this for later'
        ],
        engagementTactics: [
          'Use Twitter polls',
          'Ask questions',
          'Share hot takes',
          'Create threads'
        ],
        optimalPostingTimes: ['9-10 AM', '1-3 PM', '5-7 PM']
      }
    });

    // LinkedIn optimization rules
    rules.set('LINKEDIN', {
      characterLimits: { post: 3000, title: 150 },
      hashtagLimits: { min: 3, max: 10, recommended: 5 },
      features: {
        supportsThreads: false,
        supportsMedia: true,
        supportsPolls: true,
        supportsLinks: true,
        supportsEmojis: true,
        supportsMentions: true,
      },
      bestPractices: {
        hookPatterns: [
          'Professional insights',
          'Industry observations',
          'Career advice',
          'Lesson learned stories'
        ],
        ctaPatterns: [
          'What\'s your take?',
          'Share your experience',
          'Let\'s connect',
          'Agree? Disagree?'
        ],
        engagementTactics: [
          'Share industry insights',
          'Tell stories',
          'Ask for opinions',
          'Tag relevant people'
        ],
        optimalPostingTimes: ['7-9 AM', '12-2 PM', '5-6 PM']
      }
    });

    // Instagram optimization rules
    rules.set('INSTAGRAM', {
      characterLimits: { post: 2200, caption: 2200 },
      hashtagLimits: { min: 5, max: 30, recommended: 15 },
      features: {
        supportsThreads: false,
        supportsMedia: true,
        supportsPolls: true,
        supportsLinks: false,
        supportsEmojis: true,
        supportsMentions: true,
      },
      bestPractices: {
        hookPatterns: [
          'Visual storytelling',
          'Behind-the-scenes',
          'Tutorial intros',
          'Lifestyle moments'
        ],
        ctaPatterns: [
          'Double tap if you agree',
          'Save this post',
          'Share with a friend',
          'What do you think?'
        ],
        engagementTactics: [
          'Use Stories features',
          'Create carousel posts',
          'Share user-generated content',
          'Use trending audio'
        ],
        optimalPostingTimes: ['11 AM-1 PM', '7-9 PM']
      }
    });

    // Add more platforms...
    rules.set('TIKTOK', {
      characterLimits: { post: 4000, description: 300 },
      hashtagLimits: { min: 3, max: 10, recommended: 5 },
      features: {
        supportsThreads: false,
        supportsMedia: true,
        supportsPolls: false,
        supportsLinks: true,
        supportsEmojis: true,
        supportsMentions: true,
      },
      bestPractices: {
        hookPatterns: [
          'Trending audio hooks',
          'Challenge intros',
          'Educational hooks',
          'Entertainment hooks'
        ],
        ctaPatterns: [
          'Follow for more',
          'Like if you learned something',
          'Try this yourself',
          'What would you do?'
        ],
        engagementTactics: [
          'Use trending sounds',
          'Participate in challenges',
          'Create educational content',
          'Be authentic'
        ],
        optimalPostingTimes: ['6-10 AM', '7-9 PM', '9-11 PM']
      }
    });

    return rules;
  }

  /**
   * Generate AI-powered content optimized for a specific social media platform.
   * 
   * This method takes a content generation request and produces platform-optimized content
   * with multiple variations, metadata, and optimization scores.
   * 
   * @param request - Content generation request with platform, context, and optimization settings
   * @param provider - AI provider to use ('openai' or 'anthropic')
   * @returns Promise resolving to generated content with variations and metadata
   * 
   * @throws {ValidationError} When request validation fails or platform is unsupported
   * @throws {AIProviderError} When AI generation fails
   * 
   * @example
   * ```typescript
   * const content = await service.generateContent({
   *   organizationId: 'org_123',
   *   platform: 'TWITTER',
   *   contentType: 'POST',
   *   prompt: 'Share tips about AI development',
   *   context: {
   *     targetAudience: 'Software developers',
   *     tone: 'Professional yet approachable',
   *     keywords: ['AI', 'development', 'tips']
   *   },
   *   variations: { count: 3, diversityLevel: 'medium' },
   *   optimization: { seo: true, engagement: true }
   * });
   * ```
   */
  async generateContent(
    request: ContentGenerationRequest, 
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<GeneratedContent> {
    try {
      // Validate input
      const validatedRequest = ContentGenerationRequestSchema.parse(request);
      
      // Get platform optimization rules
      const platformRules = this.platformRules.get(validatedRequest.platform);
      if (!platformRules) {
        throw new ValidationError('Unsupported platform', 'platform', validatedRequest.platform);
      }

      // Generate content based on provider
      if (provider === 'openai') {
        return await this.generateWithOpenAI(validatedRequest, platformRules);
      } else {
        return await this.generateWithAnthropic(validatedRequest, platformRules);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', 'request', error.errors);
      }
      throw error;
    }
  }

  private async generateWithOpenAI(
    request: ContentGenerationRequest, 
    platformRules: PlatformOptimizationRules
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildContentPrompt(request, platformRules);
      
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert content creator and social media strategist. You create engaging, platform-optimized content that drives results while maintaining brand consistency and safety.

Return your response as a valid JSON object with the following structure:
{
  "content": {
    "title": "...",
    "body": "...",
    "hook": "...",
    "cta": "...",
    "hashtags": ["...", "..."],
    "mentions": ["...", "..."]
  },
  "metadata": {
    "rationale": "...",
    "confidence": 0.85,
    "keywordsUsed": ["...", "..."],
    "targetAudience": "...",
    "estimatedEngagement": 0.75,
    "brandSafetyScore": 0.95
  },
  "variations": [
    {
      "content": { "title": "...", "body": "...", "hook": "...", "cta": "...", "hashtags": [...], "mentions": [...] },
      "differentiator": "More casual tone",
      "confidence": 0.8
    }
  ],
  "optimization": {
    "seoScore": 0.8,
    "engagementPotential": 0.85,
    "conversionPotential": 0.7,
    "readabilityScore": 0.9
  }
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: request.platform,
        contentType: request.contentType,
        ...result,
      };

    } catch (error: any) {
      throw new AIProviderError('OpenAI', error.message);
    }
  }

  private async generateWithAnthropic(
    request: ContentGenerationRequest, 
    platformRules: PlatformOptimizationRules
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildContentPrompt(request, platformRules);

      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are an expert content creator and social media strategist. You create engaging, platform-optimized content that drives results while maintaining brand consistency and safety.

${prompt}

Please provide the content as a JSON object with the following structure:
{
  "content": {
    "title": "...",
    "body": "...",
    "hook": "...",
    "cta": "...",
    "hashtags": ["...", "..."],
    "mentions": ["...", "..."]
  },
  "metadata": {
    "rationale": "...",
    "confidence": 0.85,
    "keywordsUsed": ["...", "..."],
    "targetAudience": "...",
    "estimatedEngagement": 0.75,
    "brandSafetyScore": 0.95
  },
  "variations": [
    {
      "content": { "title": "...", "body": "...", "hook": "...", "cta": "...", "hashtags": [...], "mentions": [...] },
      "differentiator": "More casual tone",
      "confidence": 0.8
    }
  ],
  "optimization": {
    "seoScore": 0.8,
    "engagementPotential": 0.85,
    "conversionPotential": 0.7,
    "readabilityScore": 0.9
  }
}`
          }
        ]
      });

      const result = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}');
      
      return {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: request.platform,
        contentType: request.contentType,
        ...result,
      };

    } catch (error: any) {
      throw new AIProviderError('Anthropic', error.message);
    }
  }

  private buildContentPrompt(
    request: ContentGenerationRequest, 
    platformRules: PlatformOptimizationRules
  ): string {
    let prompt = `Create ${request.variations.count} variations of ${request.contentType.toLowerCase()} content for ${request.platform} with ${request.variations.diversityLevel} diversity.

PLATFORM CONSTRAINTS:
- Character limit: ${platformRules.characterLimits.post}
- Hashtag range: ${platformRules.hashtagLimits.min}-${platformRules.hashtagLimits.max} (recommended: ${platformRules.hashtagLimits.recommended})
- Supported features: ${Object.entries(platformRules.features).filter(([_, supported]) => supported).map(([feature, _]) => feature).join(', ')}

PLATFORM BEST PRACTICES:
- Hook patterns: ${platformRules.bestPractices.hookPatterns.join(', ')}
- CTA patterns: ${platformRules.bestPractices.ctaPatterns.join(', ')}
- Engagement tactics: ${platformRules.bestPractices.engagementTactics.join(', ')}
- Optimal posting times: ${platformRules.bestPractices.optimalPostingTimes.join(', ')}`;

    if (request.prompt) {
      prompt += `\n\nCONTENT BRIEF: ${request.prompt}`;
    }

    if (request.context) {
      prompt += '\n\nCONTEXT:';
      if (request.context.targetAudience) {
        prompt += `\n- Target Audience: ${request.context.targetAudience}`;
      }
      if (request.context.tone) {
        prompt += `\n- Brand Tone: ${request.context.tone}`;
      }
      if (request.context.objective) {
        prompt += `\n- Content Objective: ${request.context.objective}`;
      }
      if (request.context.keywords?.length) {
        prompt += `\n- Keywords to include: ${request.context.keywords.join(', ')}`;
      }
      if (request.context.contentIdeas?.length) {
        prompt += `\n- Content ideas to consider: ${request.context.contentIdeas.join(', ')}`;
      }
      if (request.context.referencePosts?.length) {
        prompt += `\n- Reference posts for inspiration: ${request.context.referencePosts.join(', ')}`;
      }
    }

    prompt += '\n\nOPTIMIZATION REQUIREMENTS:';
    if (request.optimization.seo) {
      prompt += '\n- SEO: Include relevant keywords naturally';
    }
    if (request.optimization.engagement) {
      prompt += '\n- Engagement: Use hooks, questions, and engagement tactics';
    }
    if (request.optimization.conversion) {
      prompt += '\n- Conversion: Include clear CTAs and value propositions';
    }
    if (request.optimization.brandSafety) {
      prompt += '\n- Brand Safety: Avoid controversial topics and maintain professional standards';
    }

    prompt += `\n\nGenerate the main content piece plus ${request.variations.count - 1} variations with different approaches (tone, angle, format, etc.). Each variation should be distinct and optimized for the platform while serving the same core objective.

Provide rationale for content choices, confidence scores, and optimization metrics.`;

    return prompt;
  }

  async generateVariations(
    originalContent: string,
    platform: string,
    variationTypes: string[],
    count: number,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<Array<{
    id: string;
    content: string;
    variationType: string;
    confidence: number;
    differentiator: string;
  }>> {
    try {
      const platformRules = this.platformRules.get(platform);
      if (!platformRules) {
        throw new ValidationError('Unsupported platform', 'platform', platform);
      }

      const prompt = `Create ${count} variations of this ${platform} content:

ORIGINAL CONTENT:
"${originalContent}"

VARIATION TYPES TO CREATE:
${variationTypes.join(', ')}

PLATFORM CONSTRAINTS:
- Character limit: ${platformRules.characterLimits.post}
- Platform: ${platform}

Create variations that:
1. Maintain the core message but change the approach
2. Optimize for different audience segments or objectives
3. Use different hooks, angles, or formats
4. Stay within platform constraints

Return as JSON array:
[
  {
    "content": "...",
    "variationType": "casual_tone",
    "confidence": 0.85,
    "differentiator": "More conversational and approachable"
  }
]`;

      if (provider === 'openai') {
        const completion = await this.openai.chat.completions.create({
          model: config.ai.openai.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        });

        const variations = JSON.parse(completion.choices[0].message.content || '[]');
        return variations.map((variation: any, index: number) => ({
          id: `var_${Date.now()}_${index}`,
          ...variation
        }));
      } else {
        const message = await this.anthropic.messages.create({
          model: config.ai.anthropic.model,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        });

        const variations = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '[]');
        return variations.map((variation: any, index: number) => ({
          id: `var_${Date.now()}_${index}`,
          ...variation
        }));
      }
    } catch (error: any) {
      throw new AIProviderError(provider, error.message);
    }
  }

  getPlatformRules(platform: string): PlatformOptimizationRules | undefined {
    return this.platformRules.get(platform);
  }

  getAllPlatforms(): string[] {
    return Array.from(this.platformRules.keys());
  }

  validateContentForPlatform(content: string, platform: string): {
    isValid: boolean;
    violations: string[];
    suggestions: string[];
  } {
    const rules = this.platformRules.get(platform);
    if (!rules) {
      return {
        isValid: false,
        violations: ['Unsupported platform'],
        suggestions: [`Use one of: ${this.getAllPlatforms().join(', ')}`]
      };
    }

    const violations: string[] = [];
    const suggestions: string[] = [];

    // Check character limits
    if (content.length > rules.characterLimits.post) {
      violations.push(`Content exceeds character limit (${content.length}/${rules.characterLimits.post})`);
      suggestions.push('Shorten the content or split into multiple posts');
    }

    // Check hashtag count
    const hashtags = content.match(/#\w+/g) || [];
    if (hashtags.length < rules.hashtagLimits.min) {
      violations.push(`Too few hashtags (${hashtags.length}/${rules.hashtagLimits.min} minimum)`);
      suggestions.push(`Add ${rules.hashtagLimits.min - hashtags.length} more relevant hashtags`);
    }
    if (hashtags.length > rules.hashtagLimits.max) {
      violations.push(`Too many hashtags (${hashtags.length}/${rules.hashtagLimits.max} maximum)`);
      suggestions.push(`Remove ${hashtags.length - rules.hashtagLimits.max} hashtags`);
    }

    // Check for unsupported features
    if (content.includes('http') && !rules.features.supportsLinks) {
      violations.push('Platform does not support links in posts');
      suggestions.push('Move links to bio or use link-in-bio tools');
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    };
  }
}

export const contentGenerationService = new ContentGenerationService();
