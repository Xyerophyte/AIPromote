# AI Promote - Production Deployment Guide

This comprehensive guide covers the complete production deployment process for AI Promote, including all configuration, monitoring, and maintenance procedures.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Secrets Management](#secrets-management)
4. [Docker Deployment](#docker-deployment)
5. [Nginx & SSL Configuration](#nginx--ssl-configuration)
6. [CDN Setup](#cdn-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 100GB SSD minimum
- **CPU**: 4 cores minimum
- **Network**: Static IP address

### Required Software
- Docker 24.0+
- Docker Compose 2.20+
- Nginx 1.20+
- Certbot (for SSL)
- AWS CLI (for secrets and backups)
- Git

### Domain & SSL
- Registered domain name
- DNS configured to point to your server
- SSL certificate (Let's Encrypt recommended)

## 🌍 Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install other dependencies
sudo apt install -y nginx certbot python3-certbot-nginx jq curl htop
```

### 2. Project Setup

```bash
# Clone repository
git clone https://github.com/yourusername/AI-Promote.git
cd AI-Promote

# Create necessary directories
sudo mkdir -p /var/log/aipromotapp/{backend,frontend,nginx,worker}
sudo mkdir -p /opt/aipromotapp/{uploads,backups,ssl}
sudo chown -R $USER:$USER /var/log/aipromotapp /opt/aipromotapp
```

### 3. Environment Configuration

```bash
# Copy production environment file
cp .env.production .env

# Edit with your actual values
nano .env
```

**Critical Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/aipromotdb_prod
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_256_character_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_LOGROCKET_ID=your-logrocket-id
```

## 🔐 Secrets Management

### AWS Secrets Manager Setup

1. **Create Secrets in AWS**:
```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS CLI
aws configure

# Create production secrets
aws secretsmanager create-secret \
  --name "ai-promote/production" \
  --description "AI Promote Production Secrets" \
  --secret-string file://secrets.json
```

2. **Secrets JSON Structure**:
```json
{
  "DATABASE_URL": "postgresql://user:password@postgres:5432/aipromotdb_prod",
  "REDIS_URL": "redis://:password@redis:6379",
  "JWT_SECRET": "your-jwt-secret",
  "OPENAI_API_KEY": "sk-your-openai-key",
  "STRIPE_SECRET_KEY": "sk_live_your-stripe-key",
  "SENTRY_DSN": "https://your-sentry-dsn",
  "ENCRYPTION_KEY": "your-32-char-encryption-key"
}
```

3. **IAM Policy for Secrets Access**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:ai-promote/*"
    }
  ]
}
```

## 🐳 Docker Deployment

### 1. Build Images

```bash
# Build production images
docker build -f backend/Dockerfile.prod -t aipromotapp-backend:latest backend/
docker build -f frontend/Dockerfile.prod -t aipromotapp-frontend:latest frontend/
```

### 2. Deploy with Docker Compose

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Database Migration

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial data (if needed)
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## 🌐 Nginx & SSL Configuration

### 1. SSL Certificate Setup

```bash
# Get SSL certificate with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Nginx Configuration

Copy the provided nginx configuration files:

```bash
# Copy main config
sudo cp config/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy server config
sudo cp config/nginx/conf.d/aipromotapp.conf /etc/nginx/sites-available/aipromotapp
sudo ln -s /etc/nginx/sites-available/aipromotapp /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Security Headers

Verify SSL configuration at [SSL Labs](https://www.ssllabs.com/ssltest/):
- Should achieve A+ rating
- HSTS enabled
- Perfect Forward Secrecy

## 📦 CDN Setup

### 1. AWS CloudFront Configuration

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 2. CloudFront Distribution Config

```json
{
  "CallerReference": "ai-promote-cdn-2024",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "ai-promote-origin",
        "DomainName": "yourdomain.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ai-promote-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "CACHE_POLICY_ID"
  },
  "Comment": "AI Promote CDN",
  "Enabled": true
}
```

### 3. Static Asset Optimization

```bash
# Configure Next.js for CDN
# Add to next.config.js
const nextConfig = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.yourdomain.com'],
  },
}
```

## 📊 Monitoring & Logging

### 1. Sentry Setup

The Sentry integration is already configured in the codebase. Ensure environment variables are set:

```bash
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn
```

### 2. LogRocket Setup

```bash
NEXT_PUBLIC_LOGROCKET_ID=your-logrocket-app-id
```

### 3. Application Monitoring

```bash
# Check application health
curl -f https://yourdomain.com/health

# Monitor logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f backend
docker-compose -f docker-compose.prod.yml logs --tail=100 -f frontend

# System monitoring
htop
docker stats
```

### 4. Log Rotation Setup

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/aipromotapp << EOF
/var/log/aipromotapp/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker-compose -f /path/to/docker-compose.prod.yml restart nginx > /dev/null 2>&1 || true
    endscript
}
EOF
```

## 💾 Backup & Recovery

### 1. Automated Backup Setup

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Set up daily backups with cron
crontab -e

# Add cron job for daily backups at 2 AM
0 2 * * * /path/to/AI-Promote/scripts/backup.sh daily-$(date +\%Y\%m\%d) full
```

### 2. Manual Backup

```bash
# Create immediate backup
./scripts/backup.sh manual-backup full

# Backup specific components
./scripts/backup.sh db-backup database
./scripts/backup.sh files-backup files
```

### 3. Disaster Recovery Test

```bash
# Test backup restoration (staging environment)
./scripts/restore.sh daily-20240115 full

# Verify data integrity
docker-compose -f docker-compose.staging.yml exec backend npm run test:integration
```

## 🔄 Maintenance

### 1. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker system prune -f
```

### 2. SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal (cron job)
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Maintenance

```bash
# Database optimization
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d aipromotdb_prod -c "VACUUM ANALYZE;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d aipromotdb_prod -c "SELECT pg_size_pretty(pg_database_size('aipromotdb_prod'));"
```

### 4. Performance Monitoring

```bash
# Check resource usage
docker stats

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/

# Database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d aipromotdb_prod -c "SELECT * FROM pg_stat_activity;"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check container status
docker ps -a

# Restart specific service
docker-compose -f docker-compose.prod.yml restart service-name
```

#### 2. Database Connection Issues
```bash
# Check database connectivity
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('DB OK')).catch(console.error);
"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew certificate
sudo certbot renew --force-renewal -d yourdomain.com
```

#### 4. High Resource Usage
```bash
# Check container resource usage
docker stats

# Check system resources
htop
df -h
free -m

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart
```

### Emergency Procedures

#### 1. Service Outage
```bash
# Quick health check
./scripts/health-check.sh

# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
./scripts/deploy.sh production previous-version

# Emergency maintenance page
sudo cp maintenance.html /var/www/html/index.html
```

#### 2. Data Recovery
```bash
# List available backups
ls -la /opt/aipromotapp/backups/

# Restore from backup
./scripts/restore.sh backup-name full

# Verify data integrity
./scripts/verify-data.sh
```

## 📞 Support & Monitoring

### Health Check Endpoints

- **Backend**: `https://yourdomain.com/health`
- **Frontend**: `https://yourdomain.com/`
- **Database**: Check via backend health endpoint

### Monitoring Dashboards

- **Sentry**: Error tracking and performance
- **LogRocket**: User session recording
- **System**: Server metrics via htop/docker stats

### Alerting Setup

Configure alerts for:
- Service downtime
- High error rates
- Resource exhaustion
- SSL certificate expiration
- Backup failures

## 🎯 Performance Optimization

### 1. Database Optimization
- Regular VACUUM and ANALYZE
- Index optimization
- Connection pooling
- Query optimization

### 2. Caching Strategy
- Redis for session storage
- Nginx proxy caching
- CDN for static assets
- Browser caching headers

### 3. Resource Limits
- Container memory limits
- CPU throttling
- Rate limiting
- Connection limits

---

**Security Note**: Always use secure passwords, keep secrets encrypted, enable 2FA where possible, and regularly update all components.

**Backup Verification**: Test your backups regularly to ensure they can be restored successfully.

**Monitoring**: Set up comprehensive monitoring and alerting to detect issues before they affect users.

For additional support, refer to the project documentation or contact the development team.
