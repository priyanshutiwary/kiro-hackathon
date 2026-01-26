/**
 * LiveKit Call Dispatcher
 * 
 * Handles all LiveKit-specific logic for dispatching payment reminder calls.
 * This module orchestrates:
 * 1. Room creation
 * 2. Agent dispatch
 * 3. SIP call initiation
 */

import crypto from 'crypto';

/**
 * Payment context for the call
 */
export interface PaymentCallContext {
  reminderId: string; // Added for webhook integration
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  amountDue: number;
  currencyCode: string; // ISO currency code (USD, INR, EUR, etc.)
  currencySymbol: string; // Currency symbol ($, ₹, €, etc.)
  dueDate: string;
  companyName: string;
  supportPhone: string;
  language?: string;
  voiceGender?: string;
}

/**
 * Result of call dispatch
 */
export interface CallDispatchResult {
  success: boolean;
  roomName: string;
  sipParticipantId?: string;
  error?: string;
}

/**
 * LiveKit configuration
 */
interface LiveKitConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  sipTrunkId: string;
}

/**
 * Get LiveKit configuration from environment
 */
function getLiveKitConfig(): LiveKitConfig {
  let apiUrl = process.env.LIVEKIT_API_URL || process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const sipTrunkId = process.env.LIVEKIT_SIP_TRUNK_ID;

  if (!apiUrl || !apiKey || !apiSecret) {
    throw new Error('Missing LiveKit configuration. Check LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET');
  }

  if (!sipTrunkId) {
    throw new Error('Missing LIVEKIT_SIP_TRUNK_ID configuration');
  }

  // Convert wss:// to https:// for API calls
  if (apiUrl.startsWith('wss://')) {
    apiUrl = apiUrl.replace('wss://', 'https://');
  } else if (apiUrl.startsWith('ws://')) {
    apiUrl = apiUrl.replace('ws://', 'http://');
  }

  return { apiUrl, apiKey, apiSecret, sipTrunkId };
}

/**
 * Generate JWT access token for LiveKit API
 */
function generateAccessToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  permissions: {
    canCreateRoom?: boolean;
    canDispatchAgent?: boolean;
    canDispatchSip?: boolean;
  } = {}
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: {
    iss: string;
    sub: string;
    exp: number;
    nbf: number;
    video: {
      room: string;
      roomCreate: boolean;
      roomJoin: boolean;
      roomAdmin: boolean;
      roomList: boolean;
    };
    sip?: {
      admin: boolean;
      call: boolean;
    };
    agent?: {
      dispatch: boolean;
    };
  } = {
    iss: apiKey,
    sub: apiKey,
    exp: now + 3600, // 1 hour expiry
    nbf: now,
    video: {
      room: roomName,
      roomCreate: permissions.canCreateRoom || false,
      roomJoin: true,
      roomAdmin: true,
      roomList: true,
    },
  };

  // Add SIP permissions
  if (permissions.canDispatchSip) {
    payload.sip = {
      admin: true,
      call: true,
    };
  }

  // Add agent permissions
  if (permissions.canDispatchAgent) {
    payload.agent = {
      dispatch: true,
    };
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Clean phone number to E.164 format
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

/**
 * Validate E.164 phone number format
 */
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Dispatch a payment reminder call via LiveKit
 * 
 * This function orchestrates the complete call flow:
 * 1. Creates a LiveKit room with payment context
 * 2. Dispatches the Python agent to handle the call
 * 3. Initiates SIP call to customer's phone
 * 
 * @param context - Payment call context with customer and invoice details
 * @returns Promise resolving to dispatch result
 */
export async function dispatchPaymentCall(
  context: PaymentCallContext
): Promise<CallDispatchResult> {
  const config = getLiveKitConfig();

  // Clean and validate phone number
  const cleanedPhone = cleanPhoneNumber(context.customerPhone);
  if (!isValidE164(cleanedPhone)) {
    return {
      success: false,
      roomName: '',
      error: `Invalid phone number format: ${context.customerPhone}. Must be E.164 format (e.g., +1234567890)`,
    };
  }

  // Generate unique room name with reminder_id for webhook integration
  // Format: payment-reminder-{reminderId}-{timestamp}-{random}
  const roomName = `payment-reminder-${context.reminderId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log(`[LiveKit Dispatcher] Starting call dispatch for ${cleanedPhone}`);
  console.log(`[LiveKit Dispatcher] Room: ${roomName}`);

  try {
    // Convert context to Python agent format (snake_case)
    const agentMetadata = {
      customer_name: context.customerName,
      invoice_number: context.invoiceNumber,
      amount_due: context.amountDue,
      currency_code: context.currencyCode,
      currency_symbol: context.currencySymbol,
      due_date: context.dueDate,
      company_name: context.companyName,
      phone_number: cleanedPhone,
      language: context.language || 'en',
      voice_gender: context.voiceGender || 'female',
    };

    // Step 1: Create room
    console.log(`[LiveKit Dispatcher] Creating room...`);
    const createRoomResponse = await fetch(`${config.apiUrl}/twirp/livekit.RoomService/CreateRoom`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${generateAccessToken(config.apiKey, config.apiSecret, roomName, { canCreateRoom: true })}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 2,
        metadata: JSON.stringify(agentMetadata),
      }),
    });

    if (!createRoomResponse.ok) {
      const errorText = await createRoomResponse.text();
      throw new Error(`Failed to create room: ${createRoomResponse.status} - ${errorText}`);
    }

    console.log(`[LiveKit Dispatcher] ✓ Room created`);

    // Step 2: Dispatch agent
    console.log(`[LiveKit Dispatcher] Dispatching agent...`);
    const agentDispatchResponse = await fetch(`${config.apiUrl}/twirp/livekit.AgentDispatchService/CreateDispatch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${generateAccessToken(config.apiKey, config.apiSecret, roomName, { canDispatchAgent: true })}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room: roomName,
        agent_name: 'payment-reminder-agent',
        metadata: JSON.stringify(agentMetadata),
      }),
    });

    if (!agentDispatchResponse.ok) {
      const errorText = await agentDispatchResponse.text();
      console.warn(`[LiveKit Dispatcher] Agent dispatch warning: ${agentDispatchResponse.status} - ${errorText}`);
      // Don't fail - continue with SIP call
    } else {
      console.log(`[LiveKit Dispatcher] ✓ Agent dispatched`);
    }

    // Step 3: Dispatch SIP call
    // NOTE: The Python agent handles SIP call creation internally via CallService.setup_outbound_call()
    // So we don't need to create a SIP participant here. The agent will handle it when it starts.
    console.log(`[LiveKit Dispatcher] ✓ SIP call will be handled by Python agent`);
    
    /* COMMENTED OUT - Python agent handles SIP call creation
    console.log(`[LiveKit Dispatcher] Dispatching SIP call to ${cleanedPhone}...`);
    console.log(`[LiveKit Dispatcher] Using SIP Trunk ID: ${config.sipTrunkId}`);
    
    const sipDispatchResponse = await fetch(`${config.apiUrl}/twirp/livekit.SIP/CreateSIPParticipant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${generateAccessToken(config.apiKey, config.apiSecret, roomName, { canDispatchSip: true })}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sip_trunk_id: config.sipTrunkId,
        sip_call_to: cleanedPhone,
        room_name: roomName,
        participant_identity: `sip-${cleanedPhone}`,
        participant_name: context.customerName,
      }),
    });

    if (!sipDispatchResponse.ok) {
      const errorText = await sipDispatchResponse.text();
      
      // Provide helpful error message for 404 (SIP trunk not found)
      if (sipDispatchResponse.status === 404) {
        throw new Error(
          `SIP Trunk not found. Please verify:\n` +
          `1. LIVEKIT_SIP_TRUNK_ID is set correctly in your .env.local file\n` +
          `2. The SIP trunk exists in your LiveKit dashboard\n` +
          `3. Current SIP Trunk ID: ${config.sipTrunkId}\n` +
          `Error details: ${errorText}`
        );
      }
      
      throw new Error(`Failed to dispatch SIP call: ${sipDispatchResponse.status} - ${errorText}`);
    }

    const sipParticipant = await sipDispatchResponse.json();
    console.log(`[LiveKit Dispatcher] ✓ SIP call dispatched. Participant ID: ${sipParticipant.participant_id}`);
    */

    return {
      success: true,
      roomName,
      sipParticipantId: undefined, // Will be created by Python agent
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[LiveKit Dispatcher] Error: ${errorMessage}`);

    return {
      success: false,
      roomName,
      error: errorMessage,
    };
  }
}
