"use client";
import { AnimatePresence, motion } from "framer-motion";
import UserProfile from "@/components/user-profile";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
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
  Moon,
  Sun
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

interface SidebarProps {
  isMobile?: boolean;
}

export default function DashboardSideBar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarContent = (
    <>
      {/* Toggle Button - Desktop only */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-50 rounded-full border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground shadow-sm hover:bg-sidebar-accent transition-colors focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Header */}
      <div
        className={clsx(
          "flex h-16 items-center",
          isMobile ? "px-6 border-b border-sidebar-border" : (isCollapsed ? "justify-center px-0" : "px-6")
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
          {isMobile ? (
            <span className="flex items-center gap-0.5 ml-2">
              <span className="font-medium">Invo</span>
              <span className="font-extrabold">Call</span>
            </span>
          ) : (
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <span className="flex items-center gap-0.5 ml-2">
                    <span className="font-medium">Invo</span>
                    <span className="font-extrabold">Call</span>
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          )}
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
              {isMobile ? (
                <span className="ml-1">{item.label}</span>
              ) : (
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden ml-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-sidebar-border/50 space-y-1">
        <style jsx global>{`
          .sidebar-switch .data-[state=checked]:bg-primary {
            background-color: hsl(var(--sidebar-primary));
          }
        `}</style>
        <div
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group overflow-hidden text-muted-foreground hover:text-sidebar-foreground",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Dark Mode" : undefined}
        >
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 shrink-0" />
          ) : (
            <Sun className="h-4 w-4 shrink-0" />
          )}
          {isMobile ? (
            <span className="flex items-center justify-between flex-1 ml-1">
              <span>Dark Mode</span>
              {mounted && (
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  className="scale-75"
                />
              )}
            </span>
          ) : (
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 ml-1"
                >
                  <span>Dark Mode</span>
                  {mounted && (
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      className="scale-75 sidebar-switch data-[state=unchecked]:bg-input/50 border-input"
                    />
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </div>

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
          {isMobile ? (
            <span className="ml-1">Settings</span>
          ) : (
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden ml-1"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </button>
        <div className="pt-2">
          <UserProfile mini={isMobile ? false : isCollapsed} />
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 70 : 256 }}
      transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
      className="min-[1024px]:flex hidden flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground relative z-20"
    >
      {sidebarContent}
    </motion.aside>
  );
}
