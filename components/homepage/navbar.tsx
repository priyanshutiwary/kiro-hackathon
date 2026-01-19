"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { brandColors } from "@/lib/brand-colors";

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3">
      <nav
        className={`w-full max-w-5xl rounded-2xl border ${brandColors.border.glass} ${brandColors.backgrounds.glass} shadow-xl backdrop-blur-lg`}
      >
        <div className="mx-auto px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className={`text-lg ${brandColors.text.gradient} flex items-center gap-0.5`}>
                <span className="font-medium">Invo</span>
                <span className="font-extrabold">Call</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className={`text-sm font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} transition-colors duration-200`}>
                Features
              </Link>
              <Link href="#pricing" className={`text-sm font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} transition-colors duration-200`}>
                Pricing
              </Link>
              <Link href="#integrations" className={`text-sm font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} transition-colors duration-200`}>
                Integrations
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className={`hidden sm:inline-flex hover:${brandColors.primary.text} transition-colors duration-200`}>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className={`${brandColors.primary.gradient} hover:opacity-90 text-white shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 transition-all duration-200 rounded-xl`}>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
