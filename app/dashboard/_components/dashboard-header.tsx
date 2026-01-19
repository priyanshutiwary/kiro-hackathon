"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import DashboardSideBar from "./sidebar";

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
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="min-[1024px]:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <DashboardSideBar isMobile={true} />
                </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">{title}</h1>
        </header>
    );
}
