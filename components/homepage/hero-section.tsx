"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Phone, Zap, TrendingUp, Shield } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* Gradient Background - Apple style */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />

      {/* Mesh Gradient Overlay - Desaturated/Neutral */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(148,163,184,0.1),transparent_50%)]" />

      {/* Subtle Grid Pattern - Neutral */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className={`mb-6 px-4 py-1.5 text-sm font-medium ${brandColors.border.accent} ${brandColors.backgrounds.glass}`}>
              <Zap className={`mr-1.5 h-3.5 w-3.5 ${brandColors.primary.text}`} />
              AI-Powered Payment Collection
            </Badge>
          </motion.div>

          {/* Main Heading - SEO Optimized */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl ${brandColors.text.gradient}`}
          >
            Automate Invoice Payment Reminders with AI Voice Agents
          </motion.h1>

          {/* Subheading - SEO Keywords */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`mt-6 text-lg leading-8 ${brandColors.text.secondary} max-w-2xl mx-auto`}
          >
            Reduce overdue invoices by 73% with automated payment reminder calls. Our AI voice agents make professional collection calls to your customers—seamlessly integrated with your CRM for faster cash flow.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button asChild size="lg" className={`h-12 px-8 text-base font-semibold ${brandColors.primary.gradient} hover:opacity-90 text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 transition-all rounded-xl`}>
              <Link href="/dashboard">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={`h-12 px-8 text-base font-semibold ${brandColors.border.accent} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 backdrop-blur-xl rounded-xl`}>
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators - SEO Keywords */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`mt-12 flex items-center justify-center gap-8 text-sm ${brandColors.text.muted}`}
          >
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${brandColors.primary.text}`} />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Natural AI Voices</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${brandColors.success.text}`} />
              <span>85% Collection Rate</span>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview - Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
          className="mt-20"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Silver Halo - Premium Depth without distracting color - Boosted for Dark Mode */}
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 blur-xl opacity-40 dark:opacity-60" />

            <div className={`relative rounded-[24px] ${brandColors.backgrounds.glass} p-2 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 backdrop-blur-2xl`}>
              {/* Dashboard Mock UI - Skeleton Interface */}
              <div className="rounded-[20px] bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/10 overflow-hidden flex h-[400px] md:h-[500px]">

                {/* Sidebar */}
                <div className="w-16 md:w-64 border-r border-slate-200/50 dark:border-white/5 flex flex-col p-4 bg-white/50 dark:bg-slate-900/50">
                  {/* Logo Placeholder */}
                  <div className="h-8 w-8 md:w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8" />

                  {/* Nav Items */}
                  <div className="space-y-3">
                    <div className="h-8 w-8 md:w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-center px-3">
                      <div className="h-4 w-4 bg-blue-500 rounded-sm" />
                    </div>
                    <div className="h-8 w-8 md:w-full bg-transparent rounded-lg flex items-center px-3 gap-3 opacity-60">
                      <div className="h-4 w-4 bg-slate-400 rounded-sm" />
                      <div className="hidden md:block h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    </div>
                    <div className="h-8 w-8 md:w-full bg-transparent rounded-lg flex items-center px-3 gap-3 opacity-60">
                      <div className="h-4 w-4 bg-slate-400 rounded-sm" />
                      <div className="hidden md:block h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    </div>
                    <div className="h-8 w-8 md:w-full bg-transparent rounded-lg flex items-center px-3 gap-3 opacity-60">
                      <div className="h-4 w-4 bg-slate-400 rounded-sm" />
                      <div className="hidden md:block h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>

                  {/* Dashboard Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                    {/* Stat Card 1 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 mb-3" />
                      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 mb-3" />
                      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 mb-3" />
                      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>

                    {/* Big Chart Area */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-64 relative overflow-hidden group">
                      <div className="absolute inset-x-0 bottom-0 top-12 px-4 flex items-end justify-between gap-2">
                        {[40, 60, 45, 75, 55, 85, 65, 90, 70, 100].map((h, i) => (
                          <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-t-sm group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors duration-500" />
                        ))}
                      </div>
                    </div>

                    {/* Recent List */}
                    <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-64 p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                          <div className="flex-1">
                            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
