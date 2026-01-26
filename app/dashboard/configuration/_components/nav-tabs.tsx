"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
}

interface NavTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export default function NavTabs({ tabs, activeTab, onChange, className }: NavTabsProps) {
    return (
        <div className={cn("flex items-center border-b border-border/40 w-full mb-8", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative px-4 py-3 text-sm font-medium transition-colors outline-none",
                            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        {tab.label}
                        {isActive && (
                            <motion.div
                                layoutId="active-tab-line"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
