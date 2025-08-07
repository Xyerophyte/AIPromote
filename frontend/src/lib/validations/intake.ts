import { z } from "zod"

// Step 1: Startup Basics (Development-friendly version)
export const startupBasicsSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  stage: z.enum(["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]).optional(),
  pricing: z.string().optional(),
  markets: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // For development, allow empty form
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    // In production, enforce required fields
    return data.name && data.tagline && data.description && 
           data.category && data.stage && data.markets?.length && 
           data.languages?.length
  },
  {
    message: "Please fill in all required fields"
  }
)

// Production-ready schema (strict validation)
export const startupBasicsSchemaStrict = z.object({
  name: z.string().min(1, "Company name is required"),
  url: z.string().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Please enter a valid URL or leave empty" }
  ),
  tagline: z.string().min(10, "Tagline should be at least 10 characters"),
  description: z.string().min(50, "Description should be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  stage: z.enum(["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]).optional(),
  pricing: z.string().optional(),
  markets: z.array(z.string()).min(1, "Select at least one market"),
  languages: z.array(z.string()).min(1, "Select at least one language"),
})

// Step 2: ICP & Audience (Development-friendly)
export const icpSchema = z.object({
  personas: z.array(z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    company_size: z.string().optional(),
    industry: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    jobs_to_be_done: z.array(z.string()).optional(),
  })).optional(),
  priority_segments: z.array(z.string()).optional(),
})

// Step 3: Positioning & Differentiation (Development-friendly)
export const positioningSchema = z.object({
  usp: z.string().optional(),
  differentiators: z.array(z.string()).optional(),
  proof_points: z.array(z.object({
    type: z.enum(["metric", "customer", "award", "press", "other"]).optional(),
    description: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  competitors: z.array(z.object({
    name: z.string().optional(),
    positioning: z.string().optional(),
  })).optional(),
})

// Step 4: Brand & Voice (Development-friendly)
export const brandSchema = z.object({
  tone: z.enum(["professional", "casual", "friendly", "authoritative", "playful", "technical"]).optional(),
  voice_description: z.string().optional(),
  allowed_phrases: z.array(z.string()).optional(),
  forbidden_phrases: z.array(z.string()).optional(),
  example_content: z.string().optional(),
  compliance_notes: z.string().optional(),
})

// Step 5: Goals & KPIs (Development-friendly)
export const goalsSchema = z.object({
  primary_goal: z.enum(["awareness", "leads", "signups", "demos", "sales"]).optional(),
  target_platforms: z.array(z.enum(["x", "linkedin", "instagram", "tiktok", "youtube", "reddit"])).optional(),
  posting_frequency: z.enum(["daily", "3x-week", "weekly", "biweekly"]).optional(),
  kpis: z.array(z.object({
    metric: z.string().optional(),
    target: z.string().optional(),
    timeframe: z.string().optional(),
  })).optional(),
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
