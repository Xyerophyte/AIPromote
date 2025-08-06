# Contributing to AIPromote

Thank you for your interest in contributing to AIPromote! This document provides guidelines and information for contributors to help maintain code quality and streamline the development process.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Security](#security)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@aipromotapp.com. The project team will review and investigate all complaints and respond appropriately.

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** 20+ and npm 9+
- **Docker** and Docker Compose
- **Git**
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/your-username/AIPromote.git
cd AIPromote
```

3. Add the original repository as upstream:
```bash
git remote add upstream https://github.com/aipromotapp/AIPromote.git
```

### Environment Setup

1. Copy environment files:
```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

2. Update environment variables with your local values

3. Install dependencies:
```bash
npm install
```

4. Start development services:
```bash
# Using Docker (recommended)
npm run docker:up

# Or manually
npm run dev
```

5. Run database migrations:
```bash
npm run db:migrate --workspace=backend
```

---

## 🔄 Development Workflow

### Branch Strategy

We use **Git Flow** with the following branch structure:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features and enhancements
- **`bugfix/*`**: Bug fixes for develop branch
- **`hotfix/*`**: Critical fixes for production
- **`release/*`**: Preparation for production releases

### Creating a Feature Branch

```bash
# Start from develop
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Push to your fork
git push origin feature/your-feature-name
```

### Staying Updated

Regularly sync your fork with the upstream repository:

```bash
git checkout develop
git pull upstream develop
git push origin develop

# Update your feature branch
git checkout feature/your-feature-name
git rebase develop
```

---

## 📝 Coding Standards

### General Principles

1. **Consistency**: Follow existing code patterns and styles
2. **Readability**: Write self-documenting code with clear variable/function names
3. **Simplicity**: Prefer simple solutions over complex ones
4. **Performance**: Consider performance implications of your changes
5. **Security**: Always consider security implications

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and clear names
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (!userId.trim()) {
    throw new Error('User ID is required');
  }
  
  const user = await userService.getById(userId);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

// ❌ Bad: Implicit types and unclear names
async function getUser(id: any) {
  const u = await userService.getById(id);
  return u;
}
```

### React/Next.js Guidelines

```tsx
// ✅ Good: Functional components with TypeScript
interface ContentCardProps {
  content: ContentItem;
  onEdit: (contentId: string) => void;
  onDelete: (contentId: string) => void;
}

export function ContentCard({ content, onEdit, onDelete }: ContentCardProps) {
  const handleEdit = useCallback(() => {
    onEdit(content.id);
  }, [content.id, onEdit]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {content.platform}
          <Badge variant="outline">{content.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {content.body}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleEdit}>
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(content.id)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Backend/Fastify Guidelines

```typescript
// ✅ Good: Proper error handling and validation
async function createStartup(
  request: FastifyRequest<{
    Body: CreateStartupRequest;
  }>,
  reply: FastifyReply
) {
  try {
    // Validate input
    const validation = createStartupSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      });
    }

    // Check authorization
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User authentication required',
        },
      });
    }

    // Business logic
    const startup = await startupService.create({
      ...validation.data,
      userId: request.user.id,
    });

    return reply.status(201).send({
      success: true,
      data: startup,
    });
  } catch (error) {
    request.log.error(error, 'Failed to create startup');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create startup',
      },
    });
  }
}
```

### Database/Prisma Guidelines

```typescript
// ✅ Good: Use transactions and proper error handling
async function transferContent(
  fromStartupId: string,
  toStartupId: string,
  contentIds: string[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify ownership
    const fromStartup = await tx.startup.findFirst({
      where: { id: fromStartupId },
      include: { user: true },
    });

    if (!fromStartup) {
      throw new Error('Source startup not found');
    }

    // Update content ownership
    await tx.contentItem.updateMany({
      where: {
        id: { in: contentIds },
        startupId: fromStartupId,
      },
      data: {
        startupId: toStartupId,
        updatedAt: new Date(),
      },
    });

    // Log the transfer
    await tx.auditLog.create({
      data: {
        action: 'CONTENT_TRANSFER',
        entityId: fromStartupId,
        userId: fromStartup.userId,
        metadata: {
          toStartupId,
          contentIds,
          transferredAt: new Date().toISOString(),
        },
      },
    });
  });
}
```

### Styling Guidelines

- Use **Tailwind CSS** for styling
- Follow the existing design system
- Use **Shadcn UI** components when possible
- Ensure responsive design (mobile-first)

```tsx
// ✅ Good: Consistent spacing and responsive design
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
    <h3 className="text-lg font-semibold text-foreground mb-2">
      Card Title
    </h3>
    <p className="text-sm text-muted-foreground">
      Card description text here...
    </p>
  </Card>
</div>
```

---

## 📝 Commit Guidelines

### Commit Message Format

Use the **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix  
- **docs**: Documentation changes
- **style**: Formatting changes (no code logic changes)
- **refactor**: Code refactoring (no functionality changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependencies changes
- **ci**: CI/CD pipeline changes
- **chore**: Other maintenance tasks

### Examples

```bash
# Good commit messages
git commit -m "feat(auth): add two-factor authentication support"
git commit -m "fix(content): resolve duplicate content generation issue"
git commit -m "docs(api): update authentication endpoint documentation"
git commit -m "refactor(scheduling): extract scheduling logic into service class"
git commit -m "test(analytics): add unit tests for metrics calculation"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "update code"
git commit -m "WIP"
```

### Commit Best Practices

1. **Make atomic commits**: Each commit should represent one logical change
2. **Write descriptive messages**: Explain what and why, not how
3. **Use present tense**: "Add feature" not "Added feature"
4. **Keep the first line under 50 characters**
5. **Use the body to explain complex changes**

```bash
# Example of a detailed commit
git commit -m "feat(content): implement content series generation

- Add SeriesGenerator service for creating related content
- Support for weekly and bi-weekly series cadences  
- Automatically maintain consistent themes across series
- Include series metadata in content items

Closes #123"
```

---

## 🔍 Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**:
```bash
git checkout develop
git pull upstream develop
git checkout your-feature-branch
git rebase develop
```

2. **Run tests and linting**:
```bash
npm run test
npm run lint
npm run type-check
```

3. **Test your changes**:
- Test in development environment
- Verify your changes work as expected
- Check for any breaking changes

### PR Title and Description

**Title Format**: `<type>[scope]: <description>`

**Description Template**:
```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

## 🔄 Changes Made
- Bullet point list of changes
- Include any breaking changes
- Mention new dependencies

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## 📸 Screenshots
(If applicable, include screenshots of UI changes)

## ⚠️ Breaking Changes
(List any breaking changes and migration steps)

## 📝 Additional Notes
Any additional context or considerations for reviewers.

Closes #issue-number
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing for significant changes
4. **Documentation**: Update docs if needed

### Review Criteria

**Code Quality**:
- ✅ Follows coding standards
- ✅ Includes appropriate error handling
- ✅ Has sufficient test coverage
- ✅ Is well documented

**Functionality**:
- ✅ Solves the intended problem
- ✅ Doesn't introduce regressions
- ✅ Handles edge cases appropriately
- ✅ Maintains backward compatibility

**Performance**:
- ✅ Doesn't negatively impact performance
- ✅ Uses efficient algorithms/queries
- ✅ Appropriate caching strategies

**Security**:
- ✅ No security vulnerabilities
- ✅ Proper input validation
- ✅ Secure data handling
- ✅ Authentication/authorization checks

---

## 🧪 Testing

### Test Categories

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test full user workflows
4. **API Tests**: Test API endpoints

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

**Unit Test Example**:
```typescript
// content-generator.test.ts
import { ContentGenerator } from '../services/content-generator';
import { mockStartup, mockStrategy } from '../__mocks__/fixtures';

describe('ContentGenerator', () => {
  let generator: ContentGenerator;

  beforeEach(() => {
    generator = new ContentGenerator();
  });

  describe('generatePost', () => {
    it('should generate platform-specific content', async () => {
      const content = await generator.generatePost({
        startup: mockStartup,
        strategy: mockStrategy,
        platform: 'twitter',
        pillar: 'educational',
      });

      expect(content).toMatchObject({
        platform: 'twitter',
        pillar: 'educational',
        body: expect.stringMatching(/.{10,280}/), // Twitter length
        hashtags: expect.arrayContaining([expect.any(String)]),
      });
    });

    it('should respect brand guidelines', async () => {
      const startup = {
        ...mockStartup,
        brandRules: {
          forbiddenPhrases: ['revolutionary', 'game-changing'],
          allowedPhrases: ['innovative', 'cutting-edge'],
        },
      };

      const content = await generator.generatePost({
        startup,
        strategy: mockStrategy,
        platform: 'twitter',
        pillar: 'product',
      });

      // Should not contain forbidden phrases
      expect(content.body.toLowerCase()).not.toContain('revolutionary');
      expect(content.body.toLowerCase()).not.toContain('game-changing');
    });
  });
});
```

**Integration Test Example**:
```typescript
// startup-routes.test.ts
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { createTestUser, createTestStartup } from '../test-utils';

describe('Startup Routes', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = buildApp({ logger: false });
    await app.ready();
    
    const user = await createTestUser();
    authToken = generateJWT(user.id);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/startups', () => {
    it('should create a startup with valid data', async () => {
      const startupData = {
        name: 'Test Startup',
        url: 'https://test.com',
        stage: 'pre-seed',
        description: 'A test startup',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/startups',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: startupData,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({
        success: true,
        data: {
          name: startupData.name,
          url: startupData.url,
          stage: startupData.stage,
        },
      });
    });

    it('should return 400 for invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/startups',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: '', // Invalid: empty name
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });
  });
});
```

### Test Best Practices

1. **Descriptive test names**: Clearly describe what is being tested
2. **Arrange-Act-Assert pattern**: Structure tests clearly
3. **Mock external dependencies**: Use mocks for APIs, databases, etc.
4. **Test edge cases**: Include boundary conditions and error cases
5. **Maintain test data**: Use factories and fixtures for test data

---

## 📚 Documentation

### Code Documentation

**JSDoc Comments**:
```typescript
/**
 * Generates AI-powered content for social media platforms
 * @param options - Configuration options for content generation
 * @param options.startup - The startup information
 * @param options.strategy - The marketing strategy to follow
 * @param options.platform - Target social media platform
 * @param options.pillar - Content pillar/theme
 * @returns Promise resolving to generated content item
 * @throws {ValidationError} When input validation fails
 * @throws {GenerationError} When AI generation fails
 * 
 * @example
 * ```typescript
 * const content = await generateContent({
 *   startup: myStartup,
 *   strategy: myStrategy,
 *   platform: 'twitter',
 *   pillar: 'educational'
 * });
 * ```
 */
export async function generateContent(
  options: ContentGenerationOptions
): Promise<ContentItem> {
  // Implementation...
}
```

**README Updates**:
- Update README.md when adding new features
- Include setup instructions for new dependencies
- Add examples of new functionality

**API Documentation**:
- Update API documentation in `docs/API.md`
- Include request/response examples
- Document new endpoints and parameters

### Documentation Checklist

When contributing, ensure:
- [ ] Code is properly commented
- [ ] README is updated if needed
- [ ] API documentation is updated
- [ ] User guide is updated for user-facing features
- [ ] Changelog is updated

---

## 🐛 Issue Reporting

### Before Reporting

1. **Check existing issues**: Search for similar issues first
2. **Use latest version**: Ensure you're using the latest version
3. **Minimal reproduction**: Create a minimal example if possible

### Bug Report Template

```markdown
## 🐛 Bug Description
Clear and concise description of the bug.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior
What you expected to happen.

## ❌ Actual Behavior
What actually happened.

## 🖥️ Environment
- OS: [e.g. macOS, Windows, Ubuntu]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 18.17.0]
- AIPromote version: [e.g. 1.0.0]

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 📋 Additional Context
Any other context about the problem.

## 🔍 Error Logs
```
Paste any relevant error logs here
```
```

### Feature Request Template

```markdown
## 🚀 Feature Description
Clear and concise description of the feature you'd like to see.

## 💡 Motivation
Explain why this feature would be useful and what problem it solves.

## 📋 Proposed Solution
Describe your preferred solution or approach.

## 🔄 Alternative Solutions
Describe any alternative solutions you've considered.

## 📸 Mockups/Examples
If applicable, add mockups or examples of similar features.

## 📈 Additional Context
Any other context or screenshots about the feature request.
```

---

## 🔒 Security

### Security Guidelines

1. **Never commit secrets**: Use environment variables
2. **Validate all inputs**: Server-side validation is mandatory
3. **Use parameterized queries**: Prevent SQL injection
4. **Implement proper authentication**: Check permissions appropriately
5. **Handle errors securely**: Don't expose sensitive information

### Reporting Security Issues

**Do NOT create public issues for security vulnerabilities.**

Instead, email us at: security@aipromotapp.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 24 hours and work with you to resolve the issue.

### Security Checklist

When contributing code that handles:
- [ ] **User input**: All inputs are validated and sanitized
- [ ] **Authentication**: Proper JWT verification
- [ ] **Authorization**: User permissions are checked  
- [ ] **Data access**: Users can only access their own data
- [ ] **External APIs**: API keys are not exposed
- [ ] **Database queries**: Use parameterized queries
- [ ] **File uploads**: Validate file types and sizes
- [ ] **Error messages**: Don't expose sensitive information

---

## 🎉 Recognition

### Contributors

We maintain a list of contributors in our README and documentation. Your contributions will be recognized based on:

- **Code contributions**: Features, bug fixes, improvements
- **Documentation**: Writing and improving documentation
- **Testing**: Adding tests and improving test coverage
- **Community**: Helping other users and contributors
- **Bug reports**: High-quality bug reports with reproductions

### Contributor Levels

- **Contributor**: Anyone who has contributed to the project
- **Regular Contributor**: Consistent contributions over time
- **Core Contributor**: Significant ongoing contributions
- **Maintainer**: Trusted with repository access and review duties

---

## 📞 Getting Help

### Where to Ask Questions

- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time community support
- **Email**: contribute@aipromotapp.com for contribution questions

### Development Help

- **Code questions**: Ask in GitHub discussions or Discord
- **Architecture questions**: Tag maintainers in issues
- **Setup issues**: Check documentation first, then ask for help

---

## 📄 License

By contributing to AIPromote, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

## 🙏 Thank You!

Thank you for taking the time to contribute to AIPromote! Your contributions help make this project better for everyone.

**Happy coding!** 🚀

---

*Last updated: January 15, 2025*
