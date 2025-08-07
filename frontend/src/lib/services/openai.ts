import OpenAI from 'openai'
import { z } from 'zod'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types for content generation
export interface ContentGenerationContext {
  targetAudience?: string
  tone?: string
  objective?: string
  keywords?: string[]
  contentIdeas?: string[]
  referencePosts?: string[]
}

export interface ContentVariation {
  id: string
  body: string
  hashtags: string[]
  confidence: number
  metadata?: Record<string, any>
}

export interface GeneratedContent {
  id: string
  organizationId: string
  platform: string
  contentType: string
  variations: ContentVariation[]
  metadata: {
    provider: string
    model: string
    generatedAt: string
    userId: string
    tokensUsed?: number
  }
}

export interface GenerateContentParams {
  organizationId: string
  platform: 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE_SHORTS' | 'REDDIT' | 'FACEBOOK' | 'THREADS'
  contentType: 'POST' | 'THREAD' | 'STORY' | 'REEL' | 'SHORT' | 'CAROUSEL' | 'POLL'
  pillarId?: string
  seriesId?: string
  prompt?: string
  context?: ContentGenerationContext
  variations: {
    count: number
    diversityLevel: 'low' | 'medium' | 'high'
  }
  optimization: {
    seo: boolean
    engagement: boolean
    conversion: boolean
    brandSafety: boolean
  }
  userId: string
}

class OpenAIService {
  private getSystemPrompt(platform: string, contentType: string, optimization: any): string {
    const basePrompt = `You are an expert social media content creator specializing in ${platform} ${contentType.toLowerCase()} content.`
    
    const platformSpecific = {
      TWITTER: 'Keep content under 280 characters, use relevant hashtags, and create engaging hooks.',
      LINKEDIN: 'Professional tone, valuable insights, industry-relevant content, use appropriate hashtags.',
      INSTAGRAM: 'Visual-first content, engaging captions, strategic hashtag use, story-driven approach.',
      TIKTOK: 'Trending, fun, engaging, hook within first 3 seconds, use popular sounds/effects.',
      YOUTUBE_SHORTS: 'Quick, entertaining, educational or funny, strong opening hook.',
      REDDIT: 'Community-focused, authentic, valuable discussion starters, no promotional language.',
      FACEBOOK: 'Community-building, longer-form content, discussion-friendly, family-appropriate.',
      THREADS: 'Conversational, authentic, quick thoughts, engage with trending topics.'
    }

    const optimizations = []
    if (optimization.seo) optimizations.push('SEO-optimized with relevant keywords')
    if (optimization.engagement) optimizations.push('high engagement potential with calls-to-action')
    if (optimization.conversion) optimizations.push('conversion-focused with subtle promotional elements')
    if (optimization.brandSafety) optimizations.push('brand-safe and compliant content')

    return `${basePrompt}

Platform Guidelines: ${platformSpecific[platform as keyof typeof platformSpecific] || 'Create engaging, platform-appropriate content.'}

Content Requirements:
- ${optimizations.join('\n- ')}
- Authentic voice and tone
- Clear value proposition
- Engaging and shareable

Please generate multiple unique variations that maintain these standards.`
  }

  private buildUserPrompt(params: GenerateContentParams): string {
    let prompt = ''
    
    if (params.prompt) {
      prompt += `Topic/Prompt: ${params.prompt}\n\n`
    }

    if (params.context) {
      if (params.context.targetAudience) {
        prompt += `Target Audience: ${params.context.targetAudience}\n`
      }
      if (params.context.tone) {
        prompt += `Desired Tone: ${params.context.tone}\n`
      }
      if (params.context.objective) {
        prompt += `Objective: ${params.context.objective}\n`
      }
      if (params.context.keywords?.length) {
        prompt += `Keywords to include: ${params.context.keywords.join(', ')}\n`
      }
      if (params.context.contentIdeas?.length) {
        prompt += `Content Ideas: ${params.context.contentIdeas.join(', ')}\n`
      }
    }

    prompt += `\nGenerate ${params.variations.count} unique ${params.contentType.toLowerCase()} variations for ${params.platform}.`
    
    if (params.variations.diversityLevel === 'high') {
      prompt += ' Make each variation significantly different in approach, tone, or angle.'
    } else if (params.variations.diversityLevel === 'low') {
      prompt += ' Keep variations similar with minor adjustments in wording or structure.'
    }

    return prompt
  }

  async generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    try {
      const systemPrompt = this.getSystemPrompt(params.platform, params.contentType, params.optimization)
      const userPrompt = this.buildUserPrompt(params)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: params.variations.diversityLevel === 'high' ? 0.9 : 
                    params.variations.diversityLevel === 'medium' ? 0.7 : 0.5,
        max_tokens: 2000,
        n: 1,
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        throw new Error('No content generated from OpenAI')
      }

      // Parse the response and create variations
      const variations = this.parseVariations(response, params.variations.count)

      return {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: params.organizationId,
        platform: params.platform,
        contentType: params.contentType,
        variations,
        metadata: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          generatedAt: new Date().toISOString(),
          userId: params.userId,
          tokensUsed: completion.usage?.total_tokens,
        }
      }
    } catch (error) {
      console.error('OpenAI content generation error:', error)
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseVariations(response: string, count: number): ContentVariation[] {
    // Split response into variations (basic implementation)
    const lines = response.split('\n').filter(line => line.trim())
    const variations: ContentVariation[] = []
    
    let currentVariation = ''
    let variationCount = 0

    for (const line of lines) {
      if (line.match(/^\d+[.)\-]/) || line.toLowerCase().includes('variation')) {
        if (currentVariation && variationCount < count) {
          variations.push(this.createVariation(currentVariation, variationCount))
          variationCount++
        }
        currentVariation = line.replace(/^\d+[.)\-]\s*/, '')
      } else {
        currentVariation += ' ' + line
      }
    }

    // Add the last variation
    if (currentVariation && variationCount < count) {
      variations.push(this.createVariation(currentVariation, variationCount))
    }

    // If we don't have enough variations, split the response differently
    if (variations.length < count && response.length > 100) {
      const chunks = this.splitIntoChunks(response, count)
      return chunks.map((chunk, index) => this.createVariation(chunk, index))
    }

    return variations.slice(0, count)
  }

  private createVariation(content: string, index: number): ContentVariation {
    const hashtags = this.extractHashtags(content)
    const cleanContent = content.replace(/#\w+/g, '').trim()
    
    return {
      id: `variation_${index}_${Math.random().toString(36).substr(2, 6)}`,
      body: cleanContent,
      hashtags,
      confidence: 0.85 + (Math.random() * 0.15), // Random confidence between 0.85-1.0
      metadata: {
        wordCount: cleanContent.split(' ').length,
        characterCount: cleanContent.length,
      }
    }
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g
    return content.match(hashtagRegex) || []
  }

  private splitIntoChunks(text: string, numChunks: number): string[] {
    const words = text.split(' ')
    const chunkSize = Math.ceil(words.length / numChunks)
    const chunks: string[] = []

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize
      const end = start + chunkSize
      const chunk = words.slice(start, end).join(' ')
      if (chunk.trim()) {
        chunks.push(chunk.trim())
      }
    }

    return chunks
  }

  // Additional utility methods
  async moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
    try {
      const moderation = await openai.moderations.create({
        input: content,
      })

      const result = moderation.results[0]
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category)

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
      }
    } catch (error) {
      console.error('Content moderation error:', error)
      return { flagged: false, categories: [] }
    }
  }

  async generateHashtags(content: string, platform: string, count: number = 5): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate relevant hashtags for ${platform} content. Return only hashtags, one per line, without explanations.`
          },
          {
            role: 'user',
            content: `Generate ${count} relevant hashtags for this content: "${content}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      const response = completion.choices[0]?.message?.content || ''
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('#'))
        .slice(0, count)
    } catch (error) {
      console.error('Hashtag generation error:', error)
      return []
    }
  }
}

export const openAIService = new OpenAIService()
export default openAIService
