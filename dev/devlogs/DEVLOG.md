# Development Log - SME Call Agent System

**Project**: AI-Powered Call Agent for SME Payment Reminders  
**Duration**: January 2-28, 2026  
**Total Time**: ~50+ hours  

## Overview
Building an AI-powered call agent system that automates payment reminder calls for small and medium enterprises. The system integrates with Zoho CRM/Books, uses LiveKit for voice calls, and provides intelligent customer outreach automation. Heavy use of Kiro CLI for rapid development and maintaining code quality.

## Recent Updates (January 28, 2026)

**Documentation Maintenance**: Updated all steering documents to reflect current state
- Updated tech stack versions (Next.js 15.4.10, React 19, Better Auth v1.4.15, AI SDK v4.3.16)
- Added AI SDK integration with OpenAI GPT-4o and streaming responses
- Updated Dodo Payments integration to v2.2.1 with static checkout URLs
- Added Resend email service integration
- Updated deployment target from Vercel to Cloudflare with OpenNext
- Added comprehensive development scripts documentation
- Removed PostHog analytics (replaced with call analytics)
- Enhanced security documentation with AI response filtering

**Key Technology Updates**:
- AI Chat: Now powered by OpenAI GPT-4o with streaming responses and web search tools
- Payments: Enhanced Dodo Payments integration with better error handling
- Deployment: Migrated to Cloudflare Pages with OpenNext for better performance
- Email: Integrated Resend for transactional emails
- Icons: Added Tabler icons alongside Lucide for better UI variety

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

## Day 8 (Jan 11) - Call Agent & Payment Reminders [In Progress]

**Morning**: Voice agent integration and payment reminder system
- Built comprehensive call agent system for automated SME payment reminders
- Integrated LiveKit for outbound voice calls with AI agents
- Created payment reminder sync engines for automated customer outreach
- Developed customer sync engine for seamless Zoho CRM integration
- **Current Focus**: Pre-call verification and intelligent phone number extraction
- **Architecture**: Specialized AI call agent platform for business payment collection

**Technical Components in Development**:
- **Payment Reminder Sync Engine**: Automated processing of overdue invoices
- **Customer Sync Engine**: Two-way sync between local DB and Zoho CRM
- **LiveKit Client**: Voice agent integration for automated calls
- **Pre-call Verification**: Validation system before initiating calls
- **Phone Extractor**: Smart phone number parsing and validation
- **Business Profile Management**: Company-specific call configurations

**Architecture Evolution**:
- Built specialized SME payment collection tool with AI voice capabilities
- Added intelligent voice AI for natural conversation flows during reminder calls
- Enhanced Zoho integration for comprehensive business data synchronization
- Created robust cron job system for scheduled reminder processing
- Developed modular sync engines for scalable customer management

---

## Day 9 (Jan 19) - Webhook Status Tracking & Call Lifecycle [8h]

**Morning (4h)**: Webhook infrastructure and status tracking
- Created comprehensive spec for reminder status webhook using Kiro's spec workflow
- Implemented webhook endpoint (`/api/webhooks/call-status`) with HMAC authentication
- Built status update handler with proper state transitions (in_progress → processing → completed)
- Added call outcome recording with customer response types and duration tracking
- **Kiro Usage**: Used `@spec` workflow to create requirements, design, and tasks documents

**Afternoon (4h)**: Timeout monitoring and agent integration
- Implemented timeout monitor to detect stuck reminders (10-minute threshold)
- Integrated timeout checking into cron job for automatic cleanup
- Updated call executor to use webhook-based flow instead of immediate completion
- Built Python agent webhook client with retry logic and exponential backoff
- Added webhook authentication and event reporting (call_answered, call_completed, call_failed)
- **Challenge**: Ensuring reminders don't get stuck in 'in_progress' state forever
- **Solution**: Created timeout monitor that runs on each cron execution to mark stale reminders as failed

**Technical Decisions**:
- **Event-Driven Architecture**: Python agent reports call events via webhooks for accurate lifecycle tracking
- **HMAC Authentication**: Used shared secret for secure webhook communication between agent and backend
- **Timeout Handling**: 10-minute threshold with automatic failure marking and retry capability
- **Status Progression**: Clear state machine (pending → in_progress → processing → completed/failed)
- **Retry Logic**: Exponential backoff (immediate, 2s, 4s) for webhook delivery failures

**Key Implementation Details**:
- Webhook endpoint validates authentication, reminder existence, and event types
- Status handler manages transitions based on call outcomes (answered, completed, failed, no_answer)
- Timeout monitor queries for stale reminders and marks them as failed with descriptive skip_reason
- Python agent extracts reminder_id from room metadata and reports events at key lifecycle points
- Call outcome data includes connection status, duration, customer response, and optional notes

**Kiro Spec Workflow Benefits**:
- Requirements document with EARS patterns defined 6 clear user stories with acceptance criteria
- Design document with 14 correctness properties for property-based testing approach
- Tasks document broke down implementation into 9 sequential tasks with requirement traceability
- Architecture diagram clarified event flow between cron scheduler, call executor, agent, and webhook handler

**Current Status**:
- Core webhook infrastructure complete and tested
- Timeout monitoring integrated with cron job
- Python agent webhook client implemented with retry logic
- Ready for end-to-end testing and property-based test implementation

### Future Enhancements
- Add more OAuth providers (GitHub, Microsoft)
- Implement team/organization support
- Add usage-based billing options
- Create admin dashboard for analytics
- Add email notifications for subscription events
- Complete Zoho Bills integration with property-based tests
- Add bill payment tracking and reminders
- Implement multi-currency support for international bills
- Complete voice agent testing and deployment
- Add call analytics and success rate tracking
- Implement smart scheduling based on customer preferences
- Implement property-based tests for webhook status tracking (14 properties defined)
- Add integration tests for complete reminder lifecycle with webhooks
