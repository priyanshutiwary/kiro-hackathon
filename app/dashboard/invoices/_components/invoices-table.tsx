"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardTheme } from "@/lib/dashboard-theme";

interface ZohoInvoice {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: "sent" | "draft" | "paid" | "void" | "overdue" | "partially_paid";
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}

interface InvoicesTableProps {
  invoices: ZohoInvoice[];
  onInvoiceClick: (invoice: ZohoInvoice) => void;
}

export function InvoicesTable({ invoices, onInvoiceClick }: InvoicesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: ZohoInvoice["status"]) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
      sent: { label: "Sent", variant: "secondary" as const, className: "" },
      draft: { label: "Draft", variant: "outline" as const, className: "" },
      overdue: { label: "Overdue", variant: "destructive" as const, className: "" },
      void: { label: "Void", variant: "outline" as const, className: "opacity-50" },
      partially_paid: { label: "Partially Paid", variant: "secondary" as const, className: "bg-yellow-500 hover:bg-yellow-600" },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.className + " " + (status === 'paid' ? DashboardTheme.badge.completed : status === 'overdue' ? DashboardTheme.badge.overdue : '')}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className={DashboardTheme.table.wrapper}>
      <Table>
        <TableHeader>
          <TableRow className={DashboardTheme.table.headerRow}>
            <TableHead className={DashboardTheme.table.headerCell}>Customer</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Invoice #</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Date</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Due Date</TableHead>
            <TableHead className={DashboardTheme.table.headerCell + " text-right"}>Amount</TableHead>
            <TableHead className={DashboardTheme.table.headerCell + " text-right"}>Balance</TableHead>
            <TableHead className={DashboardTheme.table.headerCell}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.invoiceId}
              className={DashboardTheme.table.row + " cursor-pointer"}
              onClick={() => onInvoiceClick(invoice)}
            >
              <TableCell className={DashboardTheme.table.cell + " font-medium"}>
                {invoice.customerName}
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>{invoice.invoiceNumber}</TableCell>
              <TableCell className={DashboardTheme.table.cell}>{formatDate(invoice.date)}</TableCell>
              <TableCell className={DashboardTheme.table.cell}>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell className={DashboardTheme.table.cell + " text-right"}>
                {formatCurrency(invoice.total, invoice.currencySymbol)}
              </TableCell>
              <TableCell className={DashboardTheme.table.cell + " text-right"}>
                {formatCurrency(invoice.balance, invoice.currencySymbol)}
              </TableCell>
              <TableCell className={DashboardTheme.table.cell}>{getStatusBadge(invoice.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
