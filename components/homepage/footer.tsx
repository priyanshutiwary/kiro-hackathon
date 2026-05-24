"use client";

import Link from "next/link";
import { Phone, Twitter, Linkedin, Github, Mail } from "lucide-react";



export default function FooterSection() {
  return (
    <footer className="bg-white dark:bg-[#060B14] pt-24 pb-12 overflow-hidden relative" id="footer">
      {/* Top Divider - Refined */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
      
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand Section */}
          <div className="lg:col-span-2 max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-8 group transition-transform hover:scale-105 duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20 group-hover:rotate-6 transition-all duration-500">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">InvoCall</span>
            </Link>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">
              Transforming accounts receivable with the world&apos;s most human-like AI voice agents. Reduce overdue invoices by 73% on autopilot.
            </p>
            <div className="flex gap-5">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Github, href: "#" },
                { icon: Mail, href: "mailto:support@invocall.ai" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Spacer for 4-col layout */}
          <div className="hidden lg:block"></div>

          {/* Legal Section */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Legal</h4>
            <ul className="space-y-5">
              <li>
                <Link href="/privacy-policy" className="text-lg text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-lg text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-lg text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Refined */}
        <div className="pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-base text-slate-500 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} InvoCall AI. All rights reserved.
          </p>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-5 py-2 rounded-full border border-slate-200/50 dark:border-white/5 shadow-inner">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-tight">System Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
