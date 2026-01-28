"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns"; // Make sure to check if date-fns is available, usually standard in these stacks
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
// import { DashboardTheme } from "@/lib/dashboard-theme";

interface Reminder {
    id: string;
    reminderType: string;
    status: string;
    channel: "sms" | "voice";
    scheduledDate: string;
    invoice: {
        customerName: string;
        amountDue: number;
        currencyCode: string;
        invoiceNumber: string;
    };
}

export function RecentActivity() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecent() {
            try {
                const res = await fetch("/api/reminders?limit=10&statuses=completed,failed,skipped,in_progress");
                if (res.ok) {
                    const data = await res.json();
                    setReminders(data.reminders || []);
                }
            } catch (error) {
                console.error("Failed to fetch recent activity", error);
            } finally {
                setLoading(false);
            }
        }
        fetchRecent();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "in_progress":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    return (
        <Card className="@container/card h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                <CardDescription>
                    Latest automated payment reminders
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <div className="h-[400px] px-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-neutral-500 text-sm">
                            Loading activity...
                        </div>
                    ) : reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
                            <Clock className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No recent activity</p>
                            <p className="text-xs">Reminders will appear here once scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            {reminders.map((reminder) => (
                                <div
                                    key={reminder.id}
                                    className="flex flex-col space-y-1 border-b border-border pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                                                {reminder.channel === "voice" ? (
                                                    <Phone className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">
                                                    {reminder.invoice.customerName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {reminder.invoice.invoiceNumber} • {formatCurrency(reminder.invoice.amountDue, reminder.invoice.currencyCode)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={reminder.status === "completed" ? "outline" : "secondary"} className="text-xs capitalize flex gap-1 items-center">
                                                {getStatusIcon(reminder.status)}
                                                {reminder.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="pl-10 text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reminder.scheduledDate), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
