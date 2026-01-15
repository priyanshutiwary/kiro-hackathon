# LiveKit Integration Architecture

## Overview

The payment reminder system uses a clean, layered architecture for LiveKit integration following **Option 3: Next.js API Route as Orchestrator**.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Payment Reminder System                                     │
│  (lib/payment-reminders/call-executor.ts)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LiveKit Client (Simplified)                                 │
│  (lib/payment-reminders/livekit-client.ts)                  │
│  - Simple interface: makeCall(phone, context)                │
│  - Delegates to dispatcher                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LiveKit Dispatcher (Core Logic)                             │
│  (lib/livekit/call-dispatcher.ts)                           │
│  - Room creation                                             │
│  - Agent dispatch                                            │
│  - SIP call initiation                                       │
│  - JWT token generation                                      │
│  - Phone number validation                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LiveKit API                                                 │
│  - RoomService/CreateRoom                                    │
│  - AgentDispatchService/CreateDispatch                       │
│  - SIP/CreateSIPParticipant                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Agent Worker                                         │
│  (agent/main.py)                                             │
│  - Listens for jobs                                          │
│  - Joins room                                                │
│  - Handles conversation                                      │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. LiveKit Client (`lib/payment-reminders/livekit-client.ts`)
**Purpose:** Simple interface for payment reminder system

**Responsibilities:**
- Expose `makeCall()` function
- Convert payment context to dispatcher format
- Handle errors and return outcomes

**Why:** Keeps payment reminder code clean and unaware of LiveKit details

### 2. LiveKit Dispatcher (`lib/livekit/call-dispatcher.ts`)
**Purpose:** All LiveKit-specific logic in one place

**Responsibilities:**
- Create LiveKit rooms
- Dispatch Python agent
- Initiate SIP calls
- Generate JWT tokens
- Validate phone numbers
- Handle LiveKit API errors

**Why:** 
- Single source of truth for LiveKit logic
- Easy to test independently
- Easy to swap LiveKit for another provider
- Reusable across different features

### 3. API Route (`app/api/livekit/dispatch-call/route.ts`)
**Purpose:** Optional HTTP endpoint for external triggers

**Responsibilities:**
- Validate request payload
- Call dispatcher
- Return JSON response

**Why:** Allows external systems to trigger calls via HTTP

## Data Flow

### Making a Call

1. **Payment Reminder System** calls `makeCall(phone, context)`
2. **LiveKit Client** converts context and calls `dispatchPaymentCall()`
3. **LiveKit Dispatcher**:
   - Cleans and validates phone number
   - Generates unique room name
   - Creates room with metadata (snake_case for Python)
   - Dispatches agent with metadata
   - Initiates SIP call
4. **LiveKit API** processes requests
5. **Python Agent** receives job and joins room
6. **SIP Call** connects to customer
7. **Agent** handles conversation

### Context Conversion

**Next.js (camelCase)** → **Python (snake_case)**

```typescript
// Next.js
{
  customerName: "John Doe",
  invoiceNumber: "INV-001",
  amountDue: 100.00
}

// Converted to Python format
{
  customer_name: "John Doe",
  invoice_number: "INV-001",
  amount_due: 100.00
}
```

## Benefits of This Architecture

### ✅ Separation of Concerns
- Payment logic doesn't know about LiveKit
- LiveKit logic isolated in one module
- Easy to understand and maintain

### ✅ Testability
- Can test dispatcher independently
- Can mock dispatcher in payment tests
- Clear interfaces between layers

### ✅ Flexibility
- Easy to swap LiveKit for Twilio/Vonage
- Can add retry logic in dispatcher
- Can add monitoring/logging in one place

### ✅ Reusability
- Dispatcher can be used by other features
- API route allows external triggers
- Clean interfaces for future expansion

## Configuration

### Environment Variables

```bash
# LiveKit Configuration
LIVEKIT_URL="wss://your-instance.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"
LIVEKIT_SIP_TRUNK_ID="ST_xxxxx"
```

### Python Agent

Must be running and connected to LiveKit:
```bash
cd agent
python main.py dev
```

## Error Handling

The dispatcher handles all LiveKit-specific errors:
- Invalid phone numbers
- Room creation failures
- Agent dispatch failures (non-fatal)
- SIP call failures
- Authentication errors

Errors are wrapped in custom error types:
- `InvalidPhoneNumberError`
- `CallInitiationError`
- `LiveKitError`

## Future Enhancements

1. **Webhooks**: Listen for call completion events
2. **Call Status**: Track ongoing calls
3. **Retry Logic**: Automatic retries in dispatcher
4. **Monitoring**: Centralized logging and metrics
5. **Queue System**: Add Redis/SQS for async processing

## Testing

### Test the Dispatcher
```typescript
import { dispatchPaymentCall } from '@/lib/livekit/call-dispatcher';

const result = await dispatchPaymentCall({
  customerName: "Test Customer",
  customerPhone: "+1234567890",
  invoiceNumber: "INV-001",
  amountDue: 100.00,
  dueDate: "2024-01-15",
  companyName: "Test Company",
  supportPhone: "+1800555000",
});
```

### Test via API
```bash
curl -X POST http://localhost:3000/api/livekit/dispatch-call \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "invoiceNumber": "INV-001",
    "amountDue": 100.00,
    "dueDate": "2024-01-15",
    "companyName": "Test Company",
    "supportPhone": "+1800555000"
  }'
```

## Summary

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Easy to maintain and test
- ✅ Flexible and extensible
- ✅ Works with LiveKit's worker model
- ✅ No additional infrastructure needed
- ✅ Professional and scalable

The key insight: **LiveKit agents are workers, not HTTP servers**, so we need the orchestration logic in Next.js, but we keep it well-organized and isolated.
