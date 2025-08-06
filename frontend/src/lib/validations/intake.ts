import { z } from "zod"

// Step 1: Startup Basics
export const startupBasicsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  tagline: z.string().min(10, "Tagline should be at least 10 characters"),
  description: z.string().min(50, "Description should be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  stage: z.enum(["idea", "pre-seed", "seed", "series-a", "series-b", "growth"], {
    required_error: "Please select a stage",
  }),
  pricing: z.string().optional(),
  markets: z.array(z.string()).min(1, "Select at least one market"),
  languages: z.array(z.string()).min(1, "Select at least one language"),
})

// Step 2: ICP & Audience
export const icpSchema = z.object({
  personas: z.array(z.object({
    name: z.string().min(1, "Persona name is required"),
    title: z.string().min(1, "Job title is required"),
    company_size: z.string().min(1, "Company size is required"),
    industry: z.string().min(1, "Industry is required"),
    pain_points: z.array(z.string()).min(1, "Add at least one pain point"),
    jobs_to_be_done: z.array(z.string()).min(1, "Add at least one job to be done"),
  })).min(1, "Add at least one persona"),
  priority_segments: z.array(z.string()).min(1, "Select at least one priority segment"),
})

// Step 3: Positioning & Differentiation
export const positioningSchema = z.object({
  usp: z.string().min(20, "USP should be at least 20 characters"),
  differentiators: z.array(z.string()).min(2, "Add at least 2 differentiators"),
  proof_points: z.array(z.object({
    type: z.enum(["metric", "customer", "award", "press", "other"]),
    description: z.string().min(5, "Description is required"),
    value: z.string().optional(),
  })).min(1, "Add at least one proof point"),
  competitors: z.array(z.object({
    name: z.string().min(1, "Competitor name is required"),
    positioning: z.string().min(10, "How do you position against them?"),
  })).min(1, "Add at least one competitor"),
})

// Step 4: Brand & Voice
export const brandSchema = z.object({
  tone: z.enum(["professional", "casual", "friendly", "authoritative", "playful", "technical"], {
    required_error: "Select a tone",
  }),
  voice_description: z.string().min(20, "Voice description should be at least 20 characters"),
  allowed_phrases: z.array(z.string()).optional(),
  forbidden_phrases: z.array(z.string()).optional(),
  example_content: z.string().min(50, "Provide an example of your preferred content style"),
  compliance_notes: z.string().optional(),
})

// Step 5: Goals & KPIs
export const goalsSchema = z.object({
  primary_goal: z.enum(["awareness", "leads", "signups", "demos", "sales"], {
    required_error: "Select a primary goal",
  }),
  target_platforms: z.array(z.enum(["x", "linkedin", "instagram", "tiktok", "youtube", "reddit"])).min(1, "Select at least one platform"),
  posting_frequency: z.enum(["daily", "3x-week", "weekly", "biweekly"], {
    required_error: "Select posting frequency",
  }),
  kpis: z.array(z.object({
    metric: z.string().min(1, "Metric name is required"),
    target: z.string().min(1, "Target value is required"),
    timeframe: z.string().min(1, "Timeframe is required"),
  })).min(1, "Add at least one KPI"),
})

// Step 6: Assets & Resources
export const assetsSchema = z.object({
  logo: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  screenshots: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  demo_videos: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  case_studies: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  pitch_deck: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  blog_links: z.array(z.string().url("Invalid URL")).optional(),
})

// Complete form schema
export const completeIntakeSchema = z.object({
  startupBasics: startupBasicsSchema,
  icp: icpSchema,
  positioning: positioningSchema,
  brand: brandSchema,
  goals: goalsSchema,
  assets: assetsSchema,
})

// Types
export type StartupBasics = z.infer<typeof startupBasicsSchema>
export type ICP = z.infer<typeof icpSchema>
export type Positioning = z.infer<typeof positioningSchema>
export type Brand = z.infer<typeof brandSchema>
export type Goals = z.infer<typeof goalsSchema>
export type Assets = z.infer<typeof assetsSchema>
export type CompleteIntake = z.infer<typeof completeIntakeSchema>

// Form step enum
export enum IntakeStep {
  BASICS = 0,
  ICP = 1,
  POSITIONING = 2,
  BRAND = 3,
  GOALS = 4,
  ASSETS = 5,
}

export const INTAKE_STEPS = [
  { key: IntakeStep.BASICS, title: "Startup Basics", description: "Tell us about your company" },
  { key: IntakeStep.ICP, title: "Ideal Customer", description: "Define your target audience" },
  { key: IntakeStep.POSITIONING, title: "Positioning", description: "What makes you unique" },
  { key: IntakeStep.BRAND, title: "Brand Voice", description: "How you communicate" },
  { key: IntakeStep.GOALS, title: "Goals & KPIs", description: "What you want to achieve" },
  { key: IntakeStep.ASSETS, title: "Assets", description: "Upload your marketing materials" },
]
