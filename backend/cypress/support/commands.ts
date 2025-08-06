/// <reference types="cypress" />

// Custom command to login a user
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('authToken', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom command to register a new user
Cypress.Commands.add('registerUser', (userData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData
  }).then((response) => {
    expect(response.status).to.eq(201);
    window.localStorage.setItem('authToken', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom command to generate content
Cypress.Commands.add('generateContent', (contentData) => {
  const token = window.localStorage.getItem('authToken');
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/v1/content/generate`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: contentData
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body;
  });
});

// Custom command to schedule a post
Cypress.Commands.add('schedulePost', (postData) => {
  const token = window.localStorage.getItem('authToken');
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/v1/scheduling/schedule`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: postData
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body;
  });
});

// Custom command to wait for API response
Cypress.Commands.add('waitForApiResponse', (alias: string, timeout: number = 10000) => {
  cy.wait(alias, { timeout });
});

// Custom command to cleanup test data
Cypress.Commands.add('cleanupTestData', () => {
  const token = window.localStorage.getItem('authToken');
  if (token) {
    // Clean up generated content
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/api/v1/test/cleanup`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      failOnStatusCode: false
    });
  }
  
  // Clear local storage
  window.localStorage.clear();
  window.sessionStorage.clear();
  
  // Clear cookies
  cy.clearCookies();
});

// Override to handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  if (err.message.includes('Network Error') || err.message.includes('fetch')) {
    return false;
  }
  return true;
});

// Global before hook for test setup
beforeEach(() => {
  // Set up API request interceptions
  cy.intercept('POST', '/auth/login').as('login');
  cy.intercept('POST', '/auth/register').as('register');
  cy.intercept('POST', '/api/v1/content/generate').as('generateContent');
  cy.intercept('GET', '/api/v1/content').as('getContent');
  cy.intercept('POST', '/api/v1/scheduling/schedule').as('schedulePost');
  cy.intercept('GET', '/api/v1/analytics/dashboard').as('getDashboard');
  
  // Visit the app
  cy.visit('/');
});

// Global after hook for cleanup
afterEach(() => {
  // Cleanup test data after each test
  cy.cleanupTestData();
});
