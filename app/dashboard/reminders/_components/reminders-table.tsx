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
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";

interface Reminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
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

export function RemindersTable({ reminders }: RemindersTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      queued: { variant: "default", icon: Clock, label: "Queued" },
      in_progress: { variant: "default", icon: Phone, label: "In Progress" },
      completed: { variant: "default", icon: CheckCircle, label: "Completed" },
      skipped: { variant: "outline", icon: AlertCircle, label: "Skipped" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell className="font-medium">
                {reminder.invoice.invoiceNumber}
              </TableCell>
              <TableCell>{reminder.invoice.customerName}</TableCell>
              <TableCell className="text-sm">
                {getReminderTypeLabel(reminder.reminderType)}
              </TableCell>
              <TableCell>
                {format(new Date(reminder.scheduledDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{getStatusBadge(reminder.status)}</TableCell>
              <TableCell>{reminder.attemptCount}</TableCell>
              <TableCell className="text-right">
                ${reminder.invoice.amountDue.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Reminder Details</DialogTitle>
                      <DialogDescription>
                        Detailed information about this reminder call
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Invoice Number
                          </p>
                          <p className="text-sm">{reminder.invoice.invoiceNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Customer
                          </p>
                          <p className="text-sm">{reminder.invoice.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Amount Due
                          </p>
                          <p className="text-sm">
                            ${reminder.invoice.amountDue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Due Date
                          </p>
                          <p className="text-sm">
                            {format(new Date(reminder.invoice.dueDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Reminder Type
                          </p>
                          <p className="text-sm">
                            {getReminderTypeLabel(reminder.reminderType)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Scheduled Date
                          </p>
                          <p className="text-sm">
                            {format(new Date(reminder.scheduledDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <div className="mt-1">{getStatusBadge(reminder.status)}</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Attempts
                          </p>
                          <p className="text-sm">{reminder.attemptCount}</p>
                        </div>
                      </div>

                      {reminder.skipReason && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Skip Reason
                          </p>
                          <p className="text-sm">{reminder.skipReason}</p>
                        </div>
                      )}

                      {reminder.callOutcome && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">Call Outcome</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Connected
                              </p>
                              <p className="text-sm">
                                {reminder.callOutcome.connected ? "Yes" : "No"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Duration
                              </p>
                              <p className="text-sm">
                                {formatDuration(reminder.callOutcome.duration)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Customer Response
                              </p>
                              <p className="text-sm">
                                {getCustomerResponseLabel(
                                  reminder.callOutcome.customerResponse
                                )}
                              </p>
                            </div>
                            {reminder.lastAttemptAt && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Last Attempt
                                </p>
                                <p className="text-sm">
                                  {format(
                                    new Date(reminder.lastAttemptAt),
                                    "MMM dd, yyyy HH:mm"
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          {reminder.callOutcome.notes && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground">
                                Notes
                              </p>
                              <p className="text-sm">{reminder.callOutcome.notes}</p>
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
