"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { brandColors } from "@/lib/brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const router = useRouter();

  // Use useEffect to handle search params to avoid hydration mismatch
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const subscriptionId = searchParams.get("subscription_id");
    const status = searchParams.get("status");

    // Best-effort sync after redirect
    if (subscriptionId) {
      (async () => {
        try {
          await fetch('/api/subscription/sync-from-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId, status }),
          });
        } catch (e) {
          console.error('Failed to sync subscription after success:', e);
        }
      })();
    }
  }, []);

  return (
    <div className={`flex flex-col justify-center items-center w-full min-h-screen p-4 relative overflow-hidden ${brandColors.backgrounds.hero}`}>
      {/* Background Elements */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(148,163,184,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className={`w-full ${brandColors.backgrounds.glass} backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[24px] border-0`}>
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-4 relative">
              <div className="absolute inset-0 animate-ping">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto opacity-75" />
              </div>
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto relative" />
            </div>
            <CardTitle className="text-2xl font-bold mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for your subscription. Your account has been activated and
              you&apos;re ready to start creating.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className={`flex items-center justify-center gap-2 text-sm ${brandColors.text.primary} bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Welcome to the team!</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className={`w-full ${brandColors.primary.gradient} hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-slate-500/20 py-6 text-lg`}
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll receive a confirmation email shortly with your receipt
              and next steps.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

