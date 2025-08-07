# CI/CD Pipeline Setup Guide

## Overview

This comprehensive CI/CD pipeline provides automated testing, security scanning, performance monitoring, and deployment for your Next.js application using GitHub Actions, Vercel, and Supabase.

## 🚀 Features

### ✅ Automated Testing
- Unit and integration tests
- End-to-end testing with Cypress  
- Snapshot testing
- API performance testing
- Load testing with k6
- Security testing

### 🔒 Security Scanning
- Dependency vulnerability scanning
- Code security analysis with CodeQL
- Container security scanning
- Secrets detection
- OWASP ZAP security testing
- License compliance checking

### 📊 Performance Monitoring
- Bundle size analysis and regression detection
- Lighthouse performance audits
- Core Web Vitals monitoring
- API response time monitoring
- Load testing with performance budgets

### 🚢 Deployment Pipeline
- **Staging Environment**: Automatic deployment on `develop` branch
- **Production Environment**: Automatic deployment on `main` branch with approval gates
- **Database Migrations**: Automated Supabase schema updates
- **Rollback Procedures**: Automated rollback on deployment failure

### 📬 Notifications
- Slack, Discord, Microsoft Teams integration
- Custom webhook support
- GitHub status updates
- Deployment status badges

## 📁 File Structure

```
.github/
├── workflows/
│   ├── test.yml              # Comprehensive testing pipeline
│   ├── deploy.yml            # Main CI/CD deployment pipeline
│   ├── security.yml          # Security scanning workflow
│   ├── performance.yml       # Performance regression testing
│   └── rollback.yml          # Emergency rollback workflow
└── actions/
    └── notify-deployment/
        └── action.yml         # Custom notification action

.performance-budget.json      # Performance budgets and thresholds
.lighthouserc.js             # Lighthouse CI configuration
.zap/
└── rules.tsv                # OWASP ZAP security rules
```

## 🔧 Setup Instructions

### 1. Repository Secrets

Configure the following secrets in your GitHub repository:

#### Vercel Integration
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Supabase Configuration
```bash
# Staging Environment
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_DB_PASSWORD_STAGING=your_staging_db_password

# Production Environment
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_DB_PASSWORD_PROD=your_production_db_password

# Supabase CLI
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
```

#### Monitoring and Error Tracking
```bash
# Sentry (Optional)
STAGING_SENTRY_DSN=your_staging_sentry_dsn
PRODUCTION_SENTRY_DSN=your_production_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Testing
CYPRESS_RECORD_KEY=your_cypress_record_key
```

#### Security Scanning (Optional)
```bash
SNYK_TOKEN=your_snyk_token
SEMGREP_APP_TOKEN=your_semgrep_token
GITLEAKS_LICENSE=your_gitleaks_license
```

#### Notifications (Optional)
```bash
DEPLOYMENT_WEBHOOK_URL=your_custom_webhook_url
SLACK_WEBHOOK_URL=your_slack_webhook_url
DISCORD_WEBHOOK_URL=your_discord_webhook_url
TEAMS_WEBHOOK_URL=your_teams_webhook_url
```

### 2. Environment Configuration

Create GitHub Environments for deployment approvals:

1. **staging**: No protection rules (auto-deploy)
2. **production**: Require reviewers, restrict to `main` branch

### 3. Branch Protection Rules

Configure branch protection for `main` and `develop`:

- Require status checks to pass
- Require branches to be up to date
- Require review from code owners
- Dismiss stale reviews when new commits are pushed

### 4. Performance Budgets

Customize `.performance-budget.json` for your specific requirements:

```json
{
  "bundles": {
    "main": { "maxSize": 250000 },
    "total": { "maxSize": 2000000 }
  },
  "lighthouse": {
    "performance": { "minScore": 80 }
  }
}
```

## 🔄 Workflow Triggers

### Automatic Triggers

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **Testing** | PR to `main`/`develop`, Push to `main`/`develop` | Full test suite |
| **Deployment** | Push to `develop` (staging), Push to `main` (production) | Automated deployment |
| **Security** | PR to `main`/`develop`, Daily at 2 AM UTC | Security scans |
| **Performance** | PR to `main`/`develop`, Daily at 1 AM UTC | Performance tests |

### Manual Triggers

All workflows support manual triggering with customizable options:

- **Deploy**: Choose environment, skip tests for emergencies
- **Rollback**: Choose environment, rollback strategy, and reason
- **Security**: Choose specific scan types
- **Performance**: Choose test types and target environment

## 📋 Deployment Process

### Staging Deployment (develop branch)
1. **Pre-deployment checks**: Migration detection, deployment decision
2. **Run tests**: Full test suite (unless skipped)
3. **Database migration**: Automated schema updates
4. **Deploy to Vercel**: Staging environment
5. **Smoke tests**: Basic functionality verification
6. **E2E tests**: Full end-to-end testing
7. **Post-deployment monitoring**: Health checks and monitoring setup

### Production Deployment (main branch)
1. **All staging steps** (if staging deployment successful)
2. **Approval gate**: Manual approval for production deployment
3. **Pre-deployment backup**: Current deployment backup
4. **Deploy to Vercel**: Production environment with custom domain
5. **Production smoke tests**: Critical functionality verification
6. **Performance tests**: Load testing and metrics validation
7. **Security scan**: Post-deployment security verification
8. **Post-deployment monitoring**: Extended health monitoring

## 🔙 Rollback Procedures

### Automatic Rollback
- Triggered on deployment failure
- Database and application rollback
- Automatic notification and incident creation

### Manual Rollback
Use the manual workflow dispatch:

```bash
# Via GitHub Actions UI
Workflow: Rollback Deployment
Environment: production
Strategy: previous_deployment
Reason: "Critical bug in latest deployment"
```

### Rollback Strategies
- **Previous Deployment**: Roll back to last successful deployment
- **Specific Commit**: Roll back to specific commit SHA
- **Database Only**: Roll back only database changes

## 📊 Monitoring and Notifications

### Performance Monitoring
- Bundle size tracking and regression detection
- Core Web Vitals monitoring
- API response time tracking
- Load testing results

### Security Monitoring
- Daily dependency vulnerability scans
- Code security analysis
- Container security scanning
- Secrets detection

### Notifications
Configure webhook endpoints for real-time deployment notifications:

```json
{
  "status": "success",
  "environment": "production",
  "deployment_url": "https://aipromoter.app",
  "commit_sha": "abc123",
  "actor": "username"
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Deployment Failures
```bash
# Check deployment logs in GitHub Actions
# Verify environment variables and secrets
# Check Vercel deployment status
```

#### 2. Test Failures
```bash
# Review test results in workflow summary
# Check for environment-specific issues
# Verify test data and dependencies
```

#### 3. Security Scan Issues
```bash
# Review security scan results
# Update dependencies with vulnerabilities
# Check for false positives in scan rules
```

### Emergency Procedures

#### Immediate Rollback
```bash
1. Go to GitHub Actions
2. Select "Rollback Deployment" workflow
3. Choose "production" environment
4. Select "Emergency" checkbox
5. Provide rollback reason
6. Execute rollback
```

#### Skip Tests (Emergency Only)
```bash
1. Go to GitHub Actions  
2. Select "CI/CD Pipeline" workflow
3. Choose environment
4. Check "Skip tests" option
5. Execute deployment
```

## 📈 Performance Budgets

The pipeline enforces performance budgets to prevent regressions:

- **Bundle Size**: Main bundle < 250KB, Total < 2MB
- **Lighthouse Score**: Performance > 80%, Accessibility > 90%
- **Core Web Vitals**: LCP < 4s, CLS < 0.1, TBT < 300ms
- **API Response**: Health check < 500ms, Auth < 1s
- **Load Testing**: Avg response < 2s, Error rate < 5%

## 🔐 Security Features

### Vulnerability Scanning
- **npm audit**: Package vulnerability detection
- **Snyk**: Advanced dependency analysis
- **CodeQL**: Static code analysis
- **Trivy**: Container image scanning

### Secrets Detection  
- **GitLeaks**: Git history secret scanning
- **TruffleHog**: Verified secrets detection

### Web Security
- **OWASP ZAP**: Web application security testing
- **License Compliance**: Open source license checking

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Cypress Documentation](https://docs.cypress.io/)
- [k6 Load Testing](https://k6.io/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## 🤝 Support

For issues with the CI/CD pipeline:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check repository issues and discussions
4. Create a new issue with detailed information

---

**Note**: This pipeline is designed for production use with your Vercel and Supabase setup. Customize the configuration files and secrets according to your specific requirements.
