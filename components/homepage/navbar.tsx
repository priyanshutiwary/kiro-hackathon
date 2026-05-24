"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { brandColors } from "@/lib/brand-colors";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 pointer-events-none">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`pointer-events-auto w-full max-w-5xl rounded-full border border-slate-200/50 dark:border-white/10 ${
          isScrolled 
            ? "py-2 px-4 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md" 
            : "py-3 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
        } transition-all duration-300`}
      >
        <div className="mx-auto flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95 duration-300">
            <Image src="/icon.svg" alt="InvoCall Logo" width={32} height={32} className="w-24 h-10 object-contain" priority />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 md:gap-2">
            {["Features", "Pricing", "Integrations", "Privacy"].map((item) => (
              <Link
                key={item}
                href={item === "Privacy" ? "/privacy-policy" : `#${item.toLowerCase()}`}
                className={`relative px-4 py-2 text-sm font-semibold ${brandColors.text.secondary} hover:text-slate-900 dark:hover:text-white transition-colors group`}
              >
                <span className="relative z-10">{item}</span>
                <span className="absolute inset-0 rounded-full bg-slate-100 dark:bg-white/10 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild className={`${brandColors.primary.gradient} hover:opacity-90 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 rounded-full px-6 font-semibold`}>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
