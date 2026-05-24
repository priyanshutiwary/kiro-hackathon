"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "85%", label: "Collection Success Rate" },
  { value: "10k+", label: "Payment Calls Made" },
  { value: "73%", label: "Faster Payment Collection" },
  { value: "4.9/5", label: "Customer Satisfaction" },
];

export default function SocialProof() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-50 dark:bg-[#060B14]">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Stats Section */}
        <div className="py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 divide-x divide-transparent lg:divide-slate-200 dark:lg:divide-white/10">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-4 tracking-tight pb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
