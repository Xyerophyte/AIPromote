# Analytics Dashboard & Reporting System

## Overview

The Analytics Dashboard provides comprehensive insights into your social media performance across all platforms. It features real-time metrics, growth tracking, competitor analysis, and automated report generation.

## Features

### 1. Real-time Analytics Dashboard
- **Live metrics updates** with configurable intervals (1m, 5m, 15m, 1h)
- **Interactive charts** showing engagement, reach, and growth trends
- **Platform comparison** tools with side-by-side metrics
- **Custom date range filtering** for flexible analysis periods
- **Anomaly detection** with automated alerts for unusual activity

### 2. Engagement Tracking
- **Comprehensive metrics**: Likes, comments, shares, saves, clicks
- **Engagement rate calculations** with industry benchmarks
- **Post-level performance** tracking and analysis
- **Trend analysis** comparing current vs previous periods
- **Content type performance** breakdown

### 3. Growth Metrics Visualization
- **Follower growth** tracking across all platforms
- **Reach and impressions** trends over time
- **Engagement growth** with milestone tracking
- **Growth velocity** calculations and projections
- **Performance benchmarking** against goals

### 4. Performance Comparison Tools
- **Previous period comparisons** (week-over-week, month-over-month)
- **Competitor benchmarking** with public metrics
- **Industry average comparisons** for context
- **Platform performance** side-by-side analysis
- **Content strategy effectiveness** metrics

### 5. Report Generation & Export
- **Multiple formats**: JSON, PDF, CSV, Excel
- **Automated report scheduling** with email delivery
- **Custom report templates** for different stakeholders
- **Executive summaries** with key insights
- **Visual charts inclusion** in exported reports
- **Historical data analysis** and trending

### 6. Competitor Analysis
- **Multi-platform competitor tracking** 
- **Content strategy analysis** including hashtag usage
- **Engagement rate comparisons** 
- **Posting frequency analysis**
- **Market positioning insights**
- **Competitive gaps identification**

## API Endpoints

### Dashboard Data
```
GET /api/v1/analytics/dashboard
Query Parameters:
- organizationId: string (required)
- platform: string (optional) - Filter by specific platform
- startDate: string (optional) - ISO date string
- endDate: string (optional) - ISO date string
- groupBy: string (default: 'day') - 'day', 'week', 'month'
- timeZone: string (default: 'UTC')

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalPosts": 125,
      "totalImpressions": 450000,
      "totalEngagements": 15600,
      "averageEngagementRate": 3.47,
      "followerGrowth": 12.5,
      "topPlatform": "LINKEDIN"
    },
    "chartData": {
      "timeSeriesData": [...],
      "platformBreakdown": [...],
      "engagementBreakdown": [...],
      "contentTypePerformance": [...]
    },
    "recentActivity": [...],
    "insights": [...]
  }
}
```

### Real-time Metrics
```
GET /api/v1/analytics/realtime
Query Parameters:
- organizationId: string (required)
- platform: string (optional)
- interval: string (default: '5m') - '1m', '5m', '15m', '1h'

Response:
{
  "success": true,
  "data": {
    "currentMetrics": {
      "activeUsers": 0,
      "recentEngagements": 234,
      "recentImpressions": 8945,
      "livePostsCount": 12
    },
    "timeSeriesData": [...],
    "alerts": [...]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Engagement Tracking
```
GET /api/v1/analytics/engagement
Query Parameters:
- organizationId: string (required)
- postId: string (optional) - Specific post analysis
- platform: string (optional)
- startDate: string (optional)
- endDate: string (optional)

Response:
{
  "success": true,
  "data": {
    "metrics": [...],
    "trends": {...},
    "summary": {
      "totalLikes": 5642,
      "totalComments": 892,
      "totalShares": 445,
      "totalImpressions": 125000,
      "averageEngagementRate": 5.58
    }
  }
}
```

### Growth Metrics
```
GET /api/v1/analytics/growth
Query Parameters:
- organizationId: string (required)
- platform: string (optional)
- metric: string (default: 'followers') - 'followers', 'engagement', 'reach', 'impressions'
- period: string (default: '30d') - '7d', '30d', '90d', '1y'

Response:
{
  "success": true,
  "data": {
    "currentValue": 12500,
    "previousValue": 11200,
    "changePercent": 11.6,
    "trend": "up",
    "chartData": [...],
    "milestones": [...]
  }
}
```

### Performance Comparison
```
GET /api/v1/analytics/comparison
Query Parameters:
- organizationId: string (required)
- compareWith: string (default: 'previous_period') - 'previous_period', 'competitors', 'industry_average'
- platforms: string[] (optional)
- startDate: string (required)
- endDate: string (required)
- metrics: string[] (default: ['engagement_rate'])

Response:
{
  "success": true,
  "data": {
    "current": {...},
    "comparison": {...},
    "insights": [...]
  }
}
```

### Report Generation
```
POST /api/v1/analytics/reports/generate
Body:
{
  "organizationId": "org_123",
  "reportType": "summary", // 'summary', 'detailed', 'performance', 'growth', 'competitor'
  "format": "pdf", // 'json', 'pdf', 'csv', 'excel'
  "platforms": ["TWITTER", "LINKEDIN"],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "includeCharts": true,
  "includeComparisons": false
}

Response:
{
  "success": true,
  "reportId": "report_abc123",
  "message": "Report generation started",
  "estimatedTime": "2-5 minutes"
}
```

### Report Status
```
GET /api/v1/analytics/reports/{reportId}/status

Response:
{
  "success": true,
  "data": {
    "id": "report_abc123",
    "status": "completed",
    "progress": 100,
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:03:00Z",
    "downloadUrl": "/api/v1/analytics/reports/report_abc123/download",
    "expiresAt": "2024-01-16T10:03:00Z"
  }
}
```

### Report Download
```
GET /api/v1/analytics/reports/{reportId}/download

Response: File download (PDF, CSV, Excel, or JSON)
```

### Competitor Analysis
```
POST /api/v1/analytics/competitor-analysis
Body:
{
  "organizationId": "org_123",
  "competitors": [
    {
      "name": "Competitor A",
      "handles": {
        "twitter": "@competitor_a",
        "linkedin": "competitor-a"
      }
    }
  ],
  "platforms": ["TWITTER", "LINKEDIN"],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "metrics": ["engagement_rate", "posting_frequency"]
}

Response:
{
  "success": true,
  "data": {
    "organization": {...},
    "competitors": [...],
    "insights": [...],
    "recommendations": [...],
    "market_position": {
      "ranking": {
        "by_followers": 2,
        "by_engagement": 1,
        "by_content_volume": 3
      },
      "strengths": [...],
      "weaknesses": [...],
      "opportunities": [...],
      "threats": [...]
    }
  }
}
```

### Top Performing Content
```
GET /api/v1/analytics/top-content
Query Parameters:
- organizationId: string (required)
- platform: string (optional)
- metric: string (default: 'engagement_rate')
- period: string (default: '30d')
- limit: number (default: 10, max: 50)

Response:
{
  "success": true,
  "data": [
    {
      "id": "analytics_123",
      "contentPiece": {
        "title": "Post Title",
        "body": "Post content...",
        "platform": "TWITTER",
        "hashtags": ["#marketing", "#growth"]
      },
      "likes": 156,
      "comments": 23,
      "shares": 12,
      "impressions": 4500,
      "engagementRate": 4.24,
      "metricValue": 4.24
    }
  ]
}
```

### Analytics Insights
```
GET /api/v1/analytics/insights
Query Parameters:
- organizationId: string (required)
- platform: string (optional)
- period: string (default: '30d')

Response:
{
  "success": true,
  "data": [
    {
      "type": "positive",
      "title": "Strong Engagement Performance",
      "description": "Your content is performing well with 4.2% average engagement rate.",
      "impact": "high",
      "actionRequired": false
    },
    {
      "type": "opportunity",
      "title": "Increase Posting Frequency",
      "description": "Your posting schedule varies significantly. Consistent posting can improve audience engagement.",
      "impact": "medium",
      "actionRequired": true
    }
  ]
}
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
The analytics system uses the existing Prisma schema with the Analytics model for storing metrics.

### 3. Environment Variables
Add the following to your `.env` file:
```env
# Analytics Configuration
ANALYTICS_COLLECTION_INTERVAL=hourly
ANALYTICS_RETENTION_DAYS=365
COMPETITOR_API_RATE_LIMIT=100

# Report Generation
REPORTS_STORAGE_PATH=./reports
REPORTS_RETENTION_DAYS=30

# External APIs for Competitor Analysis
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
LINKEDIN_API_KEY=your_linkedin_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
```

### 4. Start the Server
```bash
npm run dev
```

## Usage Examples

### Frontend Integration

#### React Dashboard Component
```jsx
import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AnalyticsDashboard = ({ organizationId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchRealtimeData, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [organizationId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/v1/analytics/dashboard?organizationId=${organizationId}&groupBy=day`);
      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch(`/api/v1/analytics/realtime?organizationId=${organizationId}&interval=5m`);
      const data = await response.json();
      setRealtimeData(data.data);
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="metric-card">
          <h3>Total Posts</h3>
          <p className="metric-value">{dashboardData.summary.totalPosts}</p>
        </div>
        <div className="metric-card">
          <h3>Total Impressions</h3>
          <p className="metric-value">{dashboardData.summary.totalImpressions.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Engagement Rate</h3>
          <p className="metric-value">{dashboardData.summary.averageEngagementRate.toFixed(1)}%</p>
        </div>
        <div className="metric-card">
          <h3>Follower Growth</h3>
          <p className="metric-value">+{dashboardData.summary.followerGrowth}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Engagement Over Time</h3>
          <Line data={formatTimeSeriesData(dashboardData.chartData.timeSeriesData)} />
        </div>
        
        <div className="chart-container">
          <h3>Platform Performance</h3>
          <Bar data={formatPlatformData(dashboardData.chartData.platformBreakdown)} />
        </div>
        
        <div className="chart-container">
          <h3>Engagement Types</h3>
          <Doughnut data={formatEngagementData(dashboardData.chartData.engagementBreakdown)} />
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        {dashboardData.insights.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.type}`}>
            <h4>{insight.title}</h4>
            <p>{insight.description}</p>
            {insight.actionRequired && <span className="action-required">Action Required</span>}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h3>Recent Activity</h3>
        {dashboardData.recentActivity.map((activity, index) => (
          <div key={index} className="activity-item">
            <span className="activity-type">{activity.type}</span>
            <span className="activity-title">{activity.title}</span>
            <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions for chart formatting
const formatTimeSeriesData = (data) => ({
  labels: data.map(item => item.date),
  datasets: [
    {
      label: 'Engagement Rate',
      data: data.map(item => item.engagementRate),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    },
    {
      label: 'Impressions',
      data: data.map(item => item.impressions),
      borderColor: 'rgb(255, 99, 132)',
      yAxisID: 'y1'
    }
  ]
});

export default AnalyticsDashboard;
```

#### Report Generation Component
```jsx
const ReportGenerator = ({ organizationId }) => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'summary',
    format: 'pdf',
    platforms: ['TWITTER', 'LINKEDIN'],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeCharts: true,
    includeComparisons: false
  });
  
  const [reportStatus, setReportStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/analytics/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportConfig, organizationId })
      });
      
      const data = await response.json();
      if (data.success) {
        pollReportStatus(data.reportId);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollReportStatus = async (reportId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/v1/analytics/reports/${reportId}/status`);
        const data = await response.json();
        
        setReportStatus(data.data);
        
        if (data.data.status === 'completed') {
          // Report is ready for download
          return;
        } else if (data.data.status === 'failed') {
          console.error('Report generation failed');
          return;
        }
        
        // Continue polling
        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error('Failed to check report status:', error);
      }
    };
    
    checkStatus();
  };

  const downloadReport = () => {
    if (reportStatus && reportStatus.downloadUrl) {
      window.open(reportStatus.downloadUrl, '_blank');
    }
  };

  return (
    <div className="report-generator">
      <h3>Generate Analytics Report</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Report Type</label>
          <select 
            value={reportConfig.reportType} 
            onChange={(e) => setReportConfig({...reportConfig, reportType: e.target.value})}
          >
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
            <option value="performance">Performance Report</option>
            <option value="growth">Growth Report</option>
            <option value="competitor">Competitor Report</option>
          </select>
        </div>

        <div className="form-group">
          <label>Format</label>
          <select 
            value={reportConfig.format} 
            onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <input 
            type="date" 
            value={reportConfig.startDate} 
            onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>End Date</label>
          <input 
            type="date" 
            value={reportConfig.endDate} 
            onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
          />
        </div>
      </div>

      <div className="form-options">
        <label>
          <input 
            type="checkbox" 
            checked={reportConfig.includeCharts} 
            onChange={(e) => setReportConfig({...reportConfig, includeCharts: e.target.checked})}
          />
          Include Charts
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={reportConfig.includeComparisons} 
            onChange={(e) => setReportConfig({...reportConfig, includeComparisons: e.target.checked})}
          />
          Include Comparisons
        </label>
      </div>

      <button onClick={generateReport} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Report'}
      </button>

      {reportStatus && (
        <div className="report-status">
          <p>Status: {reportStatus.status}</p>
          <p>Progress: {reportStatus.progress}%</p>
          {reportStatus.status === 'completed' && (
            <button onClick={downloadReport}>Download Report</button>
          )}
        </div>
      )}
    </div>
  );
};
```

## Advanced Features

### Custom Metrics Tracking
You can track custom metrics by extending the analytics system:

```typescript
// Custom metric tracking
await analyticsService.trackCustomMetric({
  organizationId: 'org_123',
  metricName: 'newsletter_signups',
  value: 15,
  source: 'linkedin_post',
  metadata: {
    campaignId: 'campaign_456',
    postId: 'post_789'
  }
});
```

### Automated Alert System
Set up automated alerts for significant changes:

```typescript
const alertConfig = {
  organizationId: 'org_123',
  rules: [
    {
      metric: 'engagement_rate',
      threshold: 50, // 50% change
      direction: 'decrease',
      notify: ['email', 'slack']
    },
    {
      metric: 'follower_count',
      threshold: 1000, // absolute value
      direction: 'increase',
      notify: ['email']
    }
  ]
};
```

### Data Export & Integration
Export data to external systems:

```bash
# Export to data warehouse
POST /api/v1/analytics/export
{
  "organizationId": "org_123",
  "destination": "bigquery",
  "dataset": "social_media_analytics",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

## Performance Considerations

1. **Data Aggregation**: Large datasets are pre-aggregated for faster queries
2. **Caching**: Frequently accessed data is cached with Redis
3. **Rate Limiting**: API calls are rate-limited to prevent abuse
4. **Pagination**: Large result sets are paginated
5. **Background Processing**: Heavy computations run in background jobs

## Security

1. **Authentication**: All endpoints require valid authentication
2. **Authorization**: Users can only access their organization's data
3. **Data Encryption**: Sensitive data is encrypted at rest
4. **API Rate Limiting**: Prevents abuse and ensures fair usage
5. **Input Validation**: All inputs are validated using Zod schemas

## Monitoring & Logging

The system includes comprehensive monitoring:

1. **Performance Metrics**: Response times, error rates, throughput
2. **Business Metrics**: Usage patterns, popular features, user engagement
3. **Error Tracking**: Detailed error logs with stack traces
4. **Health Checks**: System health monitoring with alerts

## Support

For issues or questions:

1. Check the API documentation above
2. Review error messages and logs
3. Test with smaller date ranges if experiencing timeouts
4. Contact the development team for advanced customizations

## Roadmap

Planned features for future releases:

1. **Predictive Analytics**: ML-powered forecasting
2. **Sentiment Analysis**: Content sentiment tracking
3. **A/B Testing**: Built-in A/B testing for content
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **API Webhooks**: Real-time data streaming to external systems
6. **Mobile App**: Dedicated mobile analytics app
7. **Advanced Visualizations**: Interactive charts and data exploration tools
