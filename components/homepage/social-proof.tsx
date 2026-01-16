"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CFO, TechFlow Solutions",
    content: "Reduced our overdue invoices by 73% in the first month. The AI payment reminder calls are professional and effective. Our DSO improved dramatically.",
    rating: 5,
    initials: "SC",
  },
  {
    name: "Michael Rodriguez",
    role: "Owner, Rodriguez Consulting",
    content: "Game changer for cash flow management. Automated payment collection saves us 15 hours per week. Customers appreciate the polite reminders.",
    rating: 5,
    initials: "MR",
  },
  {
    name: "Emily Watson",
    role: "Finance Director, BuildCo",
    content: "The Zoho integration is seamless. Everything syncs automatically, and the analytics help us optimize our accounts receivable strategy.",
    rating: 5,
    initials: "EW",
  },
];

const stats = [
  { value: "85%", label: "Collection Success Rate" },
  { value: "10k+", label: "Payment Calls Made" },
  { value: "73%", label: "Faster Payment Collection" },
  { value: "4.9/5", label: "Customer Satisfaction" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function SocialProof() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background - Clean with very subtle gradient (Trust Feel) */}
      <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/20 backdrop-blur-3xl" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-100/30 dark:bg-indigo-900/10 blur-3xl animate-pulse" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge variant="secondary" className="mb-4 bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 backdrop-blur-sm border-0">
              Trusted Results
            </Badge>
            <h2 className={`text-3xl font-bold ${brandColors.text.primary}`}>
              Trusted by businesses worldwide for payment collection
            </h2>
            <p className={`mt-3 text-lg ${brandColors.text.secondary}`}>
              Real results from real businesses using AI-powered payment reminders
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={item}
                className={`text-center p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <div className={`text-4xl font-bold ${brandColors.text.gradient}`}>
                  {stat.value}
                </div>
                <div className={`mt-2 text-sm ${brandColors.text.muted}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Testimonials */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={item} className="h-full">
              <Card
                className={`p-8 hover:shadow-2xl transition-all duration-300 bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 backdrop-blur-xl rounded-2xl h-full flex flex-col justify-between`}
              >
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className={`${brandColors.text.primary} text-lg mb-6 leading-relaxed font-medium`}>
                    "{testimonial.content}"
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Avatar className={`h-12 w-12 ${brandColors.primary.gradientBr} shadow-md`}>
                    <AvatarFallback className="text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={`font-semibold ${brandColors.text.primary}`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm ${brandColors.text.muted}`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
