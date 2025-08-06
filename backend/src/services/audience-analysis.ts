import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config';
import { z } from 'zod';
import { OrganizationData } from './ai-strategy';

export interface AudienceAnalysisRequest {
  organization: OrganizationData;
  existingCustomerData?: {
    demographics?: {
      age?: { min: number; max: number };
      locations?: string[];
      industries?: string[];
      jobTitles?: string[];
      companySize?: string[];
    };
    behaviors?: {
      platforms?: string[];
      contentTypes?: string[];
      engagementTimes?: string[];
    };
    feedback?: string[];
  };
  competitorAudience?: Array<{
    competitor: string;
    audienceInsights: string[];
  }>;
  marketResearch?: {
    industryTrends?: string[];
    painPoints?: string[];
    preferences?: string[];
  };
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  priority: 'high' | 'medium' | 'low';
  demographics: {
    ageRange: string;
    location: string[];
    jobTitles: string[];
    industries: string[];
    companySize: string[];
    income: string;
    education: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle: string[];
    personality: string[];
    motivations: string[];
  };
  painPoints: {
    primary: string[];
    secondary: string[];
    emotional: string[];
    functional: string[];
  };
  goals: {
    personal: string[];
    professional: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  behaviors: {
    platforms: Array<{
      platform: string;
      usage: 'heavy' | 'moderate' | 'light';
      contentTypes: string[];
      bestTimes: string[];
    }>;
    contentConsumption: {
      formats: string[];
      frequency: string;
      duration: string;
    };
    decisionMaking: {
      process: string;
      influences: string[];
      timeline: string;
    };
  };
  messaging: {
    keyMessages: string[];
    tone: string;
    language: string[];
    avoid: string[];
  };
  channels: {
    primary: string[];
    secondary: string[];
    touchpoints: string[];
  };
}

export interface AudienceAnalysisResult {
  segments: AudienceSegment[];
  totalMarketSize: {
    estimated: number;
    confidence: number;
    methodology: string;
  };
  segmentPriority: {
    ranking: Array<{
      segmentId: string;
      score: number;
      rationale: string;
    }>;
    recommended: string[];
  };
  crossSegmentInsights: {
    commonPainPoints: string[];
    sharedChannels: string[];
    messagingOverlap: string[];
    differentiators: string[];
  };
  contentStrategy: {
    contentTypes: Array<{
      type: string;
      segments: string[];
      platforms: string[];
      examples: string[];
    }>;
    calendar: {
      daily: { [segmentId: string]: string[] };
      weekly: { [segmentId: string]: string[] };
      monthly: { [segmentId: string]: string[] };
    };
  };
  measurableGoals: {
    awareness: Array<{ segment: string; metric: string; target: number }>;
    engagement: Array<{ segment: string; metric: string; target: number }>;
    conversion: Array<{ segment: string; metric: string; target: number }>;
  };
  confidence: number;
  generatedBy: string;
}

const AudienceAnalysisRequestSchema = z.object({
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
  existingCustomerData: z.object({
    demographics: z.object({
      age: z.object({ min: z.number(), max: z.number() }).optional(),
      locations: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      jobTitles: z.array(z.string()).optional(),
      companySize: z.array(z.string()).optional(),
    }).optional(),
    behaviors: z.object({
      platforms: z.array(z.string()).optional(),
      contentTypes: z.array(z.string()).optional(),
      engagementTimes: z.array(z.string()).optional(),
    }).optional(),
    feedback: z.array(z.string()).optional(),
  }).optional(),
  competitorAudience: z.array(z.object({
    competitor: z.string(),
    audienceInsights: z.array(z.string()),
  })).optional(),
  marketResearch: z.object({
    industryTrends: z.array(z.string()).optional(),
    painPoints: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
  }).optional(),
});

export class AudienceAnalysisService {
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

  async analyzeAudience(request: AudienceAnalysisRequest, provider: 'openai' | 'anthropic' = 'openai'): Promise<AudienceAnalysisResult> {
    const validatedRequest = AudienceAnalysisRequestSchema.parse(request);

    if (provider === 'openai') {
      return await this.analyzeWithOpenAI(validatedRequest);
    } else {
      return await this.analyzeWithAnthropic(validatedRequest);
    }
  }

  private async analyzeWithOpenAI(request: AudienceAnalysisRequest): Promise<AudienceAnalysisResult> {
    const prompt = this.buildAudienceAnalysisPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert market researcher and customer insights analyst. You specialize in creating detailed, actionable audience segments based on comprehensive data analysis. Your segments are psychographically rich, behaviorally specific, and strategically valuable for marketing and product development.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      ...result,
      generatedBy: `openai-${config.ai.openai.model}`
    };
  }

  private async analyzeWithAnthropic(request: AudienceAnalysisRequest): Promise<AudienceAnalysisResult> {
    const prompt = this.buildAudienceAnalysisPrompt(request);

    const message = await this.anthropic.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are an expert market researcher and customer insights analyst. ${prompt}`
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
    
    throw new Error('Failed to analyze audience');
  }

  private buildAudienceAnalysisPrompt(request: AudienceAnalysisRequest): string {
    const { organization, existingCustomerData, competitorAudience, marketResearch } = request;

    let prompt = `Conduct a comprehensive audience analysis for the following organization:

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

    if (existingCustomerData) {
      prompt += `\n\nEXISTING CUSTOMER DATA:`;
      
      if (existingCustomerData.demographics) {
        const demo = existingCustomerData.demographics;
        prompt += `\nDemographics:`;
        if (demo.age) prompt += `\n- Age: ${demo.age.min}-${demo.age.max}`;
        if (demo.locations?.length) prompt += `\n- Locations: ${demo.locations.join(', ')}`;
        if (demo.industries?.length) prompt += `\n- Industries: ${demo.industries.join(', ')}`;
        if (demo.jobTitles?.length) prompt += `\n- Job Titles: ${demo.jobTitles.join(', ')}`;
        if (demo.companySize?.length) prompt += `\n- Company Sizes: ${demo.companySize.join(', ')}`;
      }

      if (existingCustomerData.behaviors) {
        const behaviors = existingCustomerData.behaviors;
        prompt += `\nBehaviors:`;
        if (behaviors.platforms?.length) prompt += `\n- Platforms: ${behaviors.platforms.join(', ')}`;
        if (behaviors.contentTypes?.length) prompt += `\n- Content Types: ${behaviors.contentTypes.join(', ')}`;
        if (behaviors.engagementTimes?.length) prompt += `\n- Active Times: ${behaviors.engagementTimes.join(', ')}`;
      }

      if (existingCustomerData.feedback?.length) {
        prompt += `\nCustomer Feedback:`;
        existingCustomerData.feedback.forEach((feedback, index) => {
          prompt += `\n${index + 1}. "${feedback}"`;
        });
      }
    }

    if (competitorAudience?.length) {
      prompt += `\n\nCOMPETITOR AUDIENCE INSIGHTS:`;
      competitorAudience.forEach(comp => {
        prompt += `\n- ${comp.competitor}:`;
        comp.audienceInsights.forEach(insight => {
          prompt += `\n  • ${insight}`;
        });
      });
    }

    if (marketResearch) {
      prompt += `\n\nMARKET RESEARCH:`;
      if (marketResearch.industryTrends?.length) {
        prompt += `\nIndustry Trends: ${marketResearch.industryTrends.join(', ')}`;
      }
      if (marketResearch.painPoints?.length) {
        prompt += `\nKnown Pain Points: ${marketResearch.painPoints.join(', ')}`;
      }
      if (marketResearch.preferences?.length) {
        prompt += `\nPreferences: ${marketResearch.preferences.join(', ')}`;
      }
    }

    prompt += `

Please provide a comprehensive audience analysis in JSON format following this structure:
{
  "segments": [
    {
      "id": "segment-1",
      "name": "Segment Name",
      "description": "Detailed description of this segment",
      "size": "large/medium/small",
      "priority": "high/medium/low",
      "demographics": {
        "ageRange": "25-34",
        "location": ["US", "Canada"],
        "jobTitles": ["Software Engineer", "Tech Lead"],
        "industries": ["Technology", "SaaS"],
        "companySize": ["50-200", "200-500"],
        "income": "$80k-$120k",
        "education": "Bachelor's degree or higher"
      },
      "psychographics": {
        "values": ["efficiency", "innovation"],
        "interests": ["technology", "productivity"],
        "lifestyle": ["remote work", "continuous learning"],
        "personality": ["analytical", "ambitious"],
        "motivations": ["career growth", "problem solving"]
      },
      "painPoints": {
        "primary": ["pain point 1", "pain point 2"],
        "secondary": ["secondary pain 1"],
        "emotional": ["frustration with X"],
        "functional": ["difficulty doing Y"]
      },
      "goals": {
        "personal": ["goal 1", "goal 2"],
        "professional": ["goal 1", "goal 2"],
        "shortTerm": ["goal 1"],
        "longTerm": ["goal 1"]
      },
      "behaviors": {
        "platforms": [
          {
            "platform": "LinkedIn",
            "usage": "heavy",
            "contentTypes": ["articles", "posts"],
            "bestTimes": ["9am-11am", "2pm-4pm"]
          }
        ],
        "contentConsumption": {
          "formats": ["articles", "videos"],
          "frequency": "daily",
          "duration": "5-15 minutes"
        },
        "decisionMaking": {
          "process": "research-heavy",
          "influences": ["peer reviews", "case studies"],
          "timeline": "2-4 weeks"
        }
      },
      "messaging": {
        "keyMessages": ["message 1", "message 2"],
        "tone": "professional yet approachable",
        "language": ["technical but accessible"],
        "avoid": ["overly sales-y", "jargon without explanation"]
      },
      "channels": {
        "primary": ["LinkedIn", "email"],
        "secondary": ["Twitter", "industry blogs"],
        "touchpoints": ["webinars", "conferences"]
      }
    }
  ],
  "totalMarketSize": {
    "estimated": 50000,
    "confidence": 0.7,
    "methodology": "TAM/SAM analysis based on industry data"
  },
  "segmentPriority": {
    "ranking": [
      {
        "segmentId": "segment-1",
        "score": 85,
        "rationale": "High conversion potential and large market size"
      }
    ],
    "recommended": ["segment-1", "segment-2"]
  },
  "crossSegmentInsights": {
    "commonPainPoints": ["shared pain 1", "shared pain 2"],
    "sharedChannels": ["LinkedIn", "email"],
    "messagingOverlap": ["efficiency", "ROI"],
    "differentiators": ["different approaches to same problem"]
  },
  "contentStrategy": {
    "contentTypes": [
      {
        "type": "case studies",
        "segments": ["segment-1", "segment-2"],
        "platforms": ["LinkedIn", "website"],
        "examples": ["Customer X achieved Y results"]
      }
    ],
    "calendar": {
      "daily": {
        "segment-1": ["LinkedIn posts", "email responses"]
      },
      "weekly": {
        "segment-1": ["blog article", "LinkedIn article"]
      },
      "monthly": {
        "segment-1": ["webinar", "case study"]
      }
    }
  },
  "measurableGoals": {
    "awareness": [
      {
        "segment": "segment-1",
        "metric": "brand mentions",
        "target": 100
      }
    ],
    "engagement": [
      {
        "segment": "segment-1", 
        "metric": "content engagement rate",
        "target": 5.5
      }
    ],
    "conversion": [
      {
        "segment": "segment-1",
        "metric": "lead conversion rate",
        "target": 15
      }
    ]
  },
  "confidence": 0.85
}

Guidelines:
1. Create 3-5 distinct audience segments that cover the primary market
2. Each segment should be specific enough to create targeted messaging
3. Include both demographic and psychographic insights
4. Prioritize segments based on business potential and accessibility
5. Provide actionable recommendations for each segment
6. Consider the full customer journey for each segment
7. Include measurable goals and success metrics`;

    return prompt;
  }

  // Method to create personalized content for specific audience segments
  async generateSegmentContent(
    segment: AudienceSegment,
    contentType: string,
    platform: string,
    count: number = 5,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<{
    content: Array<{
      title: string;
      hook: string;
      body: string;
      cta: string;
      expectedEngagement: number;
    }>;
  }> {
    const prompt = `Generate ${count} ${contentType} pieces for the following audience segment:

SEGMENT:
${JSON.stringify(segment, null, 2)}

PLATFORM: ${platform}
CONTENT TYPE: ${contentType}

Please provide content in JSON format:
{
  "content": [
    {
      "title": "Compelling title/headline",
      "hook": "Opening hook that grabs attention",
      "body": "Main content body",
      "cta": "Clear call to action",
      "expectedEngagement": 75
    }
  ]
}

Guidelines:
1. Use the segment's preferred tone and messaging
2. Address their specific pain points and goals  
3. Adapt to platform best practices
4. Include relevant keywords and terminology
5. Make content actionable and valuable
6. Avoid topics/language they dislike`;

    if (provider === 'openai') {
      const completion = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } else {
      const message = await this.anthropic.messages.create({
        model: config.ai.anthropic.model,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to generate segment content');
    }
  }

  // Method to validate audience segments against actual data
  validateSegments(
    segments: AudienceSegment[],
    actualData: Array<{
      userId: string;
      demographics: any;
      behaviors: any;
      engagement: number;
      conversion: boolean;
    }>
  ): {
    segmentAccuracy: Array<{
      segmentId: string;
      accuracy: number;
      matches: number;
      mismatches: number;
      insights: string[];
    }>;
    overallAccuracy: number;
    recommendations: string[];
  } {
    const results = segments.map(segment => {
      let matches = 0;
      let mismatches = 0;
      const insights: string[] = [];

      actualData.forEach(user => {
        let segmentMatch = true;
        
        // Check demographic alignment
        if (segment.demographics.jobTitles.length > 0 && user.demographics.jobTitle) {
          if (!segment.demographics.jobTitles.some(title => 
            user.demographics.jobTitle.toLowerCase().includes(title.toLowerCase())
          )) {
            segmentMatch = false;
          }
        }

        // Check platform usage
        if (segment.behaviors.platforms.length > 0 && user.behaviors.platforms) {
          const platformOverlap = segment.behaviors.platforms.filter(sp =>
            user.behaviors.platforms.includes(sp.platform)
          );
          if (platformOverlap.length === 0) {
            segmentMatch = false;
          }
        }

        if (segmentMatch) {
          matches++;
        } else {
          mismatches++;
        }
      });

      const accuracy = matches / (matches + mismatches);
      
      // Generate insights
      if (accuracy < 0.6) {
        insights.push('Segment definition may be too narrow or inaccurate');
      }
      if (accuracy > 0.9) {
        insights.push('Segment is well-defined and accurate');
      }

      return {
        segmentId: segment.id,
        accuracy: Math.round(accuracy * 100) / 100,
        matches,
        mismatches,
        insights
      };
    });

    const overallAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

    const recommendations: string[] = [];
    if (overallAccuracy < 0.7) {
      recommendations.push('Consider refining segment definitions based on actual user data');
    }
    if (results.some(r => r.accuracy < 0.5)) {
      recommendations.push('Some segments may need to be merged or redefined');
    }

    return {
      segmentAccuracy: results,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      recommendations
    };
  }
}

export const audienceAnalysisService = new AudienceAnalysisService();
