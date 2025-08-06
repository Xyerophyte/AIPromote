import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Activity,
  BarChart3,
  Flag,
  FileText,
  MessageSquare,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Bell,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  checks: Record<string, any>;
  database: {
    totalUsers: number;
    activeUsers: number;
    totalContent: number;
    scheduledPosts: number;
    failedPosts: number;
    activeSubscriptions: number;
  };
  errors: {
    recentErrors: number;
  };
  performance: {
    memory: any;
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

interface Analytics {
  timeframe: string;
  userGrowth: number;
  contentStats: any[];
  platformStats: any[];
  revenue: {
    monthly: number;
    activeSubscriptions: number;
  };
  engagement: any;
}

interface AdminNotification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [healthResponse, analyticsResponse] = await Promise.all([
        fetch('/api/v1/admin/health/system'),
        fetch('/api/v1/admin/analytics/overview?timeframe=24h')
      ]);

      const health = await healthResponse.json();
      const analytics = await analyticsResponse.json();

      setSystemHealth(health);
      setAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/v1/admin/notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-400" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Banner */}
        {systemHealth && (
          <div className={`rounded-lg p-4 mb-8 ${getStatusColor(systemHealth.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {systemHealth.status === 'HEALTHY' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : systemHealth.status === 'WARNING' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium">
                    System Status: {systemHealth.status}
                  </h3>
                  <p className="text-sm">
                    {systemHealth.status === 'HEALTHY' && 'All systems operational'}
                    {systemHealth.status === 'WARNING' && 'Some issues detected'}
                    {systemHealth.status === 'CRITICAL' && 'Critical issues require attention'}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'moderation', name: 'Moderation', icon: Shield },
              { id: 'health', name: 'System Health', icon: Activity },
              { id: 'analytics', name: 'Analytics', icon: BarChart3 },
              { id: 'features', name: 'Feature Flags', icon: Flag },
              { id: 'audit', name: 'Audit Logs', icon: FileText },
              { id: 'support', name: 'Support', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && <OverviewTab systemHealth={systemHealth} analytics={analytics} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'moderation' && <ModerationTab />}
          {activeTab === 'health' && <HealthTab systemHealth={systemHealth} />}
          {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Recent Alerts</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(notification.severity)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ systemHealth: SystemHealth | null; analytics: Analytics | null }> = ({ systemHealth, analytics }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Key Metrics */}
    <div className="lg:col-span-2 grid grid-cols-2 gap-6">
      {systemHealth && [
        {
          title: 'Total Users',
          value: systemHealth.database.totalUsers.toLocaleString(),
          change: '+12%',
          icon: Users,
          color: 'blue'
        },
        {
          title: 'Active Users',
          value: systemHealth.database.activeUsers.toLocaleString(),
          change: '+8%',
          icon: Activity,
          color: 'green'
        },
        {
          title: 'Content Pieces',
          value: systemHealth.database.totalContent.toLocaleString(),
          change: '+15%',
          icon: FileText,
          color: 'purple'
        },
        {
          title: 'Failed Posts',
          value: systemHealth.database.failedPosts.toLocaleString(),
          change: systemHealth.database.failedPosts > 10 ? 'High' : 'Normal',
          icon: AlertTriangle,
          color: systemHealth.database.failedPosts > 10 ? 'red' : 'gray'
        }
      ].map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                <Icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {[
          { name: 'View Pending Moderation', count: 5 },
          { name: 'Review Support Tickets', count: 12 },
          { name: 'Check System Health', count: null },
          { name: 'Export Data', count: null }
        ].map((action, index) => (
          <button
            key={index}
            className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{action.name}</span>
              {action.count && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {action.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// Placeholder components for other tabs
const UsersTab: React.FC = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">User Management</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </div>
    <div className="p-6">
      <p className="text-gray-600">User management interface would be implemented here...</p>
    </div>
  </div>
);

const ModerationTab: React.FC = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-lg font-medium">Content Moderation</h2>
    </div>
    <div className="p-6">
      <p className="text-gray-600">Content moderation queue would be implemented here...</p>
    </div>
  </div>
);

const HealthTab: React.FC<{ systemHealth: SystemHealth | null }> = ({ systemHealth }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-medium">System Health</h2>
      </div>
      <div className="p-6">
        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{Math.round(systemHealth.performance.memory.heapUsed / 1024 / 1024)}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span>{Math.round(systemHealth.performance.uptime / 3600)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Node Version:</span>
                  <span>{systemHealth.performance.nodeVersion}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium mb-4">Database Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Subscriptions:</span>
                  <span>{systemHealth.database.activeSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Posts:</span>
                  <span>{systemHealth.database.scheduledPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Errors:</span>
                  <span className={systemHealth.errors.recentErrors > 0 ? 'text-red-600' : 'text-green-600'}>
                    {systemHealth.errors.recentErrors}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Loading system health data...</p>
        )}
      </div>
    </div>
  </div>
);

const AnalyticsTab: React.FC<{ analytics: Analytics | null }> = ({ analytics }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-lg font-medium">Platform Analytics</h2>
    </div>
    <div className="p-6">
      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.userGrowth}</p>
            <p className="text-sm text-gray-600">New Users (24h)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">${analytics.revenue.monthly}</p>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.revenue.activeSubscriptions}</p>
            <p className="text-sm text-gray-600">Active Subscriptions</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading analytics data...</p>
      )}
    </div>
  </div>
);

const FeaturesTab: React.FC = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-lg font-medium">Feature Flag Management</h2>
    </div>
    <div className="p-6">
      <p className="text-gray-600">Feature flag management would be implemented here...</p>
    </div>
  </div>
);

const AuditTab: React.FC = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-lg font-medium">Audit Logs</h2>
    </div>
    <div className="p-6">
      <p className="text-gray-600">Audit log viewer would be implemented here...</p>
    </div>
  </div>
);

const SupportTab: React.FC = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-lg font-medium">Customer Support</h2>
    </div>
    <div className="p-6">
      <p className="text-gray-600">Support ticket management would be implemented here...</p>
    </div>
  </div>
);

export default AdminDashboard;
