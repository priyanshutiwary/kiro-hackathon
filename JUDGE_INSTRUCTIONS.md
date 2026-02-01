# 🏆 Judge Instructions - Kiro Hackathon

## Welcome, Judges! 👋

Thank you for evaluating our **AI-Powered Call Agent for SME Payment Reminders**. This guide will help you quickly test all features of the application.

---

## 🔑 Test Credentials

### Demo Account (Pre-configured with Sample Data)
```
Email: testprod711@gmail
Password: Tp@112112
```

**This account includes:**
- ✅ Pre-configured business profile
- ✅ Sample customers and invoices
- ✅ Zoho Books integration (demo mode)
- ✅ Reminder settings already configured
- ✅ Historical reminder data for analytics
- ✅ All premium features unlocked

### Alternative: Create Your Own Account
You can also sign up with any email address to test the onboarding flow.

---

## ⚠️ Important Notes

### 1. Subscription Feature (DISABLED FOR JUDGING)
**All premium features are fully accessible without payment during hackathon evaluation.**

- ❌ No credit card required
- ❌ No payment information needed
- ✅ All features unlocked for testing
- ✅ Subscription UI visible but bypassed

**Why it's there**: Demonstrates production-ready monetization strategy. Will be re-enabled post-hackathon.

### 2. Live Integrations
Some features require external service credentials:

**Voice Calls (LiveKit + Python Agent)**:
- Requires LiveKit API keys and running Python agent
- See "Testing Voice Calls" section below

**SMS Reminders (Twilio)**:
- Requires Twilio account and phone number
- Can be tested with demo mode

**Zoho Books Integration**:
- Demo account has mock data pre-loaded
- Real integration requires Zoho OAuth setup

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Use Demo Account (Fastest)
1. Visit the deployed application URL
2. Click "Sign In"
3. Enter demo credentials:
   - Email: `judge@invocall.demo`
   - Password: `KiroHackathon2025!`
4. Explore the pre-configured dashboard

### Option 2: Run Locally
```bash
# Clone repository
git clone <repository-url>
cd call_agent_smes

# Install dependencies
npm install

# Set up environment (use provided .env.example)
cp .env.example .env.local

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev

# Visit http://localhost:3000
```

---

## 🎯 Features to Test

### 1. Dashboard Overview (2 minutes)
**Location**: `/dashboard`

**What to check:**
- ✅ Reminder statistics (total sent, success rate)
- ✅ Channel breakdown (SMS vs Voice)
- ✅ Recent activity feed
- ✅ Upcoming reminders
- ✅ Interactive charts

**Demo account shows**: Real historical data with various reminder outcomes

---

### 2. AI Chatbot Assistant (3 minutes)
**Location**: Bottom-right corner (all pages)

**What to test:**
1. Click the bot icon to open chat
2. Try quick actions:
   - "How do I set up payment reminders?"
   - "How does Smart Mode work?"
   - "How to connect Zoho Books?"
   - "How to view and track invoices?"
3. Ask custom questions:
   - "What is Smart Mode?"
   - "How do I configure SMS settings?"
   - "Explain the reminder workflow"
4. Test UI features:
   - Expand/collapse window
   - Markdown rendering
   - Auto-scroll
   - Loading indicators

**Key Innovation**: Context-aware AI assistant with instant quick actions and comprehensive knowledge of all features.

---

### 3. Payment Reminders (5 minutes)
**Location**: `/dashboard/reminders`

**What to test:**

#### History Tab:
- ✅ View past reminders with outcomes
- ✅ Filter by date range, status, channel
- ✅ See call outcomes (answered, completed, failed)
- ✅ View customer responses (will_pay_today, already_paid, dispute)
- ✅ Check retry attempts and timing

#### Scheduled Tab:
- ✅ View upcoming reminders
- ✅ See scheduled dates and times
- ✅ Check channel assignments (SMS vs Voice)
- ✅ Verify call window compliance

**Demo account shows**: Mix of completed, failed, and scheduled reminders

---

### 4. Reminder Configuration (5 minutes)
**Location**: `/dashboard/configuration` → Reminders tab

**What to test:**

#### Reminder Schedule:
- ✅ Toggle reminder cadence (30, 15, 7, 5, 3, 1 days before)
- ✅ Enable on-due-date reminders
- ✅ Configure overdue reminders (1, 3, 7 days)
- ✅ Add custom reminder days

#### Channel Strategy:
- ✅ **Smart Mode** (Recommended):
  - SMS for early reminders (30, 15, 7, 5 days before)
  - Voice calls for urgent reminders (3, 1 day before, due date, overdue)
- ✅ **Manual Mode**:
  - Choose SMS or Voice for all reminders

#### Call Window:
- ✅ Select timezone (IANA timezones)
- ✅ Set business hours (e.g., 9 AM - 6 PM)
- ✅ Choose active days (e.g., Monday-Friday)

#### Voice Settings:
- ✅ Language: English, Hindi, Hinglish
- ✅ Voice gender: Male, Female

#### Retry Policy:
- ✅ Max retry attempts (0-10)
- ✅ Retry delay (1-48 hours)

**Key Innovation**: Smart Mode automatically optimizes channel selection for cost and engagement.

---

### 5. Business Profile (3 minutes)
**Location**: `/dashboard/configuration` → Business Profile tab

**What to test:**
- ✅ Company name and description
- ✅ Industry selection
- ✅ Support phone and email
- ✅ Preferred payment methods
- ✅ Logo upload (optional)

**Usage**: This information is used in:
- Voice agent greetings
- SMS message templates
- Customer communications

---

### 6. Invoice Management (4 minutes)
**Location**: `/dashboard/invoices`

**What to test:**
- ✅ View all invoices from Zoho Books
- ✅ Status indicators:
  - 🟢 Paid
  - 🟡 Sent
  - 🟠 Partially Paid
  - 🔴 Overdue
  - ⚪ Draft
- ✅ Click invoice for details modal
- ✅ See associated reminders
- ✅ Track payment history
- ✅ Filter and search functionality

**Demo account shows**: Mix of paid, overdue, and pending invoices

---

### 7. Customer Management (3 minutes)
**Location**: `/dashboard/customers`

**What to test:**
- ✅ View all customers from Zoho Books
- ✅ Click customer for detail modal
- ✅ See contact information (email, phone)
- ✅ View associated invoices
- ✅ Track call history per customer
- ✅ Search and filter customers

**Demo account shows**: Sample customers with various payment histories

---

### 8. Zoho Books Integration (4 minutes)
**Location**: `/dashboard/integrations`

**What to test:**

#### Integration Status:
- ✅ Check connection status
- ✅ View organization ID
- ✅ See last sync time
- ✅ Monitor integration health

#### Demo Mode:
- Demo account has mock Zoho data pre-loaded
- Shows how real integration would work
- No actual Zoho account needed for testing

#### Real Integration (Optional):
If you want to test real OAuth flow:
1. Click "Connect" on Zoho Books
2. Authorize with your Zoho account
3. Watch automatic data sync
4. See invoices and customers populate

**Key Innovation**: Secure OAuth 2.0 with encrypted token storage (AES-256-GCM)

---

### 9. Test Call Feature (5 minutes)
**Location**: `/dashboard/test-call`

**What to test:**

#### Manual Call Testing:
1. Enter customer details:
   - Name: "Test Customer"
   - Phone: Your phone number in E.164 format (e.g., +1234567890)
   - Language: English/Hindi/Hinglish
   - Voice: Male/Female

2. Enter invoice context:
   - Invoice number: "INV-001"
   - Amount: 1000
   - Currency: USD/INR/EUR
   - Due date: Today's date

3. Enter company context:
   - Company name: Your business name
   - Support phone: Your support number

4. Click "Make Test Call"

**Note**: Requires LiveKit API keys and running Python agent. See "Testing Voice Calls" section below.

---

### 10. Analytics & Reporting (3 minutes)
**Location**: `/dashboard` (main page)

**What to test:**
- ✅ Reminder success rate trends
- ✅ Channel effectiveness (SMS vs Voice)
- ✅ Payment collection metrics
- ✅ Customer response patterns
- ✅ Interactive charts and graphs

**Demo account shows**: Historical data with various outcomes for meaningful analytics

---

## 🎤 Testing Voice Calls (Advanced)

### Prerequisites:
1. LiveKit account and API keys
2. Python 3.9+ installed
3. Running Python agent

### Setup:
```bash
# Navigate to agent directory
cd agent

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LIVEKIT_URL="wss://your-livekit-url"
export LIVEKIT_API_KEY="your-api-key"
export LIVEKIT_API_SECRET="your-api-secret"
export OPENAI_API_KEY="your-openai-key"

# Start agent
python main.py
```

### Test Flow:
1. Go to `/dashboard/test-call`
2. Enter your phone number
3. Click "Make Test Call"
4. Answer the call
5. Have a conversation with the AI agent
6. Check webhook updates in dashboard

**What the AI agent does:**
- Greets customer with company name
- Mentions invoice details
- Asks about payment status
- Handles various customer responses
- Reports outcome via webhook

---

## 📱 Testing SMS Reminders (Advanced)

### Prerequisites:
1. Twilio account
2. SMS-enabled phone number
3. Twilio credentials in environment

### Setup:
```bash
# Add to .env.local
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Test Flow:
1. Configure reminder settings with SMS channel
2. Create or sync an overdue invoice
3. Wait for cron job (or trigger manually)
4. Receive SMS on customer's phone
5. Check delivery status in dashboard

**SMS Message Format:**
```
Hi [Customer Name],

This is a reminder about invoice [Invoice Number] 
for $[Amount] due on [Due Date].

Please contact us at [Support Phone] if you have questions.

- [Company Name]
```

---

## 🔍 Key Features to Highlight

### 1. AI Voice Agent Innovation
- **Natural Conversations**: GPT-4o powered voice agent
- **Real-time Processing**: LiveKit integration
- **Context Awareness**: Remembers customer history
- **Multi-language**: English, Hindi, Hinglish support

### 2. Smart Channel Assignment
- **Smart Mode**: Automatic SMS/Voice selection based on urgency
- **Cost Optimization**: SMS for early, voice for urgent
- **Manual Override**: User can choose preferred channel

### 3. Comprehensive Integration
- **Zoho Books OAuth**: Secure token management
- **Automatic Sync**: Daily invoice and customer updates
- **Change Detection**: SHA-256 hash comparison
- **Incremental Sync**: Only fetch changed records

### 4. Production-Ready Architecture
- **Security**: AES-256-GCM encryption, HMAC validation
- **Scalability**: Microservices with separate web app and agent
- **Monitoring**: Real-time status tracking and analytics
- **Error Handling**: Retry logic with exponential backoff

### 5. Modern Tech Stack
- **Next.js 15**: Latest App Router and Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Modern styling
- **Drizzle ORM**: Type-safe database operations
- **Better Auth**: Secure authentication

---

## 🐛 Troubleshooting

### Can't log in with demo credentials?
- Check if email verification is required
- Try creating a new account
- Contact support if issue persists

### Features not loading?
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page
- Clear browser cache

### Voice calls not working?
- Verify LiveKit credentials
- Check Python agent is running
- Ensure phone number is in E.164 format
- Review agent logs for errors

### SMS not sending?
- Verify Twilio credentials
- Check phone number format
- Ensure Twilio account has credits
- Review Twilio logs

### Integration issues?
- Check Zoho OAuth credentials
- Verify redirect URIs match
- Ensure organization ID is correct
- Review integration status page

---

## 📊 Evaluation Criteria

### Innovation (30%)
- ✅ AI voice agent with natural conversations
- ✅ Smart channel assignment algorithm
- ✅ Real-time webhook integration
- ✅ Context-aware chatbot assistant

### Technical Excellence (30%)
- ✅ Modern tech stack (Next.js 15, TypeScript, LiveKit)
- ✅ Microservices architecture
- ✅ Type-safe development
- ✅ Production-ready security

### Business Impact (20%)
- ✅ Solves real SME problem (unpaid invoices)
- ✅ Measurable ROI (automation savings)
- ✅ Scalable solution
- ✅ Integration with existing systems

### User Experience (20%)
- ✅ Intuitive dashboard
- ✅ Comprehensive documentation
- ✅ AI chatbot assistance
- ✅ Real-time updates

---

## 📞 Support

### Questions During Evaluation?
- **Email**: support@invocall.demo
- **Documentation**: See README.md and docs/ folder
- **Video Demo**: [Link to demo video if available]

### Common Questions:

**Q: Why is subscription disabled?**
A: To ensure judges can test all features without payment barriers. It will be re-enabled post-hackathon.

**Q: Can I test with real phone numbers?**
A: Yes, if you have LiveKit and Twilio credentials. Otherwise, use demo mode.

**Q: How do I see the Python agent code?**
A: Visit https://github.com/priyanshutiwary/kiro-hackathon-agent

**Q: Is this production-ready?**
A: Yes! Complete with security, monitoring, error handling, and deployment configs.

---

## 🎉 Thank You!

Thank you for taking the time to evaluate our project. We've built a comprehensive solution that demonstrates:

- 🤖 Advanced AI agent capabilities
- 🔧 Production-ready architecture
- 💼 Real business value for SMEs
- 🚀 Modern development practices

We hope you enjoy exploring InvoCall!

---

**Built for Kiro Hackathon 2025**  
*Showcasing the Future of AI Agent Development*

**Demo Credentials Reminder:**
```
Email: judge@invocall.demo
Password: KiroHackathon2025!
```

**All features unlocked - No payment required!** ✅
