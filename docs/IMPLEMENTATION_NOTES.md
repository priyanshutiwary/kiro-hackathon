# Implementation Notes

## Table of Contents
1. [Database-First Implementation for Invoices and Customers](#database-first-implementation)
2. [Webhook Status Tracking for Payment Reminders](#webhook-status-tracking)

---

## Database-First Implementation for Invoices and Customers {#database-first-implementation}

### Overview
Updated the invoices and customers pages to fetch data from the local database cache. Detail modals also show data from the database only - no additional fetching from Zoho.

## Changes Made

### API Routes Created

1. **`/api/db/customers`** - Fetches customers from `customersCache` table
   - Returns paginated list of customers from local database
   - Maps database records to match Zoho contacts format for compatibility

2. **`/api/db/invoices`** - Fetches invoices from `invoicesCache` table
   - Returns paginated list of invoices from local database
   - Joins with `customersCache` to get customer names
   - Maps database records to match Zoho invoices format

3. **`/api/zoho/contacts/[contactId]`** - Fetches detailed contact from Zoho (created but not used in UI currently)

### UI Components Updated

1. **Customers Page** (`app/dashboard/customers/page.tsx`)
   - Fetches from `/api/db/customers` instead of `/api/zoho/contacts`
   - Cards are clickable and open a detail modal
   - Shows data from local cache for fast loading

2. **Customer Detail Modal** (`app/dashboard/customers/_components/customer-detail-modal.tsx`)
   - Opens with data from database cache (instant load)
   - Shows basic information, contact details, and contact persons
   - All data comes from the database - no Zoho API calls

3. **Invoices Page** (`app/dashboard/invoices/page.tsx`)
   - Fetches from `/api/db/invoices` instead of `/api/zoho/invoices`
   - Shows data from local cache for fast loading

4. **Invoice Detail Modal** (`app/dashboard/invoices/_components/invoice-detail-modal.tsx`)
   - Opens with data from database cache (instant load)
   - Shows customer info, invoice details, and financial summary
   - All data comes from the database - no Zoho API calls

### Benefits

- **Instant Load**: Both list views and detail modals open immediately
- **No API Calls**: All data comes from local database cache
- **Consistent Performance**: No dependency on Zoho API availability
- **Reduced Costs**: Minimal API usage
- **Offline Capability**: Full functionality even without internet connection

### Data Flow

```
User visits page → Fetch from DB cache → Display list
User clicks item → Open modal with DB data (instant)
```

### Limitations

- Detail modals show only data that's been synced to the database
- Advanced details like line items, taxes, addresses, etc. depend on what the sync engine stores
- Data freshness depends on sync frequency

### Requirements

- Database must be synced with Zoho data using the sync engine
- `customersCache` and `invoicesCache` tables must be populated
- Sync engine should run regularly to keep data up-to-date


---

## Webhook Status Tracking for Payment Reminders {#webhook-status-tracking}

### Overview
Implemented event-driven webhook system for accurate call lifecycle tracking. Instead of marking reminders as completed immediately after room creation, the system now waits for the Python agent to report actual call outcomes via webhook callbacks.

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Cron Scheduler │────────▶│  Call Executor   │────────▶│  LiveKit Room   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │                             │
                                     │                             ▼
                                     │                    ┌─────────────────┐
                                     │                    │  Python Agent   │
                                     │                    └─────────────────┘
                                     │                             │
                                     │                             │ Webhook
                                     │                             │ Callbacks
                                     │                             ▼
                                     │                    ┌─────────────────┐
                                     └───────────────────▶│ Webhook Handler │
                                                          └─────────────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │    Database     │
                                                          └─────────────────┘
```

### Components

#### 1. Webhook Endpoint (`/api/webhooks/call-status`)

**Purpose:** Receives call status updates from the Python agent

**Authentication:** HMAC-SHA256 signature verification using `WEBHOOK_SECRET`
- Signature sent in `X-Webhook-Signature` header
- Timing-safe comparison prevents timing attacks
- Returns 401 for authentication failures

**Event Types:**
- `call_answered` - Call was answered by customer
- `call_completed` - Call finished with outcome data
- `call_failed` - Call failed to connect

**Request Format:**
```typescript
{
  reminder_id: string;
  event_type: 'call_answered' | 'call_completed' | 'call_failed';
  outcome?: {
    connected: boolean;
    duration: number;
    customer_response: 'will_pay_today' | 'already_paid' | 'dispute' | 'no_answer';
    notes?: string;
  };
}
```

**Response Codes:**
- `200` - Success
- `400` - Invalid request (missing fields, invalid event type)
- `401` - Authentication failed
- `404` - Reminder not found
- `500` - Internal server error

#### 2. Status Update Handler

**Purpose:** Processes webhook events and updates reminder status

**Status Transitions:**

| Event Type | Current Status | New Status | Notes |
|------------|---------------|------------|-------|
| `call_answered` | `in_progress` | `processing` | Call connected, agent is talking |
| `call_completed` | `processing` | `completed` | Call finished successfully |
| `call_completed` (no_answer) | `processing` | `pending` | No answer, schedule retry |
| `call_failed` | `in_progress` | `failed` | Call failed to connect |

**Outcome Data Storage:**
- Stored in `call_outcome` JSON field
- Includes: connected, duration, customer_response, notes, reported_at
- Updated `last_attempt_at` timestamp on completion

#### 3. Timeout Monitor (`lib/payment-reminders/timeout-monitor.ts`)

**Purpose:** Detects and handles reminders stuck in `in_progress` state

**Behavior:**
- Runs during each cron execution (before processing new reminders)
- Finds reminders in `in_progress` for > 10 minutes
- Marks them as `failed` with skip_reason: `'Call timeout - no agent response'`
- Logs timeout events for monitoring
- Timed-out reminders can still be retried

**Timeout Threshold:** 10 minutes (600,000 ms)

**Query Logic:**
```typescript
status = 'in_progress' AND updated_at < (now - 10 minutes)
```

#### 4. Python Agent Webhook Client (`agent/src/services/webhook_client.py`)

**Purpose:** Reports call events from Python agent to backend

**Features:**
- HMAC-SHA256 signature generation for authentication
- Exponential backoff retry logic (3 attempts: immediate, 2s, 4s)
- Timeout handling (10 second request timeout)
- Comprehensive error logging

**Methods:**
- `send_call_answered(reminder_id)` - Report call answered
- `send_call_completed(reminder_id, connected, duration, customer_response, notes)` - Report call completion
- `send_call_failed(reminder_id, reason)` - Report call failure

**Retry Logic:**
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- After 3 failures: Log error for manual investigation

### Data Flow

#### Successful Call Flow
```
1. Cron scheduler queues reminder → status: 'in_progress'
2. Call executor creates LiveKit room
3. Python agent joins room and answers call
4. Agent sends webhook: call_answered → status: 'processing'
5. Agent completes call with customer
6. Agent sends webhook: call_completed → status: 'completed'
7. Outcome data stored in database
```

#### No Answer Flow
```
1. Cron scheduler queues reminder → status: 'in_progress'
2. Call executor creates LiveKit room
3. Python agent joins room but no answer
4. Agent sends webhook: call_completed (no_answer) → status: 'pending'
5. Reminder scheduled for retry
```

#### Timeout Flow
```
1. Cron scheduler queues reminder → status: 'in_progress'
2. Call executor creates LiveKit room
3. Python agent never reports back (crashed, network issue, etc.)
4. After 10 minutes, timeout monitor runs
5. Timeout monitor marks reminder as 'failed' with skip_reason
6. Reminder can be retried on next cron run
```

### Configuration

#### Environment Variables

**Backend (Next.js):**
```bash
WEBHOOK_SECRET=<random-secret-key>  # For HMAC authentication
```

**Python Agent:**
```bash
WEBHOOK_URL=https://your-domain.com/api/webhooks/call-status
WEBHOOK_SECRET=<same-secret-as-backend>
```

### Benefits

- **Accurate Tracking**: Real call outcomes instead of assumed success
- **Retry Logic**: No-answer calls automatically scheduled for retry
- **Timeout Handling**: Stuck reminders automatically cleaned up
- **Security**: HMAC authentication prevents unauthorized updates
- **Reliability**: Exponential backoff retry ensures webhook delivery
- **Monitoring**: Comprehensive logging for debugging and analytics

### Limitations

- Webhook delivery depends on network connectivity
- If all 3 retry attempts fail, manual investigation required
- Timeout threshold is fixed at 10 minutes (not configurable)
- No webhook delivery confirmation to agent (fire-and-forget after retries)

### Testing Considerations

**Property-Based Tests Defined (Not Yet Implemented):**
- Authentication enforcement (invalid tokens → 401)
- Valid requests update database
- Invalid reminder IDs → 404
- Status transitions for all event types
- Outcome data persistence
- Timestamp updates
- Timeout detection and handling

**Integration Tests Needed:**
- End-to-end flow: schedule → dispatch → webhook → status update
- Timeout scenario with cron execution
- Retry scheduling after no_answer
- Error handling for various failure scenarios

### Future Enhancements

- Configurable timeout threshold per business profile
- Webhook delivery confirmation to agent
- Retry queue for failed webhook deliveries
- Analytics dashboard for call outcomes
- Real-time status updates via WebSocket
- Webhook event history for debugging
