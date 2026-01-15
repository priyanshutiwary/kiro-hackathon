import FooterSection from "@/components/homepage/footer";
import HeroSection from "@/components/homepage/hero-section";
import Integrations from "@/components/homepage/integrations";
import Navbar from "@/components/homepage/navbar";
import SocialProof from "@/components/homepage/social-proof";
import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "./pricing/_component/pricing-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Payment Reminder Calls | Automated Invoice Collection Software",
  description: "Reduce overdue invoices by 73% with AI-powered payment reminder calls. Automated collection system with Zoho CRM integration. 85% success rate. Start free trial today.",
  keywords: [
    "payment reminder software",
    "automated invoice collection",
    "AI payment calls",
    "accounts receivable automation",
    "overdue invoice management",
    "payment collection software",
    "AI voice agent",
    "Zoho CRM integration",
    "cash flow management",
    "automated payment reminders",
    "invoice reminder calls",
    "debt collection automation",
    "payment follow-up software",
    "accounts receivable software",
    "automated collection calls"
  ],
  authors: [{ name: "CallAgent AI" }],
  creator: "CallAgent AI",
  publisher: "CallAgent AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://callagent.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Payment Reminder Calls | Reduce Overdue Invoices by 73%",
    description: "Automate payment collection with AI voice agents. Seamless Zoho integration, 85% success rate. Transform overdue invoices into collected payments.",
    url: "/",
    siteName: "CallAgent AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CallAgent AI - Automated Payment Collection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Payment Reminder Calls | Automated Invoice Collection",
    description: "Reduce overdue invoices by 73% with AI-powered payment reminder calls. 85% success rate. Start free trial.",
    images: ["/og-image.png"],
    creator: "@callagentai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default async function Home() {
  const subscriptionDetails = await getSubscriptionDetails();

  // Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CallAgent AI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "1000",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "AI-powered payment reminder call automation software. Reduce overdue invoices by 73% with automated collection calls and Zoho CRM integration.",
    "featureList": [
      "Automated payment reminder calls",
      "AI voice agent technology",
      "Zoho CRM and Books integration",
      "Real-time analytics dashboard",
      "Smart call scheduling",
      "85% collection success rate"
    ],
    "screenshot": "/dashboard-preview.png",
    "softwareVersion": "1.0",
    "author": {
      "@type": "Organization",
      "name": "CallAgent AI"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CallAgent AI",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://callagent.ai",
    "logo": "/logo.png",
    "description": "AI-powered payment collection automation platform for SMEs",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-0123",
      "contactType": "Customer Service",
      "email": "support@callagent.ai",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://twitter.com/callagentai",
      "https://linkedin.com/company/callagentai"
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      
      <Navbar />
      <HeroSection />
      <SocialProof />
      <Integrations />
      <PricingTable subscriptionDetails={subscriptionDetails} />
      <FooterSection />
    </>
  );
}
