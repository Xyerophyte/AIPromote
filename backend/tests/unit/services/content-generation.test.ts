import { ContentGenerationService, ContentGenerationRequest } from '../../../src/services/content-generation';
import { ValidationError, AIProviderError } from '../../../src/utils/errors';
import { jest } from '@jest/globals';

// Mock the config
jest.mock('../../../src/config/config', () => ({
  config: {
    ai: {
      openai: {
        apiKey: 'mock-openai-key',
        model: 'gpt-4'
      },
      anthropic: {
        apiKey: 'mock-anthropic-key',
        model: 'claude-3-sonnet-20240229'
      }
    }
  }
}));

describe('ContentGenerationService', () => {
  let service: ContentGenerationService;
  let mockOpenAI: any;
  let mockAnthropic: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    service = new ContentGenerationService();
    
    // Get mock instances
    const OpenAI = require('openai');
    const Anthropic = require('@anthropic-ai/sdk');
    mockOpenAI = new OpenAI();
    mockAnthropic = new Anthropic();
  });

  describe('generateContent', () => {
    const validRequest: ContentGenerationRequest = {
      organizationId: 'org_123',
      platform: 'TWITTER',
      contentType: 'POST',
      context: {
        targetAudience: 'developers',
        tone: 'professional',
        objective: 'engagement',
        keywords: ['javascript', 'programming']
      },
      variations: {
        count: 3,
        diversityLevel: 'medium'
      },
      optimization: {
        seo: true,
        engagement: true,
        conversion: false,
        brandSafety: true
      }
    };

    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            content: {
              title: 'JavaScript Tips for Better Code',
              body: 'Here are 5 essential JavaScript tips that will make you a better developer:\n\n1. Use const and let instead of var\n2. Master async/await\n3. Understand closures\n4. Use destructuring\n5. Leverage array methods\n\nWhich one do you use most?',
              hook: 'Here are 5 essential JavaScript tips that will make you a better developer:',
              cta: 'Which one do you use most?',
              hashtags: ['#JavaScript', '#WebDev'],
              mentions: []
            },
            metadata: {
              rationale: 'Educational content with actionable tips that encourage engagement',
              confidence: 0.9,
              keywordsUsed: ['javascript', 'programming'],
              targetAudience: 'developers',
              estimatedEngagement: 0.8,
              brandSafetyScore: 0.95
            },
            variations: [
              {
                content: {
                  title: 'Quick JavaScript Tips',
                  body: '5 JavaScript tricks every developer should know! 🚀',
                  hook: '5 JavaScript tricks every developer should know!',
                  cta: 'Save this for later!',
                  hashtags: ['#JavaScript', '#CodingTips'],
                  mentions: []
                },
                differentiator: 'More casual and emoji-heavy tone',
                confidence: 0.85
              }
            ],
            optimization: {
              seoScore: 0.8,
              engagementPotential: 0.85,
              conversionPotential: 0.7,
              readabilityScore: 0.9
            }
          })
        }
      }]
    };

    it('should generate content using OpenAI by default', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await service.generateContent(validRequest);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' })
          ]),
          temperature: 0.8,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^gen_\d+_[a-z0-9]+$/),
          platform: 'TWITTER',
          contentType: 'POST',
          content: expect.objectContaining({
            title: 'JavaScript Tips for Better Code',
            body: expect.stringContaining('JavaScript tips'),
            hashtags: expect.arrayContaining(['#JavaScript'])
          }),
          metadata: expect.objectContaining({
            confidence: 0.9,
            targetAudience: 'developers'
          })
        })
      );
    });

    it('should generate content using Anthropic when specified', async () => {
      const mockAnthropicResponse = {
        content: [{
          text: JSON.stringify({
            content: {
              body: 'Anthropic generated content',
              hashtags: ['#test'],
              mentions: []
            },
            metadata: {
              rationale: 'Test rationale',
              confidence: 0.85,
              keywordsUsed: ['javascript'],
              targetAudience: 'developers',
              estimatedEngagement: 0.75,
              brandSafetyScore: 0.9
            },
            variations: [],
            optimization: {
              seoScore: 0.75,
              engagementPotential: 0.8,
              conversionPotential: 0.65,
              readabilityScore: 0.85
            }
          })
        }]
      };

      mockAnthropic.messages.create.mockResolvedValue(mockAnthropicResponse);

      const result = await service.generateContent(validRequest, 'anthropic');

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-sonnet-20240229',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' })
          ])
        })
      );

      expect(result.content.body).toBe('Anthropic generated content');
    });

    it('should validate request data and throw ValidationError for invalid data', async () => {
      const invalidRequest = {
        ...validRequest,
        platform: 'INVALID_PLATFORM'
      } as any;

      await expect(service.generateContent(invalidRequest))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for unsupported platform', async () => {
      const unsupportedRequest = {
        ...validRequest,
        platform: 'SNAPCHAT'
      } as any;

      await expect(service.generateContent(unsupportedRequest))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(service.generateContent(validRequest))
        .rejects
        .toThrow(AIProviderError);
    });

    it('should handle Anthropic API errors gracefully', async () => {
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('Anthropic API error')
      );

      await expect(service.generateContent(validRequest, 'anthropic'))
        .rejects
        .toThrow(AIProviderError);
    });

    it('should respect platform character limits for Twitter', async () => {
      const twitterRequest = {
        ...validRequest,
        platform: 'TWITTER'
      } as ContentGenerationRequest;

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await service.generateContent(twitterRequest);

      expect(result.platform).toBe('TWITTER');
      // The service should include platform optimization rules in the prompt
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('280')
            })
          ])
        })
      );
    });

    it('should respect platform character limits for LinkedIn', async () => {
      const linkedinRequest = {
        ...validRequest,
        platform: 'LINKEDIN'
      } as ContentGenerationRequest;

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await service.generateContent(linkedinRequest);

      expect(result.platform).toBe('LINKEDIN');
      // The service should include LinkedIn-specific optimization rules
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('3000')
            })
          ])
        })
      );
    });

    it('should generate multiple variations when requested', async () => {
      const multiVariationRequest = {
        ...validRequest,
        variations: {
          count: 5,
          diversityLevel: 'high' as const
        }
      };

      const responseWithVariations = {
        ...mockOpenAIResponse,
        choices: [{
          message: {
            content: JSON.stringify({
              ...JSON.parse(mockOpenAIResponse.choices[0].message.content!),
              variations: [
                { content: { body: 'Variation 1' }, differentiator: 'Formal tone', confidence: 0.8 },
                { content: { body: 'Variation 2' }, differentiator: 'Casual tone', confidence: 0.85 },
                { content: { body: 'Variation 3' }, differentiator: 'Question-based', confidence: 0.9 },
                { content: { body: 'Variation 4' }, differentiator: 'Story-driven', confidence: 0.75 }
              ]
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(responseWithVariations);

      const result = await service.generateContent(multiVariationRequest);

      expect(result.variations).toHaveLength(4);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('5')
            })
          ])
        })
      );
    });

    it('should include optimization settings in the prompt', async () => {
      const optimizedRequest = {
        ...validRequest,
        optimization: {
          seo: true,
          engagement: true,
          conversion: true,
          brandSafety: true
        }
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      await service.generateContent(optimizedRequest);

      const calledWith = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const userMessage = calledWith.messages.find((m: any) => m.role === 'user');
      
      expect(userMessage.content).toContain('SEO');
      expect(userMessage.content).toContain('engagement');
      expect(userMessage.content).toContain('conversion');
      expect(userMessage.content).toContain('brand safety');
    });
  });

  describe('Platform Rules', () => {
    it('should have proper Twitter optimization rules', async () => {
      const twitterRequest = {
        organizationId: 'org_123',
        platform: 'TWITTER',
        contentType: 'POST',
        variations: { count: 1, diversityLevel: 'medium' as const },
        optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
      } as ContentGenerationRequest;

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
      
      await service.generateContent(twitterRequest);
      
      const calledWith = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const userMessage = calledWith.messages.find((m: any) => m.role === 'user');
      
      expect(userMessage.content).toContain('280');
      expect(userMessage.content).toContain('threads');
      expect(userMessage.content).toContain('hashtag');
    });

    it('should have proper LinkedIn optimization rules', async () => {
      const linkedinRequest = {
        organizationId: 'org_123',
        platform: 'LINKEDIN',
        contentType: 'POST',
        variations: { count: 1, diversityLevel: 'medium' as const },
        optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
      } as ContentGenerationRequest;

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
      
      await service.generateContent(linkedinRequest);
      
      const calledWith = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const userMessage = calledWith.messages.find((m: any) => m.role === 'user');
      
      expect(userMessage.content).toContain('3000');
      expect(userMessage.content).toContain('professional');
      expect(userMessage.content).toContain('industry');
    });
  });
});
