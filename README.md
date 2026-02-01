# AI-Powered Call Agent for SME Payment Reminders
*Kiro Hackathon Submission*

---

## 🏆 FOR HACKATHON JUDGES

**📋 [JUDGE INSTRUCTIONS - START HERE](./JUDGE_INSTRUCTIONS.md)**  
**🚀 [QUICK START GUIDE (2 min)](./QUICK_START_JUDGES.md)**

**Test Credentials:**
```
Email: judge@invocall.demo
Password: KiroHackathon2025!
```

**⚠️ IMPORTANT**: All premium features are **unlocked** for judging. No payment required!

---

## 🎯 Project Overview

**The Problem**: Small and medium enterprises (SMEs) struggle with unpaid invoices. Manual payment follow-ups are time-consuming, inconsistent, and often ineffective.

**Our Solution**: An intelligent AI voice agent that automatically calls customers about overdue payments, speaks naturally like a human representative, and integrates seamlessly with existing business systems.

**Built for Kiro**: This project showcases advanced AI agent capabilities, real-time voice processing, and intelligent automation - perfect for the Kiro ecosystem of AI-powered development tools.

## 🏗️ Architecture Overview

This project consists of **two main components**:

### 1. **Web Application** (`/call_agent_smes`)
- Next.js 15 dashboard for business management
- Customer and invoice tracking
- Payment reminder scheduling and analytics
- CRM integrations (Zoho Books/CRM)
- Multi-channel communication (SMS + Voice)

### 2. **AI Voice Agent** (`/agent`)
- Python-based LiveKit voice agent
- Real-time conversation processing with OpenAI GPT-4o
- Natural language understanding for payment discussions
- Webhook integration for status reporting
- Intelligent call flow management

**🔗 [View Agent Source Code](https://github.com/priyanshutiwary/kiro-hackathon-agent)**

Both components work together to create a complete automated payment collection system.

## 🚀 Why This Matters for Kiro Hackathon

### Innovation in AI Agents
- **Real-time Voice Processing**: Demonstrates cutting-edge AI agent capabilities with natural conversation flows
- **Multi-modal Communication**: Combines voice calls, SMS, and web interfaces in a unified system
- **Intelligent Automation**: Shows how AI can handle complex business processes autonomously

### Technical Excellence
- **Modern Stack**: Next.js 15, TypeScript, LiveKit, OpenAI GPT-4o - showcasing latest technologies
- **Scalable Architecture**: Microservices approach with separate web app and voice agent components
- **Production Ready**: Complete with authentication, database, CRM integrations, and deployment configs

### Real Business Impact
- **Solves Actual Problems**: Addresses the challenge of unpaid B2B invoices for SMEs
- **Measurable Results**: Automates tasks that typically require significant manual effort
- **SME Focused**: Designed specifically for small businesses who need automation but lack resources

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

## 🏗️ Project Structure

This hackathon submission consists of **two integrated components**:

### 📱 Web Application (`/call_agent_smes`)
```
call_agent_smes/
├── app/
│   ├── dashboard/           # Business management dashboard
│   │   ├── customers/       # Customer management
│   │   ├── invoices/        # Invoice tracking
│   │   ├── reminders/       # Payment reminders
│   │   ├── scheduled/       # Scheduled calls
│   │   └── integrations/    # CRM integrations
│   └── api/                 # API routes
│       ├── zoho/           # Zoho CRM/Books integration
│       ├── reminders/      # Reminder processing
│       ├── cron/           # Scheduled jobs
│       └── webhooks/       # Agent communication
├── lib/
│   ├── payment-reminders/   # Core reminder system
│   ├── business-profile/    # Business configuration
│   └── zoho-api-client.ts   # CRM integration
└── db/
    ├── schema.ts           # Database schema
    └── drizzle.ts          # Database connection
```

### 🤖 AI Voice Agent (`/agent`)
**🔗 [View Agent Implementation](https://github.com/priyanshutiwary/kiro-hackathon-agent)**

```
agent/
├── src/
│   ├── agents/             # Voice agent implementations
│   │   └── payment_assistant.py  # Main payment reminder agent
│   ├── services/           # Core services
│   │   ├── call_service.py      # Call management
│   │   ├── greeting_service.py  # Dynamic greetings
│   │   └── webhook_client.py    # Status reporting
│   ├── models/             # Data models
│   │   └── payment_context.py  # Payment conversation context
│   └── utils/              # Utilities
│       ├── context_parser.py    # Payment data parsing
│       └── currency_utils.py    # Currency formatting
├── agent.py               # Main agent entry point
├── main.py               # LiveKit integration
└── requirements.txt      # Python dependencies
```

**Integration Flow**:
1. Web app schedules payment reminders
2. LiveKit triggers voice agent with customer context
3. AI agent conducts natural payment conversation
4. Agent reports call outcomes via webhooks
5. Web app updates status and schedules follow-ups

## 🎮 For Hackathon Judges

**⚠️ IMPORTANT NOTE FOR JUDGES**: 

This application includes a **subscription/payment feature** that is **DISABLED for hackathon evaluation**. All premium features are **fully accessible without payment** during the judging period. The subscription system was implemented to demonstrate a complete production-ready application but has been bypassed to ensure judges can test all functionality without barriers.

**📋 Test Credentials**: See `JUDGE_INSTRUCTIONS.md` for login credentials and testing guide.

### Why Subscription is Disabled for Hackathon
- ✅ All features are accessible without payment
- ✅ No credit card or payment information required
- ✅ Judges can test the complete application freely
- ✅ Subscription will be re-enabled post-hackathon for production use

The subscription feature demonstrates:
- Integration with payment providers (Dodo Payments)
- Gated feature implementation
- Subscription management UI
- Production-ready monetization strategy

---

## 🛠️ Quick Start for Judges

### Prerequisites
- Node.js 18+ and Python 3.9+
- PostgreSQL database (Neon recommended)
- LiveKit account for voice calls
- OpenAI API key for GPT-4o
- Zoho Books/CRM account (optional for full demo)

### 🚀 Fast Setup (5 minutes)

1. **Clone and Install**
```bash
git clone <repository-url>
cd call_agent_smes
npm install

# Set up Python agent
cd ../agent
pip install -r requirements.txt
```

2. **Environment Setup**
Copy `.env.example` to `.env` and add your keys:
```env
# Required for demo
DATABASE_URL="your-neon-database-url"
BETTER_AUTH_SECRET="your-secret-key"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
OPENAI_API_KEY="your-openai-api-key"

# Optional for full features
ZOHO_CLIENT_ID="your-zoho-client-id"
TWILIO_ACCOUNT_SID="your-twilio-sid"
```

3. **Database Setup**
```bash
npx drizzle-kit push
```

4. **Start Both Components**
```bash
# Terminal 1: Web Application
npm run dev

# Terminal 2: AI Voice Agent
cd ../agent
python main.py
```

5. **Demo the System**
- Visit [http://localhost:3000](http://localhost:3000)
- Create account and set up business profile
- Add test customers and invoices
- Schedule payment reminders
- Watch AI agent make calls automatically

### 🎮 Demo Features
- **Live Voice Calls**: AI agent speaks naturally about payments
- **Real-time Dashboard**: See call status updates in real-time
- **Multi-channel**: Test both SMS and voice reminders
- **CRM Integration**: Sync with Zoho or use mock data
- **Analytics**: Track success rates and payment collection

## 🎯 Hackathon Highlights

### 🤖 Advanced AI Agent Capabilities
- **Natural Conversations**: GPT-4o powered voice agent that understands context and responds naturally
- **Real-time Processing**: LiveKit integration for seamless voice communication
- **Intelligent Routing**: Smart call scheduling based on customer preferences and business rules
- **Context Awareness**: Agent remembers customer history and payment details during calls

### 🔧 Technical Innovation
- **Microservices Architecture**: Separate web app and voice agent for scalability
- **Event-driven Design**: Webhook-based communication between components
- **Type-safe Development**: Full TypeScript implementation with Drizzle ORM
- **Modern Stack**: Next.js 15, Python 3.9+, PostgreSQL, LiveKit, OpenAI

### 💼 Business Value
- **Cost Effective**: Reduces manual follow-up costs significantly with automated calls
- **Scalable Solution**: Handles hundreds of concurrent payment reminders
- **Integration Ready**: Works with existing CRM systems (Zoho, extensible to others)
- **Multi-channel**: Combines cost-effective SMS with high-impact voice calls

### 🚀 Production Ready
- **Security First**: HMAC webhook validation, encrypted token storage, secure authentication
- **Monitoring**: Real-time status tracking, call analytics, integration health checks
- **Deployment**: Configured for Cloudflare Pages with OpenNext
- **Testing**: Comprehensive test suite for critical payment flows

## 🎯 Key Features Explained

### AI Voice Agent System (`/agent`)
**🔗 [Explore Agent Code](https://github.com/priyanshutiwary/kiro-hackathon-agent)**

- **LiveKit Integration**: Real-time voice calls with natural conversation flows
- **GPT-4o Processing**: Advanced language understanding for payment discussions
- **Context Management**: Maintains conversation state and customer payment history
- **Webhook Reporting**: Real-time status updates to web application
- **Dynamic Greetings**: Personalized call openings based on business profile

### Payment Reminder Automation (`/call_agent_smes`)
- **LiveKit Integration**: Real-time voice calls with natural conversation flows
- **Pre-call Verification**: Smart validation before initiating calls
- **Call Analytics**: Track success rates and customer responses
- **Intelligent Scheduling**: Optimal timing based on customer preferences

### Payment Reminder Automation
### Payment Reminder Automation (`/call_agent_smes`)
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

## 🏆 Kiro Hackathon Submission Summary

**Project**: AI-Powered Call Agent for SME Payment Reminders  
**Components**: Web Application (`/call_agent_smes`) + AI Voice Agent (`/agent`)  
**Innovation**: Real-time AI voice conversations for automated payment collection  
**Impact**: Addresses unpaid invoice challenges for small and medium enterprises  
**Tech Stack**: Next.js 15, Python, LiveKit, OpenAI GPT-4o, PostgreSQL  

**Why It Matters**: Demonstrates cutting-edge AI agent capabilities while solving real business problems for SMEs. Perfect showcase of how AI can automate complex human interactions with measurable ROI.

---

Built for SMEs who want to automate payment collection with AI-powered voice agents.  
*Kiro Hackathon 2025 - Showcasing the Future of AI Agent Development*
