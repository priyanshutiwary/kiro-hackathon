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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ZohoBill {
  billId: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  referenceNumber: string;
  date: string;
  dueDate: string;
  status: "open" | "paid" | "void" | "overdue";
  total: number;
  balance: number;
  currencyCode: string;
  currencySymbol: string;
}

interface BillsTableProps {
  bills: ZohoBill[];
  onRefresh: () => void;
}

export function BillsTable({ bills }: BillsTableProps) {
  /**
   * Format currency with symbol and locale
   * Requirements: 4.3
   */
  const formatCurrency = (
    amount: number,
    currencyCode: string,
    currencySymbol: string
  ): string => {
    try {
      // Use Intl.NumberFormat for proper locale formatting
      const formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch (error) {
      // Fallback to manual formatting if currency code is invalid
      return `${currencySymbol}${amount.toFixed(2)}`;
    }
  };

  /**
   * Format date in readable format
   * Requirements: 4.4
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Get status badge variant and label
   * Requirements: 4.5
   */
  const getStatusBadge = (status: ZohoBill["status"]) => {
    const statusConfig = {
      paid: {
        variant: "default" as const,
        label: "Paid",
        className: "bg-green-500 hover:bg-green-600",
      },
      open: {
        variant: "secondary" as const,
        label: "Unpaid",
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
      },
      overdue: {
        variant: "destructive" as const,
        label: "Overdue",
        className: "bg-red-500 hover:bg-red-600",
      },
      void: {
        variant: "outline" as const,
        label: "Void",
        className: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    };

    const config = statusConfig[status] || statusConfig.open;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bills List</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Bill Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.billId}>
                  <TableCell className="font-medium">
                    {bill.vendorName}
                  </TableCell>
                  <TableCell>{bill.billNumber}</TableCell>
                  <TableCell>{formatDate(bill.date)}</TableCell>
                  <TableCell>{formatDate(bill.dueDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      bill.total,
                      bill.currencyCode,
                      bill.currencySymbol
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(bill.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {bills.map((bill) => (
            <Card key={bill.billId}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{bill.vendorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.billNumber}
                      </p>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p>{formatDate(bill.date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p>{formatDate(bill.dueDate)}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Amount
                      </span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(
                          bill.total,
                          bill.currencyCode,
                          bill.currencySymbol
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
