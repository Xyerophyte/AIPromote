# NextAuth.js v5 with Supabase Integration - Implementation Guide

## Overview

This guide documents the complete implementation of NextAuth.js v5 with Supabase integration, including JWT strategy for serverless compatibility, OAuth providers (Google, GitHub), session management, user context providers, and protected route middleware.

## ✅ Implementation Status

### Completed Components

1. **✅ NextAuth.js v5 Installation**
   - Already installed: `next-auth@^5.0.0-beta.29`

2. **✅ Core Authentication Configuration**
   - `auth.ts` - Centralized NextAuth configuration
   - `src/app/api/auth/[...nextauth]/route.ts` - API routes
   - JWT strategy configured for serverless compatibility

3. **✅ Supabase Integration**
   - `src/lib/supabase.ts` - Supabase client configuration
   - Database schema for users, accounts, and sessions
   - OAuth provider integration with Supabase storage

4. **✅ OAuth Providers Setup**
   - Google OAuth provider with proper callbacks
   - GitHub OAuth provider with proper callbacks
   - Credentials provider for email/password authentication

5. **✅ Session Management**
   - `src/providers/session-provider.tsx` - Enhanced SessionProvider
   - JWT-based sessions with 30-day expiry
   - Automatic session refresh (5-minute intervals)

6. **✅ User Context and Hooks**
   - `src/contexts/UserContext.tsx` - Centralized user state management
   - `src/hooks/useAuth.ts` - Comprehensive authentication hook
   - Role-based access control helpers

7. **✅ Protected Route Middleware**
   - `src/middleware.ts` - NextAuth.js v5 compatible middleware
   - Route-based access control
   - API route protection
   - Role-based authorization

8. **✅ Protection Components**
   - `src/components/auth/ProtectedRoute.tsx` - Route protection component
   - Higher-Order Component (HOC) for route protection
   - Loading states and fallback handling

9. **✅ Enhanced Type Safety**
   - `src/types/auth.ts` - Comprehensive authentication types
   - NextAuth.js module augmentation
   - UserRole enum for RBAC

## File Structure

```
src/
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts              # NextAuth API routes
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx           # Route protection components
│   ├── providers/
│   │   └── SessionProvider.tsx          # Enhanced session provider
│   └── ui/
│       └── loading-spinner.tsx          # Loading component
├── contexts/
│   └── UserContext.tsx                  # User state management
├── hooks/
│   └── useAuth.ts                       # Authentication hook
├── lib/
│   ├── auth.ts                          # Auth exports
│   ├── auth-config.ts                   # Legacy config (now unused)
│   └── supabase.ts                      # Supabase client
├── providers/
│   └── session-provider.tsx             # Main session provider
├── types/
│   └── auth.ts                          # Authentication types
├── examples/
│   └── auth-usage.tsx                   # Usage examples
└── middleware.ts                        # Route protection middleware
auth.ts                                  # Main NextAuth configuration
```

## Environment Variables

Ensure these environment variables are configured:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Key Features

### 1. JWT Strategy for Serverless
- Configured for serverless environments (Vercel)
- No database sessions required for basic functionality
- User data synced with Supabase for persistence

### 2. OAuth Providers
- **Google**: Full OAuth2 flow with profile access
- **GitHub**: OAuth integration with user data
- **Credentials**: Email/password authentication with bcrypt

### 3. Role-Based Access Control (RBAC)
- Three roles: `user`, `admin`, `moderator`
- Hierarchical permissions (admin > moderator > user)
- Component and route-level protection

### 4. Middleware Protection
- Automatic route protection
- API endpoint protection
- Customizable redirect behavior
- Role-based access checks

### 5. Enhanced Session Management
- Client-side session provider
- Automatic refresh and sync
- Optimistic updates
- Error handling

## Usage Examples

### Basic Authentication Check
```tsx
import { useAuth } from "@/hooks/useAuth"

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <button onClick={() => login('google')}>Sign In</button>
  }
  
  return (
    <div>
      Welcome, {user?.name}!
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}
```

### Protected Routes
```tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { UserRole } from "@/types/auth"

function AdminPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <AdminPanel />
    </ProtectedRoute>
  )
}
```

### Server-Side Authentication
```tsx
import { auth } from "@/lib/auth"

export default async function ServerPage() {
  const session = await auth()
  
  if (!session) {
    return <div>Please sign in</div>
  }
  
  return <div>Hello, {session.user.name}!</div>
}
```

### API Route Protection
```tsx
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return NextResponse.json({ user: session.user })
}
```

## Database Schema (Supabase)

The implementation expects these tables in Supabase:

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image VARCHAR,
  role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  email_verified TIMESTAMPTZ,
  password_hash VARCHAR, -- For credentials provider
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Accounts Table (OAuth)
```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  provider_account_id VARCHAR NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR,
  scope VARCHAR,
  id_token TEXT,
  session_state VARCHAR,
  UNIQUE(provider, provider_account_id)
);
```

## Security Features

1. **CSRF Protection**: Built-in CSRF tokens
2. **Secure Cookies**: HTTP-only, SameSite, Secure in production
3. **JWT Signing**: Secret-based JWT signing
4. **Password Hashing**: bcrypt for stored passwords
5. **OAuth Security**: Proper state validation and PKCE
6. **Role Validation**: Server and client-side role checks

## Testing Considerations

- Use the examples in `src/examples/auth-usage.tsx` for testing
- Test OAuth flows in development with proper redirect URLs
- Verify protected routes work correctly
- Test role-based access control
- Validate session persistence and refresh

## Deployment Notes

1. **Environment Variables**: Ensure all required env vars are set
2. **OAuth Redirect URLs**: Update in provider consoles
3. **Supabase RLS**: Configure Row Level Security if needed
4. **HTTPS**: Required for OAuth in production
5. **Domain Configuration**: Set `NEXTAUTH_URL` correctly

## Next Steps

1. **Email Verification**: Implement email verification flow
2. **Password Reset**: Add forgot password functionality  
3. **Two-Factor Auth**: Consider 2FA implementation
4. **Audit Logging**: Add authentication event logging
5. **Rate Limiting**: Implement auth endpoint rate limiting

## Troubleshooting

### Common Issues
- **"Invalid CSRF token"**: Check `NEXTAUTH_SECRET` is set
- **OAuth errors**: Verify redirect URLs in provider settings
- **Database errors**: Check Supabase connection and table schema
- **Middleware redirect loops**: Review public routes configuration
- **Type errors**: Ensure proper TypeScript configuration

### Debug Mode
Set `NODE_ENV=development` to enable NextAuth debug logging.

## Dependencies

```json
{
  "next-auth": "^5.0.0-beta.29",
  "@supabase/supabase-js": "^2.53.0",
  "bcryptjs": "^3.0.2",
  "jose": "^6.0.12"
}
```

This implementation provides a production-ready authentication system with comprehensive features for modern Next.js applications using Vercel and Supabase.
