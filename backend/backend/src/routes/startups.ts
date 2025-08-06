import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Validation schemas (matching frontend)
const StartupBasicsSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  tagline: z.string().min(10),
  description: z.string().min(50),
  category: z.string().min(1),
  stage: z.enum(["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]),
  pricing: z.string().optional(),
  markets: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
})

const ICPSchema = z.object({
  personas: z.array(z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    company_size: z.string().min(1),
    industry: z.string().min(1),
    pain_points: z.array(z.string()).min(1),
    jobs_to_be_done: z.array(z.string()).min(1),
  })).min(1),
  priority_segments: z.array(z.string()).min(1),
})

const PositioningSchema = z.object({
  usp: z.string().min(20),
  differentiators: z.array(z.string()).min(2),
  proof_points: z.array(z.object({
    type: z.enum(["metric", "customer", "award", "press", "other"]),
    description: z.string().min(5),
    value: z.string().optional(),
  })).min(1),
  competitors: z.array(z.object({
    name: z.string().min(1),
    positioning: z.string().min(10),
  })).min(1),
})

const BrandSchema = z.object({
  tone: z.enum(["professional", "casual", "friendly", "authoritative", "playful", "technical"]),
  voice_description: z.string().min(20),
  allowed_phrases: z.array(z.string()).optional(),
  forbidden_phrases: z.array(z.string()).optional(),
  example_content: z.string().min(50),
  compliance_notes: z.string().optional(),
})

const GoalsSchema = z.object({
  primary_goal: z.enum(["awareness", "leads", "signups", "demos", "sales"]),
  target_platforms: z.array(z.enum(["x", "linkedin", "instagram", "tiktok", "youtube", "reddit"])).min(1),
  posting_frequency: z.enum(["daily", "3x-week", "weekly", "biweekly"]),
  kpis: z.array(z.object({
    metric: z.string().min(1),
    target: z.string().min(1),
    timeframe: z.string().min(1),
  })).min(1),
})

const AssetsSchema = z.object({
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
  blog_links: z.array(z.string().url()).optional(),
})

const CompleteIntakeSchema = z.object({
  startupBasics: StartupBasicsSchema,
  icp: ICPSchema,
  positioning: PositioningSchema,
  brand: BrandSchema,
  goals: GoalsSchema,
  assets: AssetsSchema,
})

const plugin: FastifyPluginAsync = async (fastify) => {
  // Get all startups for a user
  fastify.get('/startups', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      
      const startups = await prisma.startup.findMany({
        where: { userId },
        include: {
          brandRules: true,
          assets: true,
          strategyDocs: {
            where: { status: 'active' }
          }
        }
      })

      return { startups }
    } catch (error) {
      fastify.log.error('Error fetching startups:', error)
      return reply.status(500).send({ error: 'Failed to fetch startups' })
    }
  })

  // Create new startup
  fastify.post('/startups', {
    preHandler: [fastify.authenticate],
    schema: {
      body: CompleteIntakeSchema
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const intakeData = request.body as z.infer<typeof CompleteIntakeSchema>

      // Create startup with transaction
      const startup = await prisma.$transaction(async (tx) => {
        // Create startup
        const newStartup = await tx.startup.create({
          data: {
            userId,
            name: intakeData.startupBasics.name,
            url: intakeData.startupBasics.url || null,
            tagline: intakeData.startupBasics.tagline,
            description: intakeData.startupBasics.description,
            category: intakeData.startupBasics.category,
            stage: intakeData.startupBasics.stage,
            pricing: intakeData.startupBasics.pricing || null,
            markets: intakeData.startupBasics.markets,
            languages: intakeData.startupBasics.languages,
          }
        })

        // Create brand rules
        await tx.brandRule.create({
          data: {
            startupId: newStartup.id,
            tone: intakeData.brand.tone,
            allowedPhrases: intakeData.brand.allowed_phrases || [],
            forbiddenPhrases: intakeData.brand.forbidden_phrases || [],
            complianceNotes: intakeData.brand.compliance_notes || null,
          }
        })

        // Create assets
        const allAssets = [
          ...(intakeData.assets.logo || []).map(asset => ({
            ...asset,
            type: 'logo' as const,
            s3Key: extractS3KeyFromUrl(asset.url),
            mime: asset.type,
            size: asset.size,
            startupId: newStartup.id
          })),
          ...(intakeData.assets.screenshots || []).map(asset => ({
            ...asset,
            type: 'screenshot' as const,
            s3Key: extractS3KeyFromUrl(asset.url),
            mime: asset.type,
            size: asset.size,
            startupId: newStartup.id
          })),
          ...(intakeData.assets.demo_videos || []).map(asset => ({
            ...asset,
            type: 'video' as const,
            s3Key: extractS3KeyFromUrl(asset.url),
            mime: asset.type,
            size: asset.size,
            startupId: newStartup.id
          })),
          ...(intakeData.assets.case_studies || []).map(asset => ({
            ...asset,
            type: 'case_study' as const,
            s3Key: extractS3KeyFromUrl(asset.url),
            mime: asset.type,
            size: asset.size,
            startupId: newStartup.id
          })),
          ...(intakeData.assets.pitch_deck || []).map(asset => ({
            ...asset,
            type: 'pitch_deck' as const,
            s3Key: extractS3KeyFromUrl(asset.url),
            mime: asset.type,
            size: asset.size,
            startupId: newStartup.id
          })),
        ]

        if (allAssets.length > 0) {
          await tx.asset.createMany({
            data: allAssets
          })
        }

        // Store complete intake data as strategy document
        await tx.strategyDoc.create({
          data: {
            startupId: newStartup.id,
            contentJson: intakeData,
            status: 'active'
          }
        })

        return newStartup
      })

      // TODO: Queue background job to generate initial strategy
      // await fastify.jobQueue.add('generateInitialStrategy', {
      //   startupId: startup.id,
      //   intakeData
      // })

      return { 
        startup,
        message: 'Startup created successfully. Generating initial marketing strategy...'
      }

    } catch (error) {
      fastify.log.error('Error creating startup:', error)
      return reply.status(500).send({ error: 'Failed to create startup' })
    }
  })

  // Save draft
  fastify.post('/startups/:id/intake-draft', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const startupId = (request.params as any).id
      const draftData = request.body

      // Verify ownership
      const startup = await prisma.startup.findFirst({
        where: { id: startupId, userId }
      })

      if (!startup) {
        return reply.status(404).send({ error: 'Startup not found' })
      }

      // Save as draft strategy document
      await prisma.strategyDoc.upsert({
        where: {
          startupId_status: {
            startupId,
            status: 'draft'
          }
        },
        create: {
          startupId,
          contentJson: draftData,
          status: 'draft'
        },
        update: {
          contentJson: draftData,
        }
      })

      return { success: true }

    } catch (error) {
      fastify.log.error('Error saving draft:', error)
      return reply.status(500).send({ error: 'Failed to save draft' })
    }
  })

  // Load draft
  fastify.get('/startups/:id/intake-draft', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const startupId = (request.params as any).id

      // Verify ownership
      const startup = await prisma.startup.findFirst({
        where: { id: startupId, userId }
      })

      if (!startup) {
        return reply.status(404).send({ error: 'Startup not found' })
      }

      // Get draft
      const draft = await prisma.strategyDoc.findFirst({
        where: {
          startupId,
          status: 'draft'
        }
      })

      if (!draft) {
        return reply.status(404).send({ error: 'No draft found' })
      }

      return draft.contentJson

    } catch (error) {
      fastify.log.error('Error loading draft:', error)
      return reply.status(500).send({ error: 'Failed to load draft' })
    }
  })

  // Update existing startup
  fastify.put('/startups/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: CompleteIntakeSchema
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id
      const startupId = (request.params as any).id
      const intakeData = request.body as z.infer<typeof CompleteIntakeSchema>

      // Verify ownership
      const existingStartup = await prisma.startup.findFirst({
        where: { id: startupId, userId }
      })

      if (!existingStartup) {
        return reply.status(404).send({ error: 'Startup not found' })
      }

      // Update with transaction
      const startup = await prisma.$transaction(async (tx) => {
        // Update startup
        const updatedStartup = await tx.startup.update({
          where: { id: startupId },
          data: {
            name: intakeData.startupBasics.name,
            url: intakeData.startupBasics.url || null,
            tagline: intakeData.startupBasics.tagline,
            description: intakeData.startupBasics.description,
            category: intakeData.startupBasics.category,
            stage: intakeData.startupBasics.stage,
            pricing: intakeData.startupBasics.pricing || null,
            markets: intakeData.startupBasics.markets,
            languages: intakeData.startupBasics.languages,
          }
        })

        // Update brand rules
        await tx.brandRule.upsert({
          where: { startupId },
          create: {
            startupId,
            tone: intakeData.brand.tone,
            allowedPhrases: intakeData.brand.allowed_phrases || [],
            forbiddenPhrases: intakeData.brand.forbidden_phrases || [],
            complianceNotes: intakeData.brand.compliance_notes || null,
          },
          update: {
            tone: intakeData.brand.tone,
            allowedPhrases: intakeData.brand.allowed_phrases || [],
            forbiddenPhrases: intakeData.brand.forbidden_phrases || [],
            complianceNotes: intakeData.brand.compliance_notes || null,
          }
        })

        // Create new strategy document version
        await tx.strategyDoc.create({
          data: {
            startupId,
            contentJson: intakeData,
            status: 'active',
            version: await getNextVersion(startupId, tx)
          }
        })

        return updatedStartup
      })

      return { 
        startup,
        message: 'Startup updated successfully'
      }

    } catch (error) {
      fastify.log.error('Error updating startup:', error)
      return reply.status(500).send({ error: 'Failed to update startup' })
    }
  })
}

// Helper functions
function extractS3KeyFromUrl(url: string): string {
  const urlParts = url.split('/')
  return urlParts.slice(-2).join('/') // Get the last two parts (type/filename)
}

async function getNextVersion(startupId: string, tx: any): Promise<number> {
  const latest = await tx.strategyDoc.findFirst({
    where: { startupId },
    orderBy: { version: 'desc' }
  })
  return (latest?.version || 0) + 1
}

export default plugin
