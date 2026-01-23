
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import { Phone, CheckCircle, XCircle, Mic, MessageSquare } from "lucide-react";

interface DashboardStatsProps {
    stats: {
        overall: {
            total: number;
            completed: number;
            skipped: number;
            failed: number;
            pending: number;
            queued: number;
            inProgress: number;
            successRate: number;
        };
        byChannel: {
            smsCount: number;
            voiceCount: number;
            completedSMS: number;
            completedVoice: number;
            failedSMS: number;
            failedVoice: number;
        };
    };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    // Extracting data for readability
    const voiceReminders = stats.byChannel?.voiceCount || 0;
    const smsReminders = stats.byChannel?.smsCount || 0;
    const failedCalls = stats.overall.failed;
    const successRate = stats.overall.successRate;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Voice Reminder Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Voice Reminders</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
                        <Mic className="h-5 w-5 text-blue-500" />
                        {voiceReminders}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                        Sent via Voice Channel
                    </div>
                </CardFooter>
            </Card>

            {/* SMS Reminder Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>SMS Reminders</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        {smsReminders}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                        Sent via SMS Channel
                    </div>
                </CardFooter>
            </Card>

            {/* Failed Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        {failedCalls}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                        Unsuccessful attempts
                    </div>
                </CardFooter>
            </Card>

            {/* Success Rate Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Success Rate</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {successRate.toFixed(1)}%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {successRate >= 70 ? (
                                <>
                                    <IconTrendingUp />
                                    Good
                                </>
                            ) : (
                                <>
                                    <IconTrendingDown />
                                    Needs Attention
                                </>
                            )}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="text-muted-foreground">
                        {stats.overall.completed} completed calls
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
