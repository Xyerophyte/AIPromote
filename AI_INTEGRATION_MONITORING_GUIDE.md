# AI Integration Monitoring & Troubleshooting Guide

## 🔍 Quick Health Check Commands

### 1. Test API Key Validity
```bash
node test-openai-integration.js
```
**Expected Output:** ✅ API Connection: PASS

### 2. Test Content Generation
```bash
node test-content-generation.js
```
**Expected Output:** ✅ Content generated successfully

### 3. Test Backend API (if server running)
```bash
node test-api-endpoint.js
```
**Expected Output:** ✅ Backend server is running

---

## 📊 Monitoring Dashboard URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **OpenAI Usage** | https://platform.openai.com/usage | Monitor API usage and costs |
| **OpenAI Dashboard** | https://platform.openai.com/dashboard | Manage API keys and settings |
| **Backend Health** | http://localhost:3001/health | Check backend service status |
| **API Documentation** | http://localhost:3001/docs | View API endpoints (if available) |

---

## 🚨 Common Issues & Solutions

### Issue 1: "401 No auth credentials found"
**Symptoms:**
- Content generation fails
- API connection test fails

**Solutions:**
1. Check API key in `.env` file:
   ```bash
   grep OPENAI_API_KEY .env
   ```
2. Ensure API key starts with `sk-` or `sk-or-` or `sk-proj-`
3. Verify API key has sufficient credits
4. Check environment variables are loaded:
   ```bash
   node -e "console.log(process.env.OPENAI_API_KEY ? 'API key found' : 'API key missing')"
   ```

### Issue 2: "429 Rate limit exceeded"
**Symptoms:**
- Requests fail intermittently
- Slow response times

**Solutions:**
1. Check current usage: https://platform.openai.com/usage
2. Implement request delays:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```
3. Reduce concurrent requests
4. Upgrade OpenAI plan if necessary

### Issue 3: "Connection timeout"
**Symptoms:**
- Long wait times
- Network errors

**Solutions:**
1. Check internet connection
2. Verify firewall settings
3. Test with longer timeout:
   ```javascript
   const response = await openai.chat.completions.create({
     // ... options
     timeout: 30000 // 30 seconds
   });
   ```

### Issue 4: "Invalid model"
**Symptoms:**
- Model not found errors
- Unexpected responses

**Solutions:**
1. Check available models:
   ```bash
   node -e "const OpenAI = require('openai'); const client = new OpenAI(); client.models.list().then(r => console.log(r.data.map(m => m.id).slice(0, 10)))"
   ```
2. Update model in environment variables:
   ```
   OPENAI_MODEL=gpt-3.5-turbo
   ```

---

## 📈 Performance Monitoring

### Key Metrics to Track

1. **Response Times**
   - Target: < 10 seconds
   - Warning: > 15 seconds
   - Critical: > 30 seconds

2. **Token Usage**
   - Track: tokens per request
   - Monitor: daily/monthly usage
   - Alert: approaching limits

3. **Success Rates**
   - Target: > 95%
   - Warning: < 90%
   - Critical: < 80%

4. **Error Rates**
   - Target: < 5%
   - Warning: > 10%
   - Critical: > 20%

### Monitoring Script
```bash
# Create monitoring script
cat > monitor-ai-health.js << 'EOF'
const { exec } = require('child_process');

async function checkHealth() {
  console.log('🔍 AI Integration Health Check');
  console.log('================================');
  
  // Test API connectivity
  exec('node test-openai-integration.js', (error, stdout, stderr) => {
    if (stdout.includes('API Connection: PASS')) {
      console.log('✅ API Connection: OK');
    } else {
      console.log('❌ API Connection: FAILED');
    }
  });
  
  // Check content generation
  exec('node test-content-generation.js', (error, stdout, stderr) => {
    if (stdout.includes('Content generated successfully')) {
      console.log('✅ Content Generation: OK');
    } else {
      console.log('❌ Content Generation: FAILED');
    }
  });
}

checkHealth();
setInterval(checkHealth, 300000); // Check every 5 minutes
EOF

node monitor-ai-health.js
```

---

## 🔧 Debugging Commands

### Check Environment Configuration
```bash
# List all environment variables
node -e "Object.keys(process.env).filter(k => k.includes('OPENAI')).forEach(k => console.log(k + ':', process.env[k] ? 'SET' : 'MISSING'))"
```

### Test API Key
```bash
# Quick API key test
node -e "
const OpenAI = require('openai');
const client = new OpenAI();
client.models.list()
  .then(() => console.log('✅ API key is valid'))
  .catch(e => console.log('❌ API key issue:', e.message));
"
```

### Check Backend Status
```bash
# Test backend health endpoint
curl -s http://localhost:3001/health | jq '.status' || echo "Backend not running"
```

### Validate Content Generation
```bash
# Test content generation endpoint
curl -X POST http://localhost:3001/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "test",
    "platform": "TWITTER",
    "contentType": "POST",
    "prompt": "Test content generation"
  }' | jq '.content.body' || echo "Content generation failed"
```

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check API usage against quotas
- [ ] Review error logs
- [ ] Monitor response times

### Weekly
- [ ] Review token usage trends
- [ ] Check for new OpenAI model updates
- [ ] Validate content quality scores

### Monthly
- [ ] Audit API key permissions
- [ ] Review and optimize prompts
- [ ] Update rate limiting configurations
- [ ] Test disaster recovery procedures

---

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API keys valid and funded
- [ ] Error handling tested
- [ ] Rate limiting configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Usage tracking enabled
- [ ] Error reporting functional
- [ ] Performance metrics baseline established

---

## 📞 Support Contacts

### Internal
- **API Issues:** Check backend logs and health endpoint
- **Performance Issues:** Monitor response times and token usage
- **Content Quality:** Review prompt engineering and safety scores

### External
- **OpenAI Support:** https://help.openai.com/
- **OpenAI Status:** https://status.openai.com/
- **OpenAI Community:** https://community.openai.com/

---

## 🔄 Update Procedures

### Updating API Keys
1. Generate new key at https://platform.openai.com/api-keys
2. Update `.env` files
3. Restart backend services
4. Run health checks
5. Monitor for any issues

### Updating Models
1. Check available models: `node -e "...models.list()..."`
2. Update `OPENAI_MODEL` in environment
3. Test with new model
4. Monitor response quality
5. Rollback if issues detected

---

**Last Updated:** January 8, 2025  
**Version:** 1.0  
**Status:** Production Ready
