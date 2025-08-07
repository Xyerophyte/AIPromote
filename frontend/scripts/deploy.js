#!/usr/bin/env node

/**
 * Deployment Helper Script for Vercel
 * 
 * This script helps with common Vercel deployment tasks including:
 * - Environment validation
 * - Pre-deployment checks
 * - Deployment status monitoring
 * 
 * Usage:
 *   node scripts/deploy.js [command] [options]
 * 
 * Commands:
 *   check-env    - Validate environment variables
 *   preview      - Deploy to preview environment
 *   production   - Deploy to production environment
 *   status       - Check deployment status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REQUIRED_ENV_VARS = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL'
];

const OPTIONAL_ENV_VARS = [
  'SENTRY_ORG',
  'SENTRY_PROJECT', 
  'RESEND_API_KEY',
  'BLOB_READ_WRITE_TOKEN',
  'KV_URL'
];

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  const prefix = {
    info: 'ℹ',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    log(`${description} completed successfully`, 'success');
    return output;
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Command handlers
function checkEnvironment() {
  log('Checking environment configuration...');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('No .env.local file found. Using environment variables from system.', 'warning');
  }
  
  // Check required environment variables
  const missingVars = [];
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
    log('Please set these variables before deployment.', 'error');
    return false;
  }
  
  // Check optional variables
  const missingOptional = [];
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  });
  
  if (missingOptional.length > 0) {
    log(`Optional environment variables not set: ${missingOptional.join(', ')}`, 'warning');
    log('Some features may not work correctly.', 'warning');
  }
  
  log('Environment check completed', 'success');
  return true;
}

function runPreDeploymentChecks() {
  log('Running pre-deployment checks...');
  
  // Type check
  executeCommand('npm run type-check', 'Type checking');
  
  // Linting
  executeCommand('npm run lint', 'Linting code');
  
  // Build test
  executeCommand('npm run build', 'Testing build process');
  
  log('Pre-deployment checks completed', 'success');
}

function deployPreview() {
  log('Deploying to preview environment...');
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  runPreDeploymentChecks();
  executeCommand('vercel --confirm', 'Deploying to preview');
  
  log('Preview deployment completed', 'success');
}

function deployProduction() {
  log('Deploying to production environment...');
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  runPreDeploymentChecks();
  executeCommand('vercel --prod --confirm', 'Deploying to production');
  
  log('Production deployment completed', 'success');
}

function checkDeploymentStatus() {
  log('Checking deployment status...');
  executeCommand('vercel ls', 'Fetching deployment list');
}

function showHelp() {
  console.log(`
Vercel Deployment Helper

Usage: node scripts/deploy.js [command]

Commands:
  check-env    Check environment variable configuration
  preview      Deploy to preview environment  
  production   Deploy to production environment
  status       Check deployment status
  help         Show this help message

Examples:
  node scripts/deploy.js check-env
  node scripts/deploy.js preview
  node scripts/deploy.js production
  node scripts/deploy.js status
  `);
}

// Main execution
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check-env':
      checkEnvironment();
      break;
    case 'preview':
      deployPreview();
      break;
    case 'production':
      deployProduction();
      break;
    case 'status':
      checkDeploymentStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      if (command) {
        log(`Unknown command: ${command}`, 'error');
      }
      showHelp();
      process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at ${promise}: ${reason}`, 'error');
  process.exit(1);
});

main();
