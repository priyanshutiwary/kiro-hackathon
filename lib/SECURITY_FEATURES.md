# Security Features Documentation

This document describes the security features implemented for email/password authentication.

## Features Implemented

### 1. Account Lockout (Requirements 2.5, 5.3)

**Location:** `lib/auth.ts`

**How it works:**
- Tracks failed login attempts in the `user` table
- After 5 consecutive failed login attempts, the account is locked for 15 minutes
- Failed attempts are reset on successful login
- Lockout status is checked before each login attempt

**Database fields:**
- `failedLoginAttempts`: Counter for failed login attempts
- `lockedUntil`: Timestamp when the lockout expires
- `lastLoginAttempt`: Timestamp of the last login attempt

**User experience:**
- Users see an error message: "Account is locked. Try again in X minutes."
- After 15 minutes, the lockout automatically expires

### 2. Email Rate Limiting (Requirement 7.4)

**Location:** `lib/email.ts`

**How it works:**
- Limits verification and password reset emails to 3 per hour per email address
- Uses in-memory storage with automatic cleanup
- Separate rate limits for verification and reset emails

**User experience:**
- Users see an error message: "Too many verification/reset emails sent. Please wait an hour before requesting another."

### 3. Recent Authentication for Sensitive Operations (Requirement 5.5)

**Location:** `lib/auth-utils.ts`

**How it works:**
- Tracks `lastAuthenticatedAt` timestamp in the `session` table
- Provides `requireRecentAuthentication()` function to check if user authenticated within the last 30 minutes (configurable)
- Automatically updated on successful login

**Usage in API routes:**

```typescript
import { auth } from "@/lib/auth";
import { requireRecentAuthentication } from "@/lib/auth-utils";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  // Get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if user authenticated recently (within 30 minutes)
  const isRecent = await requireRecentAuthentication(session.session.token, 30);
  
  if (!isRecent) {
    return NextResponse.json(
      { error: "This operation requires recent authentication. Please sign in again." },
      { status: 403 }
    );
  }

  // Proceed with sensitive operation...
}
```

**When to use:**
- Password changes
- Email address changes
- Payment method updates
- Account deletion
- Security settings changes
- Any other sensitive operations

## Database Schema Changes

The following fields were added to support these security features:

**User table:**
```sql
ALTER TABLE "user" ADD COLUMN "failedLoginAttempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "lockedUntil" timestamp;
ALTER TABLE "user" ADD COLUMN "lastLoginAttempt" timestamp;
```

**Session table:**
```sql
ALTER TABLE "session" ADD COLUMN "lastAuthenticatedAt" timestamp DEFAULT now() NOT NULL;
```

## Configuration

All security features are configured in `lib/auth.ts`:

- **Account lockout threshold:** 5 failed attempts
- **Lockout duration:** 15 minutes
- **Email rate limit:** 3 emails per hour per type
- **Recent authentication window:** 30 minutes (configurable per operation)

## Testing

To test these features:

1. **Account Lockout:**
   - Try to sign in with wrong password 5 times
   - Verify account is locked
   - Wait 15 minutes or manually reset in database
   - Verify you can sign in again

2. **Email Rate Limiting:**
   - Request verification email 3 times quickly
   - Verify 4th request is blocked
   - Wait 1 hour and verify you can request again

3. **Recent Authentication:**
   - Sign in to your account
   - Immediately try a sensitive operation (should work)
   - Wait 31 minutes
   - Try the same operation (should require re-authentication)
