# Project Structure

> **📝 Documentation Maintenance**: When adding new directories, changing file organization, or updating conventions, update this file and run `@update-docs`.

## Directory Layout

```
call_agent_smes/
├── app/                     # Next.js App Router
│   ├── dashboard/          # Business management dashboard
│   │   ├── customers/     # Customer management & history
│   │   ├── invoices/      # Invoice tracking & status
│   │   ├── bills/         # Bills management & tracking
│   │   ├── reminders/     # Payment reminder management
│   │   ├── scheduled/     # Scheduled call management
│   │   ├── chat/          # AI chat interface
│   │   ├── configuration/ # System configuration
│   │   ├── settings/      # User settings & preferences
│   │   ├── upload/        # File upload interface
│   │   ├── payment/       # Payment & subscription management
│   │   ├── business-profile/ # Company settings & branding
│   │   └── integrations/  # CRM integration management
│   ├── api/               # API routes
│   │   ├── auth/[...all]/ # Better Auth
│   │   ├── zoho/          # Zoho CRM/Books integration
│   │   │   ├── auth/      # OAuth flow & token management
│   │   │   ├── contacts/  # Customer data sync
│   │   │   └── invoices/  # Invoice data sync
│   │   ├── livekit/       # LiveKit call management
│   │   │   └── dispatch-call/ # Call dispatch endpoint
│   │   ├── reminders/     # Payment reminder processing
│   │   ├── reminder-settings/ # Reminder configuration
│   │   ├── invoices/      # Invoice management API
│   │   ├── chat/          # AI chat API
│   │   ├── cron/          # Scheduled job endpoints
│   │   │   ├── process-reminders/ # Automated reminder processing
│   │   │   └── sync-invoices/ # Daily invoice sync
│   │   ├── business-profile/ # Business configuration
│   │   ├── subscription/  # Dodo Payments integration
│   │   ├── webhooks/      # Payment webhooks
│   │   └── db/            # Database operations
│   │       ├── customers/ # Customer cache operations
│   │       └── invoices/  # Invoice cache operations
│   ├── pricing/           # Pricing page
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/           # Registration pages
│   └── page.tsx           # Landing page
├── lib/                   # Core business logic
│   ├── payment-reminders/ # Payment reminder system
│   │   ├── sync-engine.ts # Main payment sync automation
│   │   ├── customer-sync-engine.ts # Customer data sync
│   │   ├── reminder-executor.ts # Unified reminder execution (SMS & voice)
│   │   ├── livekit-client.ts # Voice call integration
│   │   ├── call-window.ts # Call timing management
│   │   ├── phone-extractor.ts # Phone number validation
│   │   ├── pre-call-verification.ts # Call validation logic
│   │   ├── reminder-processor.ts # Processes due reminders (cron job)
│   │   ├── reminder-schedule-builder.ts # Builds reminder schedules
│   │   ├── settings-manager.ts # Settings management
│   │   ├── customer-hash.ts # Customer data hashing
│   │   ├── invoice-hash.ts # Invoice data hashing
│   │   ├── zoho-books-client.ts # Zoho Books API client
│   │   └── zoho-contacts-client.ts # Zoho Contacts API client
│   ├── livekit/           # LiveKit integration
│   │   └── call-dispatcher.ts # Call dispatch logic
│   ├── business-profile/  # Business configuration
│   │   ├── service.ts     # Profile management service
│   │   └── __tests__/     # Business profile tests
│   ├── zoho-api-client.ts # Zoho API integration
│   ├── zoho-oauth.ts      # OAuth service
│   ├── zoho-token-manager.ts # Token management
│   ├── encryption.ts      # Token encryption utilities
│   ├── dodo-payments.ts   # Payment processing
│   ├── subscription.ts    # Subscription management
│   └── utils.ts           # General utilities
├── components/
│   ├── ui/                # shadcn/ui components
│   └── theme-toggle.tsx   # Dark mode toggle
├── db/                    # Database
│   ├── schema.ts         # Complete database schema
│   └── drizzle.ts        # DB connection
└── .kiro/                 # Kiro CLI configuration
    ├── steering/         # Project guidelines
    ├── specs/            # Feature specifications
    │   └── business-profile-management/ # Business profile spec
    └── devlogs/          # Development logs
```

## Naming Conventions

**Components**: PascalCase (`UserProfile.tsx`) • Match file to component name • `.tsx` for JSX, `.ts` for utils

**Routes**: kebab-case folders • `page.tsx` for pages • `layout.tsx` for layouts • `route.ts` for API handlers

**Database**: snake_case (`user_sessions`, `created_at`)

**Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

## Import Conventions

**Absolute imports** (via tsconfig):
```typescript
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { db } from "@/db/drizzle"
```

**Import order**: React/external → Internal components → Types → Styles

## Routes

**Public**: `/` (landing page)

**Protected**: `/dashboard` • `/dashboard/customers` • `/dashboard/invoices` • `/dashboard/bills` • `/dashboard/reminders` • `/dashboard/scheduled` • `/dashboard/chat` • `/dashboard/configuration` • `/dashboard/settings` • `/dashboard/upload` • `/dashboard/payment` • `/dashboard/business-profile` • `/dashboard/integrations`

**API**: `/api/auth/[...all]` • `/api/zoho/auth/*` • `/api/zoho/contacts` • `/api/zoho/invoices` • `/api/livekit/dispatch-call` • `/api/reminders` • `/api/reminder-settings` • `/api/invoices` • `/api/chat` • `/api/cron/process-reminders` • `/api/cron/sync-invoices` • `/api/business-profile` • `/api/subscription` • `/api/webhooks` • `/api/db/customers` • `/api/db/invoices`

## Configuration Files

**Root**: `.env` (not committed) • `.env.example` • `package.json` • `tsconfig.json` • `next.config.ts` • `tailwind.config.ts` • `open-next.config.ts` • `wrangler.toml`

**Database**: `drizzle.config.ts` • `db/schema.ts` • `auth-schema.ts`

**Kiro**: `.kiro/steering/*.md` • `.kiro/prompts/*.md` • `.kiroignore`

## Development Scripts

**Core**: `npm run dev` (with Turbopack) • `npm run build` • `npm start` • `npm run lint`

**Testing**: `npm run test` • `npm run test:watch` • `npm run test:ui` (Vitest UI)

**Database**: `npm run db:generate` • `npm run db:migrate` • `npm run db:push` • `npm run db:studio`

**Deployment**: `npm run preview` • `npm run deploy` (OpenNext Cloudflare) • `npm run cf-typegen`
