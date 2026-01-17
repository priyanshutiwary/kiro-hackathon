# Authentication Middleware and Route Protection Guide

This guide explains how authentication and email verification work in the InvoCall application with email/password authentication support.

## Overview

The application now supports two authentication methods:
1. **Google OAuth** - Existing method
2. **Email/Password** - New method with email verification

Both methods work seamlessly with the same middleware and route protection system.

## Middleware Protection

### File: `middleware.ts`

The middleware handles:
- Redirecting unauthenticated users to sign-in
- Redirecting authenticated users away from auth pages
- Allowing access to authentication-related pages
- Setting headers for email verification checks

### Protected Routes

The middleware protects these routes:
- `/dashboard/*` - All dashboard pages (requires authentication)
- `/sign-in` - Redirects if already authenticated
- `/sign-up` - Redirects if already authenticated
- `/forgot-password` - Accessible without authentication
- `/reset-password` - Accessible without authentication
- `/verify-email` - Accessible without authentication

### Public Routes

These routes are always accessible:
- `/` - Landing page
- `/pricing` - Pricing page
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service
- `/api/payments/webhooks` - Webhook endpoints

## Authentication Utilities

### File: `lib/auth-utils.ts`

Three main utility functions are provided:

### 1. `requireRecentAuthentication(sessionToken, maxAgeMinutes)`

Checks if a user has authenticated recently (for sensitive operations).

**Usage:**
```typescript
import { requireRecentAuthentication } from "@/lib/auth-utils";

const session = await auth.api.getSession({ headers: await headers() });
const isRecent = await requireRecentAuthentication(session.session.token);

if (!isRecent) {
  return NextResponse.json({ 
    error: "Recent authentication required. Please sign in again." 
  }, { status: 403 });
}
```

**Parameters:**
- `sessionToken` - The session token from BetterAuth
- `maxAgeMinutes` - Maximum age in minutes (default: 30)

**Returns:** `boolean` - true if authenticated recently

**Use Cases:**
- Changing password
- Updating payment methods
- Deleting account
- Accessing sensitive settings

### 2. `isEmailVerified(userId)`

Checks if a user's email address is verified.

**Usage:**
```typescript
import { isEmailVerified } from "@/lib/auth-utils";

const session = await auth.api.getSession({ headers: await headers() });
const verified = await isEmailVerified(session.user.id);

if (!verified) {
  return NextResponse.json({ 
    error: "Email verification required",
    code: "EMAIL_NOT_VERIFIED"
  }, { status: 403 });
}
```

**Parameters:**
- `userId` - The user ID to check

**Returns:** `boolean` - true if email is verified

**Use Cases:**
- Checking verification status
- Custom verification logic
- Conditional feature access

### 3. `checkAuthAndVerification(headers, requireVerification)`

Comprehensive check that validates both authentication and email verification.

**Usage:**
```typescript
import { checkAuthAndVerification } from "@/lib/auth-utils";

const authCheck = await checkAuthAndVerification(await headers());

if (!authCheck.authenticated) {
  return NextResponse.json({ error: authCheck.error }, { status: 401 });
}

if (!authCheck.emailVerified) {
  return NextResponse.json({ 
    error: authCheck.error,
    code: authCheck.errorCode
  }, { status: 403 });
}

// Proceed with authenticated and verified user
const userId = authCheck.userId;
```

**Parameters:**
- `headers` - Request headers from Next.js
- `requireVerification` - Whether to require email verification (default: true)

**Returns:** `AuthCheckResult` object:
```typescript
{
  authenticated: boolean;
  emailVerified: boolean;
  userId?: string;
  error?: string;
  errorCode?: string;
}
```

**Use Cases:**
- Most API routes that require authentication
- Routes that need email verification
- Simplified authentication checks

## API Route Patterns

### Pattern 1: Basic Authentication (No Email Verification Required)

Use this for routes that work with both verified and unverified users:

```typescript
import { checkAuthAndVerification } from "@/lib/auth-utils";

export async function GET() {
  const authCheck = await checkAuthAndVerification(await headers(), false);
  
  if (!authCheck.authenticated) {
    return NextResponse.json({ error: authCheck.error }, { status: 401 });
  }

  const userId = authCheck.userId!;
  // ... your logic
}
```

### Pattern 2: Authentication + Email Verification (Recommended)

Use this for most protected routes:

```typescript
import { checkAuthAndVerification } from "@/lib/auth-utils";

export async function GET() {
  const authCheck = await checkAuthAndVerification(await headers());
  
  if (!authCheck.authenticated) {
    return NextResponse.json({ error: authCheck.error }, { status: 401 });
  }
  
  if (!authCheck.emailVerified) {
    return NextResponse.json({ 
      error: authCheck.error,
      code: authCheck.errorCode
    }, { status: 403 });
  }

  const userId = authCheck.userId!;
  // ... your logic
}
```

### Pattern 3: Sensitive Operations (Recent Authentication Required)

Use this for sensitive operations like password changes:

```typescript
import { checkAuthAndVerification, requireRecentAuthentication } from "@/lib/auth-utils";

export async function POST(request: Request) {
  const authCheck = await checkAuthAndVerification(await headers());
  
  if (!authCheck.authenticated) {
    return NextResponse.json({ error: authCheck.error }, { status: 401 });
  }
  
  if (!authCheck.emailVerified) {
    return NextResponse.json({ 
      error: authCheck.error,
      code: authCheck.errorCode
    }, { status: 403 });
  }

  // Check recent authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const isRecent = await requireRecentAuthentication(session.session.token);
  
  if (!isRecent) {
    return NextResponse.json({ 
      error: "Recent authentication required. Please sign in again.",
      code: "RECENT_AUTH_REQUIRED"
    }, { status: 403 });
  }

  const userId = authCheck.userId!;
  // ... your sensitive logic
}
```

## Email Verification Banner

### File: `app/dashboard/_components/email-verification-banner.tsx`

A banner component that displays at the top of the dashboard for users with unverified emails.

**Features:**
- Shows email verification reminder
- Allows resending verification email
- Can be dismissed by user
- Automatically hides when email is verified

**Usage:**

Already integrated in `app/dashboard/layout.tsx`:

```typescript
import EmailVerificationBanner from "./_components/email-verification-banner";

export default async function DashboardLayout({ children }) {
  return (
    <div>
      <EmailVerificationBanner />
      {children}
    </div>
  );
}
```

## Error Codes

The authentication system uses these error codes:

- `UNAUTHORIZED` - User is not authenticated
- `EMAIL_NOT_VERIFIED` - User's email is not verified
- `RECENT_AUTH_REQUIRED` - Recent authentication is required
- `AUTH_CHECK_FAILED` - Authentication check failed

## Best Practices

1. **Always use `checkAuthAndVerification`** for most routes - it's simpler and more consistent
2. **Require email verification** for sensitive operations (default behavior)
3. **Use recent authentication checks** for password changes, payment updates, and account deletion
4. **Return appropriate error codes** so frontend can handle them properly
5. **Log authentication failures** for security monitoring

## Migration Guide

To update existing routes to use the new authentication utilities:

### Before:
```typescript
const result = await auth.api.getSession({ headers: await headers() });

if (!result?.session?.userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userId = result.session.userId;
```

### After:
```typescript
const authCheck = await checkAuthAndVerification(await headers());

if (!authCheck.authenticated) {
  return NextResponse.json({ error: authCheck.error }, { status: 401 });
}

if (!authCheck.emailVerified) {
  return NextResponse.json({ 
    error: authCheck.error,
    code: authCheck.errorCode
  }, { status: 403 });
}

const userId = authCheck.userId!;
```

## Testing

When testing authentication:

1. **Test with Google OAuth users** - Should work without changes
2. **Test with email/password users (verified)** - Should work normally
3. **Test with email/password users (unverified)** - Should see verification banner and get 403 errors
4. **Test recent authentication** - Should require re-authentication after 30 minutes

## Requirements Validation

This implementation satisfies:

- **Requirement 2.6**: Protected routes work with both authentication methods
- **Requirement 4.4**: Unverified accounts are restricted from protected features
- **Requirement 5.5**: Sensitive operations require recent authentication

## Examples

See these files for implementation examples:
- `app/api/reminder-settings/route.ts` - Email verification required
- `app/api/business-profile/route.ts` - Email verification required
- `app/dashboard/layout.tsx` - Email verification banner integration
