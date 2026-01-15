# Project Structure

> **📝 Documentation Maintenance**: When adding new directories, changing file organization, or updating conventions, update this file and run `@update-docs`.

## Directory Layout

```
call_agent_smes/
├── app/                     # Next.js App Router
│   ├── dashboard/          # Business management dashboard
│   │   ├── customers/     # Customer management & history
│   │   ├── invoices/      # Invoice tracking & status
│   │   ├── reminders/     # Payment reminder management
│   │   ├── scheduled/     # Scheduled call management
│   │   ├── business-profile/ # Company settings & branding
│   │   └── integrations/  # CRM integration management
│   ├── api/               # API routes
│   │   ├── auth/[...all]/ # Better Auth
│   │   ├── zoho/          # Zoho CRM/Books integration
│   │   │   ├── auth/      # OAuth flow & token management
│   │   │   ├── contacts/  # Customer data sync
│   │   │   └── invoices/  # Invoice data sync
│   │   ├── reminders/     # Payment reminder processing
│   │   ├── cron/          # Scheduled job endpoints
│   │   │   ├── process-reminders/ # Automated reminder processing
│   │   │   └── status/    # System health checks
│   │   ├── business-profile/ # Business configuration
│   │   └── db/            # Database operations
│   │       ├── customers/ # Customer cache operations
│   │       └── invoices/  # Invoice cache operations
│   └── page.tsx           # Landing page
├── lib/                   # Core business logic
│   ├── payment-reminders/ # Payment reminder system
│   │   ├── sync-engine.ts # Main payment sync automation
│   │   ├── customer-sync-engine.ts # Customer data sync
│   │   ├── livekit-client.ts # Voice call integration
│   │   ├── phone-extractor.ts # Phone number validation
│   │   └── pre-call-verification.ts # Call validation logic
│   ├── business-profile/  # Business configuration
│   │   ├── service.ts     # Profile management service
│   │   └── __tests__/     # Business profile tests
│   ├── zoho-api-client.ts # Zoho API integration
│   ├── zoho-oauth.ts      # OAuth service
│   ├── zoho-token-manager.ts # Token management
│   ├── encryption.ts      # Token encryption utilities
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

**Protected**: `/dashboard` • `/dashboard/customers` • `/dashboard/invoices` • `/dashboard/reminders` • `/dashboard/scheduled` • `/dashboard/business-profile` • `/dashboard/integrations`

**API**: `/api/auth/[...all]` • `/api/zoho/auth/*` • `/api/zoho/contacts` • `/api/zoho/invoices` • `/api/reminders` • `/api/reminders/scheduled` • `/api/cron/process-reminders` • `/api/cron/status` • `/api/business-profile` • `/api/db/customers` • `/api/db/invoices`

## Configuration Files

**Root**: `.env` (not committed) • `.env.example` • `package.json` • `tsconfig.json` • `next.config.ts` • `tailwind.config.ts`

**Database**: `drizzle.config.ts` • `db/schema.ts` • `auth-schema.ts`

**Kiro**: `.kiro/steering/*.md` • `.kiro/prompts/*.md` • `.kiroignore`
