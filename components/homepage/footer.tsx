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
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${brandColors.primary.gradientBr} shadow-lg shadow-blue-500/30`}>
                <Phone className="h-5 w-5 text-white" />
              </div>
              <span className={`font-bold text-xl ${brandColors.text.gradient}`}>
                CallAgent AI
              </span>
            </div>
            <p className={`text-sm ${brandColors.text.muted} mb-6 max-w-sm`}>
              Automate payment reminder calls with AI-powered voice agents. Reduce overdue invoices and improve cash flow with seamless CRM integration.
            </p>
            <div className={`space-y-2 text-sm ${brandColors.text.muted}`}>
              <div className="flex items-center gap-2">
                <Mail className={`h-4 w-4 ${brandColors.primary.text}`} />
                <span>support@callagent.ai</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className={`text-sm font-semibold ${brandColors.text.primary} mb-4`}>
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className={`text-sm ${brandColors.text.muted} hover:${brandColors.primary.text} transition-colors`}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`text-sm font-semibold ${brandColors.text.primary} mb-4`}>
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className={`text-sm ${brandColors.text.muted} hover:${brandColors.primary.text} transition-colors`}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`text-sm font-semibold ${brandColors.text.primary} mb-4`}>
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className={`text-sm ${brandColors.text.muted} hover:${brandColors.primary.text} transition-colors`}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t ${brandColors.border.default}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm ${brandColors.text.muted}`}>
              © {new Date().getFullYear()} CallAgent AI. All rights reserved. Payment Collection Automation Platform.
            </p>
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
      </div>
    </footer>
  );
}
