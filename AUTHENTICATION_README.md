# Authentication & User Management System

A comprehensive authentication system built with Next.js 15, NextAuth.js v5, and Fastify backend, featuring JWT tokens, OAuth providers, role-based access control (RBAC), and password reset functionality.

## Features Implemented

### ✅ Core Authentication
- **NextAuth.js v5** with JWT strategy
- **OAuth Providers**: Google and GitHub integration
- **Credentials-based login** with email/password
- **User registration** with email verification
- **Password reset functionality** via email
- **Session management** with token refresh
- **Secure password hashing** with bcryptjs

### ✅ Role-Based Access Control (RBAC)
- **Three user roles**: USER, MODERATOR, ADMIN
- **Middleware protection** for routes
- **Component-level access control**
- **Dynamic navigation** based on user roles

### ✅ Security Features
- **JWT tokens** for stateless authentication
- **CSRF protection** built-in with NextAuth.js
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **Secure password policies**
- **Email verification** for account security

### ✅ UI/UX Components
- **Responsive design** with Tailwind CSS
- **Form validation** with error handling
- **Loading states** and user feedback
- **Accessible forms** with proper labels
- **Professional UI components**

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/          # NextAuth.js API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── admin/             # Admin-only page
│   │   └── unauthorized/      # Access denied page
│   ├── components/ui/         # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Authentication configuration
│   ├── providers/             # React context providers
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Route protection middleware

backend/
├── src/
│   ├── routes/
│   │   └── auth.ts           # Authentication API endpoints
│   └── server.ts             # Fastify server configuration
```

## Environment Variables

### Frontend (.env.local)
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# JWT Configuration
JWT_SECRET=your-jwt-secret-here-change-this-in-production

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backend API URL
BACKEND_API_URL=http://localhost:8080
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

### 2. Configure OAuth Providers

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

#### GitHub OAuth Setup:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github`

### 3. Configure Email for Password Reset

For Gmail SMTP:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password
3. Use the app password in `SMTP_PASS`

### 4. Generate Secrets

```bash
# Generate secure random strings for secrets
openssl rand -base64 32
```

### 5. Start the Development Servers

```bash
# Start backend server (from root directory)
npm run dev:backend

# Start frontend server (from root directory)
npm run dev:frontend

# Or start both simultaneously
npm run dev
```

## API Endpoints

### Authentication Endpoints (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/signin` | User login |
| POST | `/auth/oauth` | OAuth user creation/update |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/user/:id` | Get user by ID |

### Frontend API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handler |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Password reset completion |

## Usage Examples

### Basic Authentication Hook

```tsx
import { useAuth } from '@/hooks/use-auth'

export default function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>
  
  return <div>Welcome, {user?.name}!</div>
}
```

### Role-Based Access Control

```tsx
import { useRequireRole } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth'

export default function AdminPage() {
  const { hasAccess, isLoading } = useRequireRole([UserRole.ADMIN])
  
  if (isLoading) return <div>Loading...</div>
  if (!hasAccess) return null // Middleware handles redirect
  
  return <div>Admin content here</div>
}
```

### Protected Route Component

```tsx
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, canAccess } = useAuth()
  
  if (!isAuthenticated) {
    return <SignInPrompt />
  }
  
  if (requiredRole && !canAccess([requiredRole])) {
    return <UnauthorizedAccess />
  }
  
  return children
}
```

### Manual Sign In/Out

```tsx
import { signIn, signOut } from 'next-auth/react'

// Sign in with provider
await signIn('google')
await signIn('github')

// Sign in with credentials
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false
})

// Sign out
await signOut({ callbackUrl: '/' })
```

## Route Protection

### Middleware Protection
The middleware automatically protects routes based on authentication status and user roles:

```typescript
// Protected routes require authentication
const protectedRoutes = ['/dashboard', '/profile']

// Role-based route permissions
const routePermissions = {
  '/admin': [UserRole.ADMIN],
  '/moderator': [UserRole.MODERATOR, UserRole.ADMIN]
}
```

### Component-Level Protection
Use hooks for component-level access control:

```tsx
// Require authentication
useRequireAuth()

// Require specific roles
useRequireRole([UserRole.ADMIN, UserRole.MODERATOR])

// Check permissions manually
const { canAccess } = useAuth()
if (canAccess([UserRole.ADMIN])) {
  // Show admin content
}
```

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| USER | Standard user | Basic dashboard, profile |
| MODERATOR | Content moderator | User features + moderation tools |
| ADMIN | System administrator | Full system access |

## Security Considerations

### Implemented Security Measures:
- ✅ Password hashing with bcryptjs
- ✅ JWT token validation
- ✅ CSRF protection via NextAuth.js
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ Secure session management
- ✅ Environment variable protection

### Additional Recommendations:
- Use HTTPS in production
- Implement refresh token rotation
- Add brute force protection
- Set up monitoring and logging
- Regular security audits
- Database query parameterization
- Content Security Policy headers

## Testing

### Manual Testing Checklist:

#### Authentication Flow:
- [ ] User registration with valid data
- [ ] User registration with duplicate email
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] OAuth login with Google
- [ ] OAuth login with GitHub
- [ ] Password reset request
- [ ] Password reset completion
- [ ] Session persistence across page refreshes

#### Authorization Testing:
- [ ] Access protected routes without authentication
- [ ] Access role-restricted pages with insufficient permissions
- [ ] Admin access to admin-only pages
- [ ] Moderator access to moderation tools
- [ ] User role restrictions

#### Security Testing:
- [ ] XSS prevention in forms
- [ ] CSRF token validation
- [ ] Rate limiting on auth endpoints
- [ ] Password strength requirements
- [ ] Token expiration handling

## Troubleshooting

### Common Issues:

1. **OAuth redirect mismatch**
   - Check redirect URIs in provider settings
   - Ensure NEXTAUTH_URL matches your domain

2. **Email sending fails**
   - Verify SMTP credentials
   - Check firewall settings
   - Use app-specific passwords for Gmail

3. **JWT token issues**
   - Ensure JWT_SECRET is set
   - Check token expiration settings
   - Verify NextAuth configuration

4. **Role-based access not working**
   - Check middleware configuration
   - Verify user role assignment
   - Test route permission settings

### Debug Mode:
Enable debug logging in development:
```bash
# Add to .env.local
NEXTAUTH_DEBUG=true
```

## Production Deployment

### Security Checklist:
- [ ] Use strong, unique secrets
- [ ] Enable HTTPS
- [ ] Configure proper CORS settings
- [ ] Set up database with proper indexes
- [ ] Implement proper logging
- [ ] Set up monitoring and alerts
- [ ] Regular backup procedures
- [ ] Security headers configuration

### Performance Optimizations:
- [ ] Database connection pooling
- [ ] Redis for session storage
- [ ] CDN for static assets
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Set up proper monitoring

This authentication system provides a solid foundation for secure user management with modern best practices and can be extended based on specific application requirements.
