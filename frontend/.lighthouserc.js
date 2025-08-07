module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/auth/signin',
        'http://localhost:3000/dashboard'
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Additional performance metrics
        'speed-index': ['warn', { maxNumericValue: 3500 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2500 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        
        // Image optimization
        'modern-image-formats': 'off', // Can be strict for Next.js Image component
        'uses-optimized-images': 'warn',
        'uses-responsive-images': 'warn',
        'efficiently-encode-images': 'warn',
        
        // JavaScript optimization
        'uses-text-compression': 'error',
        'legacy-javascript': 'warn',
        
        // Accessibility checks
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        
        // Security
        'is-on-https': 'error',
        'uses-http2': 'warn',
        
        // SEO
        'meta-description': 'warn',
        'document-title': 'error',
        'robots-txt': 'off' // May not be applicable for all pages
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
