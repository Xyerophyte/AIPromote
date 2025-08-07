/// <reference types="cypress" />

// Custom commands for AI Promote application
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Register a new user
       */
      registerUser(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organizationName: string;
      }): Chainable<void>;
      
      /**
       * Clean up test data
       */
      cleanupTestData(): Chainable<void>;
      
      /**
       * Create a test startup
       */
      createTestStartup(startupData?: Partial<{
        companyName: string;
        industry: string;
        stage: string;
        description: string;
      }>): Chainable<void>;
      
      /**
       * Generate test content
       */
      generateTestContent(contentData?: Partial<{
        platform: string;
        contentType: string;
        context: any;
      }>): Chainable<void>;
      
      /**
       * Wait for API response by alias
       */
      waitForApiResponse(alias: string, timeout?: number): Chainable<void>;
      
      /**
       * Set up API intercepts for common endpoints
       */
      setupApiIntercepts(): Chainable<void>;
      
      /**
       * Mock successful authentication
       */
      mockAuth(): Chainable<void>;
      
      /**
       * Navigate to protected route
       */
      visitProtected(url: string): Chainable<void>;
      
      /**
       * Fill and submit intake wizard
       */
      completeIntakeWizard(data?: any): Chainable<void>;
      
      /**
       * Test accessibility
       */
      checkA11y(): Chainable<void>;
      
      /**
       * Get element by data-cy attribute
       */
      getByCy(value: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Get element by data-testid attribute
       */
      getByTestId(value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/auth/signin');
      cy.get('[data-cy=email-input]').type(email);
      cy.get('[data-cy=password-input]').type(password);
      cy.get('[data-cy=login-button]').click();
      
      // Wait for successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('be.visible');
    },
    {
      validate: () => {
        // Validate that user is still logged in
        cy.request({
          url: `${Cypress.env('apiUrl')}/auth/me`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('authToken')}`,
          },
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      },
    }
  );
});

// Register user command
Cypress.Commands.add('registerUser', (userData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 201) {
      // Store auth token if registration successful
      window.localStorage.setItem('authToken', response.body.token);
    }
  });
});

// Cleanup test data command
Cypress.Commands.add('cleanupTestData', () => {
  const authToken = window.localStorage.getItem('authToken');
  
  if (authToken) {
    // Clean up test startups
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/test/cleanup`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      failOnStatusCode: false,
    });
  }
  
  // Clear local storage
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Create test startup command
Cypress.Commands.add('createTestStartup', (startupData = {}) => {
  const defaultData = {
    companyName: 'Test Startup Inc.',
    industry: 'Technology',
    stage: 'seed',
    description: 'A test startup for Cypress testing',
    ...startupData,
  };
  
  const authToken = window.localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/startups`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: defaultData,
  }).as('createStartup');
});

// Generate test content command
Cypress.Commands.add('generateTestContent', (contentData = {}) => {
  const defaultData = {
    platform: 'TWITTER',
    contentType: 'POST',
    context: {
      targetAudience: 'developers',
      tone: 'professional',
      keywords: ['startup', 'technology'],
    },
    variations: {
      count: 1,
      diversityLevel: 'medium',
    },
    optimization: {
      seo: true,
      engagement: true,
      conversion: false,
      brandSafety: true,
    },
    ...contentData,
  };
  
  const authToken = window.localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/content/generate`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: defaultData,
  }).as('generateContent');
});

// Wait for API response command
Cypress.Commands.add('waitForApiResponse', (alias: string, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// Setup API intercepts command
Cypress.Commands.add('setupApiIntercepts', () => {
  // Auth endpoints
  cy.intercept('POST', '**/auth/register').as('register');
  cy.intercept('POST', '**/auth/login').as('login');
  cy.intercept('POST', '**/auth/logout').as('logout');
  cy.intercept('GET', '**/auth/me').as('getProfile');
  
  // Startup endpoints
  cy.intercept('GET', '**/api/startups').as('getStartups');
  cy.intercept('POST', '**/api/startups').as('createStartup');
  cy.intercept('PUT', '**/api/startups/*').as('updateStartup');
  cy.intercept('DELETE', '**/api/startups/*').as('deleteStartup');
  
  // Content endpoints
  cy.intercept('POST', '**/api/content/generate').as('generateContent');
  cy.intercept('GET', '**/api/content').as('getContent');
  cy.intercept('DELETE', '**/api/content/*').as('deleteContent');
  
  // Analytics endpoints
  cy.intercept('GET', '**/api/analytics/dashboard').as('getDashboard');
  cy.intercept('GET', '**/api/analytics/realtime').as('getRealtime');
});

// Mock authentication command
Cypress.Commands.add('mockAuth', () => {
  window.localStorage.setItem('authToken', 'mock-token');
  window.localStorage.setItem('user', JSON.stringify({
    id: 'mock-user-id',
    email: 'mock@example.com',
    firstName: 'Mock',
    lastName: 'User',
  }));
});

// Visit protected route command
Cypress.Commands.add('visitProtected', (url: string) => {
  // Ensure user is authenticated
  const authToken = window.localStorage.getItem('authToken');
  if (!authToken) {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
  }
  
  cy.visit(url);
});

// Complete intake wizard command
Cypress.Commands.add('completeIntakeWizard', (data = {}) => {
  const defaultData = {
    companyName: 'Cypress Test Company',
    industry: 'Technology',
    stage: 'seed',
    description: 'A revolutionary startup built during Cypress testing',
    targetAudience: 'developers',
    goals: ['brand-awareness', 'lead-generation'],
    brandVoice: 'professional',
    brandPersonality: ['innovative', 'trustworthy'],
    ...data,
  };
  
  // Step 1: Basics
  cy.get('[data-cy=company-name-input]').type(defaultData.companyName);
  cy.get('[data-cy=industry-input]').type(defaultData.industry);
  cy.get('[data-cy=stage-select]').select(defaultData.stage);
  cy.get('[data-cy=description-textarea]').type(defaultData.description);
  cy.get('[data-cy=next-button]').click();
  
  // Step 2: Target Audience
  cy.get('[data-cy=target-audience-input]').type(defaultData.targetAudience);
  cy.get('[data-cy=next-button]').click();
  
  // Step 3: Goals
  defaultData.goals.forEach(goal => {
    cy.get(`[data-cy=goal-${goal}]`).check();
  });
  cy.get('[data-cy=next-button]').click();
  
  // Step 4: Brand Voice
  cy.get(`[data-cy=brand-voice-${defaultData.brandVoice}]`).check();
  cy.get('[data-cy=next-button]').click();
  
  // Step 5: Brand Personality
  defaultData.brandPersonality.forEach(trait => {
    cy.get(`[data-cy=personality-${trait}]`).check();
  });
  
  // Submit
  cy.get('[data-cy=finish-button]').click();
});

// Check accessibility command
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(undefined, undefined, (violations) => {
    violations.forEach((violation) => {
      cy.task('log', `${violation.id}: ${violation.description}`);
      violation.nodes.forEach((node) => {
        cy.task('log', `  - ${node.target}`);
      });
    });
  });
});

// Get by data-cy attribute command
Cypress.Commands.add('getByCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`);
});

// Get by data-testid attribute command
Cypress.Commands.add('getByTestId', (value: string) => {
  return cy.get(`[data-testid=${value}]`);
});

// Prevent TypeScript errors
export {};
