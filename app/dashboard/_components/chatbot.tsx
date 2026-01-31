"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChat, Message } from "ai/react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! 👋 I'm your InvoCall assistant. I can help you with:\n\n• Payment reminders & scheduling\n• Invoice management\n• Integration setup\n• Account configuration\n\nWhat would you like to know?"
      }
    ]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
    }
  };

  const quickActions = [
    {
      question: "How do I set up payment reminders?",
      answer: `To set up payment reminders:\n\n**1. Connect Zoho Books First**\n• Go to **Integrations** tab\n• Click "Connect" on Zoho Books\n• Authorize InvoCall to access your invoices\n\n**2. Configure Reminder Settings**\n• Go to **Configuration** → **Reminders** tab\n• Select when to send reminders:\n  - Before due date: 30, 15, 7, 5, 3, 1 days\n  - On due date\n  - After due date: 1, 3, 7 days overdue\n\n**3. Choose Channel Strategy**\n• **Smart Mode** (recommended): Automatic SMS for early reminders, voice calls for urgent ones\n• **Manual Mode**: Choose SMS or voice for all reminders\n\n**4. Set Call Window**\n• Select your timezone\n• Set business hours (e.g., 9 AM - 6 PM)\n• Choose active days (e.g., Monday-Friday)\n\n**5. Configure Voice Settings**\n• Language: English, Hindi, or Hinglish\n• Voice gender: Male or Female\n\n**6. Set Retry Policy**\n• Max retry attempts (0-10)\n• Delay between retries (1-48 hours)\n\n✅ Once saved, reminders process automatically every 30 minutes!`
    },
    {
      question: "How does Smart Mode work?",
      answer: `**Smart Mode** automatically chooses the best channel based on urgency:\n\n📱 **SMS for Early Reminders**\n• 30, 15, 7, 5 days before due date\n• Cost-effective for non-urgent notifications\n• Gives customers time to prepare payment\n\n📞 **Voice Calls for Urgent Reminders**\n• 3, 1 day before due date\n• On due date\n• 1, 3, 7 days overdue\n• Higher engagement for time-sensitive payments\n• Allows real-time conversation\n\n💡 **Benefits:**\n• Saves costs on early reminders\n• Maximizes engagement when it matters\n• Proven to increase payment success rates\n\n**Manual Mode Alternative:**\nIf you prefer, you can choose SMS or voice for ALL reminders in Manual Mode.`
    },
    {
      question: "How to connect Zoho Books?",
      answer: `To connect Zoho Books:\n\n**Step 1: Navigate to Integrations**\n• Click **Integrations** in the sidebar\n• Find the Zoho Books card\n\n**Step 2: Authorize Connection**\n• Click "Connect" button\n• You'll be redirected to Zoho\n• Log in to your Zoho account\n• Click "Accept" to grant permissions\n\n**Step 3: Automatic Sync**\n• You'll be redirected back to InvoCall\n• First sync starts automatically\n• Invoices and customers are imported\n\n**What Gets Synced:**\n✅ Invoices (number, amount, due date, status)\n✅ Customers (name, email, phone numbers)\n✅ Bills (for expense tracking)\n\n**Sync Schedule:**\n• Daily automatic sync at 2 AM UTC\n• Manual refresh available anytime\n• Only changed invoices are updated (efficient)\n\n**Troubleshooting:**\n• Check Integration Status in the Integrations tab\n• Ensure your Zoho account has invoice access\n• Contact support if connection fails`
    },
    {
      question: "How to view and track invoices?",
      answer: `**Invoice Management:**\n\n**View All Invoices**\n• Go to **Invoices** tab in sidebar\n• See all synced invoices from Zoho Books\n• Filter by status, date range, or customer\n\n**Invoice Status Indicators:**\n• 🟢 **Paid** - Payment received\n• 🟡 **Sent** - Invoice sent to customer\n• 🟠 **Partially Paid** - Partial payment received\n• 🔴 **Overdue** - Past due date\n• ⚪ **Draft** - Not yet sent\n\n**Invoice Details**\n• Click any invoice to see full details\n• View associated reminders sent\n• See customer contact information\n• Track payment history\n\n**Reminder Tracking**\n• Go to **Reminders** tab\n• **History** sub-tab: Past reminders with outcomes\n• **Scheduled** sub-tab: Upcoming reminders\n• Filter by date, status, or channel (SMS/voice)\n\n**Automatic Updates:**\n• Invoices sync daily from Zoho Books\n• Paid invoices automatically cancel pending reminders\n• Status updates reflect in real-time`
    }
  ];

  const handleQuickAction = (question: string, answer: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question
    };
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: answer
    };
    
    setMessages([...messages, userMessage, assistantMessage]);
  };

  const chatWidth = isExpanded ? "w-[500px]" : "w-[380px]";
  const chatHeight = isExpanded ? "h-[600px]" : "h-[500px]";

  return (
    <div className="fixed bottom-4 right-4 z-[99]">
      {/* Chat Button */}
      <button
        className="rounded-full bg-primary cursor-pointer border-2 border-primary p-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative group"
        onClick={() => setOpen(!open)}
        aria-label="Open chat"
      >
        <Bot className="w-6 h-6 text-primary-foreground transition-transform group-hover:scale-110 duration-300" />
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
      
      {/* Chat Window */}
      {open && (
        <div 
          className={`absolute bottom-20 right-0 ${chatWidth} ${chatHeight} z-[99] dark:bg-zinc-900 bg-white rounded-xl border shadow-2xl transition-all duration-300 flex flex-col animate-in slide-in-from-bottom-5 fade-in`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-5 h-5 text-primary" />
                <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold flex items-center gap-1">
                  <span className="font-medium">Invo</span>
                  <span className="font-extrabold">Call</span>
                  <span className="font-normal text-sm text-muted-foreground">Assistant</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Thinking..." : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-muted p-1.5 rounded-md transition-colors"
                aria-label={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-muted hover:text-destructive p-1.5 rounded-md transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          code: ({ children }) => (
                            <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">
                              {children}
                            </code>
                          ),
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-muted p-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            {messages.length === 1 && !isLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground px-1">Quick actions:</p>
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(action.question, action.answer)}
                      className="text-left text-xs p-2.5 rounded-lg border border-dashed hover:border-solid hover:bg-muted/50 transition-all duration-200 hover:shadow-sm"
                    >
                      {action.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-muted/20">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isLoading || !input.trim()}
                className="rounded-full px-4 shadow-sm hover:shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
