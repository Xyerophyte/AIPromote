describe('Authentication Flow E2E Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Organization'
  };

  beforeEach(() => {
    cy.visit('/auth/login');
  });

  describe('User Registration', () => {
    it('should allow new user registration and redirect to dashboard', () => {
      // Navigate to registration
      cy.contains('Sign up').click();
      cy.url().should('include', '/auth/register');

      // Fill in registration form
      cy.get('[data-cy=first-name-input]').type(testUser.firstName);
      cy.get('[data-cy=last-name-input]').type(testUser.lastName);
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type(testUser.password);
      cy.get('[data-cy=organization-name-input]').type(testUser.organizationName);

      // Submit registration
      cy.get('[data-cy=register-button]').click();
      cy.waitForApiResponse('@register');

      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome').should('be.visible');

      // Should display user name
      cy.contains(testUser.firstName).should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('Sign up').click();
      
      // Try to submit empty form
      cy.get('[data-cy=register-button]').click();
      
      // Should show validation errors
      cy.contains('First name is required').should('be.visible');
      cy.contains('Last name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
      cy.contains('Organization name is required').should('be.visible');
    });

    it('should validate email format', () => {
      cy.contains('Sign up').click();
      
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=register-button]').click();
      
      cy.contains('Please enter a valid email').should('be.visible');
    });

    it('should validate password strength', () => {
      cy.contains('Sign up').click();
      
      cy.get('[data-cy=password-input]').type('weak');
      cy.get('[data-cy=register-button]').click();
      
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should handle duplicate email registration', () => {
      // Register user first time
      cy.registerUser(testUser);
      cy.visit('/auth/register');

      // Try to register with same email
      cy.get('[data-cy=first-name-input]').type('Another');
      cy.get('[data-cy=last-name-input]').type('User');
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type(testUser.password);
      cy.get('[data-cy=organization-name-input]').type('Another Org');
      
      cy.get('[data-cy=register-button]').click();
      
      cy.contains('Email already exists').should('be.visible');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Register a test user for login tests
      cy.registerUser({
        ...testUser,
        email: `login-test-${Date.now()}@example.com`
      });
      cy.visit('/auth/login');
    });

    it('should allow existing user to login and redirect to dashboard', () => {
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type(testUser.password);
      
      cy.get('[data-cy=login-button]').click();
      cy.waitForApiResponse('@login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type('wrongpassword');
      
      cy.get('[data-cy=login-button]').click();
      
      cy.contains('Invalid credentials').should('be.visible');
    });

    it('should show error for non-existent user', () => {
      cy.get('[data-cy=email-input]').type('nonexistent@example.com');
      cy.get('[data-cy=password-input]').type('somepassword');
      
      cy.get('[data-cy=login-button]').click();
      
      cy.contains('Invalid credentials').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=login-button]').click();
      
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should remember user session after page reload', () => {
      // Login
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type(testUser.password);
      cy.get('[data-cy=login-button]').click();
      cy.waitForApiResponse('@login');
      
      // Reload page
      cy.reload();
      
      // Should still be on dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.registerUser({
        ...testUser,
        email: `logout-test-${Date.now()}@example.com`
      });
      cy.visit('/dashboard');
    });

    it('should allow user to logout and redirect to login page', () => {
      // Click logout button
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();
      
      // Should redirect to login page
      cy.url().should('include', '/auth/login');
      
      // Should clear authentication
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });

    it('should redirect to login when accessing protected routes after logout', () => {
      // Logout
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.visit('/auth/forgot-password');
    });

    it('should allow user to request password reset', () => {
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=reset-password-button]').click();
      
      cy.contains('Password reset link sent').should('be.visible');
    });

    it('should validate email format in password reset', () => {
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=reset-password-button]').click();
      
      cy.contains('Please enter a valid email').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected routes without auth', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/content');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/analytics');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/settings');
      cy.url().should('include', '/auth/login');
    });

    it('should allow access to protected routes with valid authentication', () => {
      cy.registerUser(testUser);
      
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      cy.visit('/content');
      cy.url().should('include', '/content');
      
      cy.visit('/analytics');
      cy.url().should('include', '/analytics');
    });
  });
});
