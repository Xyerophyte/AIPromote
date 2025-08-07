-- AI Promote Hub - Clean Supabase Database Setup
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
  company_name text,
  industry text,
  company_size text CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise')),
  subscription_ends_at timestamp with time zone,
  monthly_content_generated integer DEFAULT 0,
  monthly_api_calls integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content campaigns table
CREATE TABLE public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  industry text NOT NULL,
  target_audience text NOT NULL,
  brand_voice text DEFAULT 'professional' CHECK (brand_voice IN ('professional', 'casual', 'friendly', 'authoritative', 'playful')),
  platforms text[] DEFAULT '{}',
  content_types text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Generated content table
CREATE TABLE public.generated_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_body text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  content_type text NOT NULL CHECK (content_type IN ('post', 'thread', 'story', 'video_script', 'carousel', 'reel')),
  prompt_used text,
  ai_model text DEFAULT 'gpt-4',
  generation_settings jsonb DEFAULT '{}',
  word_count integer,
  character_count integer,
  hashtags text[],
  mentions text[],
  engagement_rate decimal,
  likes_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'archived')),
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content performance analytics
CREATE TABLE public.content_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid REFERENCES public.generated_content(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  engagements integer DEFAULT 0,
  clicks integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  engagement_rate decimal,
  click_through_rate decimal,
  date_tracked date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User usage analytics
CREATE TABLE public.usage_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content_generated integer DEFAULT 0,
  api_calls_made integer DEFAULT 0,
  tokens_used integer DEFAULT 0,
  campaigns_created integer DEFAULT 0,
  templates_used integer DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Content templates
CREATE TABLE public.content_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template_body text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'universal')),
  content_type text NOT NULL,
  industry text,
  use_case text,
  usage_count integer DEFAULT 0,
  average_rating decimal,
  is_public boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Social media account connections
CREATE TABLE public.social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  account_name text NOT NULL,
  account_id text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  profile_picture_url text,
  follower_count integer,
  following_count integer,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, platform, account_id)
);

-- API usage tracking
CREATE TABLE public.api_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  tokens_used integer DEFAULT 0,
  processing_time_ms integer,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_role_idx ON public.users(role);
CREATE INDEX campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX generated_content_user_id_idx ON public.generated_content(user_id);
CREATE INDEX generated_content_platform_idx ON public.generated_content(platform);
CREATE INDEX content_analytics_content_id_idx ON public.content_analytics(content_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content" ON public.generated_content
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.content_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON public.content_templates
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON public.content_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own API usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON public.generated_content
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default content templates
INSERT INTO public.content_templates (name, description, template_body, platform, content_type, is_public, is_featured) VALUES
('Twitter Thread Starter', 'Engaging Twitter thread opener', 'THREAD: {topic}

Here is what most people get wrong about {subject}:

1/ {point_1}', 'twitter', 'thread', true, true),
('LinkedIn Professional Post', 'Professional LinkedIn content', '{insight_about_industry}

After {years} years in {industry}, I have learned that {key_lesson}.

Here is what changed everything:

- {point_1}
- {point_2}
- {point_3}

What is your experience with {topic}?', 'linkedin', 'post', true, true),
('Instagram Story Hook', 'Attention-grabbing story opener', 'POV: You just discovered {surprising_fact}

Swipe to see why this changes everything', 'instagram', 'story', true, true),
('Facebook Engagement Post', 'Facebook post for high engagement', 'Quick question for my network:

{question_about_topic}

I am curious because {reason_for_asking}.

Drop your thoughts in the comments!', 'facebook', 'post', true, true);

COMMIT;
