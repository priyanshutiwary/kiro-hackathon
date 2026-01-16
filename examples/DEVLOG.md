# Development Log - Next.js SaaS Starter Kit

**Project**: Next.js SaaS Starter Kit - Production-Ready SaaS Template  
**Duration**: January 2-7, 2026  
**Total Time**: ~38 hours  

## Overview
Building a comprehensive SaaS starter kit with authentication, subscriptions, AI integration, and modern UI. Heavy use of Kiro CLI for rapid development and maintaining code quality.

---

## Day 1 (Jan 2) - Project Setup & Planning [6h]

**Morning (3h)**: Initial setup and architecture planning
- Used `@quickstart` to configure Kiro environment
- Set up Next.js 15 with App Router and TypeScript
- Configured Tailwind CSS v4 and shadcn/ui
- **Kiro Usage**: `@prime` to understand Next.js 15 best practices

**Afternoon (3h)**: Database and authentication foundation
- Set up Neon PostgreSQL and Drizzle ORM
- Integrated Better Auth v1.2.8 with Google OAuth
- Created initial database schema
- **Challenge**: Better Auth configuration with Next.js 15
- **Solution**: Used catch-all route pattern for auth endpoints
- **Kiro Usage**: `@plan-feature` for auth architecture

---

## Day 2 (Jan 3) - Payment Integration [8h]

**Morning (4h)**: Dodo Payments setup
- Integrated Dodo Payments SDK
- Created subscription schema and utilities
- Built pricing page with tier configuration
- **Decision**: Used environment variables for product IDs (flexibility)

**Afternoon (4h)**: Webhook processing
- Implemented webhook signature verification
- Created subscription status tracking
- Built payment gating system with overlays
- **Challenge**: Webhook testing in development
- **Solution**: Used ngrok for local webhook testing
- **Kiro Usage**: `@code-review` caught security issues in webhook handler

---

## Day 3 (Jan 4) - Dashboard & UI [7h]

**Morning (3h)**: Dashboard layout
- Built responsive dashboard with sidebar navigation
- Created protected route middleware
- Implemented user profile management
- **Kiro Usage**: Steering documents maintained consistent component structure

**Afternoon (4h)**: UI components and features
- Added 30+ shadcn/ui components
- Built file upload system with Cloudflare R2
- Created AI chatbot interface with OpenAI
- **Technical Decision**: Server Components for data fetching, Client Components for interactivity

---

## Day 4 (Jan 5) - AI Integration & Storage [6h]

**Morning (3h)**: Cloudflare R2 integration
- Set up S3-compatible API with R2
- Built drag-and-drop upload interface
- Implemented progress tracking and file validation
- **Challenge**: CORS configuration for R2
- **Solution**: Configured bucket CORS policy for development and production

**Afternoon (3h)**: AI chatbot
- Integrated OpenAI API with streaming responses
- Built chat interface with markdown rendering
- Added conversation context management
- **Kiro Usage**: `@execute` for systematic implementation

---

## Day 5 (Jan 6) - Dark Mode & Polish [3h]

**Morning (2h)**: Theme system
- Added dark mode support with next-themes
- Created Apple-inspired dark theme colors
- Built theme toggle component
- Added theme toggle to all pages

**Afternoon (1h)**: Final touches
- Updated landing page and hero section
- Added navbar with theme toggle
- Polished responsive design
- **Kiro Usage**: `@code-review` for final quality check

---

## Day 7 (Jan 7) - Zoho Books Integration [6h]

**Morning (3h)**: OAuth flow and token management
- Created comprehensive spec for Zoho Bills integration using Kiro's spec workflow
- Implemented OAuth 2.0 authentication with Multi-DC support
- Built secure token management with encryption
- Created token refresh logic with automatic retry
- **Kiro Usage**: Used `@spec` workflow to create requirements, design, and tasks documents

**Afternoon (3h)**: API client and debugging
- Implemented Zoho API client with automatic token refresh
- Built bills fetching with pagination support
- Created bills display UI with table component
- **Challenge**: OAuth callback failing with 401 when fetching organization ID
- **Root Cause**: Insufficient OAuth scopes - only had `ZohoBooks.bills.READ`
- **Solution**: Added `ZohoBooks.settings.READ` scope to access organization details
- **Additional Fix**: Removed fallback to "default" org ID, added retry logic for 401 errors

**Technical Decisions**:
- **Multi-DC Support**: Built-in from the start to handle Zoho's regional data centers (US, EU, IN, AU, JP, CA)
- **Token Encryption**: Used AES-256-GCM encryption for storing OAuth tokens in database
- **Retry Logic**: Implemented exponential backoff for rate limiting and service unavailability
- **Scope Strategy**: Minimal scopes approach - only request what's needed for the feature

**Key Implementation Details**:
- OAuth service handles token exchange, refresh, and revocation
- Token manager encrypts/decrypts tokens and manages database operations
- API client automatically refreshes expired tokens before making requests
- Bills UI displays vendor name, bill number, dates, amount, and status with color-coded badges

**Kiro Spec Workflow Benefits**:
- Requirements document with EARS patterns ensured clear acceptance criteria
- Design document with correctness properties defined testable specifications
- Tasks document broke down implementation into manageable, sequential steps
- Property-based testing approach identified for future test implementation

---

## Day 6 (Jan 6) - Documentation & Kiro Setup [2h]

**Afternoon (2h)**: Project documentation
- Created comprehensive README.md
- Wrote DODO_PAYMENTS_SETUP.md guide
- Set up Kiro steering documents (product, tech, structure)
- Created .kiroignore for optimal context
- **Kiro Usage**: Used example steering files as templates

---

## Technical Decisions & Rationale

### Architecture Choices
- **Next.js 15 App Router**: Server Components for better performance
- **Better Auth**: Modern, flexible authentication without vendor lock-in
- **Dodo Payments**: Simple subscription management with good developer experience
- **Cloudflare R2**: Cost-effective storage with zero egress fees
- **Neon PostgreSQL**: Serverless database with excellent free tier

### Kiro CLI Integration
- **Steering Documents**: Defined product, tech stack, and structure guidelines
- **Custom .kiroignore**: Excluded node_modules, .next, and generated files
- **Code Reviews**: Used `@code-review` before each commit
- **Development Efficiency**: Estimated 35% time savings through Kiro

### Key Features Implemented
1. **Authentication**: Google OAuth with session management
2. **Subscriptions**: Flexible pricing with webhook processing
3. **File Storage**: R2 integration with drag-and-drop uploads
4. **AI Chat**: OpenAI integration with streaming responses
5. **Dark Mode**: System-aware theme with smooth transitions
6. **UI Components**: 30+ accessible components from shadcn/ui

---

## Time Breakdown

| Category | Hours | Percentage |
|----------|-------|------------|
| Authentication & Database | 9h | 24% |
| Payment Integration | 8h | 21% |
| Dashboard & UI | 7h | 18% |
| Zoho Integration | 6h | 16% |
| AI & Storage | 6h | 16% |
| Documentation & Setup | 2h | 5% |
| **Total** | **38h** | **100%** |

---

## Kiro CLI Usage

- **Total Prompts Used**: 58
- **Most Used**: `@code-review` (14 times), `@spec` (9 times), `@plan-feature` (8 times)
- **Steering Documents**: 3 comprehensive guides
- **Spec Documents**: 1 complete feature spec (requirements, design, tasks)
- **Custom .kiroignore**: Optimized for Next.js projects
- **Estimated Time Saved**: ~14 hours through automation and guidance

---

## Challenges & Solutions

1. **Better Auth Configuration**: Solved with catch-all route pattern
2. **Webhook Testing**: Used ngrok for local development
3. **R2 CORS Issues**: Configured proper bucket policies
4. **Dark Mode Flashing**: Used suppressHydrationWarning on html tag
5. **Type Safety**: Drizzle ORM provided excellent TypeScript support
6. **Zoho OAuth Scopes**: Initially missing `ZohoBooks.settings.READ` scope for organization access
7. **Organization ID Fetch**: Added retry logic and proper error handling for 401 responses

---

## Final Reflections

### What Went Well
- Kiro CLI significantly accelerated development workflow
- Spec-driven development caught issues early in design phase
- Modern tech stack made development smooth
- Comprehensive documentation from the start
- Type safety caught many bugs early
- Multi-DC support built-in from the start prevented future refactoring

### Innovation Highlights
- **Flexible Product Configuration**: Environment-based pricing tiers
- **Payment Gating System**: Elegant overlays for subscription prompts
- **Theme System**: Apple-inspired dark mode with smooth transitions
- **File Upload UX**: Progress tracking and drag-and-drop interface
- **Multi-DC OAuth**: Automatic region detection for Zoho's global infrastructure
- **Encrypted Token Storage**: AES-256-GCM encryption for sensitive OAuth credentials

### Key Learnings
- Steering documents are crucial for maintaining consistency
- .kiroignore optimization improves AI context quality
- Server Components significantly reduce client bundle size
- Webhook testing setup is essential early in development
- Spec-driven development with Kiro catches design issues before coding
- OAuth scope planning is critical - insufficient scopes cause hard-to-debug 401 errors
- Retry logic with exponential backoff is essential for third-party API integrations

---

## Day 8 (Jan 16) - Payment Reminder Calls & LiveKit Integration [4h]

**Morning (2h)**: LiveKit call system architecture
- Reviewed and refined LiveKit architecture documentation
- Worked on call dispatcher and routing logic
- Enhanced payment reminder call workflow
- **Technical Focus**: Call window management and timezone handling
- **Kiro Usage**: Used documentation workflow to maintain architecture docs

**Afternoon (2h)**: Agent integration and configuration
- Refined Python agent configuration and settings
- Enhanced context parsing for payment reminders
- Worked on payment assistant agent logic
- **Challenge**: Coordinating between Next.js frontend and Python agent
- **Solution**: Improved API routing and call dispatch mechanisms
- **Kiro Usage**: Used steering documents to maintain consistent patterns

**Key Implementation Areas**:
- **Call Window Logic**: Enhanced timezone-aware call scheduling
- **LiveKit Client**: Improved connection handling and error recovery
- **Agent Configuration**: Streamlined settings and environment management
- **Payment Context**: Better parsing of invoice and customer data

**Technical Decisions**:
- **Timezone Handling**: Implemented robust timezone conversion for call windows
- **Error Recovery**: Added retry logic for failed call attempts
- **Agent State Management**: Improved context persistence across call sessions
- **API Security**: Enhanced authentication for call dispatch endpoints

**Documentation Updates**:
- Updated LIVEKIT_ARCHITECTURE.md with latest patterns
- Maintained documentation workflow for consistency
- Enhanced configuration documentation for deployment

### Future Enhancements
- Add more OAuth providers (GitHub, Microsoft)
- Implement team/organization support
- Add usage-based billing options
- Create admin dashboard for analytics
- Add email notifications for subscription events
- Complete Zoho Bills integration with property-based tests
- Add bill payment tracking and reminders
- Implement multi-currency support for international bills
- Enhance call quality monitoring and analytics
- Add voice customization options for payment reminders
