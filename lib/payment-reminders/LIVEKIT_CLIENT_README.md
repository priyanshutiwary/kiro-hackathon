# LiveKit Client for Payment Reminder Calls

This module provides integration with LiveKit for making outbound voice calls to customers about payment reminders.

## Overview

The LiveKit client handles:
- Call initiation with invoice context
- Agent prompt generation
- Call outcome tracking
- Comprehensive error handling

## Configuration

Add the following environment variables to your `.env` file:

```bash
LIVEKIT_API_URL=https://your-livekit-instance.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## Usage

### Making a Call

```typescript
import { makeCall, CallContext } from './livekit-client';

const context: CallContext = {
  customerName: 'John Doe',
  invoiceNumber: 'INV-001',
  originalAmount: 1000.00,
  amountDue: 1000.00,
  dueDate: '2024-02-15',
  daysUntilDue: 5,
  isOverdue: false,
  paymentMethods: ['credit_card', 'bank_transfer'],
  companyName: 'Acme Corp',
  supportPhone: '+1234567890'
};

try {
  const outcome = await makeCall('+1234567890', context);
  
  console.log('Call connected:', outcome.connected);
  console.log('Duration:', outcome.duration, 'seconds');
  console.log('Customer response:', outcome.customerResponse);
  console.log('LiveKit call ID:', outcome.livekitCallId);
} catch (error) {
  if (error instanceof InvalidPhoneNumberError) {
    console.error('Invalid phone number format');
  } else if (error instanceof NetworkTimeoutError) {
    console.error('Network timeout - retry later');
  } else if (error instanceof CallInitiationError) {
    console.error('Failed to initiate call:', error.message);
  }
}
```

### Getting Call Status

```typescript
import { getCallStatus } from './livekit-client';

try {
  const status = await getCallStatus('call-id-123');
  
  console.log('Call status:', status.status);
  if (status.outcome) {
    console.log('Call outcome:', status.outcome);
  }
} catch (error) {
  console.error('Failed to get call status:', error);
}
```

## Interfaces

### CallContext

Contains all invoice and customer information needed for the call:

```typescript
interface CallContext {
  customerName: string;        // Customer's full name
  invoiceNumber: string;        // Invoice number for reference
  originalAmount: number;       // Original total amount
  amountDue: number;           // Current amount still due
  dueDate: string;             // Due date (YYYY-MM-DD)
  daysUntilDue: number;        // Days until due (negative if overdue)
  isOverdue: boolean;          // Whether invoice is overdue
  paymentMethods: string[];    // Available payment methods
  companyName: string;         // Company making the call
  supportPhone: string;        // Support phone number
}
```

### CallOutcome

Tracks the result of a call attempt:

```typescript
interface CallOutcome {
  connected: boolean;          // Whether call connected
  duration: number;            // Call duration in seconds
  customerResponse:            // Customer's response category
    | 'will_pay_today'
    | 'already_paid'
    | 'dispute'
    | 'no_answer'
    | 'other';
  notes?: string;              // Additional notes
  livekitCallId?: string;      // LiveKit call ID
}
```

## Error Handling

The module provides specific error types for different failure scenarios:

### InvalidPhoneNumberError

Thrown when the phone number format is invalid. Phone numbers must be in E.164 format (e.g., `+1234567890`).

```typescript
try {
  await makeCall('invalid-number', context);
} catch (error) {
  if (error instanceof InvalidPhoneNumberError) {
    // Handle invalid phone number
  }
}
```

### NetworkTimeoutError

Thrown when a network timeout occurs during the API call.

```typescript
try {
  await makeCall('+1234567890', context);
} catch (error) {
  if (error instanceof NetworkTimeoutError) {
    // Retry the call later
  }
}
```

### CallInitiationError

Thrown when call initiation fails for any reason other than network timeout or invalid phone number.

```typescript
try {
  await makeCall('+1234567890', context);
} catch (error) {
  if (error instanceof CallInitiationError) {
    // Log error and mark reminder as failed
  }
}
```

### ConfigurationError

Thrown when required environment variables are missing.

```typescript
try {
  await makeCall('+1234567890', context);
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Check environment configuration
  }
}
```

## Agent Prompt

The module automatically generates a structured prompt for the voice agent that includes:

1. Company identification
2. Customer information
3. Invoice details (number, amount, due date)
4. Call objectives
5. Available payment methods
6. Support contact information
7. Response categorization instructions

Example prompt:

```
You are a professional payment reminder agent calling on behalf of Acme Corp.

Customer Information:
- Name: John Doe
- Invoice Number: INV-001
- Amount Due: $1000.00
- Original Amount: $1000.00
- Due Date: 2024-02-15 (due in 5 days)

Your goal is to:
1. Politely remind the customer about their outstanding invoice
2. Confirm they received the invoice
3. Ask if they have any questions about the charges
4. Determine their payment intention

Available payment methods: credit_card, bank_transfer

If the customer has questions, provide the support phone number: +1234567890

Be professional, courteous, and understanding...
```

## Implementation Status

⚠️ **Note**: The actual LiveKit SDK integration is not yet implemented. The current implementation provides:

- ✅ Complete TypeScript interfaces
- ✅ Phone number validation
- ✅ Agent prompt generation
- ✅ Comprehensive error handling
- ✅ Configuration management
- ⏳ LiveKit API integration (placeholder)

To complete the implementation, you'll need to:

1. Install the LiveKit SDK: `npm install livekit-server-sdk`
2. Implement the actual API calls in `makeCall()` and `getCallStatus()`
3. Configure your LiveKit instance
4. Test with real phone numbers

## Requirements Mapping

This module satisfies the following requirements:

- **8.1**: Initiate calls via LiveKit Agent
- **8.2**: Provide invoice details to voice agent
- **8.3**: Track call connection status
- **8.4**: Track call duration
- **8.5**: Track customer response categories
- **14.1-14.9**: Prepare complete call context
- **17.1**: Initiate outbound calls using LiveKit API
- **17.2**: Provide call context to LiveKit agent
- **17.3**: Receive call outcome data from LiveKit
- **17.4**: Handle LiveKit API errors gracefully
- **17.5**: Track LiveKit call IDs for reference
- **17.6**: Configure voice agent prompt with invoice information

## Testing

Unit tests should cover:

- Phone number validation (valid and invalid formats)
- Agent prompt generation with various contexts
- Error handling for different failure scenarios
- Configuration validation

Example test:

```typescript
import { makeCall, InvalidPhoneNumberError } from './livekit-client';

describe('LiveKit Client', () => {
  it('should reject invalid phone numbers', async () => {
    const context = { /* ... */ };
    
    await expect(makeCall('invalid', context))
      .rejects
      .toThrow(InvalidPhoneNumberError);
  });
  
  it('should accept valid E.164 phone numbers', async () => {
    const context = { /* ... */ };
    
    // This will throw CallInitiationError until SDK is implemented
    await expect(makeCall('+1234567890', context))
      .rejects
      .toThrow(CallInitiationError);
  });
});
```
