import { z } from 'zod';
import { prisma } from './database';
import { ValidationError } from '../utils/errors';

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string[];
  contentType: string[];
  template: {
    structure: TemplateStructure;
    placeholders: TemplatePlaceholder[];
    styling: TemplateStyle;
  };
  examples: TemplateExample[];
  tags: string[];
  isPublic: boolean;
  organizationId?: string;
  usage: {
    timesUsed: number;
    avgEngagement?: number;
    avgConversion?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  layout: 'linear' | 'hook-body-cta' | 'problem-solution' | 'story' | 'list' | 'comparison';
  maxLength?: number;
  requiredSections: string[];
  optionalSections: string[];
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'hook' | 'body' | 'cta' | 'hashtags' | 'mentions' | 'title' | 'subtitle' | 'bullet_points' | 'conclusion';
  placeholder: string;
  required: boolean;
  maxLength?: number;
  position: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    uppercase?: boolean;
    lineBreaks?: number;
  };
}

export interface TemplatePlaceholder {
  key: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'url' | 'date' | 'list' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  examples: string[];
}

export interface TemplateStyle {
  tone: string[];
  voice: string[];
  formatting: {
    useEmojis: boolean;
    useHashtags: boolean;
    useMentions: boolean;
    lineBreaksStyle: 'minimal' | 'moderate' | 'heavy';
    capitalizationStyle: 'sentence' | 'title' | 'all_caps' | 'mixed';
  };
  platformSpecific: {
    [platform: string]: {
      adaptations: string[];
      constraints: string[];
    };
  };
}

export interface TemplateExample {
  title: string;
  content: string;
  platform: string;
  context: string;
  performance?: {
    engagement: number;
    reach: number;
    conversions?: number;
  };
}

export interface TemplateApplication {
  templateId: string;
  variables: Record<string, any>;
  platform: string;
  customizations?: {
    tone?: string;
    style?: Partial<TemplateStyle>;
    additionalSections?: TemplateSection[];
  };
}

const TemplateApplicationSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()),
  platform: z.string(),
  customizations: z.object({
    tone: z.string().optional(),
    style: z.object({
      tone: z.array(z.string()).optional(),
      voice: z.array(z.string()).optional(),
      formatting: z.object({
        useEmojis: z.boolean().optional(),
        useHashtags: z.boolean().optional(),
        useMentions: z.boolean().optional(),
        lineBreaksStyle: z.enum(['minimal', 'moderate', 'heavy']).optional(),
        capitalizationStyle: z.enum(['sentence', 'title', 'all_caps', 'mixed']).optional(),
      }).optional(),
    }).optional(),
    additionalSections: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['hook', 'body', 'cta', 'hashtags', 'mentions', 'title', 'subtitle', 'bullet_points', 'conclusion']),
      placeholder: z.string(),
      required: z.boolean(),
      maxLength: z.number().optional(),
      position: z.number(),
    })).optional(),
  }).optional(),
});

export class ContentTemplatesService {
  // Built-in template categories
  private readonly templateCategories = [
    'educational',
    'promotional',
    'engagement',
    'news_update',
    'behind_scenes',
    'testimonial',
    'how_to',
    'announcement',
    'question',
    'poll',
    'story',
    'list',
    'comparison',
    'case_study'
  ];

  constructor() {}

  async createTemplate(template: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<ContentTemplate> {
    try {
      // Validate template structure
      this.validateTemplateStructure(template.template.structure);

      const newTemplate: ContentTemplate = {
        ...template,
        id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usage: {
          timesUsed: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In a real implementation, save to database
      // await prisma.contentTemplate.create({ data: newTemplate });

      return newTemplate;
    } catch (error) {
      throw new ValidationError('Failed to create template', 'template', error);
    }
  }

  async getTemplates(filters?: {
    category?: string;
    platform?: string;
    contentType?: string;
    organizationId?: string;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<ContentTemplate[]> {
    // Return built-in templates for now
    return this.getBuiltInTemplates(filters);
  }

  async getTemplateById(id: string): Promise<ContentTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async applyTemplate(application: TemplateApplication): Promise<{
    content: string;
    sections: { [key: string]: string };
    metadata: {
      templateUsed: string;
      variablesApplied: string[];
      platformOptimized: string;
      generatedAt: Date;
    };
  }> {
    try {
      // Validate application
      const validatedApplication = TemplateApplicationSchema.parse(application);

      // Get template
      const template = await this.getTemplateById(validatedApplication.templateId);
      if (!template) {
        throw new ValidationError('Template not found', 'templateId', validatedApplication.templateId);
      }

      // Check platform compatibility
      if (!template.platform.includes(validatedApplication.platform)) {
        throw new ValidationError(
          'Template not compatible with platform',
          'platform',
          `Template supports: ${template.platform.join(', ')}`
        );
      }

      // Apply variables to template
      const sections = this.applySectionsWithVariables(
        template.template.structure,
        validatedApplication.variables,
        validatedApplication.customizations
      );

      // Generate final content
      const content = this.assembleFinalContent(
        sections,
        template.template.structure,
        template.template.styling,
        validatedApplication.platform,
        validatedApplication.customizations?.style
      );

      // Update usage statistics (in real implementation)
      // await this.updateTemplateUsage(validatedApplication.templateId);

      return {
        content,
        sections,
        metadata: {
          templateUsed: template.name,
          variablesApplied: Object.keys(validatedApplication.variables),
          platformOptimized: validatedApplication.platform,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid template application', 'application', error.errors);
      }
      throw error;
    }
  }

  async searchTemplates(query: string, filters?: {
    category?: string;
    platform?: string;
    organizationId?: string;
  }): Promise<ContentTemplate[]> {
    const templates = await this.getTemplates(filters);
    
    const searchLower = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      template.category.toLowerCase().includes(searchLower)
    );
  }

  async duplicateTemplate(templateId: string, customizations?: {
    name?: string;
    organizationId?: string;
    modifications?: Partial<ContentTemplate>;
  }): Promise<ContentTemplate> {
    const originalTemplate = await this.getTemplateById(templateId);
    if (!originalTemplate) {
      throw new ValidationError('Template not found', 'templateId', templateId);
    }

    const duplicatedTemplate = {
      ...originalTemplate,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customizations?.name || `${originalTemplate.name} (Copy)`,
      organizationId: customizations?.organizationId,
      isPublic: false, // Duplicated templates are private by default
      usage: {
        timesUsed: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customizations?.modifications,
    };

    return duplicatedTemplate;
  }

  private validateTemplateStructure(structure: TemplateStructure): void {
    if (!structure.sections || structure.sections.length === 0) {
      throw new ValidationError('Template must have at least one section', 'sections', []);
    }

    const sectionIds = structure.sections.map(s => s.id);
    const uniqueIds = new Set(sectionIds);
    if (sectionIds.length !== uniqueIds.size) {
      throw new ValidationError('Section IDs must be unique', 'sections', sectionIds);
    }

    // Validate required sections exist
    for (const requiredSection of structure.requiredSections) {
      if (!sectionIds.includes(requiredSection)) {
        throw new ValidationError(
          `Required section '${requiredSection}' not found in template`,
          'requiredSections',
          requiredSection
        );
      }
    }
  }

  private applySectionsWithVariables(
    structure: TemplateStructure,
    variables: Record<string, any>,
    customizations?: TemplateApplication['customizations']
  ): { [key: string]: string } {
    const sections: { [key: string]: string } = {};

    for (const section of structure.sections) {
      let content = section.placeholder;

      // Replace variables in placeholder
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }

      // Apply section formatting
      if (section.formatting) {
        if (section.formatting.bold) {
          content = `**${content}**`;
        }
        if (section.formatting.italic) {
          content = `*${content}*`;
        }
        if (section.formatting.uppercase) {
          content = content.toUpperCase();
        }
      }

      sections[section.id] = content;
    }

    // Add any additional sections from customizations
    if (customizations?.additionalSections) {
      for (const additionalSection of customizations.additionalSections) {
        let content = additionalSection.placeholder;
        
        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), String(value));
        }

        sections[additionalSection.id] = content;
      }
    }

    return sections;
  }

  private assembleFinalContent(
    sections: { [key: string]: string },
    structure: TemplateStructure,
    styling: TemplateStyle,
    platform: string,
    customStyling?: Partial<TemplateStyle>
  ): string {
    const finalStyling = { ...styling, ...customStyling };
    const sortedSections = structure.sections.sort((a, b) => a.position - b.position);

    let content = '';
    let lineBreakCount = 0;

    switch (finalStyling.formatting.lineBreaksStyle) {
      case 'minimal':
        lineBreakCount = 1;
        break;
      case 'moderate':
        lineBreakCount = 2;
        break;
      case 'heavy':
        lineBreakCount = 3;
        break;
    }

    for (let i = 0; i < sortedSections.length; i++) {
      const section = sortedSections[i];
      const sectionContent = sections[section.id];

      if (!sectionContent || sectionContent.trim() === '') continue;

      content += sectionContent;

      // Add line breaks between sections (except for the last section)
      if (i < sortedSections.length - 1) {
        content += '\n'.repeat(lineBreakCount);
      }
    }

    // Apply platform-specific adaptations
    const platformAdaptations = finalStyling.platformSpecific[platform];
    if (platformAdaptations) {
      // Apply platform-specific formatting rules
      // This would contain platform-specific logic for content formatting
    }

    return content.trim();
  }

  private getBuiltInTemplates(filters?: {
    category?: string;
    platform?: string;
    contentType?: string;
    organizationId?: string;
    isPublic?: boolean;
    tags?: string[];
  }): ContentTemplate[] {
    const templates: ContentTemplate[] = [
      // Educational Template
      {
        id: 'tpl_educational_001',
        name: 'Educational Post',
        description: 'Template for sharing educational content with clear value proposition',
        category: 'educational',
        platform: ['LINKEDIN', 'TWITTER', 'FACEBOOK'],
        contentType: ['POST'],
        template: {
          structure: {
            sections: [
              {
                id: 'hook',
                name: 'Hook',
                type: 'hook',
                placeholder: '🧠 {{topic}} is crucial for {{audience}}. Here\'s what most people get wrong:',
                required: true,
                position: 1,
              },
              {
                id: 'body',
                name: 'Main Content',
                type: 'body',
                placeholder: '{{main_points}}\n\nThe key insight: {{key_insight}}',
                required: true,
                position: 2,
              },
              {
                id: 'cta',
                name: 'Call to Action',
                type: 'cta',
                placeholder: 'What\'s your take on {{topic}}? Share your thoughts below! 👇',
                required: true,
                position: 3,
              },
              {
                id: 'hashtags',
                name: 'Hashtags',
                type: 'hashtags',
                placeholder: '#{{primary_hashtag}} #education #learning #{{industry}}',
                required: false,
                position: 4,
              },
            ],
            layout: 'hook-body-cta',
            requiredSections: ['hook', 'body', 'cta'],
            optionalSections: ['hashtags'],
          },
          placeholders: [
            {
              key: 'topic',
              name: 'Topic',
              description: 'The main topic you\'re teaching about',
              type: 'text',
              required: true,
              examples: ['Email marketing', 'Leadership', 'Time management'],
            },
            {
              key: 'audience',
              name: 'Target Audience',
              description: 'Who this content is for',
              type: 'text',
              required: true,
              examples: ['entrepreneurs', 'marketers', 'developers'],
            },
            {
              key: 'main_points',
              name: 'Main Points',
              description: 'The key educational points to cover',
              type: 'list',
              required: true,
              examples: ['• Point 1\n• Point 2\n• Point 3'],
            },
            {
              key: 'key_insight',
              name: 'Key Insight',
              description: 'The most important takeaway',
              type: 'text',
              required: true,
              examples: ['Quality over quantity always wins'],
            },
            {
              key: 'primary_hashtag',
              name: 'Primary Hashtag',
              description: 'Main hashtag related to the topic',
              type: 'text',
              required: false,
              examples: ['marketing', 'leadership', 'productivity'],
            },
            {
              key: 'industry',
              name: 'Industry',
              description: 'Relevant industry hashtag',
              type: 'text',
              required: false,
              examples: ['saas', 'fintech', 'ecommerce'],
            },
          ],
          styling: {
            tone: ['educational', 'helpful', 'authoritative'],
            voice: ['expert', 'approachable'],
            formatting: {
              useEmojis: true,
              useHashtags: true,
              useMentions: false,
              lineBreaksStyle: 'moderate',
              capitalizationStyle: 'sentence',
            },
            platformSpecific: {
              LINKEDIN: {
                adaptations: ['Professional tone', 'Industry focus'],
                constraints: ['Avoid excessive emojis'],
              },
              TWITTER: {
                adaptations: ['Concise format', 'Thread potential'],
                constraints: ['Character limits'],
              },
            },
          },
        },
        examples: [
          {
            title: 'Email Marketing Example',
            content: '🧠 Email marketing is crucial for SaaS founders. Here\'s what most people get wrong:\n\n• They focus on features, not benefits\n• They send too frequently without value\n• They don\'t segment their audience\n\nThe key insight: Personalization beats frequency every time.\n\nWhat\'s your take on email marketing? Share your thoughts below! 👇\n\n#emailmarketing #education #learning #saas',
            platform: 'LINKEDIN',
            context: 'SaaS founder sharing email marketing tips',
            performance: {
              engagement: 0.85,
              reach: 5000,
            },
          },
        ],
        tags: ['educational', 'tips', 'howto', 'teaching'],
        isPublic: true,
        usage: {
          timesUsed: 127,
          avgEngagement: 0.78,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },

      // Promotional Template
      {
        id: 'tpl_promotional_001',
        name: 'Product Launch',
        description: 'Template for announcing new products or features',
        category: 'promotional',
        platform: ['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK'],
        contentType: ['POST', 'CAROUSEL'],
        template: {
          structure: {
            sections: [
              {
                id: 'announcement',
                name: 'Announcement',
                type: 'hook',
                placeholder: '🚀 {{product_name}} is here! {{launch_emotion}}',
                required: true,
                position: 1,
                formatting: { bold: true },
              },
              {
                id: 'problem',
                name: 'Problem Statement',
                type: 'body',
                placeholder: 'We built this because {{problem_statement}}.',
                required: true,
                position: 2,
              },
              {
                id: 'solution',
                name: 'Solution Description',
                type: 'body',
                placeholder: '{{product_name}} {{solution_description}}',
                required: true,
                position: 3,
              },
              {
                id: 'benefits',
                name: 'Key Benefits',
                type: 'body',
                placeholder: '✅ {{benefit_1}}\n✅ {{benefit_2}}\n✅ {{benefit_3}}',
                required: true,
                position: 4,
              },
              {
                id: 'cta',
                name: 'Call to Action',
                type: 'cta',
                placeholder: '{{cta_action}} {{cta_urgency}}\n\n🔗 {{link}}',
                required: true,
                position: 5,
              },
              {
                id: 'hashtags',
                name: 'Hashtags',
                type: 'hashtags',
                placeholder: '#{{product_hashtag}} #launch #{{industry}} #innovation',
                required: false,
                position: 6,
              },
            ],
            layout: 'problem-solution',
            requiredSections: ['announcement', 'problem', 'solution', 'benefits', 'cta'],
            optionalSections: ['hashtags'],
          },
          placeholders: [
            {
              key: 'product_name',
              name: 'Product Name',
              description: 'Name of the product being launched',
              type: 'text',
              required: true,
              examples: ['AI Content Writer', 'Smart Dashboard', 'Mobile App 2.0'],
            },
            {
              key: 'launch_emotion',
              name: 'Launch Emotion',
              description: 'Emotional hook for the launch',
              type: 'select',
              required: true,
              options: ['We\'re excited to share it with you!', 'This changes everything.', 'You asked, we delivered.', 'The wait is over!'],
              examples: ['We\'re excited to share it with you!'],
            },
            {
              key: 'problem_statement',
              name: 'Problem Statement',
              description: 'What problem does this solve?',
              type: 'text',
              required: true,
              examples: ['creating content was taking too much time', 'teams needed better collaboration tools'],
            },
            {
              key: 'solution_description',
              name: 'Solution Description',
              description: 'How your product solves the problem',
              type: 'text',
              required: true,
              examples: ['helps you create engaging content 10x faster', 'streamlines your entire workflow'],
            },
            {
              key: 'benefit_1',
              name: 'Benefit 1',
              description: 'First key benefit',
              type: 'text',
              required: true,
              examples: ['Save 5+ hours per week'],
            },
            {
              key: 'benefit_2',
              name: 'Benefit 2',
              description: 'Second key benefit',
              type: 'text',
              required: true,
              examples: ['AI-powered content optimization'],
            },
            {
              key: 'benefit_3',
              name: 'Benefit 3',
              description: 'Third key benefit',
              type: 'text',
              required: true,
              examples: ['Seamless team collaboration'],
            },
            {
              key: 'cta_action',
              name: 'CTA Action',
              description: 'What action do you want users to take?',
              type: 'select',
              required: true,
              options: ['Try it free today!', 'Get early access now!', 'Join the waitlist!', 'Download now!'],
              examples: ['Try it free today!'],
            },
            {
              key: 'cta_urgency',
              name: 'CTA Urgency',
              description: 'Urgency element for the CTA',
              type: 'text',
              required: false,
              examples: ['Limited spots available!', 'Launch week only!', ''],
            },
            {
              key: 'link',
              name: 'Link',
              description: 'URL for the call to action',
              type: 'url',
              required: true,
              examples: ['https://yourproduct.com', 'https://app.yourproduct.com/signup'],
            },
            {
              key: 'product_hashtag',
              name: 'Product Hashtag',
              description: 'Hashtag for your product',
              type: 'text',
              required: false,
              examples: ['aiwriter', 'smartdashboard', 'newlaunch'],
            },
            {
              key: 'industry',
              name: 'Industry Hashtag',
              description: 'Relevant industry hashtag',
              type: 'text',
              required: false,
              examples: ['saas', 'productivity', 'contentmarketing'],
            },
          ],
          styling: {
            tone: ['exciting', 'confident', 'solution-focused'],
            voice: ['innovative', 'helpful'],
            formatting: {
              useEmojis: true,
              useHashtags: true,
              useMentions: false,
              lineBreaksStyle: 'moderate',
              capitalizationStyle: 'sentence',
            },
            platformSpecific: {
              TWITTER: {
                adaptations: ['Shorter format', 'Thread potential for details'],
                constraints: ['Character limits', 'Link handling'],
              },
              LINKEDIN: {
                adaptations: ['Professional focus', 'Business benefits'],
                constraints: ['Avoid overly promotional tone'],
              },
            },
          },
        },
        examples: [
          {
            title: 'AI Content Writer Launch',
            content: '🚀 **AI Content Writer is here!** We\'re excited to share it with you!\n\nWe built this because creating content was taking too much time.\n\nAI Content Writer helps you create engaging content 10x faster\n\n✅ Save 5+ hours per week\n✅ AI-powered content optimization\n✅ Seamless team collaboration\n\nTry it free today! Launch week only!\n\n🔗 https://aiwriter.com\n\n#aiwriter #launch #contentmarketing #innovation',
            platform: 'LINKEDIN',
            context: 'SaaS company launching AI writing tool',
            performance: {
              engagement: 0.92,
              reach: 8500,
              conversions: 45,
            },
          },
        ],
        tags: ['promotional', 'launch', 'product', 'announcement'],
        isPublic: true,
        usage: {
          timesUsed: 89,
          avgEngagement: 0.82,
          avgConversion: 0.08,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      },
    ];

    // Apply filters
    let filteredTemplates = templates;

    if (filters?.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    if (filters?.platform) {
      filteredTemplates = filteredTemplates.filter(t => t.platform.includes(filters.platform!));
    }

    if (filters?.contentType) {
      filteredTemplates = filteredTemplates.filter(t => t.contentType.includes(filters.contentType!));
    }

    if (filters?.isPublic !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isPublic === filters.isPublic);
    }

    if (filters?.tags && filters.tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    return filteredTemplates;
  }

  getTemplateCategories(): string[] {
    return this.templateCategories;
  }
}

export const contentTemplatesService = new ContentTemplatesService();
