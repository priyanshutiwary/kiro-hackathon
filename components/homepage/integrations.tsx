"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";
import { motion } from "framer-motion";
import Image from "next/image";

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

export default function Integrations() {
  return (
    <section className={`py-24 sm:py-32 relative overflow-hidden ${brandColors.backgrounds.section}`}>
      {/* Background Pattern - Dot Grid (Subtle Technical Feel) */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="secondary" className={`mb-4 ${brandColors.border.accent} ${brandColors.backgrounds.glass} shadow-sm backdrop-blur-md`}>
            <Zap className={`mr-1.5 h-3.5 w-3.5 ${brandColors.primary.text}`} />
            Powerful Features
          </Badge>
          <h2 className={`text-4xl font-bold tracking-tight sm:text-5xl ${brandColors.text.gradient}`}>
            Automated Payment Collection Made Simple
          </h2>
          <p className={`mt-4 text-lg ${brandColors.text.secondary}`}>
            Reduce overdue invoices and improve cash flow with intelligent automation
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FeatureCard
            image="/feature-voice-call.png"
            title="AI Voice Collection Calls"
            description="Professional, natural-sounding AI agents make payment reminder calls automatically. Improve collection rates with personalized conversations."
          />

          <FeatureCard
            image="/feature-integration.png"
            title="CRM & Accounting Integration"
            description="Seamlessly sync with Zoho Books, Zoho CRM, and other platforms. Automatic invoice tracking and payment status updates."
          />

          <FeatureCard
            image="/feature-scheduling.png"
            title="Smart Call Scheduling"
            description="Optimal timing based on customer time zones and preferences. Automated follow-ups and retry logic for maximum efficiency."
          />

          <FeatureCard
            image="/feature-security.png"
            title="Secure & Compliant"
            description="Bank-level encryption for payment data. GDPR and PCI compliant with full audit trails and secure call recordings."
          />

          <FeatureCard
            image="/feature-analytics.png"
            title="Real-time Analytics Dashboard"
            description="Track collection rates, call success metrics, and payment trends. Data-driven insights to optimize your collection strategy."
          />

          <FeatureCard
            image="/feature-success.png"
            title="85% Collection Success Rate"
            description="Proven results with automated payment reminders. Reduce DSO (Days Sales Outstanding) and improve working capital."
          />
        </motion.div>


      </div>
    </section>
  );
}

const FeatureCard = ({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) => {
  return (
    <motion.div variants={item} className="h-full">
      <Card className={`relative overflow-hidden p-5 hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-white/10 ${brandColors.backgrounds.glass} backdrop-blur-xl rounded-2xl h-full group`}>
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="mb-4 relative overflow-hidden rounded-xl h-48 w-full flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Image
            src={image}
            alt={title}
            width={400}
            height={300}
            className="object-contain w-full h-full transform transition-transform duration-500 group-hover:scale-110 p-2 relative z-10"
          />
        </div>

        <h3 className={`text-lg font-semibold ${brandColors.text.primary} mb-1.5 relative z-10`}>
          {title}
        </h3>
        <p className={`text-sm ${brandColors.text.secondary} leading-relaxed relative z-10 line-clamp-3`}>
          {description}
        </p>
      </Card>
    </motion.div>
  );
};


