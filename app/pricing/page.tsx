import { getSubscriptionDetails } from "@/lib/subscription";
import { ThemeToggle } from "@/components/theme-toggle";
import PricingTable from "./_component/pricing-table";
import { brandColors } from "@/lib/brand-colors";

export default async function PricingPage() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <div className={`flex flex-col items-center justify-center w-full min-h-screen relative overflow-hidden ${brandColors.backgrounds.hero}`}>
      {/* Background Elements */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(148,163,184,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full">
        <PricingTable subscriptionDetails={subscriptionDetails} />
      </div>
    </div>
  );
}
