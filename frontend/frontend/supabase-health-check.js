#!/usr/bin/env node

/**
 * Supabase Configuration Assessment Script
 * 
 * This script validates:
 * - Environment variable configuration
 * - Supabase client initialization
 * - Database connection
 * - Authentication setup
 * - Table schema validation
 * - Real-time subscriptions (if configured)
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Assessment results
let results = {
  envVariables: { status: 'pending', details: [] },
  clientInit: { status: 'pending', details: [] },
  dbConnection: { status: 'pending', details: [] },
  authSetup: { status: 'pending', details: [] },
  schemaValidation: { status: 'pending', details: [] },
  realTimeConfig: { status: 'pending', details: [] }
};

async function assessEnvironmentVariables() {
  log.header('Environment Variables Assessment');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  const frontendPath = path.resolve('./frontend');
  const rootPath = path.resolve('.');
  
  // Check for environment files
  const foundEnvFiles = [];
  for (const envFile of envFiles) {
    const frontendEnvPath = path.join(frontendPath, envFile);
    const rootEnvPath = path.join(rootPath, envFile);
    
    if (fs.existsSync(frontendEnvPath)) {
      foundEnvFiles.push(`frontend/${envFile}`);
    }
    if (fs.existsSync(rootEnvPath)) {
      foundEnvFiles.push(envFile);
    }
  }
  
  if (foundEnvFiles.length === 0) {
    log.warning('No environment files found');
    results.envVariables.details.push('No .env files detected');
  } else {
    log.info(`Found environment files: ${foundEnvFiles.join(', ')}`);
    results.envVariables.details.push(`Environment files: ${foundEnvFiles.join(', ')}`);
  }
  
  // Check environment variables from process.env
  const missingVars = [];
  const presentVars = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
      // Don't log actual values for security
      log.success(`${varName}: configured`);
    }
  }
  
  if (missingVars.length > 0) {
    missingVars.forEach(varName => log.error(`${varName}: not configured`));
    results.envVariables.status = 'error';
    results.envVariables.details.push(`Missing variables: ${missingVars.join(', ')}`);
  } else {
    log.success('All required environment variables are configured');
    results.envVariables.status = 'success';
    results.envVariables.details.push('All required variables configured');
  }
  
  return missingVars.length === 0;
}

async function assessSupabaseClient() {
  log.header('Supabase Client Initialization');
  
  try {
    const supabaseClientPath = path.resolve('./frontend/src/lib/supabase.ts');
    
    if (!fs.existsSync(supabaseClientPath)) {
      log.error('Supabase client file not found at expected location');
      results.clientInit.status = 'error';
      results.clientInit.details.push('Client file missing');
      return false;
    }
    
    log.success('Supabase client file exists');
    
    // Read and analyze the client file
    const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
    
    // Check for required imports
    if (!clientContent.includes("import { createClient }")) {
      log.error('Missing createClient import');
      results.clientInit.status = 'error';
      results.clientInit.details.push('Missing createClient import');
      return false;
    }
    
    // Check for client creation
    if (!clientContent.includes("export const supabase = createClient")) {
      log.error('Supabase client not properly exported');
      results.clientInit.status = 'error';
      results.clientInit.details.push('Client not properly exported');
      return false;
    }
    
    // Check for admin client
    if (clientContent.includes("export const supabaseAdmin")) {
      log.success('Admin client configured');
      results.clientInit.details.push('Admin client available');
    } else {
      log.warning('Admin client not configured');
    }
    
    // Check for TypeScript types
    if (clientContent.includes("interface Database")) {
      log.success('TypeScript database types defined');
      results.clientInit.details.push('TypeScript types available');
    } else {
      log.warning('No TypeScript database types found');
    }
    
    log.success('Supabase client initialization appears correct');
    results.clientInit.status = 'success';
    results.clientInit.details.push('Client initialization verified');
    return true;
    
  } catch (error) {
    log.error(`Error analyzing Supabase client: ${error.message}`);
    results.clientInit.status = 'error';
    results.clientInit.details.push(`Analysis error: ${error.message}`);
    return false;
  }
}

async function assessDatabaseConnection() {
  log.header('Database Connection Test');
  
  // Since we can't actually import and test the Supabase client in this Node.js script
  // (it's designed for Next.js environment), we'll check the configuration instead
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    log.error('Cannot test connection - missing credentials');
    results.dbConnection.status = 'error';
    results.dbConnection.details.push('Missing credentials for connection test');
    return false;
  }
  
  // Validate URL format
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('supabase')) {
      log.warning('URL does not appear to be a Supabase URL');
      results.dbConnection.details.push('URL format questionable');
    } else {
      log.success('Supabase URL format appears valid');
      results.dbConnection.details.push('URL format validated');
    }
  } catch (error) {
    log.error('Invalid Supabase URL format');
    results.dbConnection.status = 'error';
    results.dbConnection.details.push('Invalid URL format');
    return false;
  }
  
  // Validate key format (should start with certain prefixes)
  if (!key.startsWith('eyJ')) {
    log.warning('Anonymous key format may be incorrect (should be JWT)');
    results.dbConnection.details.push('Key format questionable');
  } else {
    log.success('Anonymous key format appears valid (JWT)');
    results.dbConnection.details.push('Key format validated');
  }
  
  log.info('⚠️ Actual connection test requires runtime environment');
  results.dbConnection.status = 'warning';
  results.dbConnection.details.push('Configuration validated, runtime test needed');
  
  return true;
}

async function assessAuthenticationSetup() {
  log.header('Authentication Setup Assessment');
  
  try {
    const authConfigPath = path.resolve('./frontend/src/lib/auth-config.ts');
    
    if (!fs.existsSync(authConfigPath)) {
      log.error('Auth configuration file not found');
      results.authSetup.status = 'error';
      results.authSetup.details.push('Auth config file missing');
      return false;
    }
    
    const authContent = fs.readFileSync(authConfigPath, 'utf8');
    
    // Check for Supabase integration in auth
    if (authContent.includes('supabaseAdmin')) {
      log.success('Supabase Auth integration found');
      results.authSetup.details.push('Supabase integration present');
    } else {
      log.warning('No Supabase integration in auth config');
      results.authSetup.details.push('Missing Supabase integration');
    }
    
    // Check for OAuth providers
    const oauthProviders = [];
    if (authContent.includes('GoogleProvider')) oauthProviders.push('Google');
    if (authContent.includes('GitHubProvider')) oauthProviders.push('GitHub');
    if (authContent.includes('CredentialsProvider')) oauthProviders.push('Credentials');
    
    if (oauthProviders.length > 0) {
      log.success(`OAuth providers configured: ${oauthProviders.join(', ')}`);
      results.authSetup.details.push(`Providers: ${oauthProviders.join(', ')}`);
    } else {
      log.warning('No OAuth providers found');
    }
    
    // Check for session strategy
    if (authContent.includes('strategy: "jwt"')) {
      log.success('JWT session strategy configured');
      results.authSetup.details.push('JWT strategy configured');
    } else {
      log.warning('Session strategy not clearly defined');
    }
    
    results.authSetup.status = 'success';
    results.authSetup.details.push('Auth configuration analyzed');
    return true;
    
  } catch (error) {
    log.error(`Error analyzing auth setup: ${error.message}`);
    results.authSetup.status = 'error';
    results.authSetup.details.push(`Analysis error: ${error.message}`);
    return false;
  }
}

async function assessSchemaValidation() {
  log.header('Schema Validation');
  
  try {
    // Check for Prisma schema
    const prismaSchemaPath = path.resolve('./backend/prisma/schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      const prismaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
      
      // Check for tables that should match Supabase types
      const expectedTables = ['users', 'accounts', 'sessions'];
      const foundTables = [];
      
      for (const table of expectedTables) {
        if (prismaContent.includes(`model ${table.charAt(0).toUpperCase() + table.slice(1)}`)) {
          foundTables.push(table);
        }
      }
      
      log.success(`Prisma schema found with tables: ${foundTables.join(', ')}`);
      results.schemaValidation.details.push(`Prisma tables: ${foundTables.join(', ')}`);
    } else {
      log.warning('Prisma schema not found');
    }
    
    // Check Supabase TypeScript types in client
    const supabaseClientPath = path.resolve('./frontend/src/lib/supabase.ts');
    if (fs.existsSync(supabaseClientPath)) {
      const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
      
      if (clientContent.includes('interface Database')) {
        log.success('Supabase TypeScript types defined');
        
        // Check for specific table types
        const tableTypes = ['users', 'accounts', 'sessions'];
        const foundTypes = tableTypes.filter(table => 
          clientContent.includes(`${table}:`)
        );
        
        if (foundTypes.length > 0) {
          log.success(`Table types found: ${foundTypes.join(', ')}`);
          results.schemaValidation.details.push(`Types: ${foundTypes.join(', ')}`);
        }
      } else {
        log.warning('No TypeScript database types found');
      }
    }
    
    results.schemaValidation.status = 'success';
    results.schemaValidation.details.push('Schema validation completed');
    return true;
    
  } catch (error) {
    log.error(`Schema validation error: ${error.message}`);
    results.schemaValidation.status = 'error';
    results.schemaValidation.details.push(`Validation error: ${error.message}`);
    return false;
  }
}

async function assessRealTimeConfig() {
  log.header('Real-time Subscriptions Assessment');
  
  log.info('Checking for real-time subscription usage...');
  
  try {
    // Search for real-time usage in the codebase
    const frontendSrcPath = path.resolve('./frontend/src');
    
    if (!fs.existsSync(frontendSrcPath)) {
      log.warning('Frontend src directory not found');
      results.realTimeConfig.status = 'warning';
      results.realTimeConfig.details.push('Frontend src not found');
      return false;
    }
    
    // Recursively search for real-time usage
    function searchForRealTime(dir) {
      const files = fs.readdirSync(dir);
      let realTimeUsage = [];
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          realTimeUsage = realTimeUsage.concat(searchForRealTime(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('.subscribe(') || content.includes('channel(')) {
              realTimeUsage.push(filePath.replace(frontendSrcPath, ''));
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
      
      return realTimeUsage;
    }
    
    const realTimeFiles = searchForRealTime(frontendSrcPath);
    
    if (realTimeFiles.length > 0) {
      log.success(`Real-time subscriptions found in: ${realTimeFiles.join(', ')}`);
      results.realTimeConfig.status = 'success';
      results.realTimeConfig.details.push(`Files with real-time: ${realTimeFiles.length}`);
    } else {
      log.info('No real-time subscriptions detected');
      results.realTimeConfig.status = 'info';
      results.realTimeConfig.details.push('No real-time usage found');
    }
    
    return true;
    
  } catch (error) {
    log.error(`Real-time assessment error: ${error.message}`);
    results.realTimeConfig.status = 'error';
    results.realTimeConfig.details.push(`Assessment error: ${error.message}`);
    return false;
  }
}

function generateSummaryReport() {
  log.header('Assessment Summary Report');
  
  const statusSymbols = {
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'info': 'ℹ️',
    'pending': '⏳'
  };
  
  console.log(`${colors.bold}Supabase Configuration Status:${colors.reset}\n`);
  
  for (const [category, result] of Object.entries(results)) {
    const symbol = statusSymbols[result.status] || '❓';
    const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    console.log(`${symbol} ${categoryName}: ${result.status}`);
    if (result.details.length > 0) {
      result.details.forEach(detail => console.log(`   • ${detail}`));
    }
    console.log();
  }
  
  // Overall status
  const hasErrors = Object.values(results).some(r => r.status === 'error');
  const hasWarnings = Object.values(results).some(r => r.status === 'warning');
  
  if (hasErrors) {
    log.error('❌ Supabase configuration has critical issues that need to be addressed');
  } else if (hasWarnings) {
    log.warning('⚠️ Supabase configuration is mostly working but has some recommendations');
  } else {
    log.success('✅ Supabase configuration appears to be properly set up');
  }
  
  // Recommendations
  console.log(`\n${colors.bold}${colors.cyan}Recommendations:${colors.reset}\n`);
  
  if (results.envVariables.status === 'error') {
    console.log('📝 Create .env.local file with required Supabase credentials');
  }
  
  if (results.dbConnection.status === 'warning') {
    console.log('🧪 Run your Next.js application to test actual database connection');
  }
  
  if (results.realTimeConfig.status === 'info') {
    console.log('⚡ Consider implementing real-time subscriptions for live updates');
  }
  
  console.log('📚 Refer to Supabase documentation for advanced configuration options');
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.cyan}🔍 Supabase Configuration Assessment${colors.reset}\n`);
  console.log('Assessing your Supabase setup per user preferences...\n');
  
  try {
    await assessEnvironmentVariables();
    await assessSupabaseClient();
    await assessDatabaseConnection();
    await assessAuthenticationSetup();
    await assessSchemaValidation();
    await assessRealTimeConfig();
    
    generateSummaryReport();
    
  } catch (error) {
    log.error(`Assessment failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
