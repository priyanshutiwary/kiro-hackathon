import { getSubscriptionDetails } from "@/lib/subscription";
import { ThemeToggle } from "@/components/theme-toggle";
import PricingTable from "./_component/pricing-table";

export default async function PricingPage() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <PricingTable subscriptionDetails={subscriptionDetails} />;
    </div>
  );
}
