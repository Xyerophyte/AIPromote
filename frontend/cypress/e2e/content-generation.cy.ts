describe('Content Generation Workflow', () => {
  const testUser = Cypress.env('testUser');

  beforeEach(() => {
    cy.setupApiIntercepts();
    cy.cleanupTestData();
    
    // Register and login test user
    cy.registerUser({
      email: testUser.email,
      password: testUser.password,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      organizationName: testUser.organizationName,
    });
    
    cy.login(testUser.email, testUser.password);
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('should complete the full content generation workflow', () => {
    // Complete intake wizard first
    cy.visitProtected('/intake');
    cy.completeIntakeWizard({
      companyName: 'AI Content Startup',
      industry: 'Artificial Intelligence',
      stage: 'series-a',
      description: 'We help businesses create amazing content with AI',
    });
    
    cy.waitForApiResponse('@createStartup');
    cy.url().should('include', '/dashboard');

    // Navigate to content generation
    cy.getByCy('content-menu-item').click();
    cy.url().should('include', '/content');

    // Generate new content
    cy.getByCy('generate-content-button').click();
    
    // Fill content generation form
    cy.getByCy('platform-select').select('TWITTER');
    cy.getByCy('content-type-select').select('POST');
    cy.getByCy('target-audience-input').type('startup founders');
    cy.getByCy('tone-select').select('professional');
    cy.getByCy('keywords-input').type('AI, content marketing, automation');
    cy.getByCy('variation-count').type('3');
    
    // Enable optimizations
    cy.getByCy('seo-optimization').check();
    cy.getByCy('engagement-optimization').check();
    cy.getByCy('brand-safety-optimization').check();

    // Generate content
    cy.getByCy('generate-button').click();
    
    cy.waitForApiResponse('@generateContent', 30000);
    
    // Verify content was generated
    cy.getByCy('generated-content').should('be.visible');
    cy.getByCy('content-variations').should('have.length.at.least', 1);
    
    // Check that content meets platform constraints
    cy.getByCy('generated-content').within(() => {
      cy.get('[data-cy=content-text]').should('exist');
      cy.get('[data-cy=content-text]').invoke('text').then((text) => {
        // Twitter character limit
        expect(text.length).to.be.at.most(280);
      });
    });

    // Review and edit content
    cy.getByCy('edit-content-button').click();
    cy.getByCy('content-editor').should('be.visible');
    
    // Make minor edit
    cy.getByCy('content-editor').clear();
    cy.getByCy('content-editor').type('Edited: AI is revolutionizing content creation! 🚀 #AI #ContentMarketing');
    cy.getByCy('save-edit-button').click();

    // Schedule content
    cy.getByCy('schedule-content-button').click();
    cy.getByCy('schedule-modal').should('be.visible');
    
    // Set schedule for next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    
    cy.getByCy('schedule-date-input').type(nextHour.toISOString().split('T')[0]);
    cy.getByCy('schedule-time-input').type(nextHour.toTimeString().slice(0, 5));
    
    cy.getByCy('confirm-schedule-button').click();
    
    // Verify content was scheduled
    cy.getByCy('success-message').should('contain', 'Content scheduled successfully');
    
    // Navigate to content calendar
    cy.getByCy('calendar-view-button').click();
    cy.url().should('include', '/content/calendar');
    
    // Verify scheduled content appears in calendar
    cy.getByCy('calendar-grid').should('be.visible');
    cy.getByCy('scheduled-content-item').should('exist');

    // Check analytics
    cy.getByCy('analytics-menu-item').click();
    cy.url().should('include', '/analytics');
    
    cy.waitForApiResponse('@getDashboard');
    
    // Verify analytics dashboard loads
    cy.getByCy('analytics-dashboard').should('be.visible');
    cy.getByCy('content-metrics').should('exist');
  });

  it('should handle content approval workflow', () => {
    cy.visitProtected('/content');
    
    // Generate content
    cy.generateTestContent({
      platform: 'LINKEDIN',
      contentType: 'POST',
    });
    
    cy.waitForApiResponse('@generateContent');
    
    // Submit for approval
    cy.getByCy('submit-for-approval-button').click();
    
    // Verify approval status
    cy.getByCy('content-status').should('contain', 'Pending Approval');
    
    // Mock approval as admin (in real app, this would be different user)
    cy.getByCy('approve-content-button').click();
    cy.getByCy('approval-comment').type('Content looks good, approved!');
    cy.getByCy('confirm-approval-button').click();
    
    // Verify approved status
    cy.getByCy('content-status').should('contain', 'Approved');
    cy.getByCy('publish-button').should('be.enabled');
  });

  it('should handle content variations and A/B testing', () => {
    cy.visitProtected('/content');
    
    // Generate multiple variations
    cy.getByCy('generate-content-button').click();
    cy.getByCy('variation-count').clear().type('5');
    cy.getByCy('diversity-level-select').select('high');
    cy.getByCy('generate-button').click();
    
    cy.waitForApiResponse('@generateContent');
    
    // Verify multiple variations generated
    cy.getByCy('content-variations').should('have.length', 5);
    
    // Select variations for A/B test
    cy.getByCy('variation-0').find('[data-cy=select-variation]').check();
    cy.getByCy('variation-1').find('[data-cy=select-variation]').check();
    
    // Create A/B test
    cy.getByCy('create-ab-test-button').click();
    cy.getByCy('ab-test-modal').should('be.visible');
    
    cy.getByCy('test-name-input').type('Content Variation Test');
    cy.getByCy('traffic-split-slider').invoke('val', 50).trigger('change');
    cy.getByCy('test-duration-select').select('7-days');
    
    cy.getByCy('start-ab-test-button').click();
    
    // Verify A/B test created
    cy.getByCy('ab-test-status').should('contain', 'Running');
    cy.getByCy('ab-test-metrics').should('be.visible');
  });

  it('should validate content before publishing', () => {
    cy.visitProtected('/content');
    
    // Generate content with potential issues
    cy.generateTestContent({
      context: {
        keywords: ['test', 'spam', 'click here now!!!'],
      },
    });
    
    cy.waitForApiResponse('@generateContent');
    
    // Try to publish
    cy.getByCy('publish-button').click();
    
    // Should show validation warnings
    cy.getByCy('validation-warnings').should('be.visible');
    cy.getByCy('brand-safety-warning').should('exist');
    
    // Fix issues
    cy.getByCy('edit-content-button').click();
    cy.getByCy('content-editor').clear();
    cy.getByCy('content-editor').type('Professional content about our innovative AI solution.');
    cy.getByCy('save-edit-button').click();
    
    // Validation should pass
    cy.getByCy('publish-button').click();
    cy.getByCy('validation-warnings').should('not.exist');
    cy.getByCy('publish-confirmation').should('be.visible');
  });

  it('should handle bulk content operations', () => {
    cy.visitProtected('/content');
    
    // Generate multiple pieces of content
    for (let i = 0; i < 3; i++) {
      cy.generateTestContent({
        platform: i === 0 ? 'TWITTER' : i === 1 ? 'LINKEDIN' : 'INSTAGRAM',
      });
      cy.waitForApiResponse('@generateContent');
    }
    
    // Select multiple content items
    cy.getByCy('content-item-0').find('[data-cy=select-content]').check();
    cy.getByCy('content-item-1').find('[data-cy=select-content]').check();
    
    // Bulk schedule
    cy.getByCy('bulk-actions-menu').click();
    cy.getByCy('bulk-schedule-option').click();
    
    // Set bulk schedule settings
    cy.getByCy('bulk-schedule-modal').should('be.visible');
    cy.getByCy('stagger-posts').check();
    cy.getByCy('interval-minutes').type('30');
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2);
    
    cy.getByCy('start-date-input').type(startTime.toISOString().split('T')[0]);
    cy.getByCy('start-time-input').type(startTime.toTimeString().slice(0, 5));
    
    cy.getByCy('confirm-bulk-schedule').click();
    
    // Verify bulk operation success
    cy.getByCy('bulk-success-message').should('be.visible');
    cy.getByCy('scheduled-count').should('contain', '2 posts scheduled');
  });

  it('should provide content performance insights', () => {
    cy.visitProtected('/content');
    
    // Generate and publish content
    cy.generateTestContent();
    cy.waitForApiResponse('@generateContent');
    
    cy.getByCy('publish-button').click();
    cy.getByCy('confirm-publish-button').click();
    
    // Wait for content to be published
    cy.getByCy('content-status').should('contain', 'Published');
    
    // View performance
    cy.getByCy('view-performance-button').click();
    
    // Check performance metrics
    cy.getByCy('performance-modal').should('be.visible');
    cy.getByCy('engagement-metrics').should('exist');
    cy.getByCy('reach-metrics').should('exist');
    cy.getByCy('performance-chart').should('be.visible');
    
    // Export performance data
    cy.getByCy('export-performance-button').click();
    cy.getByCy('export-format-select').select('csv');
    cy.getByCy('confirm-export-button').click();
    
    // Verify download initiated
    cy.getByCy('download-success-message').should('be.visible');
  });

  it('should handle errors gracefully', () => {
    cy.visitProtected('/content');
    
    // Mock API error
    cy.intercept('POST', '**/api/content/generate', {
      statusCode: 500,
      body: { error: 'AI service temporarily unavailable' },
    }).as('generateContentError');
    
    // Try to generate content
    cy.getByCy('generate-content-button').click();
    cy.getByCy('generate-button').click();
    
    cy.waitForApiResponse('@generateContentError');
    
    // Verify error handling
    cy.getByCy('error-message').should('be.visible');
    cy.getByCy('error-message').should('contain', 'temporarily unavailable');
    
    // Retry button should be available
    cy.getByCy('retry-button').should('be.visible');
    
    // Mock successful retry
    cy.intercept('POST', '**/api/content/generate', {
      statusCode: 200,
      body: {
        id: 'test-content-1',
        content: { body: 'Test content generated successfully!' },
        platform: 'TWITTER',
      },
    }).as('generateContentSuccess');
    
    cy.getByCy('retry-button').click();
    cy.waitForApiResponse('@generateContentSuccess');
    
    // Verify recovery
    cy.getByCy('generated-content').should('be.visible');
    cy.getByCy('error-message').should('not.exist');
  });

  it('should be accessible', () => {
    cy.visitProtected('/content');
    
    // Check accessibility
    cy.checkA11y();
    
    // Test keyboard navigation
    cy.getByCy('generate-content-button').focus();
    cy.focused().should('have.attr', 'data-cy', 'generate-content-button');
    
    // Tab through interactive elements
    cy.focused().tab();
    cy.focused().should('have.attr', 'role', 'button');
    
    // Test screen reader announcements
    cy.getByCy('generate-content-button').should('have.attr', 'aria-label');
    cy.getByCy('content-form').should('have.attr', 'role', 'form');
    
    // Test high contrast mode
    cy.get('body').invoke('addClass', 'high-contrast');
    cy.getByCy('generate-content-button').should('be.visible');
    
    // Verify focus indicators
    cy.getByCy('generate-content-button').focus();
    cy.getByCy('generate-content-button').should('have.css', 'outline-width');
  });

  it('should work on mobile devices', () => {
    // Set mobile viewport
    cy.viewport('iphone-8');
    
    cy.visitProtected('/content');
    
    // Mobile-specific UI elements
    cy.getByCy('mobile-menu-button').should('be.visible');
    cy.getByCy('mobile-menu-button').click();
    cy.getByCy('mobile-navigation').should('be.visible');
    
    // Content generation should work on mobile
    cy.getByCy('generate-content-button').click();
    cy.getByCy('content-form').should('be.visible');
    
    // Form should be mobile-optimized
    cy.getByCy('platform-select').should('be.visible');
    cy.getByCy('platform-select').select('TWITTER');
    
    // Swipe gestures (if implemented)
    cy.getByCy('content-variations').trigger('touchstart', { which: 1, pageX: 100, pageY: 200 });
    cy.getByCy('content-variations').trigger('touchmove', { which: 1, pageX: 200, pageY: 200 });
    cy.getByCy('content-variations').trigger('touchend');
    
    // Verify mobile-friendly layout
    cy.getByCy('content-card').should('have.css', 'width');
  });
});
