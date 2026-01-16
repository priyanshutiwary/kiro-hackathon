"use client";

import { usePathname } from "next/navigation";

// Wait, the sidebar is custom (from checking sidebar.tsx). The sidebar has its own mini/expand logic.
// The user asked to "remove top nav bar", which had the mobile trigger.
// For now, I will build the header with just the title. If mobile trigger is needed, I'll address it.

const getPageTitle = (pathname: string) => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.includes("/dashboard/settings")) return "Settings";
    if (pathname.includes("/dashboard/business-profile")) return "Business Profile";
    if (pathname.includes("/dashboard/reminders")) return "Reminders";
    if (pathname.includes("/dashboard/scheduled")) return "Scheduled";
    if (pathname.includes("/dashboard/customers")) return "Customers";
    if (pathname.includes("/dashboard/invoices")) return "Invoices";
    if (pathname.includes("/dashboard/configuration")) return "Configuration";
    if (pathname.includes("/dashboard/payment")) return "Payment Gated";
    if (pathname.includes("/dashboard/integrations")) return "Integrations";
    return "Dashboard";
};

export default function DashboardHeader() {
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <h1 className="text-lg font-semibold">{title}</h1>
        </header>
    );
}
