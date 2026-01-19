# Next.js Rendering Strategy Guide

## Overview
This document explains our rendering strategy for different page types to optimize performance, SEO, and user experience.

## Page Type Patterns

### 1. Public Marketing Pages (Static + Dynamic Sections)
**Examples**: `/`, `/pricing`, `/about`

**Strategy**: Partial Static Generation with Suspense
```tsx
// app/page.tsx
import { Suspense } from 'react';

export const dynamic = 'auto'; // Let Next.js decide

export default function Page() {
  return (
    <>
      {/* Static sections - pre-rendered at build time */}
      <HeroSection />
      <Features />
      
      {/* Dynamic sections - rendered on request */}
      <Suspense fallback={<LoadingSpinner />}>
        <UserSpecificContent />
      </Suspense>
      
      {/* Static sections */}
      <Footer />
    </>
  );
}

async function UserSpecificContent() {
  const data = await fetchUserData(); // Uses headers/cookies
  return <PricingTable data={data} />;
}
```

**Benefits**:
- ✅ Fast initial page load (static shell)
- ✅ Good SEO (static content indexed)
- ✅ Personalized content where needed
- ✅ Lower hosting costs

---

### 2. Dashboard/Authenticated Pages (Always Dynamic)
**Examples**: `/dashboard/*`, `/settings/*`, `/profile/*`

**Strategy**: Force Dynamic at Layout Level
```tsx
// app/dashboard/layout.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayout({ children }) {
  return <div>{children}</div>;
}
```

**All child pages automatically inherit this config!**

```tsx
// app/dashboard/bills/page.tsx
// No need to add dynamic config - inherited from layout!

export default async function BillsPage() {
  const session = await getSession(); // Uses headers
  const bills = await getBills(session.userId);
  return <BillsTable bills={bills} />;
}
```

**Benefits**:
- ✅ Always fresh data
- ✅ Secure (no caching of sensitive data)
- ✅ Simple - configure once in layout
- ✅ No build-time errors

**Why This is Correct**:
- Dashboard pages SHOULD be dynamic
- They require authentication (headers/cookies)
- They show user-specific data
- They need real-time updates
- This is the **standard Next.js pattern** for authenticated areas

---

### 3. API Routes (Always Dynamic)
**Examples**: `/api/*`

**Strategy**: API routes are always dynamic by default
```tsx
// app/api/subscription/route.ts
export async function GET(request: Request) {
  // Always dynamic - no config needed
  const session = await getSession();
  return Response.json({ data });
}
```

---

## Common Scenarios

### Adding a New Dashboard Page
```tsx
// app/dashboard/new-feature/page.tsx
// ✅ No dynamic config needed - inherited from layout!

export default async function NewFeaturePage() {
  const data = await fetchData(); // Can use headers freely
  return <div>{data}</div>;
}
```

### Adding a New Public Page with User Content
```tsx
// app/blog/page.tsx
import { Suspense } from 'react';

export const dynamic = 'auto';

export default function BlogPage() {
  return (
    <>
      {/* Static blog list */}
      <BlogList posts={staticPosts} />
      
      {/* Dynamic user recommendations */}
      <Suspense fallback={<Skeleton />}>
        <UserRecommendations />
      </Suspense>
    </>
  );
}

async function UserRecommendations() {
  const session = await getSession();
  if (!session) return null;
  const recs = await getRecommendations(session.userId);
  return <RecommendationsList items={recs} />;
}
```

---

## Decision Tree

```
Is this page public (marketing/landing)?
├─ YES → Use dynamic='auto' + Suspense for user-specific parts
└─ NO → Is it behind authentication?
    ├─ YES → Use force-dynamic in layout (already done for /dashboard)
    └─ NO → Use dynamic='auto' (default)
```

---

## Current Configuration

### ✅ Already Configured
- `/dashboard/*` - Dynamic via layout (all pages inherit)
- `/` - Partial static with Suspense
- `/pricing` - Partial static with Suspense

### 🎯 Future Pages
- **New dashboard pages**: No config needed! Inherits from layout
- **New public pages**: Use `dynamic='auto'` + Suspense pattern
- **New API routes**: No config needed (always dynamic)

---

## Performance Tips

1. **Keep public pages mostly static** - Use Suspense for dynamic parts
2. **Dashboard pages should be dynamic** - This is correct and expected
3. **Use Suspense boundaries** - Better UX with progressive loading
4. **Don't over-optimize** - Dynamic rendering for auth pages is fine
5. **Monitor build output** - Check which pages are static vs dynamic

---

## Build Output Guide

When you run `npm run build`, you'll see:
- `○` (Static) - Pre-rendered at build time
- `ƒ` (Dynamic) - Rendered on each request
- `◐` (Partial) - Static shell with dynamic content

**Expected output**:
```
○  /                    (Static shell + dynamic pricing)
○  /pricing             (Static shell + dynamic pricing)
ƒ  /dashboard           (Dynamic - correct!)
ƒ  /dashboard/bills     (Dynamic - correct!)
ƒ  /dashboard/payment   (Dynamic - correct!)
```

---

## Summary

✅ **Public pages**: Mostly static with Suspense for user content  
✅ **Dashboard pages**: Always dynamic (configured in layout)  
✅ **No future problems**: Layout config handles all dashboard pages automatically  
✅ **Best practices**: Following Next.js App Router patterns  

**The key insight**: Dashboard pages SHOULD be dynamic. This is not a problem to solve, it's the correct architecture! 🎯
