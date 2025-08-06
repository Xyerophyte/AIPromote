'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Search, Book, MessageCircle, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'getting-started' | 'content' | 'scheduling' | 'analytics' | 'billing' | 'troubleshooting';
  tags: string[];
  searchTerms: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  lastUpdated: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started-basics',
    title: 'Getting Started with AIPromote',
    description: 'Learn the basics of setting up your account and creating your first startup profile.',
    content: `
# Getting Started with AIPromote

Welcome to AIPromote! This guide will walk you through the essential steps to get your marketing automation up and running.

## Step 1: Complete Your Startup Profile
1. Navigate to the **Intake Wizard**
2. Fill in your startup details:
   - Company name and description
   - Target audience information
   - Brand voice and guidelines
   - Marketing goals and KPIs
3. Upload your logo and key assets
4. Review and save your profile

## Step 2: Connect Your Social Media Accounts
1. Go to **Settings > Social Accounts**
2. Click "Connect" for each platform you want to use
3. Authorize AIPromote to access your accounts
4. Test the connection to ensure it's working

## Step 3: Generate Your First Strategy
1. Click "Generate Strategy" from your dashboard
2. Review the AI-generated marketing plan
3. Make any necessary adjustments
4. Approve the strategy to start content generation

## Step 4: Review and Approve Content
1. Navigate to the **Content Library**
2. Review the generated posts
3. Edit any content that needs adjustment
4. Approve posts for scheduling

## What's Next?
- Set up your posting schedule
- Monitor your analytics
- Optimize based on performance data

Need help? Contact our support team or check out our video tutorials!
    `,
    category: 'getting-started',
    tags: ['basics', 'setup', 'onboarding'],
    searchTerms: ['getting started', 'setup', 'first time', 'begin', 'start', 'new user'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    lastUpdated: '2025-01-15',
  },
  {
    id: 'content-generation-guide',
    title: 'Understanding Content Generation',
    description: 'Learn how AIPromote creates and optimizes content for your social media platforms.',
    content: `
# Understanding Content Generation

AIPromote uses advanced AI to create platform-optimized content that aligns with your brand and resonates with your audience.

## How Content Generation Works

### 1. Strategy-Driven Creation
- Content is based on your approved marketing strategy
- Each post aligns with specific content pillars
- Platform optimization ensures maximum engagement

### 2. Brand Voice Consistency
- AI learns from your brand guidelines
- Maintains consistent tone across all content
- Respects forbidden phrases and compliance requirements

### 3. Platform Optimization
Each platform has specific requirements:
- **Twitter**: 280 character limit, 1-5 hashtags
- **LinkedIn**: 3000 character limit, 3-10 hashtags
- **Instagram**: 2200 characters, 5-30 hashtags

## Content Types

### Single Posts
Stand-alone messages optimized for engagement and reach.

### Thread Series
Multi-post narratives that tell a complete story or provide detailed information.

### Weekly Series
Recurring themed content like "Tutorial Tuesday" or "Feature Friday".

### Campaign Content
Coordinated messaging for product launches or special events.

## Quality Control

### AI Brand Safety
- Automatic filtering for inappropriate content
- Brand guideline enforcement
- Compliance checking

### Manual Review
- Performance claims require approval
- Sensitive topics are flagged
- New product announcements need review

## Tips for Better Content
1. Provide detailed brand guidelines
2. Include specific industry terminology
3. Upload reference content examples
4. Set clear content objectives
5. Regularly update your brand voice settings

## Troubleshooting
If content doesn't match your expectations:
1. Update your brand guidelines
2. Provide more specific prompts
3. Use the feedback system to improve AI
4. Contact support for personalized assistance
    `,
    category: 'content',
    tags: ['content', 'generation', 'AI', 'optimization'],
    searchTerms: ['content generation', 'AI content', 'posts', 'writing', 'create content'],
    difficulty: 'intermediate',
    estimatedReadTime: 8,
    lastUpdated: '2025-01-15',
  },
  // Add more articles...
];

const FAQS: FAQ[] = [
  {
    id: 'pricing-plans',
    question: 'What are the differences between Free and Pro plans?',
    answer: 'Free plan includes 1 startup, 20 posts/month, and access to Twitter & LinkedIn. Pro plan includes 3 startups, 200 posts/month, all platforms, auto-publishing, extended analytics, and priority support.',
    category: 'billing',
    helpfulCount: 42,
  },
  {
    id: 'content-approval',
    question: 'How do I approve content before it gets published?',
    answer: 'Go to Content Library, review posts marked "Draft" or "Under Review", make any edits needed, then click "Approve" for each post you want to schedule.',
    category: 'content',
    helpfulCount: 38,
  },
  {
    id: 'connect-social-accounts',
    question: 'Why can\'t I connect my social media accounts?',
    answer: 'Ensure you have admin access to the social accounts you\'re trying to connect. Check that third-party app permissions are enabled in your social media settings.',
    category: 'troubleshooting',
    helpfulCount: 29,
  },
  // Add more FAQs...
];

const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'onboarding-walkthrough',
    title: 'Complete Onboarding Walkthrough',
    description: 'A step-by-step guide through the entire AIPromote setup process.',
    duration: '12:34',
    thumbnail: '/images/tutorials/onboarding-thumb.jpg',
    videoUrl: '/videos/onboarding-walkthrough.mp4',
    category: 'getting-started',
    difficulty: 'beginner',
  },
  {
    id: 'content-optimization',
    title: 'Content Optimization Best Practices',
    description: 'Learn how to optimize your content strategy for better engagement.',
    duration: '8:45',
    thumbnail: '/images/tutorials/content-optimization-thumb.jpg',
    videoUrl: '/videos/content-optimization.mp4',
    category: 'content',
    difficulty: 'intermediate',
  },
  // Add more video tutorials...
];

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // Current page/context for contextual help
}

export function HelpSystem({ isOpen, onClose, context }: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>(HELP_ARTICLES);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>(FAQS);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [activeTab, setActiveTab] = useState('articles');

  // Filter content based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(HELP_ARTICLES);
      setFilteredFAQs(FAQS);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const articles = HELP_ARTICLES.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query)) ||
      article.searchTerms.some(term => term.toLowerCase().includes(query))
    );
    
    const faqs = FAQS.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    );

    setFilteredArticles(articles);
    setFilteredFAQs(faqs);
  }, [searchQuery]);

  // Show contextual help based on current page
  useEffect(() => {
    if (context && isOpen) {
      const contextualArticle = HELP_ARTICLES.find(article =>
        article.searchTerms.some(term => term.includes(context.toLowerCase()))
      );
      if (contextualArticle) {
        setSelectedArticle(contextualArticle);
        setActiveTab('articles');
      }
    }
  }, [context, isOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return '🚀';
      case 'content': return '✍️';
      case 'scheduling': return '📅';
      case 'analytics': return '📊';
      case 'billing': return '💳';
      case 'troubleshooting': return '🔧';
      default: return '📖';
    }
  };

  const getDifficultyColor = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Help Center</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Article List */}
          <div className="w-1/3 border-r flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-3 m-4">
                <TabsTrigger value="articles" className="text-xs">
                  <Book className="h-3 w-3 mr-1" />
                  Articles
                </TabsTrigger>
                <TabsTrigger value="faqs" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  FAQs
                </TabsTrigger>
                <TabsTrigger value="videos" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Videos
                </TabsTrigger>
              </TabsList>

              {/* Articles Tab */}
              <TabsContent value="articles" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {filteredArticles.map((article) => (
                      <Card
                        key={article.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedArticle?.id === article.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium line-clamp-2">
                                {getCategoryIcon(article.category)} {article.title}
                              </CardTitle>
                              <CardDescription className="text-xs line-clamp-2 mt-1">
                                {article.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <Badge className={getDifficultyColor(article.difficulty)} variant="secondary">
                              {article.difficulty}
                            </Badge>
                            <span>{article.estimatedReadTime} min read</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* FAQs Tab */}
              <TabsContent value="faqs" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {filteredFAQs.map((faq) => (
                      <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            {faq.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">{faq.answer}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <Badge variant="outline">{faq.category}</Badge>
                            <span>{faq.helpfulCount} found this helpful</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {VIDEO_TUTORIALS.map((video) => (
                      <Card key={video.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex space-x-3">
                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Video className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium line-clamp-1">
                                {video.title}
                              </CardTitle>
                              <CardDescription className="text-xs line-clamp-2 mt-1">
                                {video.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <Badge className={getDifficultyColor(video.difficulty)} variant="secondary">
                              {video.difficulty}
                            </Badge>
                            <span>{video.duration}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedArticle ? (
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">
                        {getCategoryIcon(selectedArticle.category)} {selectedArticle.title}
                      </h1>
                      <p className="text-gray-600 mb-3">{selectedArticle.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <Badge className={getDifficultyColor(selectedArticle.difficulty)} variant="secondary">
                          {selectedArticle.difficulty}
                        </Badge>
                        <span>{selectedArticle.estimatedReadTime} min read</span>
                        <span>Updated {selectedArticle.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-6 prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br />') }} />
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Help Center</h3>
                  <p className="text-gray-600 mb-6">
                    Select an article from the sidebar to get started, or search for specific topics.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>🚀 Get started with onboarding guides</p>
                    <p>✍️ Learn about content creation</p>
                    <p>📊 Understand your analytics</p>
                    <p>💳 Manage billing and subscriptions</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Can't find what you're looking for?
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact Support
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Full Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Help trigger button component
export function HelpTrigger({ context }: { context?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-gray-700"
        title="Get Help"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      
      <HelpSystem
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
}

export default HelpSystem;
