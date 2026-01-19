# Page Rendering Map

Complete list of all pages in your app and their rendering modes.

## Legend
- ○ **Static** - Pre-rendered at build time, served from CDN
- ƒ **Dynamic** - Rendered on each request on the server
- ⚡ **Client** - Client-side rendered (CSR)
- 🔒 **Auth Required** - Requires authentication

---

## Public Pages (Static/Client)

### Marketing & Landing Pages
| Route | Type | Rendering | Server Hit | Notes |
|-------|------|-----------|------------|-------|
| `/` | Page | ○ Static | No | Homepage with client-side pricing fetch |
| `/pricing` | Page | ○ Static | No | Pricing page with client-side subscription check |
| `/privacy-policy` | Page | ○ Static | No | Static legal page |
| `/terms-of-service` | Page | ○ Static | No | Static legal page |

**Why Static?**
- SEO optimization
- Fast CDN delivery
- Low hosting costs
- Global edge caching

---

## Authentication Pages (Client-Side)

### Auth Flow Pages
| Route | Type | Rendering | Server Hit | Notes |
|-------|------|-----------|------------|-------|
| `/sign-in` | Page | ⚡ Client | No (page) | Client component, hits API for auth |
| `/sign-up` | Page | ⚡ Client | No (page) | Client component, hits API for auth |
| `/forgot-password` | Page | ⚡ Client | No (page) | Client component |
| `/reset-password` | Page | ⚡ Client | No (page) | Client component |
| `/verify-email` | Page | ⚡ Client | No (page) | Client component, hits API for verification |
| `/success` | Page | ⚡ Client | No (page) | Post-payment success page |

**Why Client-Side?**
- Interactive forms
- Real-time validation
- OAuth redirects
- No sensitive data to pre-render

---

## Dashboard Pages (Dynamic + Auth Required)

### Main Dashboard
| Route | Type | Rendering | Server Hit | Auth | Notes |
|-------|------|-----------|------------|------|-------|
| `/dashboard` | Page | ƒ Dynamic | Yes | 🔒 | Main dashboard with stats |
| `/dashboard/layout.tsx` | Layout | ƒ Dynamic | Yes | 🔒 | **Applies to ALL dashboard pages** |

### Dashboard Sub-Pages
| Route | Type | Rendering | Server Hit | Auth | Notes |
|-------|------|-----------|------------|------|-------|
| `/dashboard/bills` | Page | ƒ Dynamic | Yes | 🔒 | Zoho Bills list |
| `/dashboard/business-profile` | Page | ƒ Dynamic | Yes | 🔒 | Business profile settings |
| `/dashboard/chat` | Page | ƒ Dynamic | Yes | 🔒 | AI chat interface |
| `/dashboard/configuration` | Page | ƒ Dynamic | Yes | 🔒 | System configuration |
| `/dashboard/customers` | Page | ƒ Dynamic | Yes | 🔒 | Customer management |
| `/dashboard/integrations` | Page | ƒ Dynamic | Yes | 🔒 | Zoho & other integrations |
| `/dashboard/invoices` | Page | ƒ Dynamic | Yes | 🔒 | Invoice list |
| `/dashboard/invoices/[invoiceId]` | Page | ƒ Dynamic | Yes | 🔒 | Individual invoice details |
| `/dashboard/payment` | Page | ƒ Dynamic | Yes | 🔒 | Subscription management |
| `/dashboard/reminders` | Page | ƒ Dynamic | Yes | 🔒 | Payment reminders list |
| `/dashboard/scheduled` | Page | ƒ Dynamic | Yes | 🔒 | Scheduled reminders |
| `/dashboard/settings` | Page | ƒ Dynamic | Yes | 🔒 | User settings |
| `/dashboard/upload` | Page | ƒ Dynamic | Yes | 🔒 | File upload |

**Why Dynamic?**
- Authentication required
- User-specific data
- Real-time database queries
- Security (no caching of sensitive data)
- Fresh data on every visit

**Configuration:**
```typescript
// app/dashboard/layout.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```
All child pages automatically inherit this!

---

## API Routes (Always Dynamic)

### Authentication APIs
| Route | Type | Notes |
|-------|------|-------|
| `/api/auth/[...all]` | API | Better Auth handler |
| `/api/auth/send-verification-email` | API | Email verification |
| `/api/auth/verify-email-custom` | API | Custom verification |

### Business Logic APIs
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/subscription` | API | 🔒 | Get user subscription |
| `/api/subscription/sync-from-success` | API | 🔒 | Sync after payment |
| `/api/sync-subscription` | API | 🔒 | Manual subscription sync |
| `/api/business-profile` | API | 🔒 | Business profile CRUD |
| `/api/chat` | API | 🔒 | AI chat endpoint |
| `/api/invoices` | API | 🔒 | Invoice operations |
| `/api/reminders` | API | 🔒 | Reminder operations |
| `/api/reminders/scheduled` | API | 🔒 | Scheduled reminders |
| `/api/reminders/stats` | API | 🔒 | Reminder statistics |
| `/api/reminder-settings` | API | 🔒 | Settings CRUD |
| `/api/reminder-settings/timezones` | API | 🔒 | Timezone list |
| `/api/upload-image` | API | 🔒 | Image upload |

### Integration APIs
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/integration/status` | API | 🔒 | Integration status |
| `/api/zoho/auth` | API | 🔒 | Zoho OAuth |
| `/api/zoho/bills` | API | 🔒 | Zoho Bills sync |
| `/api/zoho/contacts` | API | 🔒 | Zoho Contacts sync |
| `/api/zoho/invoices` | API | 🔒 | Zoho Invoices sync |
| `/api/zoho/status` | API | 🔒 | Zoho connection status |

### Database APIs
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/db/customers` | API | 🔒 | Customer database ops |
| `/api/db/invoices` | API | 🔒 | Invoice database ops |

### LiveKit APIs
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/livekit/dispatch-call` | API | 🔒 | Dispatch payment call |

### Cron Jobs (Server-to-Server)
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/cron/process-reminders` | API | 🔑 | Cron secret | Process due reminders |
| `/api/cron/sync-invoices` | API | 🔑 | Cron secret | Sync Zoho invoices |
| `/api/cron/status` | API | 🔑 | Cron secret | Cron job status |

### Webhooks (External Services)
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/webhooks/call-status` | API | 🔑 | LiveKit | Call status updates |
| `/api/webhooks/dodo` | API | 🔑 | Dodo | Payment webhooks |

### Testing/Development
| Route | Type | Auth | Notes |
|-------|------|------|-------|
| `/api/test-dodo` | API | - | Dodo Payments test |
| `/api/test-webhook` | API | - | Webhook testing |

**Why Always Dynamic?**
- API routes are always server-side
- No static generation possible
- Handle real-time requests
- Database operations
- External API calls

---

## Summary Statistics

### Page Count by Type
- **Static Pages**: 4 (Homepage, Pricing, Privacy, Terms)
- **Client Pages**: 6 (Auth flow pages)
- **Dynamic Pages**: 15 (All dashboard pages)
- **API Routes**: 40+ (All backend endpoints)

### Server Hits by Page Type
| Page Type | Server Hit on Load | Why |
|-----------|-------------------|-----|
| Static (/) | ❌ No | Served from CDN |
| Client (sign-in) | ❌ No | Client-side only |
| Dynamic (dashboard) | ✅ Yes | Auth + data fetch |
| API Routes | ✅ Yes | Always server-side |

### Performance Characteristics

**Public Pages (Static)**
- Load time: 10-50ms (CDN)
- Cost per 1M visits: ~$5
- Scalability: Unlimited
- SEO: Excellent

**Dashboard Pages (Dynamic)**
- Load time: 200-500ms (server)
- Cost per 1M visits: ~$100
- Scalability: Requires server scaling
- SEO: Not indexed (auth required)

---

## Configuration Summary

### Static Pages
```typescript
// No config needed - default behavior
// Or explicitly:
export const dynamic = 'auto';
```

### Dashboard Pages
```typescript
// Set once in layout, applies to all children
// app/dashboard/layout.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### Client Components
```typescript
// Top of file
"use client";
```

### API Routes
```typescript
// Always dynamic by default
// No config needed
export async function GET(request: Request) {
  // ...
}
```

---

## Best Practices Applied

✅ **Public pages are static** - Fast, SEO-friendly, cheap  
✅ **Auth pages are client-side** - Interactive, no server render needed  
✅ **Dashboard is dynamic** - Secure, fresh data, auth required  
✅ **APIs are always dynamic** - Real-time, server-side logic  
✅ **Layout-level config** - DRY principle, configure once  

---

## Future Pages Guide

### Adding a New Public Page
```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <div>About Us</div>;
}
// ✅ Automatically static
```

### Adding a New Dashboard Page
```typescript
// app/dashboard/analytics/page.tsx
export default async function AnalyticsPage() {
  const data = await fetchAnalytics(); // Can use headers/cookies
  return <AnalyticsChart data={data} />;
}
// ✅ Automatically dynamic (inherits from layout)
```

### Adding a New API Route
```typescript
// app/api/analytics/route.ts
export async function GET(request: Request) {
  // Always dynamic
  return Response.json({ data });
}
// ✅ Automatically dynamic
```

---

## Verification

To verify the rendering mode of pages, run:
```bash
npm run build
```

Look for the symbols in the output:
- `○` = Static
- `ƒ` = Dynamic
- `◐` = Partial (static shell + dynamic content)

Expected output:
```
○  /                    (Static)
○  /pricing             (Static)
○  /privacy-policy      (Static)
○  /terms-of-service    (Static)
ƒ  /dashboard           (Dynamic)
ƒ  /dashboard/bills     (Dynamic)
ƒ  /dashboard/...       (Dynamic)
```

This is the **correct and optimal** configuration! 🎯
