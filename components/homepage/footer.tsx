import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";

const footerLinks = {
  product: [
    { title: "Features", href: "#features" },
    { title: "Pricing", href: "#pricing" },
    { title: "Integrations", href: "#integrations" },
    { title: "Demo", href: "#demo" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Blog", href: "/blog" },
    { title: "Careers", href: "/careers" },
    { title: "Contact", href: "/contact" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Security", href: "/security" },
    { title: "GDPR Compliance", href: "/gdpr" },
  ],
};

export default function FooterSection() {
  return (
    <footer className={`${brandColors.backgrounds.section} border-t ${brandColors.border.default}`}>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${brandColors.primary.gradientBr} shadow-md`}>
                <Phone className="h-4 w-4 text-white" />
              </div>
              <span className={`font-bold text-lg ${brandColors.text.primary}`}>
                CallAgent AI
              </span>
            </div>
            <p className={`text-sm ${brandColors.text.muted}`}>
              © {new Date().getFullYear()} CallAgent AI. All rights reserved.
            </p>
          </div>

          {/* Minimal Social Links */}
          <div className="flex items-center gap-6">
            <Link
              href="https://twitter.com"
              className={`${brandColors.text.muted} hover:${brandColors.primary.text} transition-colors`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </Link>
            <Link
              href="https://linkedin.com"
              className={`${brandColors.text.muted} hover:${brandColors.primary.text} transition-colors`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
