# AI Promote - Monorepo

A modern full-stack application built with Next.js 15, React 19, FastifyJS, TypeScript, and PostgreSQL.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, and Shadcn UI
- **Backend**: Fastify server with TypeScript, Prisma ORM, and PostgreSQL
- **Shared**: Common types and utilities shared between frontend and backend

## 📁 Project Structure

```
├── frontend/          # Next.js React application
├── backend/           # Fastify API server
├── shared/            # Shared types and utilities
├── docker-compose.yml # Docker services configuration
├── .env.example       # Environment variables template
└── package.json       # Root package.json with workspaces
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd ai-promote
```

### 2. Environment Configuration

Copy the environment variables template:
```bash
cp .env.example .env
```

Update the `.env` file with your actual values.

### 3. Start Development Environment

#### Option A: Using Docker Compose (Recommended)
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

#### Option B: Local Development
```bash
# Install dependencies for all workspaces
npm install

# Start PostgreSQL and Redis only
docker-compose up -d postgres redis

# Start development servers
npm run dev
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate --workspace=backend

# Run database migrations
npm run db:migrate --workspace=backend

# Open Prisma Studio (optional)
npm run db:studio --workspace=backend
```

## 🛠️ Development

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend
- `npm run start` - Start both frontend and backend in production mode
- `npm run docker:up` - Start all Docker services
- `npm run docker:down` - Stop all Docker services

#### Frontend Specific
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production

#### Backend Specific
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production

### Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🗃️ Database

The application uses PostgreSQL as the primary database with Prisma as the ORM.

### Database Schema

- **Users**: User accounts and authentication
- **Accounts**: OAuth provider accounts
- **Sessions**: User session management
- **VerificationTokens**: Email verification tokens

## 🔧 Tech Stack

### Frontend
- **Framework**: Next.js 15
- **React**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: NextAuth.js (ready for implementation)

### Backend
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT

### DevOps
- **Containerization**: Docker & Docker Compose
- **Monorepo**: npm workspaces
- **Process Management**: PM2 (production)

## 🔐 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aipromotdb

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 5432, and 6379 are available
2. **Database connection**: Check PostgreSQL is running and credentials are correct
3. **Missing dependencies**: Run `npm install` in root directory

### Reset Everything
```bash
npm run docker:down
docker system prune -f
npm run docker:up
```

## 📚 Next Steps

1. Implement authentication system
2. Add user dashboard
3. Set up API endpoints
4. Configure email services
5. Add comprehensive testing
6. Set up CI/CD pipeline
