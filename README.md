# Next.js SaaS Starter Kit

A comprehensive, production-ready SaaS starter kit built with Next.js 15, featuring authentication, subscriptions, AI integration, and modern UI components.

## ✨ Features

### 🔐 Authentication & User Management
- **Better Auth v1.2.8** - Modern authentication system
- Google OAuth integration
- Session management with database persistence
- User profile management with image uploads
- Account linking for multiple providers

### 💳 Subscription & Billing
- **Dodo Payments** integration for subscription management
- Flexible pricing tiers (configurable)
- Real-time webhook processing
- Subscription status tracking (active, canceled, expired)
- Payment gating with elegant overlays
- Secure checkout with redirect flow

### 🤖 AI Integration
- **OpenAI** powered chatbot
- React Markdown rendering for rich responses
- Multi-step conversation support
- Integrated chat widget in dashboard

### 🎨 Modern UI/UX
- **Tailwind CSS v4** - Latest utility-first styling
- **shadcn/ui** components - Accessible, customizable
- **Radix UI** primitives - Unstyled, accessible components
- Dark/light theme support with smooth transitions
- Responsive design with mobile-first approach
- Loading skeletons and optimistic UI updates

### 🗄️ Database & Storage
- **Neon PostgreSQL** - Serverless database
- **Drizzle ORM** - Type-safe database toolkit
- **Cloudflare R2** - Scalable file storage with zero egress fees
- Database migrations with Drizzle Kit
- Drag & drop file uploads with progress tracking

### 📊 Analytics & Monitoring
- **PostHog** integration for product analytics
- User behavior tracking
- Custom event monitoring
- Error tracking and insights

## 🚀 Tech Stack

- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth v1.2.8
- **Payments**: Dodo Payments
- **AI**: OpenAI SDK
- **Storage**: Cloudflare R2
- **Analytics**: PostHog
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── dashboard/           # Protected dashboard area
│   │   ├── _components/     # Dashboard components
│   │   ├── chat/           # AI chat interface
│   │   ├── upload/         # File upload with R2
│   │   ├── payment/        # Subscription management
│   │   └── settings/       # User settings & billing
│   ├── pricing/            # Public pricing page
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── homepage/           # Landing page sections
├── lib/
│   ├── auth/              # Authentication config
│   ├── subscription.ts    # Subscription utilities
│   ├── dodo-payments.ts   # Dodo Payments integration
│   └── upload-image.ts    # R2 file upload utilities
└── db/
    ├── schema.ts          # Database schema
    └── drizzle.ts         # Database connection
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket for file storage
- Dodo Payments account for subscriptions
- OpenAI API key for AI features
- Google OAuth credentials (optional)

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
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Dodo Payments
DODO_PAYMENTS_API_KEY="your-dodo-api-key"
DODO_WEBHOOK_SECRET="your-dodo-webhook-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
R2_UPLOAD_IMAGE_ACCESS_KEY_ID="your-r2-access-key-id"
R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_UPLOAD_IMAGE_BUCKET_NAME="your-r2-bucket-name"

# Product Configuration
NEXT_PUBLIC_STARTER_TIER="your-dodo-product-id"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**See DODO_PAYMENTS_SETUP.md for detailed setup instructions.**

4. **Database Setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit push
```

5. **Cloudflare R2 Setup**
- Create a Cloudflare account and set up R2 storage
- Create a bucket for file uploads
- Generate API tokens with R2 permissions
- Configure CORS settings for your domain

6. **Dodo Payments Setup**
- Create products for your pricing tiers
- Set up webhook endpoints at `/api/webhooks/dodo`
- Configure your pricing structure
- See **DODO_PAYMENTS_SETUP.md** for complete instructions

7. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🎯 Key Features Explained

### Subscription Management
- Automatic subscription status checking
- Payment gating for premium features
- Integration with Dodo Payments checkout
- Webhook handling for real-time updates
- Secure payment processing with redirect flow

### AI Chat Integration
- Built-in chatbot with OpenAI
- Markdown rendering for rich responses
- Conversation history and context

### File Upload System
- **Cloudflare R2 integration** with S3-compatible API
- **Drag & drop interface** with visual feedback
- **File validation** - Type checking and size limits
- **Progress tracking** - Real-time upload progress
- **Image gallery** - View uploaded files with metadata
- **Copy URLs** - Easy sharing and integration

### Analytics & Tracking
- PostHog event tracking
- User behavior monitoring
- Custom analytics dashboard

## 🔧 Customization

### Adding New Features
1. Create components in `components/`
2. Add API routes in `app/api/`
3. Update database schema in `db/schema.ts`
4. Run `npx drizzle-kit generate` and `npx drizzle-kit push`

### Styling
- Modify `app/globals.css` for global styles
- Use Tailwind classes for component styling
- Customize theme in `tailwind.config.ts`

### Authentication
- Configure providers in `lib/auth/auth.ts`
- Add new OAuth providers as needed
- Customize user profile fields in database schema

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Dodo Payments Documentation](https://docs.dodopayments.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm start
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and modern web technologies.
