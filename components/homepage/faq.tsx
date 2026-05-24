"use client";

import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does the AI voice agent work?",
    answer: "Our AI voice agents are advanced Conversational AI specialized in payment collection. They call your customers, verify their identity politely, discuss outstanding invoices, and can even process payments or arrange callbacks. They sound natural, professional, and are available 24/7."
  },
  {
    question: "Does it integrate with my CRM?",
    answer: "Yes! We have native integrations with Zoho CRM, Zoho Books, QuickBooks, Xero, and Salesforce. The system automatically syncs your contacts and overdue invoices, writes back call outcomes, and updates payment statuses in real-time."
  },
  {
    question: "Is my customer data secure?",
    answer: "Security is our top priority. We use bank-level 256-bit encryption for all data. We are GDPR and PCI compliant. We do not store sensitive credit card information directly; all payments are processed through secure gateways like Stripe or PayPal."
  },
  {
    question: "What if a customer gets angry?",
    answer: "Our agents are trained to be empathetic, professional, and de-escalate situations. If a customer becomes agitated or requests to speak to a human, the AI can intelligently transfer the call to your support team or schedule a callback for a specific time."
  },
  {
    question: "Can I customize the scripts?",
    answer: "Absolutely. You have full control over the call scripts, tone of voice, and negotiation parameters. You can set rules for partial payments, payment plans, and when to offer discounts (if configured)."
  }
];

export default function Faq() {
    return (
        <section className="relative py-24 lg:py-48 bg-slate-50 dark:bg-[#0B1121] overflow-hidden" id="faq">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

            <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-32"
                >
                    <Badge 
                      variant="secondary" 
                      className="mb-8 px-5 py-2 bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] rounded-full border-0"
                    >
                        <HelpCircle className="mr-2 h-3.5 w-3.5" />
                        Common Questions
                    </Badge>
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
                        Everything you need to know about automated payment collection
                    </p>
                </motion.div>

                <div className="space-y-6">
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <AccordionItem 
                          value={`item-${index}`} 
                          className="border border-slate-200 dark:border-white/5 rounded-3xl bg-white dark:bg-slate-900/40 backdrop-blur-xl px-8 hover:border-blue-500/30 transition-all duration-300 group overflow-hidden"
                        >
                          <AccordionTrigger className="text-xl font-bold text-slate-900 dark:text-white hover:no-underline py-8 group-data-[state=open]:pb-4 transition-all">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pb-8 pt-2">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </Accordion>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-20 text-center"
                >
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    Still have questions? <a href="mailto:support@invocall.ai" className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4">Contact our support team</a>
                  </p>
                </motion.div>
            </div>
        </section >
    );
}
