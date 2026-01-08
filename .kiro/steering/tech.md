# Technical Architecture

> **📝 Documentation Maintenance**: When making significant changes to tech stack, architecture, or security practices, update this file and run `@update-docs` to sync all documentation.

## Technology Stack

**Frontend**: Next.js 15.3.1 (App Router) • React 19 • TypeScript 5 • Tailwind CSS v4 • shadcn/ui • next-themes

**Backend**: Next.js API Routes • Better Auth v1.2.8 • Drizzle ORM • Neon PostgreSQL

**Services**: Dodo Payments • OpenAI API • Cloudflare R2 • PostHog • Zoho Books API • Vercel

**Tools**: TypeScript (strict) • ESLint • Drizzle Kit • Kiro CLI

## Architecture Overview

**Layers**: Next.js App Router (RSC) → API Routes → Drizzle ORM → Neon PostgreSQL

**Key Components**:
- Authentication: Better Auth with Google OAuth
- Payments: Dodo Payments with webhook processing
- Storage: Cloudflare R2 (S3-compatible)
- AI: OpenAI API for chatbot
- Database: Neon PostgreSQL with Drizzle ORM
- Integrations: Zoho Books OAuth with encrypted token storage

## Development Environment

**Required**: Node.js 18+ • npm 9+ • Git 2.30+

**Setup**:
```bash
npm install
cp .env.example .env  # Edit with your keys
npx drizzle-kit generate && npx drizzle-kit push
npm run dev
```

**Key Environment Variables**: `DATABASE_URL` • `BETTER_AUTH_SECRET` • `GOOGLE_CLIENT_ID/SECRET` • `DODO_PAYMENTS_API_KEY` • `OPENAI_API_KEY` • R2 credentials • `NEXT_PUBLIC_STARTER_TIER` • `ZOHO_CLIENT_ID/SECRET` • `ENCRYPTION_KEY`

## Code Standards

**TypeScript**: Strict mode • Explicit return types • Interface over type • No `any`

**React**: Server Components by default • "use client" when needed • Custom hooks (prefix `use`) • Avoid prop drilling

**Naming**: Components (PascalCase) • Files (kebab-case) • Functions (camelCase) • Constants (UPPER_SNAKE_CASE) • DB tables (snake_case)

**Best Practices**: Components <200 lines • Extract logic to hooks • Handle errors gracefully • Validate inputs • Descriptive commits

## Security

**Authentication**: Better Auth with secure sessions • OAuth 2.0 • JWT with httpOnly cookies • CSRF protection

**Data Protection**: Environment variables for secrets • User data isolated by userId • SQL injection prevention (Drizzle ORM) • Input validation • AES-256-GCM encryption for OAuth tokens

**API Security**: Webhook signature verification • CORS configuration • Auth middleware for protected routes • Input sanitization

**File Upload**: Type validation • Size limits • Secure presigned URLs • Access control

**Best Practices**: Never commit secrets • Use environment variables • Validate all inputs • Keep dependencies updated • HTTPS in production
