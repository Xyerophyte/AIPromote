import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FounderIntakeWizard } from '@/components/intake/founder-intake-wizard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

// Mock next-auth/react for components that use it
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock API calls
jest.mock('@/lib/api/startups', () => ({
  createStartup: jest.fn(),
  updateStartup: jest.fn(),
  getStartup: jest.fn(),
}));

jest.mock('@/lib/api/admin', () => ({
  getDashboardStats: jest.fn().mockResolvedValue({
    users: { total: 150, active: 120, newThisMonth: 25 },
    startups: { total: 45, activeProjects: 38, completedIntakes: 42 },
    content: { generated: 1250, published: 980, scheduled: 85 },
    system: { uptime: '99.9%', responseTime: '245ms', errorRate: '0.1%' },
  }),
  getRecentUsers: jest.fn().mockResolvedValue([]),
  getSystemLogs: jest.fn().mockResolvedValue([]),
}));

describe('UI Component Snapshots', () => {
  describe('Button Component', () => {
    it('should render default button', () => {
      const { container } = render(<Button>Click me</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
      
      variants.forEach(variant => {
        const { container } = render(
          <Button variant={variant}>Button {variant}</Button>
        );
        expect(container.firstChild).toMatchSnapshot(`button-variant-${variant}`);
      });
    });

    it('should render button sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;
      
      sizes.forEach(size => {
        const { container } = render(
          <Button size={size}>Button {size}</Button>
        );
        expect(container.firstChild).toMatchSnapshot(`button-size-${size}`);
      });
    });

    it('should render disabled button', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button with loading state', () => {
      const { container } = render(
        <Button disabled>
          <span className="animate-spin">⟳</span>
          Loading...
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Component', () => {
    it('should render default input', () => {
      const { container } = render(<Input />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with placeholder', () => {
      const { container } = render(<Input placeholder="Enter your email" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with value', () => {
      const { container } = render(<Input value="test@example.com" readOnly />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render different input types', () => {
      const types = ['text', 'email', 'password', 'number', 'search'] as const;
      
      types.forEach(type => {
        const { container } = render(<Input type={type} placeholder={`Enter ${type}`} />);
        expect(container.firstChild).toMatchSnapshot(`input-type-${type}`);
      });
    });

    it('should render disabled input', () => {
      const { container } = render(<Input disabled placeholder="Disabled input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with error state', () => {
      const { container } = render(
        <Input 
          className="border-red-500 focus:border-red-500" 
          placeholder="Invalid input"
          aria-invalid="true"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Card Component', () => {
    it('should render basic card', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with complex content', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Statistics Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
            <Progress value={75} className="w-full" />
          </CardContent>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Component', () => {
    it('should render default badge', () => {
      const { container } = render(<Badge>New</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render badge variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
      
      variants.forEach(variant => {
        const { container } = render(
          <Badge variant={variant}>Badge {variant}</Badge>
        );
        expect(container.firstChild).toMatchSnapshot(`badge-variant-${variant}`);
      });
    });

    it('should render status badges', () => {
      const statuses = [
        { label: 'Active', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
        { label: 'Pending', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
        { label: 'Inactive', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      ];

      statuses.forEach(status => {
        const { container } = render(
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        );
        expect(container.firstChild).toMatchSnapshot(`badge-status-${status.label.toLowerCase()}`);
      });
    });
  });

  describe('Progress Component', () => {
    it('should render progress at different values', () => {
      const values = [0, 25, 50, 75, 100];
      
      values.forEach(value => {
        const { container } = render(<Progress value={value} />);
        expect(container.firstChild).toMatchSnapshot(`progress-${value}percent`);
      });
    });

    it('should render indeterminate progress', () => {
      const { container } = render(<Progress />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render progress with custom styling', () => {
      const { container } = render(
        <Progress 
          value={60} 
          className="h-4 bg-gray-200"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Form Components Layout', () => {
    it('should render form with multiple components', () => {
      const { container } = render(
        <form className="space-y-4 p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input 
              id="email"
              type="email" 
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input 
              id="password"
              type="password" 
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="rounded border-gray-300"
            />
            <label htmlFor="remember" className="text-sm">
              Remember me
            </label>
          </div>

          <div className="flex space-x-3">
            <Button type="submit">Sign In</Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render error state form', () => {
      const { container } = render(
        <form className="space-y-4 p-6">
          <div>
            <label htmlFor="email-error" className="block text-sm font-medium mb-2 text-red-700">
              Email Address
            </label>
            <Input 
              id="email-error"
              type="email" 
              placeholder="Enter your email"
              className="border-red-500 focus:border-red-500"
              aria-invalid="true"
            />
            <p className="text-red-600 text-sm mt-1">Please enter a valid email address</p>
          </div>
          
          <Button type="submit" disabled>
            Sign In
          </Button>
        </form>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Complex Components', () => {
    it('should render FounderIntakeWizard initial state', () => {
      const { container } = render(<FounderIntakeWizard />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render FounderIntakeWizard with initial data', () => {
      const initialData = {
        companyName: 'Test Company',
        industry: 'Technology',
        stage: 'seed',
        description: 'A test company for snapshot testing',
      };

      const { container } = render(
        <FounderIntakeWizard initialData={initialData} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render AdminDashboard', () => {
      const { container } = render(<AdminDashboard />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Responsive Layout Snapshots', () => {
    it('should render mobile-optimized card layout', () => {
      const { container } = render(
        <div className="p-4 space-y-4 max-w-sm">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mobile Card</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-gray-600 mb-3">
                This is how the card looks on mobile devices.
              </p>
              <Button size="sm" className="w-full">
                Action Button
              </Button>
            </CardContent>
          </Card>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render desktop grid layout', () => {
      const { container } = render(
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Card {i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Content for card {i}</p>
                <div className="mt-3 flex justify-between items-center">
                  <Badge variant={i % 2 === 0 ? 'default' : 'secondary'}>
                    Status {i}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Mode Snapshots', () => {
    it('should render components in dark mode', () => {
      const { container } = render(
        <div className="dark bg-gray-900 text-white p-6 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Dark Mode Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                This is how components look in dark mode.
              </p>
              <div className="space-y-3">
                <Input 
                  placeholder="Dark mode input"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <div className="flex space-x-2">
                  <Button variant="default">Primary</Button>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                    Outline
                  </Button>
                  <Button variant="ghost" className="text-white hover:bg-gray-700">
                    Ghost
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Loading States', () => {
    it('should render skeleton loading states', () => {
      const { container } = render(
        <div className="space-y-4 p-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-4"></div>
            </CardContent>
          </Card>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render loading spinner states', () => {
      const { container } = render(
        <div className="space-y-4 p-6">
          <Button disabled>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </Button>
          
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
