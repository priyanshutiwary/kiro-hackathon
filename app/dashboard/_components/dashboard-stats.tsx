
import { Mic, MessageSquare, XCircle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";

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
    const failedCalls = stats.overall.failed || 0;
    const successRate = stats.overall.successRate || 0;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Voice Reminder Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Mic className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Voice Reminders</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                            {voiceReminders}
                        </h3>
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span>Sent via Voice Channel</span>
                </div>
            </div>

            {/* SMS Reminder Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">SMS Reminders</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                            {smsReminders}
                        </h3>
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span>Sent via SMS Channel</span>
                </div>
            </div>

            {/* Failed Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                            {failedCalls}
                        </h3>
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span>Unsuccessful attempts</span>
                </div>
            </div>

            {/* Success Rate Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Success Rate</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                                {successRate.toFixed(1)}%
                            </h3>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${successRate >= 70
                        ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}>
                        {successRate >= 70 ? (
                            <><TrendingUp className="h-3 w-3" /> Good</>
                        ) : (
                            <><TrendingDown className="h-3 w-3" /> Review</>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span>{stats.overall.completed} completed calls</span>
                </div>
            </div>
        </div>
    );
}
