import { redis } from '../config/redis';
import { config } from '../config/config';
import { securityLogger, SecurityEvent } from '../middleware/security';

interface SecurityAlert {
  id: string;
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'INTRUSION_ATTEMPT' | 'DATA_BREACH' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'SYSTEM_ANOMALY';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  metadata: Record<string, any>;
  acknowledged: boolean;
  resolved: boolean;
}

interface ThreatIntelligence {
  ip: string;
  riskScore: number;
  knownThreats: string[];
  geolocation: {
    country: string;
    region: string;
    city: string;
    asn: string;
  };
  reputation: {
    malware: boolean;
    spam: boolean;
    phishing: boolean;
    botnet: boolean;
  };
}

interface SecurityMetrics {
  totalThreats: number;
  blockedIPs: number;
  suspiciousActivity: number;
  rateLimitViolations: number;
  dataBreachAttempts: number;
  systemAnomalies: number;
  averageResponseTime: number;
  uptime: number;
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private alerts: Map<string, SecurityAlert> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private isMonitoring = false;

  private readonly ALERT_CHANNELS = {
    email: process.env.SECURITY_ALERT_EMAIL || 'security@aipromotapp.com',
    slack: process.env.SLACK_WEBHOOK_URL,
    discord: process.env.DISCORD_WEBHOOK_URL,
    pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY,
  };

  private readonly THREAT_THRESHOLDS = {
    CRITICAL: {
      failedLogins: 50,
      rateLimitViolations: 1000,
      suspiciousIPs: 100,
      errorRate: 50, // percentage
    },
    HIGH: {
      failedLogins: 25,
      rateLimitViolations: 500,
      suspiciousIPs: 50,
      errorRate: 25,
    },
    MEDIUM: {
      failedLogins: 10,
      rateLimitViolations: 100,
      suspiciousIPs: 20,
      errorRate: 10,
    },
  };

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // Start continuous monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🛡️  Security monitoring started');

    // Monitor security events every minute
    setInterval(() => this.monitorSecurityEvents(), 60000);

    // Analyze threat patterns every 5 minutes
    setInterval(() => this.analyzeThreatPatterns(), 300000);

    // Generate security reports every hour
    setInterval(() => this.generateSecurityReport(), 3600000);

    // Cleanup old data every 24 hours
    setInterval(() => this.cleanupOldData(), 86400000);
  }

  // Stop monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛡️  Security monitoring stopped');
  }

  // Monitor security events in real-time
  private async monitorSecurityEvents(): Promise<void> {
    try {
      const events = securityLogger.getRecentEvents(100);
      const recentEvents = events.filter(event => 
        Date.now() - event.timestamp.getTime() < 60000 // Last minute
      );

      for (const event of recentEvents) {
        await this.processSecurityEvent(event);
      }

      // Check for anomalies
      await this.detectAnomalies(recentEvents);
    } catch (error) {
      console.error('Error monitoring security events:', error);
    }
  }

  // Process individual security events
  private async processSecurityEvent(event: SecurityEvent): Promise<void> {
    const riskScore = this.calculateRiskScore(event);
    
    // Update threat intelligence
    await this.updateThreatIntelligence(event.ip, riskScore, event);

    // Check if we need to create an alert
    if (riskScore >= 70) {
      await this.createAlert({
        type: 'CRITICAL',
        category: 'INTRUSION_ATTEMPT',
        title: 'High-Risk Security Event Detected',
        description: `${event.type}: ${event.details?.reason || 'Unknown'}`,
        source: event.ip,
        metadata: {
          event,
          riskScore,
          userAgent: event.userAgent,
          endpoint: event.endpoint,
        },
      });
    } else if (riskScore >= 50) {
      await this.createAlert({
        type: 'HIGH',
        category: 'SUSPICIOUS_ACTIVITY',
        title: 'Suspicious Activity Detected',
        description: `${event.type} from ${event.ip}`,
        source: event.ip,
        metadata: { event, riskScore },
      });
    }
  }

  // Calculate risk score for security events
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // Base score by event type
    switch (event.type) {
      case 'BLOCKED_REQUEST':
        score += 80;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        score += 60;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        score += 40;
        break;
      case 'INVALID_TOKEN':
        score += 30;
        break;
    }

    // Additional scoring factors
    if (event.details?.reason?.includes('injection')) score += 30;
    if (event.details?.reason?.includes('xss')) score += 25;
    if (event.details?.reason?.includes('traversal')) score += 25;
    if (event.details?.reason?.includes('bot')) score += 15;
    if (event.details?.reason?.includes('honeypot')) score += 20;

    // User agent scoring
    const suspiciousUserAgents = ['curl', 'wget', 'python', 'bot', 'scanner'];
    if (suspiciousUserAgents.some(ua => event.userAgent.toLowerCase().includes(ua))) {
      score += 10;
    }

    // Endpoint scoring (higher risk for admin/auth endpoints)
    if (event.endpoint.includes('/admin')) score += 15;
    if (event.endpoint.includes('/auth')) score += 10;
    if (event.endpoint.includes('/api/')) score += 5;

    return Math.min(score, 100);
  }

  // Update threat intelligence for IP addresses
  private async updateThreatIntelligence(
    ip: string, 
    riskScore: number, 
    event: SecurityEvent
  ): Promise<void> {
    try {
      let intel = this.threatIntelligence.get(ip);
      
      if (!intel) {
        intel = {
          ip,
          riskScore: 0,
          knownThreats: [],
          geolocation: await this.getGeolocation(ip),
          reputation: {
            malware: false,
            spam: false,
            phishing: false,
            botnet: false,
          },
        };
      }

      // Update risk score (weighted average)
      intel.riskScore = Math.round((intel.riskScore * 0.8) + (riskScore * 0.2));

      // Add threat type
      if (event.type === 'SUSPICIOUS_ACTIVITY' && event.details?.reason) {
        if (!intel.knownThreats.includes(event.details.reason)) {
          intel.knownThreats.push(event.details.reason);
        }
      }

      // Check external threat intelligence (if configured)
      if (intel.riskScore > 70) {
        const reputation = await this.checkReputationServices(ip);
        intel.reputation = { ...intel.reputation, ...reputation };
      }

      this.threatIntelligence.set(ip, intel);

      // Store in Redis for persistence
      await redis.setex(`threat_intel:${ip}`, 86400, JSON.stringify(intel));
    } catch (error) {
      console.error('Error updating threat intelligence:', error);
    }
  }

  // Get geolocation for IP address
  private async getGeolocation(ip: string): Promise<ThreatIntelligence['geolocation']> {
    try {
      // Use a free IP geolocation service
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      
      return {
        country: data.countryCode || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        asn: data.as || 'Unknown',
      };
    } catch (error) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        asn: 'Unknown',
      };
    }
  }

  // Check external reputation services
  private async checkReputationServices(ip: string): Promise<Partial<ThreatIntelligence['reputation']>> {
    const reputation: Partial<ThreatIntelligence['reputation']> = {};

    try {
      // Example: Check VirusTotal (requires API key)
      if (process.env.VIRUSTOTAL_API_KEY) {
        const vtResponse = await fetch(`https://www.virustotal.com/vtapi/v2/ip-address/report?apikey=${process.env.VIRUSTOTAL_API_KEY}&ip=${ip}`);
        const vtData = await vtResponse.json();
        
        if (vtData.response_code === 1) {
          reputation.malware = vtData.detected_urls?.length > 0 || false;
        }
      }

      // Example: Check AbuseIPDB (requires API key)
      if (process.env.ABUSEIPDB_API_KEY) {
        const abuseResponse = await fetch(`https://api.abuseipdb.com/api/v2/check`, {
          headers: {
            'Key': process.env.ABUSEIPDB_API_KEY,
            'Accept': 'application/json',
          },
          method: 'GET',
        });
        const abuseData = await abuseResponse.json();
        
        if (abuseData.data?.abuseConfidencePercentage > 75) {
          reputation.spam = true;
        }
      }
    } catch (error) {
      console.error('Error checking reputation services:', error);
    }

    return reputation;
  }

  // Detect anomalies in security patterns
  private async detectAnomalies(events: SecurityEvent[]): Promise<void> {
    const now = Date.now();
    const hourlyKeys = [`anomaly:${Math.floor(now / 3600000)}`];

    try {
      // Check for unusual patterns
      const ipCounts = new Map<string, number>();
      const userAgentCounts = new Map<string, number>();
      const endpointCounts = new Map<string, number>();

      events.forEach(event => {
        ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
        userAgentCounts.set(event.userAgent, (userAgentCounts.get(event.userAgent) || 0) + 1);
        endpointCounts.set(event.endpoint, (endpointCounts.get(event.endpoint) || 0) + 1);
      });

      // Check for IP anomalies
      for (const [ip, count] of ipCounts.entries()) {
        if (count > 10) { // More than 10 security events from one IP in a minute
          await this.createAlert({
            type: 'HIGH',
            category: 'SYSTEM_ANOMALY',
            title: 'IP Anomaly Detected',
            description: `Unusual activity from IP ${ip}: ${count} security events in 1 minute`,
            source: ip,
            metadata: { ip, count, timeframe: '1 minute' },
          });
        }
      }

      // Check for endpoint targeting
      for (const [endpoint, count] of endpointCounts.entries()) {
        if (count > 20) { // More than 20 attempts on one endpoint
          await this.createAlert({
            type: 'MEDIUM',
            category: 'SUSPICIOUS_ACTIVITY',
            title: 'Endpoint Targeting Detected',
            description: `Unusual targeting of endpoint ${endpoint}: ${count} attempts in 1 minute`,
            source: 'multiple',
            metadata: { endpoint, count, timeframe: '1 minute' },
          });
        }
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }

  // Create security alert
  private async createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<void> {
    const alert: SecurityAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alert.id, alert);

    // Store in Redis for persistence
    await redis.setex(`security_alert:${alert.id}`, 604800, JSON.stringify(alert)); // 1 week

    // Send notifications
    await this.sendAlertNotifications(alert);

    console.log(`🚨 Security Alert [${alert.type}]: ${alert.title}`);
  }

  // Send alert notifications to configured channels
  private async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    const message = this.formatAlertMessage(alert);

    // Send to Slack
    if (this.ALERT_CHANNELS.slack && alert.type === 'CRITICAL') {
      await this.sendSlackAlert(message, alert);
    }

    // Send to Discord
    if (this.ALERT_CHANNELS.discord && ['CRITICAL', 'HIGH'].includes(alert.type)) {
      await this.sendDiscordAlert(message, alert);
    }

    // Send to PagerDuty for critical alerts
    if (this.ALERT_CHANNELS.pagerduty && alert.type === 'CRITICAL') {
      await this.sendPagerDutyAlert(alert);
    }

    // Send email for high-priority alerts
    if (['CRITICAL', 'HIGH'].includes(alert.type)) {
      await this.sendEmailAlert(alert);
    }
  }

  // Format alert message
  private formatAlertMessage(alert: SecurityAlert): string {
    return `🚨 **${alert.type} Security Alert**
    
**${alert.title}**
${alert.description}

**Source:** ${alert.source}
**Category:** ${alert.category}
**Time:** ${alert.timestamp.toISOString()}

**Metadata:**
${JSON.stringify(alert.metadata, null, 2)}`;
  }

  // Send Slack alert
  private async sendSlackAlert(message: string, alert: SecurityAlert): Promise<void> {
    try {
      await fetch(this.ALERT_CHANNELS.slack!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: '#security-alerts',
          username: 'Security Bot',
          icon_emoji: ':shield:',
          attachments: [{
            color: alert.type === 'CRITICAL' ? 'danger' : 'warning',
            fields: [
              { title: 'Alert ID', value: alert.id, short: true },
              { title: 'Source', value: alert.source, short: true },
              { title: 'Category', value: alert.category, short: true },
              { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
            ]
          }]
        }),
      });
    } catch (error) {
      console.error('Error sending Slack alert:', error);
    }
  }

  // Send Discord alert
  private async sendDiscordAlert(message: string, alert: SecurityAlert): Promise<void> {
    try {
      await fetch(this.ALERT_CHANNELS.discord!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          embeds: [{
            title: alert.title,
            description: alert.description,
            color: alert.type === 'CRITICAL' ? 15158332 : 16776960, // Red or Yellow
            fields: [
              { name: 'Source', value: alert.source, inline: true },
              { name: 'Category', value: alert.category, inline: true },
              { name: 'Alert ID', value: alert.id, inline: true },
            ],
            timestamp: alert.timestamp.toISOString(),
          }]
        }),
      });
    } catch (error) {
      console.error('Error sending Discord alert:', error);
    }
  }

  // Send PagerDuty alert
  private async sendPagerDutyAlert(alert: SecurityAlert): Promise<void> {
    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: this.ALERT_CHANNELS.pagerduty,
          event_action: 'trigger',
          payload: {
            summary: alert.title,
            severity: 'critical',
            source: alert.source,
            component: 'ai-promote-security',
            group: 'security',
            class: alert.category,
            custom_details: alert.metadata,
          },
        }),
      });
    } catch (error) {
      console.error('Error sending PagerDuty alert:', error);
    }
  }

  // Send email alert (placeholder - implement with your email service)
  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    // Implement with your email service (SendGrid, Mailgun, etc.)
    console.log(`📧 Email alert would be sent: ${alert.title}`);
  }

  // Generate security reports
  private async generateSecurityReport(): Promise<void> {
    try {
      const metrics = await this.collectSecurityMetrics();
      const report = {
        timestamp: new Date().toISOString(),
        period: 'hourly',
        metrics,
        topThreats: this.getTopThreats(),
        activeAlerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved),
      };

      // Store report
      await redis.setex(
        `security_report:${Date.now()}`, 
        86400, 
        JSON.stringify(report)
      );

      console.log('📊 Security report generated:', {
        threats: metrics.totalThreats,
        blockedIPs: metrics.blockedIPs,
        activeAlerts: report.activeAlerts.length,
      });
    } catch (error) {
      console.error('Error generating security report:', error);
    }
  }

  // Collect security metrics
  private async collectSecurityMetrics(): Promise<SecurityMetrics> {
    const blockedIPs = await redis.keys('blocked_ip:*');
    const suspiciousIPs = await redis.keys('suspicious:*');
    const rateLimitKeys = await redis.keys('rate_limit:*');

    const events = securityLogger.getRecentEvents(1000);
    const recentEvents = events.filter(event => 
      Date.now() - event.timestamp.getTime() < 3600000 // Last hour
    );

    return {
      totalThreats: recentEvents.length,
      blockedIPs: blockedIPs.length,
      suspiciousActivity: suspiciousIPs.length,
      rateLimitViolations: rateLimitKeys.length,
      dataBreachAttempts: recentEvents.filter(e => e.details?.reason?.includes('injection')).length,
      systemAnomalies: this.alerts.size,
      averageResponseTime: 0, // Would need to implement response time tracking
      uptime: Math.floor(process.uptime()),
    };
  }

  // Get top threats by IP
  private getTopThreats(): ThreatIntelligence[] {
    return Array.from(this.threatIntelligence.values())
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }

  // Clean up old data
  private async cleanupOldData(): Promise<void> {
    try {
      // Remove old alerts (older than 7 days)
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const alertsToDelete = Array.from(this.alerts.entries())
        .filter(([_, alert]) => alert.timestamp.getTime() < cutoff)
        .map(([id]) => id);

      alertsToDelete.forEach(id => {
        this.alerts.delete(id);
        redis.del(`security_alert:${id}`);
      });

      // Remove old threat intelligence (older than 30 days)
      const threatCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const threatsToDelete = Array.from(this.threatIntelligence.entries())
        .filter(([_, threat]) => threat.riskScore < 20) // Only remove low-risk entries
        .map(([ip]) => ip);

      threatsToDelete.forEach(ip => {
        this.threatIntelligence.delete(ip);
        redis.del(`threat_intel:${ip}`);
      });

      console.log(`🧹 Cleaned up ${alertsToDelete.length} old alerts and ${threatsToDelete.length} old threat records`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Generate unique alert ID
  private generateAlertId(): string {
    return `SEC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Public API methods
  public getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      await redis.setex(`security_alert:${alertId}`, 604800, JSON.stringify(alert));
      return true;
    }
    return false;
  }

  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.acknowledged = true;
      await redis.setex(`security_alert:${alertId}`, 604800, JSON.stringify(alert));
      return true;
    }
    return false;
  }

  public getThreatIntelligence(ip: string): ThreatIntelligence | undefined {
    return this.threatIntelligence.get(ip);
  }

  public async getSecurityMetrics(): Promise<SecurityMetrics> {
    return this.collectSecurityMetrics();
  }
}

// Export singleton instance
export const securityMonitoring = SecurityMonitoringService.getInstance();

// Auto-start monitoring in production
if (config.nodeEnv === 'production') {
  securityMonitoring.startMonitoring();
}
