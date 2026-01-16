"use client";

import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { brandColors } from "@/lib/brand-colors";

import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

export default function Faq() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background - Soft Radial Glow (Helpful Feel) */}
            <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-blue-100/20 dark:bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center mb-16"
                >
                    <Badge variant="secondary" className={`mb-4 ${brandColors.border.accent} ${brandColors.backgrounds.glass} shadow-sm backdrop-blur-md`}>
                        <HelpCircle className={`mr-1.5 h-3.5 w-3.5 ${brandColors.primary.text}`} />
                        Common Questions
                    </Badge>
                    <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${brandColors.text.primary}`}>
                        Frequently Asked Questions
                    </h2>
                    <p className={`mt-4 text-lg ${brandColors.text.secondary}`}>
                        Everything you need to know about automated payment collection
                    </p>
                </motion.div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="item-1" className={`border border-white/20 dark:border-white/10 px-6 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                        <AccordionTrigger className={`text-lg font-medium ${brandColors.text.primary} hover:no-underline`}>
                            How does the AI voice agent work?
                        </AccordionTrigger>
                        <AccordionContent className={`text-base ${brandColors.text.secondary} leading-relaxed`}>
                            Our AI voice agents are advanced Conversational AI specialized in payment collection. They call your customers, verify their identity politely, discuss outstanding invoices, and can even process payments or arrange callbacks. They sound natural, professional, and are available 24/7.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className={`border border-white/20 dark:border-white/10 px-6 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                        <AccordionTrigger className={`text-lg font-medium ${brandColors.text.primary} hover:no-underline`}>
                            Does it integrate with my CRM?
                        </AccordionTrigger>
                        <AccordionContent className={`text-base ${brandColors.text.secondary} leading-relaxed`}>
                            Yes! We have native integrations with Zoho CRM, Zoho Books, QuickBooks, Xero, and Salesforce. The system automatically syncs your contacts and overdue invoices, writes back call outcomes, and updates payment statuses in real-time.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className={`border border-white/20 dark:border-white/10 px-6 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                        <AccordionTrigger className={`text-lg font-medium ${brandColors.text.primary} hover:no-underline`}>
                            Is my customer data secure?
                        </AccordionTrigger>
                        <AccordionContent className={`text-base ${brandColors.text.secondary} leading-relaxed`}>
                            Security is our top priority. We use bank-level 256-bit encryption for all data. We are GDPR and PCI compliant. We do not store sensitive credit card information directly; all payments are processed through secure gateways like Stripe or PayPal.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4" className={`border border-white/20 dark:border-white/10 px-6 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                        <AccordionTrigger className={`text-lg font-medium ${brandColors.text.primary} hover:no-underline`}>
                            What if a customer gets angry?
                        </AccordionTrigger>
                        <AccordionContent className={`text-base ${brandColors.text.secondary} leading-relaxed`}>
                            Our agents are trained to be empathetic, professional, and de-escalate situations. If a customer becomes agitated or requests to speak to a human, the AI can intelligently transfer the call to your support team or schedule a callback for a specific time.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5" className={`border border-white/20 dark:border-white/10 px-6 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                        <AccordionTrigger className={`text-lg font-medium ${brandColors.text.primary} hover:no-underline`}>
                            Can I customize the scripts?
                        </AccordionTrigger>
                        <AccordionContent className={`text-base ${brandColors.text.secondary} leading-relaxed`}>
                            Absolutely. You have full control over the call scripts, tone of voice, and negotiation parameters. You can set rules for partial payments, payment plans, and when to offer discounts (if configured).
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section >
    );
}
