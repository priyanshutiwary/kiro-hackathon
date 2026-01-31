# Chatbot Quick Reference Guide

## 🚀 Quick Start

**Location**: Bottom-right corner of all dashboard pages  
**Icon**: Bot icon with green pulse indicator  
**Shortcut**: Click icon to open/close

## 📋 Quick Actions (Instant Answers)

### 1. How do I set up payment reminders?
**Covers:**
- Zoho Books connection
- Reminder schedule configuration
- Smart Mode vs Manual Mode
- Call window settings
- Voice configuration
- Retry policy

### 2. How does Smart Mode work?
**Covers:**
- SMS for early reminders (cost-effective)
- Voice for urgent reminders (high engagement)
- Benefits and cost optimization
- Manual Mode alternative

### 3. How to connect Zoho Books?
**Covers:**
- OAuth integration steps
- Data sync details
- Sync schedule
- Troubleshooting

### 4. How to view and track invoices?
**Covers:**
- Invoice management
- Status indicators
- Reminder tracking
- Automatic updates

## 💬 AI Chat Capabilities

Ask about:
- ✅ Dashboard navigation
- ✅ Feature explanations
- ✅ Setup instructions
- ✅ Troubleshooting
- ✅ Integration help
- ✅ Configuration options
- ✅ Best practices

## 🎨 UI Features

| Feature | Description |
|---------|-------------|
| **Expand/Collapse** | Toggle window size (380px ↔ 500px) |
| **Auto-scroll** | Automatically scrolls to latest message |
| **Auto-focus** | Input focuses when chat opens |
| **Status** | Shows "Online" or "Thinking..." |
| **Markdown** | Supports bold, lists, code blocks |
| **Animations** | Smooth fade-in and slide effects |
| **Themes** | Adapts to light/dark mode |

## ⌨️ Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line (future)
- **ESC**: Close chat (future)

## 🔧 For Developers

### Update Quick Actions
**File**: `app/dashboard/_components/chatbot.tsx`  
**Location**: `quickActions` array  
**Format**:
```typescript
{
  question: "Your question here",
  answer: `Your markdown answer here`
}
```

### Update AI System Prompt
**File**: `app/api/chat/route.ts`  
**Location**: `SYSTEM_PROMPT` constant  
**When**: Add new features, change navigation, update processes

### Test Checklist
- [ ] Quick actions work instantly
- [ ] AI responses are accurate
- [ ] Markdown renders correctly
- [ ] Expand/collapse works
- [ ] Auto-scroll functions
- [ ] Loading indicator shows
- [ ] Dark/light theme support

## 📊 Performance

| Metric | Value |
|--------|-------|
| Quick action response | Instant (0ms) |
| AI response time | 2-5 seconds |
| Token usage | 300-500 per response |
| Cost per AI response | $0.0001-0.0002 |

## 🔐 Security

- ✅ API key in environment variables
- ✅ No PII in system prompt
- ✅ Input sanitization
- ✅ Rate limiting (future)

## 📝 Maintenance Schedule

| Frequency | Task |
|-----------|------|
| **Weekly** | Review AI response quality |
| **Monthly** | Update quick actions if features change |
| **Quarterly** | Refresh system prompt with new features |
| **As Needed** | Add new quick actions for common questions |

## 🐛 Troubleshooting

### Chatbot not appearing
- Check `app/dashboard/layout.tsx` includes `<Chatbot />`
- Verify component is imported correctly

### AI not responding
- Check `OPENAI_API_KEY` in environment variables
- Verify API endpoint `/api/chat/route.ts` exists
- Check browser console for errors

### Quick actions not working
- Verify `handleQuickAction` function is correct
- Check `setMessages` is available from `useChat`
- Review browser console for errors

### Markdown not rendering
- Verify `react-markdown` is installed
- Check component imports
- Review markdown syntax in answers

## 📚 Related Documentation

- **Full Documentation**: `CHATBOT_DOCUMENTATION.md`
- **Implementation Summary**: `docs/CHATBOT_IMPLEMENTATION.md`
- **Feature Overview**: `CHATBOT_FEATURES.md`

## 🎯 Best Practices

### For Content:
1. Keep quick actions updated with product changes
2. Use clear, step-by-step instructions
3. Include navigation paths (e.g., "Go to Configuration → Reminders")
4. Use emojis sparingly for clarity
5. Test answers with real users

### For Code:
1. Keep system prompt comprehensive but concise
2. Update when features change
3. Test both quick actions and AI responses
4. Monitor API usage and costs
5. Review user feedback regularly

## 📞 Support

**Issues with chatbot?**
1. Check this quick reference
2. Review full documentation
3. Test in browser console
4. Contact development team

## 🎉 Success Metrics

Track these to measure chatbot effectiveness:
- Number of interactions per user
- Quick action vs AI chat usage ratio
- User satisfaction ratings
- Support ticket reduction
- Feature adoption increase
- Time to first action

## 🔄 Version Info

**Current Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅

---

**Quick Tip**: Start with quick actions for common questions, then use AI chat for specific or complex queries!
