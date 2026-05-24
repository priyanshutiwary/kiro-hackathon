"use client";

import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

const steps = [
    {
        title: "Connect Your Stack",
        description: "Seamlessly integrate with Zoho CRM, QuickBooks, or Salesforce in just a few clicks. No developer required to get your data flowing.",
        image: "/how-it-works-connect.png",
        color: "from-blue-500 to-indigo-600",
        delay: 0,
    },
    {
        title: "Configure Your AI Agent",
        description: "Customize your AI voice agent's tone, script, call frequency, and automated follow-up rules to match your brand's unique voice.",
        image: "/how-it-works-configure.png",
        color: "from-indigo-600 to-purple-600",
        delay: 0.2,
    },
    {
        title: "Collect Payments",
        description: "Sit back as InvoCall automatically makes polite follow-up calls, negotiates terms, and collects faster than ever before.",
        image: "/how-it-works-collect.png",
        color: "from-emerald-500 to-teal-600",
        delay: 0.4,
    },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "100%"]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section className="py-24 lg:py-48 relative bg-white dark:bg-[#0B1121] overflow-hidden" id="features" ref={containerRef}>
      {/* Background Grid - Refined */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e293b_0.5px,transparent_0.5px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 dark:opacity-20" />

      <div className="container px-6 mx-auto relative z-10 max-w-7xl">
        <div className="text-center mb-32 max-w-3xl mx-auto">
          <Badge
            variant="secondary"
            className="mb-8 px-5 py-2 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold uppercase tracking-wider text-[11px] rounded-full border border-indigo-100 dark:border-indigo-500/20"
          >
            Simple Workflow
          </Badge>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">InvoCall</span> Works
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Get started in minutes and transform your accounts receivable process entirely on autopilot.
          </p>
        </div>

        <div className="relative">
          {/* Animated Glowing Line (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 -translate-x-1/2 w-1 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div 
              className="w-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="flex flex-col gap-32 lg:gap-48">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className="relative flex flex-col lg:flex-row items-center gap-12 lg:gap-32">
                  {/* Timeline Dot (Desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-[#0B1121] border-4 border-slate-100 dark:border-slate-800 items-center justify-center z-20 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${step.color} shadow-[0_0_20px_rgba(59,130,246,0.5)]`} />
                  </div>

                  {/* Text Content */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full lg:w-[45%] ${isEven ? 'lg:pr-12 lg:text-right' : 'lg:pl-12 lg:order-2'}`}
                  >
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8 bg-gradient-to-br ${step.color} text-white font-bold text-2xl shadow-xl lg:hidden`}>
                      {index + 1}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>

                  {/* Image/Visual Content */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full lg:w-[45%] ${isEven ? 'lg:pl-12 lg:order-2' : 'lg:pr-12'}`}
                  >
                    <div className="relative rounded-[2.5rem] p-3 bg-white dark:bg-slate-800/40 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 shadow-3xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-transparent pointer-events-none" />
                      <div className="relative aspect-[16/10] rounded-[1.8rem] overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-inner">
                        <Image
                          src={step.image}
                          alt={step.title}
                          fill
                          className="object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-slate-900/5 dark:ring-white/5 rounded-[1.8rem] pointer-events-none" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
