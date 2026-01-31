# InvoCall Chatbot Documentation

## Overview
The InvoCall Assistant is an AI-powered chatbot that helps users navigate the platform and understand its features. It provides instant answers to common questions and can handle complex queries about the system.

## Features

### 1. Quick Actions (Hardcoded Answers)
Four pre-configured questions with instant, accurate responses:

#### A. "How do I set up payment reminders?"
**Complete setup guide covering:**
- Connecting Zoho Books integration
- Configuring reminder schedule (30, 15, 7, 5, 3, 1 days before; on due date; 1, 3, 7 days overdue)
- Choosing channel strategy (Smart Mode vs Manual Mode)
- Setting call window (timezone, business hours, active days)
- Configuring voice settings (language, gender)
- Setting retry policy (max attempts, delay)

#### B. "How does Smart Mode work?"
**Explains channel assignment logic:**
- SMS for early reminders (30, 15, 7, 5 days before) - cost-effective
- Voice calls for urgent reminders (3, 1 day before, due date, overdue) - higher engagement
- Benefits of Smart Mode vs Manual Mode
- Cost optimization strategy

#### C. "How to connect Zoho Books?"
**Step-by-step integration guide:**
- Navigation to Integrations tab
- OAuth authorization flow
- What data gets synced (invoices, customers, bills)
- Sync schedule (daily at 2 AM UTC)
- Troubleshooting connection issues

#### D. "How to view and track invoices?"
**Invoice management guide:**
- Viewing all invoices in Invoices tab
- Understanding status indicators (Paid, Sent, Overdue, etc.)
- Accessing invoice details and reminder history
- Tracking reminders in History and Scheduled tabs
- Automatic updates from Zoho Books

### 2. AI-Powered Responses
For questions beyond quick actions, the chatbot uses OpenAI GPT-4o-mini with a comprehensive system prompt covering:

**Dashboard Navigation:**
- All tabs and their functionality
- Sub-tabs and nested features
- Navigation paths

**Payment Reminder System:**
- Complete reminder workflow (sync → process → execute → webhook → retry)
- Setup steps and configuration options
- Channel assignment logic (Smart vs Manual)
- Retry policy and failure handling

**Zoho Books Integration:**
- Connection process and OAuth flow
- Data sync (invoices, customers, bills)
- Token management and security
- Troubleshooting integration issues

**Invoice Management:**
- Status tracking and filtering
- Invoice details and history
- Automatic reminder cancellation for paid invoices

**Voice Call Features:**
- LiveKit integration and Python agent
- Language and voice options
- Call outcomes and customer responses
- Test call functionality

**SMS Features:**
- Twilio integration
- Message formatting and delivery
- Phone number validation (E.164 format)
- Delivery status tracking

**Business Profile:**
- Configuration options
- Usage in agent greetings and SMS

**Security Features:**
- OAuth token encryption
- Webhook validation
- Rate limiting
- Phone number masking

### 3. UI Intelligence

**Expandable Chat Window:**
- Default: 380px × 500px
- Expanded: 500px × 600px
- Toggle with maximize/minimize button

**Smart Interactions:**
- Auto-focus input when opened
- Auto-scroll to latest message
- Smooth animations for messages
- Loading indicator with animated dots
- Online/Thinking status display

**Markdown Rendering:**
- Bold text for emphasis
- Bullet lists for steps
- Numbered lists for sequences
- Code blocks for technical terms
- Proper spacing and formatting

**Keyboard Shortcuts:**
- Enter to send message
- Shift+Enter for new line (in textarea)
- ESC to close (future enhancement)

**Visual Design:**
- Gradient header with sparkle icon
- Chat bubbles with rounded corners
- Different styles for user vs assistant
- Green pulse indicator when closed
- Shadow effects and hover states

## Technical Implementation

### Component Structure
```typescript
// State Management
- open: boolean - Chat window visibility
- isExpanded: boolean - Window size toggle
- messages: Message[] - Chat history
- input: string - Current input value
- isLoading: boolean - AI response loading state

// Refs
- messagesEndRef - Auto-scroll target
- inputRef - Auto-focus target

// Hooks
- useChat from ai/react - Vercel AI SDK integration
- useEffect for scroll and focus management
```

### API Integration
```typescript
// Endpoint: /api/chat/route.ts
- Model: OpenAI GPT-4o-mini
- Max tokens: 800
- Temperature: 0.7
- Streaming: Real-time response streaming
```

### Quick Actions Implementation
```typescript
// Instant responses without API calls
const handleQuickAction = (question: string, answer: string) => {
  const userMessage: Message = { id, role: "user", content: question };
  const assistantMessage: Message = { id, role: "assistant", content: answer };
  setMessages([...messages, userMessage, assistantMessage]);
};
```

## System Prompt Architecture

The AI assistant has comprehensive knowledge of:

1. **All Dashboard Tabs** - Navigation paths and functionality
2. **Reminder System** - Complete workflow and configuration
3. **Integration Process** - Zoho Books OAuth and sync
4. **Invoice Management** - Status tracking and filtering
5. **Voice Calls** - LiveKit integration and agent behavior
6. **SMS Delivery** - Twilio integration and formatting
7. **Security** - Encryption, validation, and best practices
8. **Troubleshooting** - Common issues and solutions

## Usage Guidelines

### When to Use Quick Actions
- User is new to the platform
- Common setup questions
- Need instant answers without AI latency
- Want to reduce API costs

### When to Use AI Chat
- Complex or specific questions
- Troubleshooting unique issues
- Questions about edge cases
- Need personalized guidance

### Best Practices
1. **Keep Quick Actions Updated** - Sync with actual product changes
2. **Monitor AI Responses** - Review logs for accuracy
3. **Update System Prompt** - Reflect new features and changes
4. **Test Regularly** - Ensure both quick actions and AI work correctly

## Future Enhancements

### Planned Features
- [ ] Message history persistence (localStorage or database)
- [ ] Context-aware suggestions based on current page
- [ ] Integration with user's actual data (show their invoices, reminders)
- [ ] File/image upload support
- [ ] Voice input/output
- [ ] Multi-language support (Hindi, Spanish, etc.)
- [ ] Conversation analytics and feedback
- [ ] Suggested follow-up questions
- [ ] Copy code/text functionality
- [ ] Export conversation as PDF

### Technical Improvements
- [ ] Rate limiting for API calls
- [ ] Caching common responses
- [ ] A/B testing different prompts
- [ ] User feedback collection
- [ ] Error boundary for graceful failures
- [ ] Offline mode with cached responses

## Maintenance

### Regular Updates Required
1. **Quick Actions** - Update when features change
2. **System Prompt** - Add new features and tabs
3. **Navigation Paths** - Reflect UI changes
4. **Troubleshooting** - Add new common issues

### Monitoring
- Track chatbot usage metrics
- Monitor AI response quality
- Review user feedback
- Analyze common questions
- Identify gaps in documentation

## Environment Variables

```bash
# Required for AI responses
OPENAI_API_KEY=your_openai_api_key_here
```

## Testing

### Manual Testing Checklist
- [ ] Quick actions work instantly
- [ ] AI responses are accurate
- [ ] Markdown renders correctly
- [ ] Expand/collapse works
- [ ] Auto-scroll functions
- [ ] Auto-focus on open
- [ ] Loading indicator shows
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Dark/light theme support

### Test Scenarios
1. Click each quick action button
2. Ask complex questions about reminders
3. Ask about integration setup
4. Request troubleshooting help
5. Test with very long messages
6. Test with code blocks and formatting
7. Test rapid-fire questions
8. Test with network errors

## Performance

### Optimization Strategies
- Quick actions bypass API (instant response)
- Streaming responses for better UX
- Lazy loading of chat history
- Debounced input for typing indicators
- Memoized components to prevent re-renders

### Metrics to Monitor
- Average response time
- API call count
- Token usage
- User satisfaction
- Conversation completion rate

## Accessibility

### Current Features
- ARIA labels on buttons
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast support

### Future Improvements
- [ ] Keyboard shortcuts documentation
- [ ] Voice commands
- [ ] Screen reader announcements for new messages
- [ ] Focus trap in modal
- [ ] Skip to chat button

## Security Considerations

### Current Implementation
- API key stored in environment variables
- No PII in system prompt
- Rate limiting on API endpoint (future)
- Input sanitization

### Best Practices
- Never expose API keys in client code
- Validate and sanitize user input
- Implement rate limiting
- Monitor for abuse
- Log suspicious activity

## Support

For issues or questions about the chatbot:
1. Check this documentation
2. Review system prompt in `/app/api/chat/route.ts`
3. Test quick actions in `/app/dashboard/_components/chatbot.tsx`
4. Contact development team

## Version History

### v1.0.0 (Current)
- Initial release with 4 quick actions
- AI-powered responses with comprehensive system prompt
- Expandable chat window
- Markdown rendering
- Auto-scroll and auto-focus
- Smart Mode and Manual Mode explanations
- Complete integration and setup guides
