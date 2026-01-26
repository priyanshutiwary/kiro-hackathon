"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TimelineSelectorProps {
    days: {
        label: string;
        description: string;
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
    }[];
}

export default function TimelineSelector({ days }: TimelineSelectorProps) {
    return (
        <div className="relative">
            {/* Line connecting items */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-border -z-10 hidden md:block" />

            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {days.map((day, index) => (
                    <div
                        key={index}
                        className="group flex flex-col items-center gap-3 cursor-pointer"
                        onClick={() => day.onCheckedChange(!day.checked)}
                    >
                        {/* Circle Node */}
                        <div className={cn(
                            "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-200 bg-background",
                            day.checked
                                ? "border-primary text-primary-foreground bg-primary shadow-lg scale-105"
                                : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50"
                        )}>
                            {day.checked ? (
                                <Check className="w-8 h-8" />
                            ) : (
                                <div className="w-3 h-3 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
                            )}
                        </div>

                        {/* Label */}
                        <div className="text-center">
                            <div className={cn(
                                "font-medium text-sm transition-colors",
                                day.checked ? "text-primary" : "text-muted-foreground"
                            )}>
                                {day.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground/70 hidden md:block mt-1">
                                {day.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
