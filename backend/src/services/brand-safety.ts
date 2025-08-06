import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';

export interface BrandSafetyRules {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  rules: {
    content: {
      allowedTopics: string[];
      forbiddenTopics: string[];
      allowedPhrases: string[];
      forbiddenPhrases: string[];
      requiredDisclaimer?: string;
      sensitiveTerms: string[];
    };
    tone: {
      allowedTones: string[];
      forbiddenTones: string[];
      brandVoice: string;
      formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    };
    legal: {
      claimsToAvoid: string[];
      requiredDisclosures: string[];
      complianceNotes: string[];
      industryRegulations: string[];
    };
    social: {
      platformSpecificRules: {
        [platform: string]: {
          maxLength?: number;
          requiredHashtags?: string[];
          forbiddenHashtags?: string[];
          specialRequirements?: string[];
        };
      };
      targetAudienceConsiderations: string[];
    };
    quality: {
      minimumReadabilityScore: number;
      maxSentenceLength: number;
      requiredElements: string[];
      prohibitedElements: string[];
    };
  };
  severity: {
    [ruleType: string]: 'error' | 'warning' | 'info';
  };
  autoApprove: {
    enabled: boolean;
    conditions: string[];
    excludeConditions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSafetyCheck {
  content: string;
  platform?: string;
  contentType?: string;
  targetAudience?: string;
  metadata?: {
    title?: string;
    hashtags?: string[];
    mentions?: string[];
    links?: string[];
  };
}

export interface SafetyCheckResult {
  passed: boolean;
  overallScore: number; // 0-100
  issues: Array<{
    type: 'content' | 'tone' | 'legal' | 'social' | 'quality';
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
    location?: {
      start: number;
      end: number;
      text: string;
    };
    ruleId: string;
  }>;
  suggestions: Array<{
    type: 'improvement' | 'alternative' | 'addition';
    message: string;
    example?: string;
  }>;
  compliance: {
    legal: boolean;
    brand: boolean;
    platform: boolean;
    quality: boolean;
  };
  autoApprovalEligible: boolean;
  confidence: number;
  processingTime: number;
}

export interface ContentGuidelines {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  guidelines: {
    general: {
      purpose: string;
      mission: string;
      values: string[];
      keyMessages: string[];
    };
    contentTypes: {
      [type: string]: {
        purpose: string;
        structure: string[];
        length: { min: number; max: number };
        tone: string;
        examples: string[];
        bestPractices: string[];
      };
    };
    platforms: {
      [platform: string]: {
        voice: string;
        style: string;
        formatting: string[];
        hashtagStrategy: string[];
        postingTimes: string[];
        engagement: string[];
      };
    };
    brandElements: {
      logoUsage: string[];
      colorPalette: string[];
      typography: string[];
      imagery: string[];
      iconography: string[];
    };
    messaging: {
      valueProposition: string;
      keyDifferentiators: string[];
      competitiveAdvantages: string[];
      targetAudienceLanguage: {
        [segment: string]: {
          tone: string;
          vocabulary: string[];
          avoid: string[];
        };
      };
    };
  };
  approval: {
    workflow: 'auto' | 'review' | 'approval';
    reviewers: string[];
    criteria: string[];
  };
  metrics: {
    trackingRequirements: string[];
    successCriteria: string[];
    kpis: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentSafetyCheckSchema = z.object({
  content: z.string().min(1),
  platform: z.string().optional(),
  contentType: z.string().optional(),
  targetAudience: z.string().optional(),
  metadata: z.object({
    title: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
  }).optional(),
});

export class BrandSafetyService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  // Predefined risk keywords by category
  private riskKeywords = {
    legal: [
      'guaranteed', 'promise', 'lawsuit', 'legal action', 'sue', 'liability',
      'negligence', 'malpractice', 'fraud', 'violation'
    ],
    financial: [
      'investment advice', 'financial guarantee', 'get rich quick', 'insider trading',
      'ponzi', 'pyramid scheme', 'risk-free'
    ],
    medical: [
      'cure', 'treatment', 'diagnosis', 'medical advice', 'prescription',
      'clinical trial', 'fda approved', 'side effects'
    ],
    controversial: [
      'politics', 'religion', 'race', 'gender discrimination', 'harassment',
      'violence', 'hate speech', 'extremist'
    ],
    misleading: [
      'fake', 'scam', 'misleading', 'deceptive', 'false claims', 'misinformation',
      'clickbait', 'too good to be true'
    ]
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });
  }

  async checkContentSafety(
    request: ContentSafetyCheck, 
    brandRules: BrandSafetyRules,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();
    const validatedRequest = ContentSafetyCheckSchema.parse(request);

    // Basic rule-based checks
    const basicChecks = await this.performBasicChecks(validatedRequest, brandRules);
    
    // AI-powered analysis
    const aiAnalysis = provider === 'openai' 
      ? await this.checkWithOpenAI(validatedRequest, brandRules)
      : await this.checkWithAnthropic(validatedRequest, brandRules);

    // Combine results
    const allIssues = [...basicChecks.issues, ...aiAnalysis.issues];
    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;
    
    const overallScore = Math.max(0, 100 - (errorCount * 25) - (warningCount * 10));
    const passed = errorCount === 0;

    return {
      passed,
      overallScore,
      issues: allIssues,
      suggestions: [...basicChecks.suggestions, ...aiAnalysis.suggestions],
      compliance: {
        legal: !allIssues.some(i => i.type === 'legal' && i.severity === 'error'),
        brand: !allIssues.some(i => i.type === 'content' && i.severity === 'error'),
        platform: !allIssues.some(i => i.type === 'social' && i.severity === 'error'),
        quality: !allIssues.some(i => i.type === 'quality' && i.severity === 'error')
      },
      autoApprovalEligible: this.checkAutoApprovalEligibility(allIssues, brandRules),
      confidence: aiAnalysis.confidence || 0.8,
      processingTime: Date.now() - startTime
    };
  }

  private async performBasicChecks(
    request: ContentSafetyCheck,
    brandRules: BrandSafetyRules
  ): Promise<{
    issues: SafetyCheckResult['issues'];
    suggestions: SafetyCheckResult['suggestions'];
  }> {
    const issues: SafetyCheckResult['issues'] = [];
    const suggestions: SafetyCheckResult['suggestions'] = [];

    // Check forbidden phrases
    brandRules.rules.content.forbiddenPhrases.forEach(phrase => {
      if (request.content.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push({
          type: 'content',
          severity: 'error',
          message: `Contains forbidden phrase: "${phrase}"`,
          suggestion: `Remove or replace the phrase "${phrase}"`,
          ruleId: 'forbidden-phrase',
          location: this.findTextLocation(request.content, phrase)
        });
      }
    });

    // Check forbidden topics
    brandRules.rules.content.forbiddenTopics.forEach(topic => {
      if (request.content.toLowerCase().includes(topic.toLowerCase())) {
        issues.push({
          type: 'content',
          severity: 'warning',
          message: `May contain forbidden topic: "${topic}"`,
          suggestion: `Consider avoiding discussion of "${topic}" or approach with caution`,
          ruleId: 'forbidden-topic'
        });
      }
    });

    // Check risk keywords
    Object.entries(this.riskKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (request.content.toLowerCase().includes(keyword.toLowerCase())) {
          issues.push({
            type: 'legal',
            severity: category === 'legal' ? 'error' : 'warning',
            message: `Contains potentially risky term: "${keyword}" (${category})`,
            suggestion: `Review usage of "${keyword}" for compliance`,
            ruleId: `risk-${category}`,
            location: this.findTextLocation(request.content, keyword)
          });
        }
      });
    });

    // Check platform-specific rules
    if (request.platform && brandRules.rules.social.platformSpecificRules[request.platform]) {
      const platformRules = brandRules.rules.social.platformSpecificRules[request.platform];
      
      if (platformRules.maxLength && request.content.length > platformRules.maxLength) {
        issues.push({
          type: 'social',
          severity: 'error',
          message: `Content exceeds ${request.platform} character limit (${request.content.length}/${platformRules.maxLength})`,
          suggestion: `Shorten content to under ${platformRules.maxLength} characters`,
          ruleId: 'platform-length'
        });
      }

      // Check required hashtags
      if (platformRules.requiredHashtags && request.metadata?.hashtags) {
        const missingHashtags = platformRules.requiredHashtags.filter(
          required => !request.metadata!.hashtags!.some(hash => 
            hash.toLowerCase().includes(required.toLowerCase())
          )
        );
        
        if (missingHashtags.length > 0) {
          suggestions.push({
            type: 'addition',
            message: `Consider adding required hashtags: ${missingHashtags.join(', ')}`
          });
        }
      }
    }

    // Quality checks
    const sentences = request.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;

    if (avgSentenceLength > brandRules.rules.quality.maxSentenceLength) {
      issues.push({
        type: 'quality',
        severity: 'warning',
        message: `Average sentence length (${Math.round(avgSentenceLength)}) exceeds recommended maximum (${brandRules.rules.quality.maxSentenceLength})`,
        suggestion: 'Consider breaking down longer sentences for better readability',
        ruleId: 'sentence-length'
      });
    }

    return { issues, suggestions };
  }

  private async checkWithOpenAI(
    request: ContentSafetyCheck,
    brandRules: BrandSafetyRules
  ): Promise<{
    issues: SafetyCheckResult['issues'];
    suggestions: SafetyCheckResult['suggestions'];
    confidence: number;
  }> {
    const prompt = this.buildSafetyCheckPrompt(request, brandRules);

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are a brand safety expert and content compliance analyzer. You review content for brand safety, legal compliance, and adherence to guidelines. You identify potential risks and provide specific, actionable suggestions for improvement.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      confidence: result.confidence || 0.8
    };
  }

  private async checkWithAnthropic(
    request: ContentSafetyCheck,
    brandRules: BrandSafetyRules
  ): Promise<{
    issues: SafetyCheckResult['issues'];
    suggestions: SafetyCheckResult['suggestions'];
    confidence: number;
  }> {
    const prompt = this.buildSafetyCheckPrompt(request, brandRules);

    const message = await this.anthropic.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a brand safety expert and content compliance analyzer. ${prompt}`
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        confidence: result.confidence || 0.8
      };
    }
    
    return { issues: [], suggestions: [], confidence: 0.5 };
  }

  private buildSafetyCheckPrompt(request: ContentSafetyCheck, brandRules: BrandSafetyRules): string {
    let prompt = `Analyze the following content for brand safety and compliance:

CONTENT TO ANALYZE:
"${request.content}"

CONTEXT:
- Platform: ${request.platform || 'Not specified'}
- Content Type: ${request.contentType || 'Not specified'}
- Target Audience: ${request.targetAudience || 'Not specified'}`;

    if (request.metadata) {
      prompt += `
- Title: ${request.metadata.title || 'None'}
- Hashtags: ${request.metadata.hashtags?.join(', ') || 'None'}
- Mentions: ${request.metadata.mentions?.join(', ') || 'None'}`;
    }

    prompt += `

BRAND SAFETY RULES:
${JSON.stringify(brandRules.rules, null, 2)}

Please analyze for:
1. Brand voice and tone alignment
2. Legal and compliance risks
3. Controversial or sensitive content
4. Misleading claims or statements
5. Platform-specific violations
6. Quality and readability issues

Return analysis as JSON:
{
  "issues": [
    {
      "type": "content/tone/legal/social/quality",
      "severity": "error/warning/info",
      "message": "Description of the issue",
      "suggestion": "How to fix it",
      "ruleId": "rule-identifier"
    }
  ],
  "suggestions": [
    {
      "type": "improvement/alternative/addition",
      "message": "Suggestion text",
      "example": "Example if applicable"
    }
  ],
  "confidence": 0.85
}`;

    return prompt;
  }

  private findTextLocation(content: string, searchText: string): SafetyCheckResult['issues'][0]['location'] {
    const index = content.toLowerCase().indexOf(searchText.toLowerCase());
    if (index === -1) return undefined;

    return {
      start: index,
      end: index + searchText.length,
      text: content.substring(index, index + searchText.length)
    };
  }

  private checkAutoApprovalEligibility(
    issues: SafetyCheckResult['issues'],
    brandRules: BrandSafetyRules
  ): boolean {
    if (!brandRules.autoApprove.enabled) return false;
    
    // No errors allowed for auto-approval
    const hasErrors = issues.some(issue => issue.severity === 'error');
    if (hasErrors) return false;

    // Check exclude conditions
    const hasExcludeConditions = brandRules.autoApprove.excludeConditions.some(condition => {
      return issues.some(issue => issue.message.toLowerCase().includes(condition.toLowerCase()));
    });
    
    return !hasExcludeConditions;
  }

  // Method to generate content guidelines
  async generateContentGuidelines(
    organizationData: {
      name: string;
      description?: string;
      category?: string;
      brandVoice?: string;
      targetAudiences?: string[];
      platforms?: string[];
    },
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<Partial<ContentGuidelines['guidelines']>> {
    const prompt = `Create comprehensive content guidelines for the following organization:

ORGANIZATION:
- Name: ${organizationData.name}
- Description: ${organizationData.description || 'Not provided'}
- Category: ${organizationData.category || 'Not specified'}
- Brand Voice: ${organizationData.brandVoice || 'Not specified'}
- Target Audiences: ${organizationData.targetAudiences?.join(', ') || 'Not specified'}
- Platforms: ${organizationData.platforms?.join(', ') || 'Not specified'}

Please provide comprehensive guidelines in JSON format:
{
  "general": {
    "purpose": "Overall content purpose",
    "mission": "Content mission statement",
    "values": ["value1", "value2"],
    "keyMessages": ["message1", "message2"]
  },
  "contentTypes": {
    "blog-post": {
      "purpose": "Educational and thought leadership",
      "structure": ["intro", "body", "conclusion"],
      "length": {"min": 800, "max": 2000},
      "tone": "professional yet approachable",
      "examples": ["example1", "example2"],
      "bestPractices": ["practice1", "practice2"]
    }
  },
  "platforms": {
    "linkedin": {
      "voice": "professional",
      "style": "business casual",
      "formatting": ["bullet points", "line breaks"],
      "hashtagStrategy": ["industry tags", "brand tags"],
      "postingTimes": ["9am-11am", "2pm-4pm"],
      "engagement": ["respond within 2 hours", "ask questions"]
    }
  },
  "messaging": {
    "valueProposition": "Main value prop",
    "keyDifferentiators": ["diff1", "diff2"],
    "competitiveAdvantages": ["advantage1", "advantage2"]
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
      
      throw new Error('Failed to generate content guidelines');
    }
  }

  // Method to batch check multiple pieces of content
  async batchSafetyCheck(
    requests: ContentSafetyCheck[],
    brandRules: BrandSafetyRules,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<SafetyCheckResult[]> {
    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    const results: SafetyCheckResult[] = [];

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(request => 
        this.checkContentSafety(request, brandRules, provider)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Method to update brand safety rules based on violations
  suggestRuleUpdates(
    violations: Array<{
      content: string;
      issues: SafetyCheckResult['issues'];
      approved: boolean;
    }>,
    currentRules: BrandSafetyRules
  ): {
    suggestedAdditions: {
      forbiddenPhrases: string[];
      forbiddenTopics: string[];
      newRules: string[];
    };
    suggestedRemovals: {
      overzealousRules: string[];
      reasons: string[];
    };
  } {
    const commonViolations: { [key: string]: number } = {};
    const falsePositives: string[] = [];

    // Analyze patterns in violations
    violations.forEach(violation => {
      violation.issues.forEach(issue => {
        if (issue.severity === 'error') {
          const key = `${issue.type}:${issue.message}`;
          commonViolations[key] = (commonViolations[key] || 0) + 1;
        }
      });

      // Track false positives (violations that were approved)
      if (violation.approved) {
        violation.issues.forEach(issue => {
          if (issue.severity === 'error') {
            falsePositives.push(issue.ruleId);
          }
        });
      }
    });

    // Extract patterns
    const suggestedAdditions = {
      forbiddenPhrases: Object.keys(commonViolations)
        .filter(key => commonViolations[key] >= 3)
        .map(key => key.split(':')[1])
        .slice(0, 10),
      forbiddenTopics: [],
      newRules: []
    };

    const suggestedRemovals = {
      overzealousRules: [...new Set(falsePositives)],
      reasons: ['Multiple approved violations suggest rule may be too strict']
    };

    return { suggestedAdditions, suggestedRemovals };
  }
}

export const brandSafetyService = new BrandSafetyService();
