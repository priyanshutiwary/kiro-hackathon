import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  amountDue: number;
  dueDate: string;
  status: string;
  remindersCreated: boolean;
}

interface InvoicesAwaitingPaymentProps {
  invoices: Invoice[];
}

import { DashboardTheme } from "@/lib/dashboard-theme";

// ... (existing imports)

export function InvoicesAwaitingPayment({ invoices }: InvoicesAwaitingPaymentProps) {
  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate));
  };

  const totalAmountDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <div className="grid gap-6">
      <div className={DashboardTheme.layout.gridcols3}>
        <Card className={`${DashboardTheme.layout.colSpan1} ${DashboardTheme.card.gradient}`}>
          <CardHeader className={DashboardTheme.card.header}>
            <CardTitle className={DashboardTheme.card.titleWithIcon}>
              <DollarSign className="h-4 w-4" />
              Total Awaiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={DashboardTheme.card.metricValue}>
              ${totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={DashboardTheme.card.metricLabel}>
              Across {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </p>
          </CardContent>
        </Card>

        <Card className={`${DashboardTheme.layout.colSpan2} border-border/60`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Recent Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent className={DashboardTheme.card.contentCompact}>
            <Table>
              <TableHeader>
                <TableRow className={DashboardTheme.table.headerRow}>
                  <TableHead className={`pl-6 ${DashboardTheme.table.headerCell}`}>Invoice</TableHead>
                  <TableHead className={DashboardTheme.table.headerCell}>Customer</TableHead>
                  <TableHead className={DashboardTheme.table.headerCell}>Due Date</TableHead>
                  <TableHead className={DashboardTheme.table.headerCell}>Status</TableHead>
                  <TableHead className={`pr-6 text-right ${DashboardTheme.table.headerCell}`}>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id} className={DashboardTheme.table.row}>
                    <TableCell className={`pl-6 ${DashboardTheme.table.cell}`}>
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className={DashboardTheme.table.cellMuted}>{invoice.customerName}</TableCell>
                    <TableCell className={DashboardTheme.table.cellMuted}>
                      {format(new Date(invoice.dueDate), "MMM dd")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={isOverdue(invoice.dueDate)
                          ? DashboardTheme.badge.overdue
                          : DashboardTheme.badge.upcoming
                        }
                      >
                        {isOverdue(invoice.dueDate) ? "Overdue" : "Upcoming"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`pr-6 text-right ${DashboardTheme.table.cell}`}>
                      ${invoice.amountDue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoices.length > 5 && (
              <div className="p-3 border-t border-white/5 text-center">
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  View all {invoices.length} invoices
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
