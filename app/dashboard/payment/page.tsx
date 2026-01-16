import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscriptionDetails } from "@/lib/subscription";
import Link from "next/link";
import ManageSubscription from "./_components/manage-subscription";
import { DashboardTheme } from "@/lib/dashboard-theme";

export default async function PaymentPage() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <div className={DashboardTheme.layout.container}>
      <div className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="relative min-h-[500px]">
          {!subscriptionDetails.hasSubscription ||
            subscriptionDetails.subscription?.status !== "active" ? (
            <>
              <div className="absolute inset-0 z-10 rounded-lg flex items-center justify-center">
                <div className="bg-background border p-8 rounded-lg shadow-lg text-center max-w-md">
                  <h3 className={DashboardTheme.typography.sectionTitle + " mb-2"}>
                    Subscription Required
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You need an active subscription to access payment management
                    features.
                  </p>
                  <Link href="/pricing">
                    <Button>Subscribe Now</Button>
                  </Link>
                </div>
              </div>
              <div className="blur-sm pointer-events-none select-none opacity-50">
                <Card className={DashboardTheme.card.base}>
                  <CardHeader className={DashboardTheme.card.header}>
                    <CardTitle className={DashboardTheme.card.metricLabel}>Payment Management</CardTitle>
                    <CardDescription className={DashboardTheme.card.metricValue}>
                      Manage your billing and payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={DashboardTheme.card.content + " space-y-4"}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Current Plan
                        </p>
                        <p className="text-md">Pro Plan</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Billing Status
                        </p>
                        <p className="text-md">Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
                <div>
                  <h2 className={DashboardTheme.typography.sectionTitle}>Subscription & Billing</h2>
                  <p className={DashboardTheme.typography.subtext}>
                    Manage your subscription plan and billing details
                  </p>
                </div>
              </div>

              <Card className={DashboardTheme.card.base}>
                <CardHeader className={DashboardTheme.card.header}>
                  <CardTitle className={DashboardTheme.card.metricLabel}>Subscription Details</CardTitle>
                  <CardDescription className={DashboardTheme.card.metricValue}>
                    Your current subscription information
                  </CardDescription>
                </CardHeader>
                <CardContent className={DashboardTheme.card.content + " space-y-4"}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Status
                      </p>
                      <p className="text-md capitalize">
                        {subscriptionDetails.subscription.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Amount
                      </p>
                      <p className="text-md">
                        {subscriptionDetails.subscription.amount / 100}{" "}
                        {subscriptionDetails.subscription.currency.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Billing Interval
                      </p>
                      <p className="text-md capitalize">
                        {subscriptionDetails.subscription.recurringInterval}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Current Period End
                      </p>
                      <p className="text-md">
                        {new Date(
                          subscriptionDetails.subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {subscriptionDetails.subscription.cancelAtPeriodEnd && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Your subscription will cancel at the end of the current
                        billing period.
                      </p>
                    </div>
                  )}
                  <ManageSubscription />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
