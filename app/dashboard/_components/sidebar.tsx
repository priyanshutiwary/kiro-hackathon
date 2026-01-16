"use client";

import UserProfile from "@/components/user-profile";
import clsx from "clsx";
import {
  Banknote,
  HomeIcon,
  LucideIcon,
  Plug,
  Settings,
  Phone,
  Sliders,
  Users,
  FileText,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    label: "Business Profile",
    href: "/dashboard/business-profile",
    icon: Building2,
  },
  {
    label: "Reminders",
    href: "/dashboard/reminders",
    icon: Phone,
  },
  {
    label: "Scheduled",
    href: "/dashboard/scheduled",
    icon: Calendar,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    label: "Configuration",
    href: "/dashboard/configuration",
    icon: Sliders,
  },
  {
    label: "Payment Gated",
    href: "/dashboard/payment",
    icon: Banknote,
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: Plug,
  },
];

export default function DashboardSideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={clsx(
        "min-[1024px]:flex hidden flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-50 rounded-full border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground shadow-sm hover:bg-sidebar-accent transition-colors focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div
        className={clsx(
          "flex h-16 items-center",
          isCollapsed ? "justify-center px-0" : "px-6"
        )}
      >
        <Link
          prefetch={true}
          className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          href="/"
        >
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
          </div>
          <span
            className={clsx(
              "whitespace-nowrap transition-all duration-300 origin-left",
              isCollapsed ? "w-0 opacity-0 overflow-hidden scale-0" : "w-auto opacity-100 scale-100"
            )}
          >
            Starter Kit
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group overflow-hidden",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                className={clsx(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              <span
                className={clsx(
                  "whitespace-nowrap transition-all duration-300",
                  isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-sidebar-border/50 space-y-1">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group overflow-hidden",
            pathname === "/dashboard/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings
            className={clsx(
              "h-4 w-4 shrink-0 transition-colors",
              pathname === "/dashboard/settings"
                ? "text-sidebar-primary"
                : "text-muted-foreground group-hover:text-sidebar-foreground"
            )}
          />
          <span
            className={clsx(
              "whitespace-nowrap transition-all duration-300",
              isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            )}
          >
            Settings
          </span>
        </button>
        <div className="pt-2">
          <UserProfile mini={isCollapsed} />
        </div>
      </div>
    </aside>
  );
}
