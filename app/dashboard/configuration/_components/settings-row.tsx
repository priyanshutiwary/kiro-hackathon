"use client";

import { cn } from "@/lib/utils";

interface SettingsRowProps {
    label: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    alignTop?: boolean;
}

export default function SettingsRow({ label, description, children, className, alignTop = false }: SettingsRowProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-border/40 last:border-0", className)}>
            <div className="md:col-span-4 space-y-1">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
                {description && (
                    <p className="text-[13px] text-muted-foreground mr-6 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <div className={cn("md:col-span-8", alignTop ? "items-start" : "flex items-center")}>
                <div className="w-full max-w-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
