import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import Sentiment from 'sentiment';
import * as natural from 'natural';

const sentiment = new Sentiment();

export interface ToneAnalysisRequest {
  content: string;
  context?: {
    platform?: string;
    contentType?: string;
    targetAudience?: string;
  };
}

export interface BrandVoiceRequest {
  organizationData: {
    name: string;
    description?: string;
    category?: string;
    targetMarkets?: string[];
    founders?: Array<{
      name: string;
      role: string;
      bio?: string;
    }>;
  };
  existingContent?: string[];
  desiredTone?: string;
  brandPersonality?: string[];
}

export interface ToneAnalysisResult {
  overallTone: string;
  sentiment: {
    score: number;
    comparative: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    trust: number;
    anticipation: number;
    disgust: number;
  };
  formality: {
    level: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    score: number;
  };
  complexity: {
    readabilityScore: number;
    averageWordsPerSentence: number;
    difficultWords: number;
    level: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate';
  };
  brandAlignment: {
    score: number;
    suggestions: string[];
  };
  confidence: number;
}

export interface BrandVoiceResult {
  primaryTone: string;
  secondaryTones: string[];
  voiceCharacteristics: {
    personality: string[];
    language: {
      vocabulary: 'simple' | 'moderate' | 'sophisticated';
      sentenceStructure: 'short' | 'mixed' | 'complex';
      punctuation: 'minimal' | 'standard' | 'expressive';
    };
    emotionalRange: string[];
  };
  guidelines: {
    dos: string[];
    donts: string[];
    examples: {
      good: string[];
      avoid: string[];
    };
  };
  platformAdaptations: {
    [platform: string]: {
      tone: string;
      approach: string;
      examples: string[];
    };
  };
  confidence: number;
}

const ToneAnalysisRequestSchema = z.object({
  content: z.string().min(1),
  context: z.object({
    platform: z.string().optional(),
    contentType: z.string().optional(),
    targetAudience: z.string().optional(),
  }).optional(),
});

const BrandVoiceRequestSchema = z.object({
  organizationData: z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    targetMarkets: z.array(z.string()).optional(),
    founders: z.array(z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string().optional(),
    })).optional(),
  }),
  existingContent: z.array(z.string()).optional(),
  desiredTone: z.string().optional(),
  brandPersonality: z.array(z.string()).optional(),
});

export class ToneAnalysisService {
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

  async analyzeTone(request: ToneAnalysisRequest, provider: 'openai' | 'anthropic' = 'openai'): Promise<ToneAnalysisResult> {
    const validatedRequest = ToneAnalysisRequestSchema.parse(request);
    
    // Basic sentiment analysis
    const sentimentResult = sentiment.analyze(validatedRequest.content);
    
    // Calculate readability metrics
    const complexity = this.calculateComplexity(validatedRequest.content);
    
    // AI-powered tone analysis
    const aiAnalysis = provider === 'openai' 
      ? await this.analyzeWithOpenAI(validatedRequest)
      : await this.analyzeWithAnthropic(validatedRequest);

    return {
      ...aiAnalysis,
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        label: sentimentResult.score > 0 ? 'positive' : sentimentResult.score < 0 ? 'negative' : 'neutral'
      },
      complexity,
    };
  }

  async generateBrandVoice(request: BrandVoiceRequest, provider: 'openai' | 'anthropic' = 'openai'): Promise<BrandVoiceResult> {
    const validatedRequest = BrandVoiceRequestSchema.parse(request);
    
    if (provider === 'openai') {
      return await this.generateBrandVoiceWithOpenAI(validatedRequest);
    } else {
      return await this.generateBrandVoiceWithAnthropic(validatedRequest);
    }
  }

  private async analyzeWithOpenAI(request: ToneAnalysisRequest): Promise<Partial<ToneAnalysisResult>> {
    const prompt = this.buildToneAnalysisPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert in linguistic analysis and brand communication. Analyze the tone, emotions, and brand alignment of the given content. Return your analysis as a JSON object.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private async analyzeWithAnthropic(request: ToneAnalysisRequest): Promise<Partial<ToneAnalysisResult>> {
    const prompt = this.buildToneAnalysisPrompt(request);

    const message = await this.anthropic.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an expert in linguistic analysis and brand communication. ${prompt}`
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {};
  }

  private async generateBrandVoiceWithOpenAI(request: BrandVoiceRequest): Promise<BrandVoiceResult> {
    const prompt = this.buildBrandVoicePrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are a brand strategist specializing in voice and tone development. Create comprehensive brand voice guidelines that are actionable and specific to the organization's needs.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private async generateBrandVoiceWithAnthropic(request: BrandVoiceRequest): Promise<BrandVoiceResult> {
    const prompt = this.buildBrandVoicePrompt(request);

    const message = await this.anthropic.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a brand strategist specializing in voice and tone development. ${prompt}`
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to generate brand voice');
  }

  private buildToneAnalysisPrompt(request: ToneAnalysisRequest): string {
    let prompt = `Analyze the tone and emotional characteristics of the following content:

CONTENT:
"${request.content}"

`;

    if (request.context) {
      prompt += `CONTEXT:`;
      if (request.context.platform) {
        prompt += `\n- Platform: ${request.context.platform}`;
      }
      if (request.context.contentType) {
        prompt += `\n- Content Type: ${request.context.contentType}`;
      }
      if (request.context.targetAudience) {
        prompt += `\n- Target Audience: ${request.context.targetAudience}`;
      }
      prompt += '\n\n';
    }

    prompt += `Please provide analysis in JSON format:
{
  "overallTone": "professional/casual/friendly/authoritative/etc",
  "emotions": {
    "joy": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "sadness": 0.0-1.0,
    "surprise": 0.0-1.0,
    "trust": 0.0-1.0,
    "anticipation": 0.0-1.0,
    "disgust": 0.0-1.0
  },
  "formality": {
    "level": "very_formal/formal/neutral/informal/very_informal",
    "score": 0.0-1.0
  },
  "brandAlignment": {
    "score": 0.0-1.0,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "confidence": 0.0-1.0
}`;

    return prompt;
  }

  private buildBrandVoicePrompt(request: BrandVoiceRequest): string {
    const { organizationData, existingContent, desiredTone, brandPersonality } = request;

    let prompt = `Create a comprehensive brand voice guide for the following organization:

ORGANIZATION:
- Name: ${organizationData.name}
- Description: ${organizationData.description || 'Not provided'}
- Category: ${organizationData.category || 'Not specified'}
- Target Markets: ${organizationData.targetMarkets?.join(', ') || 'Not specified'}

`;

    if (organizationData.founders?.length) {
      prompt += `FOUNDERS:`;
      organizationData.founders.forEach(founder => {
        prompt += `\n- ${founder.name} (${founder.role}): ${founder.bio || 'No bio provided'}`;
      });
      prompt += '\n\n';
    }

    if (existingContent?.length) {
      prompt += `EXISTING CONTENT EXAMPLES:`;
      existingContent.forEach((content, index) => {
        prompt += `\n${index + 1}. "${content}"`;
      });
      prompt += '\n\n';
    }

    if (desiredTone) {
      prompt += `DESIRED TONE: ${desiredTone}\n\n`;
    }

    if (brandPersonality?.length) {
      prompt += `BRAND PERSONALITY TRAITS: ${brandPersonality.join(', ')}\n\n`;
    }

    prompt += `Please create comprehensive brand voice guidelines in JSON format:
{
  "primaryTone": "main tone descriptor",
  "secondaryTones": ["supporting", "tones"],
  "voiceCharacteristics": {
    "personality": ["trait1", "trait2", "trait3"],
    "language": {
      "vocabulary": "simple/moderate/sophisticated",
      "sentenceStructure": "short/mixed/complex",
      "punctuation": "minimal/standard/expressive"
    },
    "emotionalRange": ["emotion1", "emotion2"]
  },
  "guidelines": {
    "dos": ["do this", "do that"],
    "donts": ["avoid this", "avoid that"],
    "examples": {
      "good": ["good example 1", "good example 2"],
      "avoid": ["bad example 1", "bad example 2"]
    }
  },
  "platformAdaptations": {
    "twitter": {
      "tone": "adapted tone",
      "approach": "approach description",
      "examples": ["example tweet 1", "example tweet 2"]
    },
    "linkedin": {
      "tone": "adapted tone",
      "approach": "approach description", 
      "examples": ["example post 1", "example post 2"]
    }
  },
  "confidence": 0.0-1.0
}`;

    return prompt;
  }

  private calculateComplexity(content: string): ToneAnalysisResult['complexity'] {
    const sentences = natural.SentenceTokenizer.tokenize(content);
    const words = natural.WordTokenizer.tokenize(content);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Count difficult words (words with 3+ syllables)
    const difficultWords = words.filter(word => this.countSyllables(word) >= 3).length;
    
    let level: ToneAnalysisResult['complexity']['level'];
    if (fleschScore >= 90) level = 'elementary';
    else if (fleschScore >= 80) level = 'middle_school';
    else if (fleschScore >= 70) level = 'high_school';
    else if (fleschScore >= 60) level = 'college';
    else level = 'graduate';
    
    return {
      readabilityScore: Math.max(0, Math.min(100, fleschScore)),
      averageWordsPerSentence: avgSentenceLength,
      difficultWords,
      level
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  // Method to check brand alignment
  async checkBrandAlignment(content: string, brandVoice: BrandVoiceResult): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `Check if the following content aligns with the brand voice guidelines:

CONTENT:
"${content}"

BRAND VOICE GUIDELINES:
${JSON.stringify(brandVoice, null, 2)}

Return JSON:
{
  "score": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }
}

export const toneAnalysisService = new ToneAnalysisService();
