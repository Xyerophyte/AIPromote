import {
  startupBasicsSchema,
  startupBasicsSchemaStrict,
  icpSchema,
  positioningSchema,
  brandSchema,
  goalsSchema,
  assetsSchema,
  completeIntakeSchema,
  IntakeStep,
  INTAKE_STEPS,
} from '../intake';

describe('Intake Validation Schemas', () => {
  describe('startupBasicsSchema', () => {
    it('should allow empty data in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = startupBasicsSchema.safeParse({});
      expect(result.success).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should validate optional fields correctly', () => {
      const validData = {
        name: 'Test Company',
        url: 'https://example.com',
        tagline: 'Amazing startup',
        description: 'We do great things',
        category: 'Technology',
        stage: 'seed' as const,
        pricing: 'Freemium',
        markets: ['US', 'Canada'],
        languages: ['English', 'French'],
      };

      const result = startupBasicsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid stage values', () => {
      const validStages = ['idea', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth'];

      validStages.forEach(stage => {
        const result = startupBasicsSchema.safeParse({ stage });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid stage values', () => {
      const result = startupBasicsSchema.safeParse({ stage: 'invalid-stage' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid enum value');
    });
  });

  describe('startupBasicsSchemaStrict', () => {
    it('should require company name', () => {
      const result = startupBasicsSchemaStrict.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(issue => issue.message === 'Company name is required')).toBe(true);
    });

    it('should validate URL format', () => {
      const invalidUrlResult = startupBasicsSchemaStrict.safeParse({
        name: 'Test',
        tagline: 'Test tagline here',
        description: 'A long enough description that meets the minimum character requirement',
        category: 'Tech',
        markets: ['US'],
        languages: ['English'],
        url: 'not-a-valid-url',
      });
      expect(invalidUrlResult.success).toBe(false);

      const validUrlResult = startupBasicsSchemaStrict.safeParse({
        name: 'Test',
        tagline: 'Test tagline here',
        description: 'A long enough description that meets the minimum character requirement',
        category: 'Tech',
        markets: ['US'],
        languages: ['English'],
        url: 'https://example.com',
      });
      expect(validUrlResult.success).toBe(true);
    });

    it('should validate minimum lengths', () => {
      const result = startupBasicsSchemaStrict.safeParse({
        name: 'Test',
        tagline: 'Short', // Too short
        description: 'Short', // Too short
        category: 'Tech',
        markets: ['US'],
        languages: ['English'],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some(issue => 
        issue.message.includes('at least 10 characters')
      )).toBe(true);
      expect(result.error?.issues.some(issue => 
        issue.message.includes('at least 50 characters')
      )).toBe(true);
    });

    it('should require at least one market and language', () => {
      const result = startupBasicsSchemaStrict.safeParse({
        name: 'Test Company',
        tagline: 'A great tagline here',
        description: 'A comprehensive description that definitely meets the minimum character requirements',
        category: 'Technology',
        markets: [],
        languages: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some(issue => 
        issue.message.includes('Select at least one market')
      )).toBe(true);
      expect(result.error?.issues.some(issue => 
        issue.message.includes('Select at least one language')
      )).toBe(true);
    });

    it('should pass with all valid required fields', () => {
      const validData = {
        name: 'Test Company',
        tagline: 'A revolutionary platform',
        description: 'We are building the next generation of AI-powered solutions that will transform how businesses operate',
        category: 'Technology',
        stage: 'seed' as const,
        markets: ['United States', 'Canada'],
        languages: ['English', 'French'],
      };

      const result = startupBasicsSchemaStrict.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('icpSchema', () => {
    it('should accept valid ICP data', () => {
      const validICP = {
        personas: [
          {
            name: 'Technical Founder',
            title: 'CTO',
            company_size: '10-50',
            industry: 'SaaS',
            pain_points: ['Scaling issues', 'Technical debt'],
            jobs_to_be_done: ['Build faster', 'Reduce bugs'],
          },
        ],
        priority_segments: ['Early-stage startups', 'SMBs'],
      };

      const result = icpSchema.safeParse(validICP);
      expect(result.success).toBe(true);
    });

    it('should handle empty/optional data', () => {
      const result = icpSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('positioningSchema', () => {
    it('should accept valid positioning data', () => {
      const validPositioning = {
        usp: 'AI-powered automation platform',
        differentiators: ['Real-time processing', '99.9% uptime', 'Easy integration'],
        proof_points: [
          {
            type: 'metric' as const,
            description: 'Processing speed improvement',
            value: '10x faster',
          },
          {
            type: 'customer' as const,
            description: 'Enterprise client testimonial',
            value: 'Increased efficiency by 50%',
          },
        ],
        competitors: [
          {
            name: 'Competitor A',
            positioning: 'Legacy solution provider',
          },
        ],
      };

      const result = positioningSchema.safeParse(validPositioning);
      expect(result.success).toBe(true);
    });

    it('should validate proof point types', () => {
      const invalidProofPoint = {
        proof_points: [
          {
            type: 'invalid-type',
            description: 'Test',
            value: 'Test',
          },
        ],
      };

      const result = positioningSchema.safeParse(invalidProofPoint);
      expect(result.success).toBe(false);
    });
  });

  describe('brandSchema', () => {
    it('should accept valid brand data', () => {
      const validBrand = {
        tone: 'professional' as const,
        voice_description: 'Authoritative yet approachable',
        allowed_phrases: ['innovative solution', 'cutting-edge technology'],
        forbidden_phrases: ['disruptive', 'game-changer'],
        example_content: 'Our platform helps businesses automate their workflows efficiently.',
        compliance_notes: 'Ensure all claims are substantiated',
      };

      const result = brandSchema.safeParse(validBrand);
      expect(result.success).toBe(true);
    });

    it('should validate tone options', () => {
      const validTones = ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'technical'];

      validTones.forEach(tone => {
        const result = brandSchema.safeParse({ tone });
        expect(result.success).toBe(true);
      });

      const invalidTone = brandSchema.safeParse({ tone: 'invalid' });
      expect(invalidTone.success).toBe(false);
    });
  });

  describe('goalsSchema', () => {
    it('should accept valid goals data', () => {
      const validGoals = {
        primary_goal: 'leads' as const,
        target_platforms: ['x', 'linkedin'] as const,
        posting_frequency: 'daily' as const,
        kpis: [
          {
            metric: 'Lead generation',
            target: '100 leads/month',
            timeframe: '3 months',
          },
          {
            metric: 'Engagement rate',
            target: '5%',
            timeframe: '1 month',
          },
        ],
      };

      const result = goalsSchema.safeParse(validGoals);
      expect(result.success).toBe(true);
    });

    it('should validate platform options', () => {
      const validPlatforms = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'reddit'];

      const result = goalsSchema.safeParse({
        target_platforms: validPlatforms,
      });
      expect(result.success).toBe(true);

      const invalidPlatform = goalsSchema.safeParse({
        target_platforms: ['invalid-platform'],
      });
      expect(invalidPlatform.success).toBe(false);
    });
  });

  describe('assetsSchema', () => {
    it('should accept valid asset data', () => {
      const validAssets = {
        logo: [
          {
            name: 'logo.png',
            size: 1024,
            type: 'image/png',
            url: 'https://example.com/logo.png',
          },
        ],
        screenshots: [
          {
            name: 'screenshot1.jpg',
            size: 2048,
            type: 'image/jpeg',
            url: 'https://example.com/screenshot1.jpg',
          },
        ],
        blog_links: [
          'https://example.com/blog/post1',
          'https://example.com/blog/post2',
        ],
      };

      const result = assetsSchema.safeParse(validAssets);
      expect(result.success).toBe(true);
    });

    it('should validate blog URL formats', () => {
      const invalidUrls = assetsSchema.safeParse({
        blog_links: ['not-a-url', 'also-invalid'],
      });
      expect(invalidUrls.success).toBe(false);

      const validUrls = assetsSchema.safeParse({
        blog_links: ['https://example.com/blog', 'http://blog.example.com'],
      });
      expect(validUrls.success).toBe(true);
    });
  });

  describe('completeIntakeSchema', () => {
    it('should validate complete intake form', () => {
      const completeForm = {
        startupBasics: {
          name: 'Test Company',
          tagline: 'Great product',
          description: 'We make things',
        },
        icp: {
          personas: [],
        },
        positioning: {
          usp: 'Best in class',
        },
        brand: {
          tone: 'professional' as const,
        },
        goals: {
          primary_goal: 'leads' as const,
        },
        assets: {
          logo: [],
        },
      };

      const result = completeIntakeSchema.safeParse(completeForm);
      expect(result.success).toBe(true);
    });
  });

  describe('IntakeStep enum and constants', () => {
    it('should have correct step values', () => {
      expect(IntakeStep.BASICS).toBe(0);
      expect(IntakeStep.ICP).toBe(1);
      expect(IntakeStep.POSITIONING).toBe(2);
      expect(IntakeStep.BRAND).toBe(3);
      expect(IntakeStep.GOALS).toBe(4);
      expect(IntakeStep.ASSETS).toBe(5);
    });

    it('should have correct INTAKE_STEPS array', () => {
      expect(INTAKE_STEPS).toHaveLength(6);
      expect(INTAKE_STEPS[0]).toEqual({
        key: IntakeStep.BASICS,
        title: 'Startup Basics',
        description: 'Tell us about your company',
      });
      expect(INTAKE_STEPS[5]).toEqual({
        key: IntakeStep.ASSETS,
        title: 'Assets',
        description: 'Upload your marketing materials',
      });
    });
  });
});
