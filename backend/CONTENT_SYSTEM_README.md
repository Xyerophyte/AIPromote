# Content Generation and Management System

This document describes the comprehensive content generation and management system built for the AI Promote platform. The system provides AI-powered content creation, template management, approval workflows, content library, hashtag research, and media attachment handling.

## 🚀 Features Overview

### 1. Content Generation Engine
- **Platform-specific optimization** for Twitter, LinkedIn, Instagram, TikTok, YouTube Shorts, Reddit, Facebook, and Threads
- **AI-powered content creation** using OpenAI GPT and Anthropic Claude
- **Multiple content variations** with different tones, styles, and approaches
- **Real-time content validation** against platform requirements
- **Smart hashtag and mention suggestions**
- **SEO and engagement optimization**

### 2. Content Templates
- **Pre-built templates** for different content types (educational, promotional, engagement, etc.)
- **Customizable template variables** with validation and examples
- **Platform-specific adaptations** and styling options
- **Template search and categorization**
- **Performance tracking** and usage analytics
- **Template duplication** and customization

### 3. Content Approval Workflow
- **Multi-step approval processes** with configurable workflows
- **Revision tracking** with change history and diff visualization
- **Collaborative review** with comments, suggestions, and feedback
- **Automated checks** for brand safety, quality, and compliance
- **Role-based permissions** and approval rights
- **Auto-approval conditions** based on content and user criteria

### 4. Content Library
- **Advanced search and filtering** with faceted navigation
- **Content organization** with tags, categories, and collections
- **Performance analytics** and usage tracking
- **Version control** and content history
- **Bulk operations** and content management tools
- **Analytics and insights** for content optimization

### 5. Hashtag Research and Optimization
- **AI-powered hashtag research** with trend analysis
- **Performance tracking** and optimization suggestions
- **Platform-specific recommendations** with volume and engagement data
- **Competitive analysis** and hashtag gap identification
- **Trending hashtag discovery** with real-time updates
- **Hashtag mix optimization** for maximum reach and engagement

### 6. Media Attachment System
- **Multi-platform media upload** with automatic optimization
- **Format validation** and conversion for different platforms
- **Image processing** with compression, resizing, and watermarking
- **Media library management** with search and filtering
- **Platform compliance checking** with automated suggestions
- **Usage tracking** and media analytics

## 🏗️ Architecture

### Services Layer
```
src/services/
├── content-generation.ts      # AI-powered content creation
├── content-templates.ts       # Template management and application
├── content-approval.ts        # Approval workflow and revision tracking
├── content-library.ts         # Content search and organization
├── hashtag-research.ts        # Hashtag analysis and optimization
└── media-attachment.ts        # Media upload and processing
```

### API Routes
```
src/routes/
└── content.ts                 # RESTful API endpoints for all content features
```

### Key Components

#### Content Generation Service
- Platform-specific optimization rules
- AI provider integration (OpenAI/Anthropic)
- Content validation and compliance checking
- Variation generation with different approaches

#### Template System
- Flexible template structure with variables and styling
- Platform adaptations and content type optimization
- Usage analytics and performance tracking
- Template search and discovery

#### Approval Workflow
- Configurable multi-step workflows
- Automated quality and brand safety checks
- Collaborative review with comments and suggestions
- Revision tracking with change visualization

#### Content Library
- Full-text search with faceted filtering
- Content organization and management
- Performance analytics and insights
- Usage tracking and optimization recommendations

#### Hashtag Research
- AI-powered hashtag discovery and analysis
- Trend monitoring and competitive analysis
- Performance optimization and mix recommendations
- Platform-specific hashtag strategies

#### Media Management
- Multi-format support with automatic optimization
- Platform compliance validation
- Image processing and variant generation
- Usage tracking and media analytics

## 📚 API Endpoints

### Content Generation
- `POST /api/v1/content/generate` - Generate AI-powered content
- `POST /api/v1/content/variations` - Create content variations
- `POST /api/v1/content/validate/:platform` - Validate content for platform

### Templates
- `GET /api/v1/content/templates` - List available templates
- `GET /api/v1/content/templates/:id` - Get template details
- `POST /api/v1/content/templates/apply` - Apply template with variables
- `GET /api/v1/content/templates/search` - Search templates
- `GET /api/v1/content/templates/categories` - Get template categories

### Content Approval
- `POST /api/v1/content/approval/request` - Create approval request
- `GET /api/v1/content/approval/requests` - List approval requests
- `POST /api/v1/content/approval/:id/process` - Process approval decision

### Content Library
- `GET /api/v1/content/library/search` - Search content library
- `GET /api/v1/content/library/analytics/:orgId` - Get library analytics
- `POST /api/v1/content/library/items` - Create library item
- `PUT /api/v1/content/library/items/:id` - Update library item

### Hashtag Research
- `POST /api/v1/content/hashtags/research` - Research hashtags for content
- `GET /api/v1/content/hashtags/analytics/:orgId` - Get hashtag analytics
- `GET /api/v1/content/hashtags/trending` - Get trending hashtags
- `POST /api/v1/content/hashtags/suggest` - Suggest hashtags for content

### Media Management
- `POST /api/v1/content/media/upload` - Upload and process media
- `POST /api/v1/content/media/:id/validate/:platform/:type` - Validate media
- `GET /api/v1/content/media/library` - Browse media library
- `PUT /api/v1/content/media/:id/metadata` - Update media metadata

### Platform Information
- `GET /api/v1/content/platforms` - List supported platforms
- `GET /api/v1/content/platforms/:platform/rules` - Get platform rules

## 🔧 Configuration

### Environment Variables
```bash
# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Media Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-media-bucket

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aipromotdb

# Redis for caching
REDIS_URL=redis://localhost:6379
```

### Platform Requirements
The system includes built-in platform requirements for:
- **Instagram**: Posts, Stories, Reels with specific dimensions and formats
- **Twitter**: Posts, Threads with character limits and media requirements
- **LinkedIn**: Professional content with business-focused optimization
- **TikTok**: Video content with vertical format requirements
- **YouTube Shorts**: Short-form video content specifications

## 🎯 Usage Examples

### Generate Content
```javascript
// Generate platform-optimized content
const content = await contentGenerationService.generateContent({
  organizationId: 'org_123',
  platform: 'LINKEDIN',
  contentType: 'POST',
  prompt: 'Share tips about remote work productivity',
  context: {
    targetAudience: 'Remote workers and managers',
    tone: 'professional yet approachable',
    objective: 'engagement',
    keywords: ['remote work', 'productivity', 'work from home']
  },
  variations: { count: 3, diversityLevel: 'medium' },
  optimization: {
    seo: true,
    engagement: true,
    brandSafety: true
  }
});
```

### Apply Template
```javascript
// Use a template to generate content
const result = await contentTemplatesService.applyTemplate({
  templateId: 'tpl_educational_001',
  variables: {
    topic: 'Email marketing',
    audience: 'startup founders',
    main_points: '• Segment your audience\n• Personalize subject lines\n• A/B test everything',
    key_insight: 'Personalization beats frequency every time',
    primary_hashtag: 'emailmarketing',
    industry: 'saas'
  },
  platform: 'LINKEDIN'
});
```

### Research Hashtags
```javascript
// Research optimal hashtags
const hashtags = await hashtagResearchService.researchHashtags({
  organizationId: 'org_123',
  platform: 'INSTAGRAM',
  content: 'Sharing our new AI-powered productivity tool',
  targetAudience: 'Entrepreneurs and small business owners',
  industry: 'SaaS',
  preferences: {
    includeNiche: true,
    includeTrending: true,
    excludeOverused: true
  }
});
```

### Content Approval Workflow
```javascript
// Create approval request
const approval = await contentApprovalService.createApprovalRequest({
  contentPieceId: 'content_456',
  workflowId: 'wf_default',
  organizationId: 'org_123',
  submitterId: 'user_789',
  priority: 'normal',
  metadata: {
    platform: 'LINKEDIN',
    contentType: 'POST'
  }
});
```

## 📊 Analytics and Insights

The system provides comprehensive analytics across all components:

- **Content performance** tracking and optimization suggestions
- **Template usage** statistics and effectiveness metrics  
- **Hashtag performance** analysis and trend identification
- **Approval workflow** efficiency and bottleneck analysis
- **Media usage** tracking and optimization opportunities
- **Cross-platform** performance comparisons

## 🔒 Security and Compliance

- **Content validation** against platform policies and brand guidelines
- **Brand safety** checks using AI-powered analysis
- **Media compliance** validation for usage rights and licenses
- **Access control** with role-based permissions
- **Audit trails** for all content operations and approvals
- **Data privacy** compliance with content encryption and secure storage

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** in `.env` file

3. **Set up database**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

The content system will be available at `http://localhost:3001/api/v1/content`

## 🔄 Future Enhancements

- **Multi-language support** for global content creation
- **Advanced AI models** integration for specialized content types
- **Real-time collaboration** features for team content creation
- **Advanced analytics** with predictive performance modeling
- **Integration marketplace** for third-party tools and platforms
- **Mobile SDK** for native app integration

This comprehensive content generation and management system provides everything needed for scalable, AI-powered content marketing operations.
