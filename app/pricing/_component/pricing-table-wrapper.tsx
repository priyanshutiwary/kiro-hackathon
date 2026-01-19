"use client";

import { useEffect, useState } from "react";
import PricingTable from "./pricing-table";

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

export default function PricingTableWrapper() {
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsResult>({
    hasSubscription: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionDetails(data);
        } else if (response.status === 401) {
          // User not authenticated - this is fine for public pages
          setSubscriptionDetails({ hasSubscription: false });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        // On error, assume no subscription
        setSubscriptionDetails({ hasSubscription: false });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-pulse">Loading pricing...</div>
      </div>
    );
  }

  return <PricingTable subscriptionDetails={subscriptionDetails} />;
}
