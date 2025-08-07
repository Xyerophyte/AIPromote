-- AI Promote Hub - Supabase Database Setup
-- This script sets up the complete database schema for your AI Promote application

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- USERS AND AUTHENTICATION
-- =============================================================================

-- Create custom users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'premium')),
  
  -- Profile information
  company_name text,
  industry text,
  company_size text check (company_size in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  
  -- Subscription info
  subscription_status text default 'free' check (subscription_status in ('free', 'pro', 'enterprise')),
  subscription_ends_at timestamp with time zone,
  
  -- Usage tracking
  monthly_content_generated integer default 0,
  monthly_api_calls integer default 0,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- CONTENT MANAGEMENT
-- =============================================================================

-- Content campaigns table
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Campaign details
  name text not null,
  description text,
  industry text not null,
  target_audience text not null,
  brand_voice text default 'professional' check (brand_voice in ('professional', 'casual', 'friendly', 'authoritative', 'playful')),
  
  -- Settings
  platforms text[] default '{}', -- ['twitter', 'linkedin', 'facebook', 'instagram']
  content_types text[] default '{}', -- ['post', 'thread', 'story', 'video_script']
  
  -- Status
  status text default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generated content table
create table public.generated_content (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  
  -- Content details
  title text not null,
  content_body text not null,
  platform text not null check (platform in ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  content_type text not null check (content_type in ('post', 'thread', 'story', 'video_script', 'carousel', 'reel')),
  
  -- AI generation info
  prompt_used text,
  ai_model text default 'gpt-4',
  generation_settings jsonb default '{}',
  
  -- Content metadata
  word_count integer,
  character_count integer,
  hashtags text[],
  mentions text[],
  
  -- Performance tracking
  engagement_rate decimal,
  likes_count integer default 0,
  shares_count integer default 0,
  comments_count integer default 0,
  
  -- Status and scheduling
  status text default 'draft' check (status in ('draft', 'approved', 'scheduled', 'published', 'archived')),
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- ANALYTICS AND TRACKING
-- =============================================================================

-- Content performance analytics
create table public.content_analytics (
  id uuid default gen_random_uuid() primary key,
  content_id uuid references public.generated_content(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Platform metrics
  platform text not null,
  impressions integer default 0,
  reach integer default 0,
  engagements integer default 0,
  clicks integer default 0,
  
  -- Engagement details
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  
  -- Calculated metrics
  engagement_rate decimal,
  click_through_rate decimal,
  
  -- Tracking period
  date_tracked date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User usage analytics
create table public.usage_analytics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Usage metrics
  content_generated integer default 0,
  api_calls_made integer default 0,
  tokens_used integer default 0,
  
  -- Feature usage
  campaigns_created integer default 0,
  templates_used integer default 0,
  
  -- Time period
  month integer not null,
  year integer not null,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one record per user per month
  unique(user_id, month, year)
);

-- =============================================================================
-- TEMPLATES AND PROMPTS
-- =============================================================================

-- Content templates
create table public.content_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  
  -- Template details
  name text not null,
  description text,
  template_body text not null,
  
  -- Template metadata
  platform text not null check (platform in ('twitter', 'linkedin', 'facebook', 'instagram', 'universal')),
  content_type text not null,
  industry text,
  use_case text,
  
  -- Usage and performance
  usage_count integer default 0,
  average_rating decimal,
  
  -- Sharing and visibility
  is_public boolean default false,
  is_featured boolean default false,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- INTEGRATIONS
-- =============================================================================

-- Social media account connections
create table public.social_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Account details
  platform text not null check (platform in ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  account_name text not null,
  account_id text not null,
  
  -- Authentication
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  
  -- Account metadata
  profile_picture_url text,
  follower_count integer,
  following_count integer,
  
  -- Status
  is_active boolean default true,
  last_sync_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one connection per platform per user
  unique(user_id, platform, account_id)
);

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

-- Audit log for tracking important actions
create table public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  
  -- Action details
  action text not null,
  resource_type text not null,
  resource_id uuid,
  
  -- Context
  ip_address inet,
  user_agent text,
  
  -- Metadata
  old_values jsonb,
  new_values jsonb,
  
  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API usage tracking
create table public.api_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Request details
  endpoint text not null,
  method text not null,
  status_code integer not null,
  
  -- Usage metrics
  tokens_used integer default 0,
  processing_time_ms integer,
  
  -- Request context
  ip_address inet,
  user_agent text,
  
  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User indexes
create index users_email_idx on public.users(email);
create index users_role_idx on public.users(role);
create index users_subscription_status_idx on public.users(subscription_status);

-- Campaign indexes
create index campaigns_user_id_idx on public.campaigns(user_id);
create index campaigns_status_idx on public.campaigns(status);

-- Content indexes
create index generated_content_user_id_idx on public.generated_content(user_id);
create index generated_content_campaign_id_idx on public.generated_content(campaign_id);
create index generated_content_platform_idx on public.generated_content(platform);
create index generated_content_status_idx on public.generated_content(status);
create index generated_content_created_at_idx on public.generated_content(created_at);

-- Analytics indexes
create index content_analytics_content_id_idx on public.content_analytics(content_id);
create index content_analytics_date_tracked_idx on public.content_analytics(date_tracked);
create index usage_analytics_user_id_month_year_idx on public.usage_analytics(user_id, month, year);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.campaigns enable row level security;
alter table public.generated_content enable row level security;
alter table public.content_analytics enable row level security;
alter table public.usage_analytics enable row level security;
alter table public.content_templates enable row level security;
alter table public.social_accounts enable row level security;
alter table public.audit_log enable row level security;
alter table public.api_usage enable row level security;

-- Users can only see and edit their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Campaigns: Users can only access their own campaigns
create policy "Users can manage own campaigns" on public.campaigns
  for all using (auth.uid() = user_id);

-- Generated content: Users can only access their own content
create policy "Users can manage own content" on public.generated_content
  for all using (auth.uid() = user_id);

-- Content analytics: Users can only see their own analytics
create policy "Users can view own analytics" on public.content_analytics
  for select using (auth.uid() = user_id);

-- Usage analytics: Users can only see their own usage
create policy "Users can view own usage" on public.usage_analytics
  for select using (auth.uid() = user_id);

-- Content templates: Users can see public templates and manage their own
create policy "Users can view public templates" on public.content_templates
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can manage own templates" on public.content_templates
  for all using (auth.uid() = user_id);

-- Social accounts: Users can only manage their own accounts
create policy "Users can manage own social accounts" on public.social_accounts
  for all using (auth.uid() = user_id);

-- API usage: Users can only see their own usage
create policy "Users can view own API usage" on public.api_usage
  for select using (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to automatically update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to relevant tables
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute procedure public.handle_updated_at();

create trigger generated_content_updated_at
  before update on public.generated_content
  for each row execute procedure public.handle_updated_at();

create trigger content_templates_updated_at
  before update on public.content_templates
  for each row execute procedure public.handle_updated_at();

create trigger social_accounts_updated_at
  before update on public.social_accounts
  for each row execute procedure public.handle_updated_at();

-- Function to create user profile when auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile for new auth users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to track monthly usage
create or replace function public.increment_monthly_usage(
  user_uuid uuid,
  content_count integer default 1,
  api_calls integer default 1,
  tokens integer default 0
)
returns void as $$
declare
  current_month integer := extract(month from now());
  current_year integer := extract(year from now());
begin
  -- Insert or update monthly usage
  insert into public.usage_analytics (
    user_id, 
    month, 
    year, 
    content_generated, 
    api_calls_made, 
    tokens_used
  )
  values (
    user_uuid, 
    current_month, 
    current_year, 
    content_count, 
    api_calls, 
    tokens
  )
  on conflict (user_id, month, year)
  do update set
    content_generated = usage_analytics.content_generated + content_count,
    api_calls_made = usage_analytics.api_calls_made + api_calls,
    tokens_used = usage_analytics.tokens_used + tokens;
    
  -- Also update user's monthly counters
  update public.users 
  set 
    monthly_content_generated = monthly_content_generated + content_count,
    monthly_api_calls = monthly_api_calls + api_calls,
    updated_at = now()
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert some default content templates
insert into public.content_templates (name, description, template_body, platform, content_type, is_public, is_featured) values
('Twitter Thread Starter', 'Engaging Twitter thread opener', '🧵 THREAD: {topic}\n\nHere''s what most people get wrong about {subject}:\n\n1/ {point_1}', 'twitter', 'thread', true, true),
('LinkedIn Professional Post', 'Professional LinkedIn content', '💡 {insight_about_industry}\n\nAfter {years} years in {industry}, I''ve learned that {key_lesson}.\n\nHere''s what changed everything:\n\n➤ {point_1}\n➤ {point_2}\n➤ {point_3}\n\nWhat''s your experience with {topic}?', 'linkedin', 'post', true, true),
('Instagram Story Hook', 'Attention-grabbing story opener', 'POV: You just discovered {surprising_fact} 🤯\n\nSwipe to see why this changes everything ➡️', 'instagram', 'story', true, true),
('Facebook Engagement Post', 'Facebook post for high engagement', 'Quick question for my network:\n\n{question_about_topic} 🤔\n\nI''m curious because {reason_for_asking}.\n\nDrop your thoughts in the comments! 👇', 'facebook', 'post', true, true);

-- Insert sample campaign data (you can remove this after testing)
-- This is just for demonstration purposes

commit;
