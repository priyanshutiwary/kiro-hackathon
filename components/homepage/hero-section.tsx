"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Phone, Zap, TrendingUp, Shield, Play } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32 min-h-[70vh] flex flex-col justify-center">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      
      {/* Ambient Glows - Optimized for performance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-[80px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-semibold rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              AI-Powered Payment Collection
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-slate-900 dark:text-white mb-8"
          >
            Automate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Invoice</span> Payments.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 font-medium"
          >
            Reduce overdue invoices by 73% with intelligent AI voice agents that call your customers, collect payments, and sync seamlessly with your CRM.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xl transition-all rounded-full w-full sm:w-auto">
              <Link href="/dashboard">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-full w-full sm:w-auto transition-all group">
              <Link href="#demo">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-medium text-slate-500 dark:text-slate-400"
          >
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Phone className="h-4 w-4 text-blue-500" />
              <span>Natural AI Voices</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span>85% Success Rate</span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
