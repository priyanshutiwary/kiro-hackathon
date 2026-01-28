import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Reminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
  channel: string;
  externalId: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  callOutcome: {
    connected: boolean;
    duration: number;
    customerResponse: string;
    notes?: string;
  } | null;
  skipReason: string | null;
  invoice: {
    invoiceNumber: string;
    customerName: string;
    amountDue: number;
    dueDate: string;
  };
}

interface RemindersTableProps {
  reminders: Reminder[];
}

import { DashboardTheme } from "@/lib/dashboard-theme";

// ... existing imports

export function RemindersTable({ reminders }: RemindersTableProps) {
  const getChannelBadge = (channel: string) => {
    if (channel === "sms") {
      return (
        <Badge variant="outline" className="gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          <MessageSquare className="h-3 w-3" />
          SMS
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
        <Phone className="h-3 w-3" />
        Voice
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; className: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      pending: { variant: "secondary", className: DashboardTheme.badge.pending, icon: Clock, label: "Pending" },
      queued: { variant: "default", className: DashboardTheme.badge.queued, icon: Clock, label: "Queued" },
      in_progress: { variant: "default", className: DashboardTheme.badge.in_progress, icon: Phone, label: "In Progress" },
      completed: { variant: "default", className: DashboardTheme.badge.completed, icon: CheckCircle, label: "Completed" },
      skipped: { variant: "outline", className: DashboardTheme.badge.skipped, icon: AlertCircle, label: "Skipped" },
      failed: { variant: "destructive", className: DashboardTheme.badge.failed, icon: XCircle, label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${DashboardTheme.badge.base} ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // ... (getReminderTypeLabel, formatDuration, getCustomerResponseLabel methods - kept as is)
  const getReminderTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      "30_days_before": "30 Days Before",
      "15_days_before": "15 Days Before",
      "7_days_before": "7 Days Before",
      "5_days_before": "5 Days Before",
      "3_days_before": "3 Days Before",
      "1_day_before": "1 Day Before",
      "on_due_date": "On Due Date",
      "1_day_overdue": "1 Day Overdue",
      "3_days_overdue": "3 Days Overdue",
      "7_days_overdue": "7 Days Overdue",
    };

    return typeMap[type] || type;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getCustomerResponseLabel = (response: string) => {
    const responseMap: Record<string, string> = {
      will_pay_today: "Will Pay Today",
      already_paid: "Already Paid",
      dispute: "Dispute",
      no_answer: "No Answer",
      other: "Other",
    };

    return responseMap[response] || response;
  };

  return (
    <div className={DashboardTheme.table.wrapper}>
      <Table>
        <TableHeader>
          <TableRow className={DashboardTheme.table.headerRow}>
            <TableHead className={`pl-6 ${DashboardTheme.table.headerCell}`}>Invoice</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Customer</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Type</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Channel</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Scheduled</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Status</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Attempts</TableHead>
            <TableHead className={`text-right ${DashboardTheme.table.headerCell}`}>Amount</TableHead>
            <TableHead className={`text-right pr-6 ${DashboardTheme.table.headerCell}`}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map((reminder) => (
            <TableRow key={reminder.id} className={DashboardTheme.table.row}>
              <TableCell className={`pl-6 ${DashboardTheme.table.cell}`}>
                {reminder.invoice.invoiceNumber}
              </TableCell>
              <TableCell className={DashboardTheme.table.cellMuted}>{reminder.invoice.customerName}</TableCell>
              <TableCell className={DashboardTheme.table.cellMuted}>
                <span className={DashboardTheme.badge.pill}>
                  {getReminderTypeLabel(reminder.reminderType)}
                </span>
              </TableCell>
              <TableCell>{getChannelBadge(reminder.channel)}</TableCell>
              <TableCell className={DashboardTheme.table.cellMuted}>
                {format(new Date(reminder.scheduledDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{getStatusBadge(reminder.status)}</TableCell>
              <TableCell>
                <span className={`${DashboardTheme.table.cellMuted} ml-2`}>{reminder.attemptCount}</span>
              </TableCell>
              <TableCell className={`text-right ${DashboardTheme.table.cell}`}>
                ${reminder.invoice.amountDue.toFixed(2)}
              </TableCell>
              <TableCell className="text-right pr-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card border-border/60">
                    <DialogHeader>
                      <DialogTitle>Reminder Details</DialogTitle>
                      <DialogDescription>
                        Detailed information about this reminder call
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Invoice
                          </p>
                          <p className="text-base font-medium">{reminder.invoice.invoiceNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Customer
                          </p>
                          <p className="text-base font-medium">{reminder.invoice.customerName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Amount Due
                          </p>
                          <p className="text-base font-mono">
                            ${reminder.invoice.amountDue.toFixed(2)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Due Date
                          </p>
                          <p className="text-base">
                            {format(new Date(reminder.invoice.dueDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Context
                          </p>
                          <p className="text-sm font-medium">
                            {getReminderTypeLabel(reminder.reminderType)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Channel
                          </p>
                          <div>{getChannelBadge(reminder.channel)}</div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Status
                          </p>
                          <div>{getStatusBadge(reminder.status)}</div>
                        </div>
                        {reminder.externalId && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              External ID
                            </p>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {reminder.externalId}
                            </p>
                          </div>
                        )}
                      </div>

                      {(reminder.skipReason || reminder.callOutcome) && <div className="border-t border-border/50 my-4"></div>}

                      {reminder.skipReason && (
                        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                          <p className="text-sm font-medium text-destructive mb-1">
                            Skipped
                          </p>
                          <p className="text-sm text-destructive/80">{reminder.skipReason}</p>
                        </div>
                      )}

                      {reminder.callOutcome && (
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Call Outcome
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Connected</p>
                              <Badge variant={reminder.callOutcome.connected ? "default" : "secondary"}>
                                {reminder.callOutcome.connected ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Duration</p>
                              <p className="text-sm font-mono">
                                {formatDuration(reminder.callOutcome.duration)}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground mb-1">Response</p>
                              <p className="text-sm font-medium">
                                {getCustomerResponseLabel(
                                  reminder.callOutcome.customerResponse
                                )}
                              </p>
                            </div>
                          </div>
                          {reminder.callOutcome.notes && (
                            <div className="mt-4 pt-4 border-t border-border/40">
                              <p className="text-xs text-muted-foreground mb-1">
                                Notes
                              </p>
                              <p className="text-sm italic text-muted-foreground/80">&quot;{reminder.callOutcome.notes}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
