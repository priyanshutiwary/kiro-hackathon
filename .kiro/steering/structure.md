# Project Structure

> **📝 Documentation Maintenance**: When adding new directories, changing file organization, or updating conventions, update this file and run `@update-docs`.

## Directory Layout

```
call_agent_smes/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── dashboard/          # Protected routes
│   │   ├── _components/   # Private components
│   │   ├── chat/          # AI chat
│   │   ├── upload/        # File upload
│   │   ├── payment/       # Subscriptions
│   │   ├── bills/         # Zoho Bills
│   │   ├── invoices/      # Zoho Invoices
│   │   ├── integrations/  # Integration management
│   │   └── settings/      # User settings
│   ├── api/               # API routes
│   │   ├── auth/[...all]/ # Better Auth
│   │   ├── webhooks/      # Payment webhooks
│   │   ├── chat/          # AI endpoint
│   │   ├── upload-image/  # R2 upload
│   │   └── zoho/          # Zoho API routes
│   │       ├── auth/      # OAuth flow
│   │       ├── bills/     # Bills endpoint
│   │       ├── invoices/  # Invoices endpoint
│   │       └── status/    # Integration status
│   ├── pricing/           # Pricing page
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui (30+ components)
│   ├── homepage/          # Landing sections
│   ├── theme-toggle.tsx   # Dark mode toggle
│   └── user-profile.tsx   # Profile dropdown
├── lib/                   # Utilities
│   ├── auth.ts           # Auth config
│   ├── subscription.ts   # Subscription utils
│   ├── upload-image.ts   # R2 utils
│   ├── encryption.ts     # Token encryption
│   ├── zoho-oauth.ts     # Zoho OAuth service
│   ├── zoho-token-manager.ts  # Token management
│   ├── zoho-api-client.ts     # Zoho API client
│   └── utils.ts          # General utils
├── db/                    # Database
│   ├── schema.ts         # Drizzle schema
│   └── drizzle.ts        # DB connection
├── .kiro/                 # Kiro CLI
│   ├── steering/         # Guidelines
│   ├── specs/            # Feature specs
│   │   └── zoho-bills-integration/  # Zoho spec
│   └── prompts/          # Custom commands
└── examples/              # Documentation
    ├── README.md
    └── DEVLOG.md
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

**Public**: `/` • `/pricing` • `/sign-in` • `/sign-up`

**Protected**: `/dashboard` • `/dashboard/chat` • `/dashboard/upload` • `/dashboard/payment` • `/dashboard/settings` • `/dashboard/bills` • `/dashboard/invoices` • `/dashboard/integrations`

**API**: `/api/auth/[...all]` • `/api/webhooks/dodo` • `/api/chat` • `/api/upload-image` • `/api/zoho/auth/*` • `/api/zoho/bills` • `/api/zoho/invoices` • `/api/zoho/status`

## Configuration Files

**Root**: `.env` (not committed) • `.env.example` • `package.json` • `tsconfig.json` • `next.config.ts` • `tailwind.config.ts`

**Database**: `drizzle.config.ts` • `db/schema.ts` • `auth-schema.ts`

**Kiro**: `.kiro/steering/*.md` • `.kiro/prompts/*.md` • `.kiroignore`
