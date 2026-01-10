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

export function InvoicesAwaitingPayment({ invoices }: InvoicesAwaitingPaymentProps) {
  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate));
  };

  const totalAmountDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Invoices Awaiting Payment
            </CardTitle>
            <CardDescription>
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} • Total: $
              {totalAmountDue.toFixed(2)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 10).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                      {isOverdue(invoice.dueDate) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isOverdue(invoice.dueDate) ? "destructive" : "secondary"}
                    >
                      {isOverdue(invoice.dueDate) ? "Overdue" : "Upcoming"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${invoice.amountDue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {invoices.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing 10 of {invoices.length} invoices
          </p>
        )}
      </CardContent>
    </Card>
  );
}
