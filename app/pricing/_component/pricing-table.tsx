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
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { brandColors } from "@/lib/brand-colors";

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
      // Get current user session for customer info
      const session = await authClient.getSession();
      const user = session.data?.user;

      if (!user) {
        toast.error("Please sign in to continue");
        return;
      }

      // Prepare checkout parameters
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

      console.log("🔍 Dodo checkout parameters:", checkoutParams);

      // Use Better Auth Dodo Payments plugin checkout with required parameters
      const { data: checkout, error } = await authClient.dodopayments.checkout(checkoutParams);

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to create checkout session");
        return;
      }

      if (checkout?.url) {
        window.location.href = checkout.url;
      } else {
        toast.error("Failed to get checkout URL");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Oops, something went wrong");
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Use Better Auth Dodo Payments plugin customer portal
      const { data: customerPortal, error } = await authClient.dodopayments.customer.portal();
      
      if (error) {
        console.error("Portal error:", error);
        toast.error("Failed to open customer portal");
        return;
      }

      if (customerPortal?.redirect && customerPortal?.url) {
        window.location.href = customerPortal.url;
      } else {
        // Fallback to internal payment page
        router.push("/dashboard/payment");
      }
    } catch (error) {
      console.error("Failed to open subscription management:", error);
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
    <section id="pricing" className={`flex flex-col items-center justify-center px-4 py-24 w-full ${brandColors.backgrounds.section}`}>
      <div className="text-center mb-12 max-w-2xl">
        <Badge variant="secondary" className={`mb-4 ${brandColors.border.accent} ${brandColors.backgrounds.glass}`}>
          <Zap className={`mr-1.5 h-3.5 w-3.5 ${brandColors.primary.text}`} />
          Simple Pricing
        </Badge>
        <h2 className={`text-4xl font-bold tracking-tight sm:text-5xl ${brandColors.text.gradient}`}>
          Start Collecting Payments Today
        </h2>
        <p className={`mt-4 text-lg ${brandColors.text.secondary}`}>
          Reduce overdue invoices and improve cash flow with automated payment reminders
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Starter Tier */}
        <Card className={`relative h-fit ${brandColors.backgrounds.card} ${brandColors.border.default} backdrop-blur-xl rounded-2xl hover:shadow-2xl transition-all duration-300`}>
          {isCurrentPlan(STARTER_TIER) && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge
                variant="secondary"
                className={`${brandColors.success.gradientBr} text-white shadow-lg`}
              >
                Current Plan
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className={`text-2xl ${brandColors.text.primary}`}>Starter</CardTitle>
            <CardDescription className={brandColors.text.secondary}>
              Perfect for small businesses getting started with automated payment collection
            </CardDescription>
            <div className="mt-4">
              <span className={`text-4xl font-bold ${brandColors.text.primary}`}>$1,000</span>
              <span className={brandColors.text.muted}>/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Up to 500 payment reminder calls/month</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Zoho CRM & Books integration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>AI voice agent customization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Real-time analytics dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Email & chat support</span>
            </div>
          </CardContent>
          <CardFooter>
            {isCurrentPlan(STARTER_TIER) ? (
              <div className="w-full space-y-2">
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </Button>
                {subscriptionDetails.subscription && (
                  <p className={`text-sm ${brandColors.text.muted} text-center`}>
                    {subscriptionDetails.subscription.cancelAtPeriodEnd
                      ? `Expires ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`
                      : `Renews ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`}
                  </p>
                )}
              </div>
            ) : (
              <Button
                className={`w-full ${brandColors.primary.gradient} hover:opacity-90 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all rounded-xl`}
                onClick={() => handleCheckout("starter")}
              >
                {isAuthenticated === false
                  ? "Sign In to Get Started"
                  : "Start Free Trial"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Enterprise Tier - Coming Soon */}
        <Card className={`relative h-fit ${brandColors.backgrounds.card} ${brandColors.border.default} backdrop-blur-xl rounded-2xl hover:shadow-2xl transition-all duration-300`}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge
              variant="secondary"
              className={`${brandColors.secondary.gradientBr} text-white shadow-lg`}
            >
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className={`text-2xl ${brandColors.text.primary}`}>Enterprise</CardTitle>
            <CardDescription className={brandColors.text.secondary}>
              For businesses with high-volume payment collection needs
            </CardDescription>
            <div className="mt-4">
              <span className={`text-4xl font-bold ${brandColors.text.primary}`}>Custom</span>
              <span className={brandColors.text.muted}>/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Unlimited payment reminder calls</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Multi-CRM integrations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Advanced AI customization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Dedicated account manager</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${brandColors.success.bg}`}>
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={brandColors.text.secondary}>Priority 24/7 support</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full rounded-xl"
              variant="outline"
              onClick={() => window.location.href = "mailto:sales@callagent.ai"}
            >
              Contact Sales
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className={brandColors.text.secondary}>
          Need a custom plan?{" "}
          <a href="mailto:sales@callagent.ai" className={`${brandColors.primary.text} cursor-pointer hover:underline font-medium`}>
            Contact our sales team
          </a>
        </p>
      </div>
    </section>
  );
}
