# AI-Powered Call Agent for SME Payment Reminders

An intelligent call agent system that automates payment reminder calls for small and medium enterprises. Built with Next.js 15, LiveKit voice AI, OpenAI GPT-4o, and Zoho CRM integration for seamless customer outreach and payment collection.

## ✨ Features

### 🤖 AI Voice Agent
- **LiveKit Integration** - Real-time voice calls with AI agents
- Natural conversation flows for payment reminders
- Intelligent call routing and scheduling
- Pre-call verification and validation
- Call analytics and success tracking

### 💰 Payment Reminder Automation
- **Smart Sync Engine** - Automated processing of overdue invoices
- Customer sync with Zoho CRM/Books integration
- Intelligent phone number extraction and validation
- Scheduled reminder processing with cron jobs
- Business profile-specific call configurations
- **Multi-Channel Reminders** - SMS and voice call support
  - Smart Mode: Automatic channel selection (SMS for early reminders, voice for urgent)
  - Manual Mode: User-selected channel preference
  - Cost-effective SMS for non-urgent reminders
- **Webhook Status Tracking** - Real-time call outcome reporting
- Automatic retry logic for failed or unanswered calls
- Timeout monitoring for stuck reminders

### 🏢 Business Management
- **Customer Management** - Comprehensive customer database with sync
- Invoice tracking and payment status monitoring
- Business profile configuration for personalized calls
- Integration status monitoring and health checks
- Dashboard for managing reminders and scheduled calls

### 🔗 CRM Integration
- **Zoho Books/CRM** - OAuth 2.0 with Multi-DC support
- Secure token management with AES-256-GCM encryption
- Two-way data synchronization (customers, invoices, bills)
- Automatic token refresh and retry logic
- Real-time integration status tracking

### 🎨 Modern Dashboard
- **Next.js 15** - Server Components with App Router
- **Tailwind CSS v4** + shadcn/ui components
- Dark/light theme support with smooth transitions
- Responsive design optimized for business workflows
- Real-time updates and optimistic UI

### 🗄️ Database & Storage
- **Neon PostgreSQL** - Serverless database with caching
- **Drizzle ORM** - Type-safe database operations
- Local data caching for fast UI performance
- Database-first approach for instant loading
- Automated sync engines for data consistency

## 🚀 Tech Stack

- **Framework**: Next.js 15.4.10 with App Router
- **Language**: TypeScript with strict mode
- **Voice AI**: LiveKit for real-time voice calls
- **AI Integration**: OpenAI GPT-4o with AI SDK v4.3.16
- **SMS**: Twilio for SMS reminders
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth v1.4.15
- **Payments**: Dodo Payments v2.2.1
- **CRM Integration**: Zoho Books/CRM OAuth 2.0
- **Email**: Resend for transactional emails
- **Encryption**: AES-256-GCM for secure token storage
- **Deployment**: Cloudflare Pages with OpenNext

## 📁 Project Structure

```
├── app/
│   ├── dashboard/           # Business management dashboard
│   │   ├── customers/       # Customer management
│   │   ├── invoices/        # Invoice tracking
│   │   ├── reminders/       # Payment reminders
│   │   ├── scheduled/       # Scheduled calls
│   │   ├── business-profile/ # Company settings
│   │   └── integrations/    # CRM integrations
│   └── api/                 # API routes
│       ├── zoho/           # Zoho CRM/Books integration
│       ├── reminders/      # Reminder processing
│       ├── cron/           # Scheduled jobs
│       └── business-profile/ # Profile management
├── lib/
│   ├── payment-reminders/   # Core reminder system
│   │   ├── sync-engine.ts   # Payment sync automation
│   │   ├── customer-sync-engine.ts # Customer data sync
│   │   ├── livekit-client.ts # Voice call integration
│   │   ├── phone-extractor.ts # Phone validation
│   │   └── pre-call-verification.ts # Call validation
│   ├── business-profile/    # Business configuration
│   ├── zoho-api-client.ts   # Zoho API integration
│   └── encryption.ts        # Token security
└── db/
    ├── schema.ts           # Database schema
    └── drizzle.ts          # Database connection
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- LiveKit account for voice calls
- Zoho Books/CRM account for customer data
- Business with overdue invoices to automate

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd call_agent_smes
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file with:
```env
# Database
DATABASE_URL="your-neon-database-url"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"

# LiveKit Voice Integration
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_URL="your-livekit-server-url"

# OpenAI Integration
OPENAI_API_KEY="your-openai-api-key"

# Dodo Payments
DODO_PAYMENTS_API_KEY="your-dodo-payments-api-key"

# Resend Email Service
RESEND_API_KEY="your-resend-api-key"

# Twilio SMS Integration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
TWILIO_WEBHOOK_SECRET="your-webhook-secret-for-twilio"

# Zoho CRM/Books Integration
ZOHO_CLIENT_ID="your-zoho-client-id"
ZOHO_CLIENT_SECRET="your-zoho-client-secret"
ZOHO_REDIRECT_URI="http://localhost:3000/api/zoho/auth/callback"

# Encryption for secure token storage
ENCRYPTION_KEY="your-32-character-encryption-key"

# Webhook for call status updates
WEBHOOK_SECRET="your-webhook-secret-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Database Setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit push
```

5. **LiveKit Setup**
- Create a LiveKit account at [livekit.io](https://livekit.io)
- Set up voice agent configuration
- Configure outbound calling capabilities

6. **Zoho Integration Setup**
- Create Zoho OAuth app in Zoho Developer Console
- Configure OAuth scopes: `ZohoBooks.contacts.READ`, `ZohoBooks.invoices.READ`
- Set up webhook endpoints for real-time updates

7. **Twilio SMS Setup**
- Create a Twilio account at [twilio.com](https://www.twilio.com)
- Purchase a phone number with SMS capabilities
- Get your Account SID and Auth Token from the Twilio Console
- Configure webhook URL for SMS status callbacks:
  - **Webhook URL**: `https://your-domain.com/api/webhooks/twilio/status`
  - **Method**: POST
  - **Events**: Message Status (delivered, failed, undelivered)
- Generate a webhook secret for signature validation:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Add the webhook secret to your environment variables as `TWILIO_WEBHOOK_SECRET`
- In Twilio Console, navigate to: Phone Numbers → Your Number → Messaging Configuration
- Set "A MESSAGE COMES IN" webhook to your status endpoint

8. **Python Agent Setup**
- Navigate to the `agent` directory
- Follow the setup instructions in `agent/README.md`
- Configure webhook URL and secret to match your backend
- The agent will report call status updates automatically

9. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access your call agent dashboard.

## 🎯 Key Features Explained

### AI Voice Agent System
- **LiveKit Integration**: Real-time voice calls with natural conversation flows
- **Pre-call Verification**: Smart validation before initiating calls
- **Call Analytics**: Track success rates and customer responses
- **Intelligent Scheduling**: Optimal timing based on customer preferences

### Payment Reminder Automation
- **Sync Engine**: Automatically processes overdue invoices from Zoho
- **Customer Sync**: Two-way synchronization with CRM data
- **Phone Extraction**: Intelligent parsing and validation of contact numbers
- **Business Profiles**: Company-specific call scripts and configurations
- **Multi-Channel Support**: 
  - SMS reminders via Twilio for cost-effective early notifications
  - Voice calls via LiveKit for urgent payment follow-ups
  - Smart Mode automatically selects optimal channel based on urgency
  - Manual Mode allows user preference for all reminders
- **Webhook Status Tracking**: Event-driven architecture for accurate call lifecycle tracking
  - Real-time status updates from Python agent via HMAC-authenticated webhooks
  - Twilio SMS delivery status tracking with automatic updates
  - Automatic status transitions: pending → in_progress → processing → completed/failed
  - Timeout monitoring detects stuck reminders (10-minute threshold)
  - Retry logic with exponential backoff ensures webhook delivery
  - No-answer calls automatically scheduled for retry

### CRM Integration
- **Zoho OAuth**: Secure Multi-DC authentication with encrypted token storage
- **Real-time Sync**: Automatic updates between local cache and Zoho
- **Data Consistency**: Database-first approach for instant UI performance
- **Integration Health**: Monitoring and status tracking for all connections

### Business Dashboard
- **Customer Management**: Comprehensive view of all customers and contact history
- **Invoice Tracking**: Real-time status of payments and overdue amounts
- **Reminder Scheduling**: Plan and manage automated call campaigns
- **Analytics**: Track call success rates and payment collection metrics

## 🔧 Customization

### Webhook Configuration

#### Twilio SMS Status Webhooks
The system uses webhooks to track SMS delivery status in real-time:

1. **Endpoint**: `/api/webhooks/twilio/status`
2. **Authentication**: HMAC signature validation using `TWILIO_WEBHOOK_SECRET`
3. **Supported Events**:
   - `delivered` - SMS successfully delivered to recipient
   - `failed` - SMS delivery failed (invalid number, carrier issues)
   - `undelivered` - SMS could not be delivered
   - `sent` - SMS accepted by Twilio (in transit)

4. **Configuration Steps**:
   - Log in to [Twilio Console](https://console.twilio.com)
   - Navigate to Phone Numbers → Manage → Active Numbers
   - Select your SMS-enabled phone number
   - Under "Messaging Configuration", find "A MESSAGE STATUS CHANGES"
   - Set webhook URL: `https://your-domain.com/api/webhooks/twilio/status`
   - Set HTTP Method: `POST`
   - Save configuration

5. **Security**:
   - All webhook requests are validated using Twilio's signature
   - Invalid signatures return 401 Unauthorized
   - Webhook secret must match `TWILIO_WEBHOOK_SECRET` environment variable

6. **Testing Webhooks**:
   ```bash
   # Send a test SMS and monitor webhook delivery
   curl -X POST https://your-domain.com/api/webhooks/twilio/status \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "MessageSid=SM123456789" \
     -d "MessageStatus=delivered"
   ```

#### LiveKit Call Status Webhooks
Voice call status updates are handled by the Python agent:
- Endpoint: `/api/webhooks/call-status`
- See `agent/README.md` for configuration details

### Business Configuration
1. Set up business profile in `/dashboard/business-profile`
2. Configure call scripts and company branding
3. Set payment reminder schedules and frequency
4. Customize voice agent personality and responses

### Integration Setup
- Connect Zoho Books/CRM for customer and invoice data
- Configure LiveKit for voice calling capabilities
- Set up automated sync schedules for data consistency
- Monitor integration health and performance

### Call Agent Customization
- Modify conversation flows in LiveKit configuration
- Adjust pre-call verification rules
- Customize phone number extraction patterns
- Configure call scheduling and retry logic

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [LiveKit Voice Agent Guide](https://docs.livekit.io/agents/)
- [Zoho Books API Documentation](https://www.zoho.com/books/api/v3/)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Configure LiveKit and Zoho webhook endpoints
4. Deploy automatically on every push

### Environment Variables for Production
- Update `NEXT_PUBLIC_APP_URL` to your domain
- Configure LiveKit production server
- Set up Zoho OAuth with production redirect URIs
- Use secure encryption keys for token storage

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built for SMEs who want to automate payment collection with AI-powered voice agents.
