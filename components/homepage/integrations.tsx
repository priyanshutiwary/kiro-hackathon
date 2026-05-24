"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, BarChart3, Globe2, Cpu, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Integrations() {
  return (
    <section className="py-24 lg:py-48 relative overflow-hidden bg-white dark:bg-[#0B1121]" id="integrations">
      {/* Background accents - Refined */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-32">
          <Badge 
            variant="secondary" 
            className="mb-8 px-5 py-2 bg-blue-50/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold uppercase tracking-wider text-[11px] rounded-full border border-blue-100 dark:border-blue-500/20"
          >
            <Zap className="mr-2 h-3.5 w-3.5 fill-current" />
            Platform Capabilities
          </Badge>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
            Everything you need for <span className="text-blue-600 dark:text-blue-400">Cash Flow</span> excellence
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            A comprehensive suite of AI-driven tools designed to automate your accounts receivable from end-to-end.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-8 auto-rows-[280px]">
          
          {/* Main Feature - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-6 lg:col-span-8 row-span-2 group"
          >
            <Card className="h-full relative overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-10 flex flex-col justify-between hover:shadow-3xl transition-all duration-700 ease-out hover:-translate-y-1">
              <div className="relative z-10 max-w-md">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                  <Globe2 className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">AI Voice Collection Calls</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Professional, natural-sounding AI agents make payment reminder calls automatically. Our proprietary LLM handles complex negotiations and ensures a polite human-like experience.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-3/5 h-3/5 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/40 to-transparent blur-3xl rounded-full translate-x-1/4 translate-y-1/4" />
                <div className="relative w-full h-full p-8 pr-0 pb-0">
                  <Image 
                    src="/feature-voice-call.png" 
                    alt="Voice UI" 
                    fill 
                    className="object-contain object-right-bottom translate-x-8 translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-1000 ease-out"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Secondary Feature - Tall */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-6 lg:col-span-4 row-span-2 group"
          >
            <Card className="h-full relative overflow-hidden border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/40 rounded-[2.5rem] p-10 flex flex-col hover:shadow-3xl transition-all duration-700 ease-out hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-8 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Enterprise Security</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Bank-level encryption for all payment data. Fully GDPR and PCI compliant with audit trails for every interaction.
              </p>
              <div className="mt-auto relative h-48 w-full group-hover:scale-105 transition-transform duration-1000 ease-out">
                <Image 
                  src="/feature-security.png" 
                  alt="Security" 
                  fill 
                  className="object-contain object-bottom p-4" 
                />
              </div>
            </Card>
          </motion.div>

          {/* Small Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 lg:col-span-4 row-span-1 group"
          >
            <Card className="h-full relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col justify-center hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Real-time Analytics</h3>
              </div>
            </Card>
          </motion.div>

          {/* Small Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3 lg:col-span-4 row-span-1 group"
          >
            <Card className="h-full relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col justify-center hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <Cpu className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CRM Sync</h3>
              </div>
            </Card>
          </motion.div>

          {/* Small Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-6 lg:col-span-4 row-span-1 group"
          >
            <Card className="h-full relative overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col justify-center hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Multi-channel</h3>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
}


