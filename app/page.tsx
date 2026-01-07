import FooterSection from "@/components/homepage/footer";
import HeroSection from "@/components/homepage/hero-section";
import Integrations from "@/components/homepage/integrations";
import Navbar from "@/components/homepage/navbar";
import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "./pricing/_component/pricing-table";

export default async function Home() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <>
      <Navbar />
      <HeroSection />
      <Integrations />
      <PricingTable subscriptionDetails={subscriptionDetails} />
      <FooterSection />
    </>
  );
}
