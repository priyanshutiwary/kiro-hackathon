"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Phone, MessageSquare } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

interface ScheduledReminder {
  id: number;
  invoiceId: number;
  reminderType: string;
  scheduledDate: string;
  status: string;
  channel: string;
  externalId: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  skipReason: string | null;
  invoice: {
    invoiceNumber: string;
    customerName: string;
    amountDue: number;
    dueDate: string;
  };
}

interface ScheduledRemindersTableProps {
  reminders: ScheduledReminder[];
}

export function ScheduledRemindersTable({ reminders }: ScheduledRemindersTableProps) {
  const [sortBy, setSortBy] = useState<"scheduledDate" | "amountDue" | "customerName">("scheduledDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else if (isThisWeek(date)) {
      return format(date, "EEEE, h:mm a");
    } else {
      return format(date, "MMM d, yyyy h:mm a");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className={DashboardTheme.badge.pending} variant="outline">Pending</Badge>;
      case "queued":
        return <Badge className={DashboardTheme.badge.queued} variant="outline">Queued</Badge>;
      case "in_progress":
        return <Badge className={DashboardTheme.badge.in_progress} variant="outline">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReminderTypeBadge = (type: string) => {
    switch (type) {
      case "initial":
        return <Badge className={DashboardTheme.badge.upcoming} variant="outline">Initial</Badge>;
      case "follow_up":
        return <Badge className={DashboardTheme.badge.pending} variant="outline">Follow-up</Badge>;
      case "final":
        return <Badge className={DashboardTheme.badge.failed} variant="outline">Final</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "scheduledDate":
        aValue = new Date(a.scheduledDate).getTime();
        bValue = new Date(b.scheduledDate).getTime();
        break;
      case "amountDue":
        aValue = a.invoice.amountDue;
        bValue = b.invoice.amountDue;
        break;
      case "customerName":
        aValue = a.invoice.customerName.toLowerCase();
        bValue = b.invoice.customerName.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column: "scheduledDate" | "amountDue" | "customerName") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className={DashboardTheme.table.wrapper}>
      <Table>
        <TableHeader>
          <TableRow className={DashboardTheme.table.headerRow}>
            <TableHead
              className={`${DashboardTheme.table.headerCell} cursor-pointer hover:bg-muted/50`}
              onClick={() => handleSort("scheduledDate")}
            >
              <div className="flex items-center gap-2">
                Scheduled Time
                {sortBy === "scheduledDate" && (
                  <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead
              className={`${DashboardTheme.table.headerCell} cursor-pointer hover:bg-muted/50`}
              onClick={() => handleSort("customerName")}
            >
              <div className="flex items-center gap-2">
                Customer
                {sortBy === "customerName" && (
                  <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>
              <div className="flex items-center gap-2">
                Invoice
              </div>
            </TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Channel</TableHead>
            <TableHead
              className={`${DashboardTheme.table.headerCell} cursor-pointer hover:bg-muted/50`}
              onClick={() => handleSort("amountDue")}
            >
              <div className="flex items-center gap-2">
                Amount Due
                {sortBy === "amountDue" && (
                  <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Type</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReminders.map((reminder) => (
            <TableRow key={reminder.id} className={DashboardTheme.table.row}>
              <TableCell className={DashboardTheme.table.cell}>
                <div className="font-medium">
                  {formatScheduledDate(reminder.scheduledDate)}
                </div>
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                <div className="font-medium">{reminder.invoice.customerName}</div>
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                <div className="font-medium">{reminder.invoice.invoiceNumber}</div>
                <div className={DashboardTheme.table.cellMuted}>
                  Due: {format(new Date(reminder.invoice.dueDate), "MMM d, yyyy")}
                </div>
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                {getChannelBadge(reminder.channel)}
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                <div className="font-medium">
                  ${reminder.invoice.amountDue.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                {getReminderTypeBadge(reminder.reminderType)}
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>
                {getStatusBadge(reminder.status)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Cancel Reminder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}