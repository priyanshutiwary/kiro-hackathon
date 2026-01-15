import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Phone, Zap, TrendingUp, Shield } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* Gradient Background - Apple style */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(99,102,241,0.15),transparent_50%)]" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className={`mb-6 px-4 py-1.5 text-sm font-medium ${brandColors.border.accent} ${brandColors.backgrounds.glass}`}>
            <Zap className={`mr-1.5 h-3.5 w-3.5 ${brandColors.primary.text}`} />
            AI-Powered Payment Collection
          </Badge>
          
          {/* Main Heading - SEO Optimized */}
          <h1 className={`text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl ${brandColors.text.gradient}`}>
            Automate Invoice Payment Reminders with AI Voice Agents
          </h1>
          
          {/* Subheading - SEO Keywords */}
          <p className={`mt-6 text-lg leading-8 ${brandColors.text.secondary} max-w-2xl mx-auto`}>
            Reduce overdue invoices by 73% with automated payment reminder calls. Our AI voice agents make professional collection calls to your customers—seamlessly integrated with your CRM for faster cash flow.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg" className={`h-12 px-8 text-base font-semibold ${brandColors.primary.gradient} hover:opacity-90 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all rounded-xl`}>
              <Link href="/dashboard">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={`h-12 px-8 text-base font-semibold ${brandColors.border.accent} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 backdrop-blur-xl rounded-xl`}>
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>
          
          {/* Trust Indicators - SEO Keywords */}
          <div className={`mt-12 flex items-center justify-center gap-8 text-sm ${brandColors.text.muted}`}>
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
          </div>
        </div>
        
        {/* Dashboard Preview - Liquid Glass */}
        <div className="mt-20">
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 blur-3xl" />
            
            <div className={`relative rounded-[28px] ${brandColors.backgrounds.glass} p-3 shadow-2xl ring-1 ${brandColors.border.glass} backdrop-blur-2xl backdrop-saturate-150`}>
              {/* Placeholder for dashboard screenshot */}
              <div className={`aspect-video rounded-[20px] bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-violet-950/50 flex items-center justify-center overflow-hidden border ${brandColors.border.glass}`}>
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className={`absolute inset-0 ${brandColors.primary.gradient} blur-2xl opacity-30`} />
                    <Phone className={`relative h-16 w-16 mx-auto ${brandColors.primary.text}`} />
                  </div>
                  <p className={`${brandColors.text.secondary} font-medium text-lg`}>Payment Collection Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
