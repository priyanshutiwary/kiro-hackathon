"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Check, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type SubscriptionDetails = {
  id: string;
  productId: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  organizationId: string | null;
};

type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
  errorType?: "CANCELED" | "EXPIRED" | "GENERAL";
};

interface PricingTableProps {
  subscriptionDetails: SubscriptionDetailsResult;
}

export default function PricingTable({
  subscriptionDetails,
}: PricingTableProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (slug: string) => {
    if (isAuthenticated === false) {
      router.push("/sign-in");
      return;
    }

    try {
      const session = await authClient.getSession();
      const user = session.data?.user;

      if (!user) {
        toast.error("Please sign in to continue");
        return;
      }

      const checkoutParams = {
        slug: slug,
        customer: {
          email: user.email,
          name: user.name || "Customer",
        },
        billing: {
          city: "San Francisco",
          country: "US",
          state: "CA",
          street: "123 Market St",
          zipcode: "94103",
        },
        referenceId: `order_${Date.now()}_${user.id}`,
      };

      const { data: checkout, error } = await authClient.dodopayments.checkout(checkoutParams);

      if (error) {
        toast.error("Failed to create checkout session");
        return;
      }

      if (checkout?.url) {
        window.location.href = checkout.url;
      } else {
        toast.error("Failed to get checkout URL");
      }
    } catch (error) {
      toast.error("Oops, something went wrong");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: customerPortal, error } = await authClient.dodopayments.customer.portal();
      if (error) {
        toast.error("Failed to open customer portal");
        return;
      }
      if (customerPortal?.redirect && customerPortal?.url) {
        window.location.href = customerPortal.url;
      } else {
        router.push("/dashboard/payment");
      }
    } catch (error) {
      toast.error("Failed to open subscription management");
    }
  };

  const STARTER_TIER = process.env.NEXT_PUBLIC_STARTER_TIER;

  if (!STARTER_TIER) {
    throw new Error("Missing required environment variables for Starter tier");
  }

  const isCurrentPlan = (tierProductId: string) => {
    return (
      subscriptionDetails.hasSubscription &&
      subscriptionDetails.subscription?.productId === tierProductId &&
      subscriptionDetails.subscription?.status === "active"
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section id="pricing" className="relative py-24 lg:py-40 bg-white dark:bg-[#0B1121] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-6 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold rounded-full border-0">
            <Zap className="mr-2 h-4 w-4" />
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Scale your <span className="text-blue-600 dark:text-blue-400">Recovery</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
            Transparent, performance-driven pricing for growing businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <Card className="relative h-full border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 rounded-3xl p-2 transition-all duration-500 hover:shadow-2xl hover:border-blue-500/20">
              {isCurrentPlan(STARTER_TIER) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-emerald-500 text-white border-0 py-1 px-4 shadow-lg">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Professional</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
                  Best for small to medium businesses automating collections.
                </CardDescription>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">$1,000</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">/month</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                {[
                  "Up to 500 AI calls / month",
                  "Zoho CRM & Books sync",
                  "Natural AI Voice Agents",
                  "Real-time Analytics",
                  "Priority Email Support"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="p-8 pt-0">
                {isCurrentPlan(STARTER_TIER) ? (
                  <Button variant="outline" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={handleManageSubscription}>
                    Manage Account
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 group/btn"
                    onClick={() => handleCheckout("starter")}
                  >
                    {isAuthenticated === false ? "Get Started Now" : "Start 7-Day Free Trial"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <Card className="relative h-full border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 rounded-3xl p-2 transition-all duration-500 hover:shadow-2xl hover:border-blue-500/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-0 py-1 px-4 shadow-lg shrink-0 font-bold uppercase tracking-wider text-[10px]">Custom</Badge>
              </div>
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Enterprise</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
                  Custom solutions for high-volume enterprise operations.
                </CardDescription>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                {[
                  "Unlimited AI Collections",
                  "Dedicated Account Manager",
                  "Custom CRM Workflows",
                  "24/7 Dedicated Support",
                  "API Access & Webhooks"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-lg transition-all"
                  onClick={() => window.location.href = "mailto:sales@invocall.ai"}
                >
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            All plans include bank-level security and natural AI voices. <a href="#" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Learn more about our technology</a>
          </p>
        </div>
      </div>
    </section>
  );
}
