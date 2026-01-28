# Technical Architecture

> **📝 Documentation Maintenance**: When making significant changes to tech stack, architecture, or security practices, update this file and run `@update-docs` to sync all documentation.

## Technology Stack

**Frontend**: Next.js 15.4.10 (App Router) • React 19 • TypeScript 5 • Tailwind CSS v4 • shadcn/ui • next-themes

**Backend**: Next.js API Routes • Better Auth v1.4.15 • Drizzle ORM • Neon PostgreSQL • AI SDK v4.3.16

**Voice AI**: LiveKit • Real-time voice calls • AI conversation flows • Call analytics • SIP integration

**AI Integration**: OpenAI GPT-4o • AI SDK React • Streaming responses • Web search tools

**Payments**: Dodo Payments v2.2.1 • Subscription management • Webhook processing • Static checkout URLs

**Services**: Zoho Books/CRM API • AES-256-GCM encryption • Cloudflare deployment • Resend email

**UI/UX**: Radix UI components • Framer Motion • Recharts • React Hook Form • Lucide icons • Tabler icons

**Tools**: TypeScript (strict) • ESLint • Drizzle Kit • Vitest • Kiro CLI • OpenNext Cloudflare

## Architecture Overview

**Layers**: Next.js App Router (RSC) → API Routes → Sync Engines → Drizzle ORM → Neon PostgreSQL

**Key Components**:
- Voice Agent: LiveKit integration for AI-powered calls with SIP trunking
- Sync Engines: Automated data synchronization with Zoho Books/CRM
- Authentication: Better Auth with secure session management
- Database: Local caching with real-time sync capabilities
- Integrations: Zoho Books/CRM OAuth with encrypted token storage
- Payment Processing: Dodo Payments for subscription management
- AI Chat: OpenAI GPT-4o integration with streaming responses and web search
- Analytics: Real-time call analytics and performance tracking
- Email Service: Resend integration for transactional emails

## Development Environment

**Required**: Node.js 18+ • npm 9+ • Git 2.30+

**Setup**:
```bash
npm install
cp .env.example .env  # Edit with your keys
npx drizzle-kit generate && npx drizzle-kit push
npm run dev
```

**Key Environment Variables**: `DATABASE_URL` • `BETTER_AUTH_SECRET` • `LIVEKIT_API_KEY/SECRET` • `LIVEKIT_URL` • `LIVEKIT_SIP_TRUNK_ID` • `ZOHO_CLIENT_ID/SECRET` • `ENCRYPTION_KEY` • `NEXT_PUBLIC_APP_URL` • `DODO_PAYMENTS_API_KEY` • `OPENAI_API_KEY` • `RESEND_API_KEY`

## Code Standards

**TypeScript**: Strict mode • Explicit return types • Interface over type • No `any`

**React**: Server Components by default • "use client" when needed • Custom hooks (prefix `use`) • Avoid prop drilling

**Naming**: Components (PascalCase) • Files (kebab-case) • Functions (camelCase) • Constants (UPPER_SNAKE_CASE) • DB tables (snake_case)

**Best Practices**: Components <200 lines • Extract logic to hooks • Handle errors gracefully • Validate inputs • Descriptive commits

## Security

**Authentication**: Better Auth with secure sessions • OAuth 2.0 • JWT with httpOnly cookies • CSRF protection

**Data Protection**: Environment variables for secrets • User data isolated by userId • SQL injection prevention (Drizzle ORM) • Input validation • AES-256-GCM encryption for OAuth tokens

**Voice Security**: LiveKit secure connections • Call recording compliance • Customer data privacy • PCI DSS considerations for payment data

**API Security**: Webhook signature verification • CORS configuration • Auth middleware for protected routes • Input sanitization • Rate limiting for voice calls • AI SDK secure streaming

**Integration Security**: Encrypted token storage • Automatic token refresh • Secure API communication • Multi-DC OAuth support

**Payment Security**: Dodo Payments secure checkout • Webhook signature validation • PCI compliance • Secure payment links

**Best Practices**: Never commit secrets • Use environment variables • Validate all inputs • Keep dependencies updated • HTTPS in production • Secure voice call handling • AI response filtering
