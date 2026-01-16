"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Zap,
  Clock,
  BarChart3,
  Shield,
  Workflow,
  TrendingUp
} from "lucide-react";
import { brandColors } from "@/lib/brand-colors";
import { motion } from "framer-motion";

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
            icon={<Phone className="h-6 w-6" />}
            title="AI Voice Collection Calls"
            description="Professional, natural-sounding AI agents make payment reminder calls automatically. Improve collection rates with personalized conversations."
            gradient={brandColors.features.voice}
          />

          <FeatureCard
            icon={<Workflow className="h-6 w-6" />}
            title="CRM & Accounting Integration"
            description="Seamlessly sync with Zoho Books, Zoho CRM, and other platforms. Automatic invoice tracking and payment status updates."
            gradient={brandColors.features.integration}
          />

          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Smart Call Scheduling"
            description="Optimal timing based on customer time zones and preferences. Automated follow-ups and retry logic for maximum efficiency."
            gradient={brandColors.features.scheduling}
          />

          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Secure & Compliant"
            description="Bank-level encryption for payment data. GDPR and PCI compliant with full audit trails and secure call recordings."
            gradient={brandColors.features.security}
          />

          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Real-time Analytics Dashboard"
            description="Track collection rates, call success metrics, and payment trends. Data-driven insights to optimize your collection strategy."
            gradient={brandColors.features.analytics}
          />

          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="85% Collection Success Rate"
            description="Proven results with automated payment reminders. Reduce DSO (Days Sales Outstanding) and improve working capital."
            gradient={brandColors.features.success}
          />
        </motion.div>

        {/* How It Works */}
        <div className="mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className={`mb-4 ${brandColors.border.default} backdrop-blur-sm`}>
              Simple Process
            </Badge>
            <h3 className={`text-3xl font-bold ${brandColors.text.primary}`}>
              Start collecting payments in 3 simple steps
            </h3>
            <p className={`mt-3 text-lg ${brandColors.text.secondary}`}>
              Setup takes minutes, not days
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            <StepCard
              step="1"
              title="Connect Your CRM"
              description="Link your Zoho Books or CRM account. We automatically sync overdue invoices and customer contact information."
            />
            <StepCard
              step="2"
              title="Configure Call Scripts"
              description="Customize AI voice agent scripts, set your business profile, and define payment reminder schedules."
            />
            <StepCard
              step="3"
              title="Automate Collections"
              description="Our AI agents make professional payment reminder calls automatically. Track results and watch your cash flow improve."
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) => {
  return (
    <motion.div variants={item} className="h-full">
      <Card className={`relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-white/10 ${brandColors.backgrounds.glass} backdrop-blur-xl rounded-2xl h-full group`}>
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-blue-500/20 mb-4 transition-transform duration-300 group-hover:scale-110 relative z-10`}>
          {icon}
        </div>
        <h3 className={`text-xl font-semibold ${brandColors.text.primary} mb-2 relative z-10`}>
          {title}
        </h3>
        <p className={`${brandColors.text.secondary} leading-relaxed relative z-10`}>
          {description}
        </p>
      </Card>
    </motion.div>
  );
};

const StepCard = ({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) => {
  return (
    <motion.div variants={item} className="relative">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${brandColors.primary.gradientBr} text-white font-bold shadow-lg shadow-blue-500/30`}>
          {step}
        </div>
        <div>
          <h4 className={`text-lg font-semibold ${brandColors.text.primary} mb-2`}>
            {title}
          </h4>
          <p className={brandColors.text.secondary}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
