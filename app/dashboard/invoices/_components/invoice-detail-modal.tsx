"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

interface LineItem {
  line_item_id: string;
  item_id?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  unit?: string;
  discount?: number;
  discount_amount?: number;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  item_total: number;
}

interface Tax {
  tax_name: string;
  tax_amount: number;
}

interface DetailedInvoice extends ZohoInvoice {
  line_items?: LineItem[];
  taxes?: Tax[];
  sub_total?: number;
  discount?: number;
  discount_amount?: number;
  shipping_charge?: number;
  adjustment?: number;
  adjustment_description?: string;
  notes?: string;
  terms?: string;
  billing_address?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  shipping_address?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface InvoiceDetailModalProps {
  invoice: ZohoInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailModal({
  invoice,
  open,
  onOpenChange,
}: InvoiceDetailModalProps) {
  const [detailedInvoice, setDetailedInvoice] = useState<DetailedInvoice | null>(null);

  useEffect(() => {
    if (open && invoice) {
      // Initialize with invoice data from DB
      setDetailedInvoice(invoice as DetailedInvoice);
    } else if (!open) {
      setDetailedInvoice(null);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
      paid: {
        label: "Paid",
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600",
      },
      sent: { label: "Sent", variant: "secondary" as const, className: "" },
      draft: { label: "Draft", variant: "outline" as const, className: "" },
      overdue: {
        label: "Overdue",
        variant: "destructive" as const,
        className: "",
      },
      void: {
        label: "Void",
        variant: "outline" as const,
        className: "opacity-50",
      },
      partially_paid: {
        label: "Partially Paid",
        variant: "secondary" as const,
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoiceNumber}</span>
            {getStatusBadge(invoice.status)}
          </DialogTitle>
          <DialogDescription>
            Invoice details from database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <p className="font-medium">{invoice.customerId}</p>
                </div>
              </div>

              {/* Billing Address */}
              {detailedInvoice?.billing_address && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                  <p className="text-sm">
                    {detailedInvoice.billing_address.address && (
                      <>{detailedInvoice.billing_address.address}<br /></>
                    )}
                    {detailedInvoice.billing_address.city && detailedInvoice.billing_address.city}
                    {detailedInvoice.billing_address.state && `, ${detailedInvoice.billing_address.state}`}
                    {detailedInvoice.billing_address.zip && ` ${detailedInvoice.billing_address.zip}`}
                    {detailedInvoice.billing_address.country && (
                      <><br />{detailedInvoice.billing_address.country}</>
                    )}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                {invoice.referenceNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Reference Number
                    </p>
                    <p className="font-medium">{invoice.referenceNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">{formatDate(invoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            {detailedInvoice?.line_items && detailedInvoice.line_items.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Items Purchased</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Item</th>
                          <th className="text-right p-3 text-sm font-medium">Qty</th>
                          <th className="text-right p-3 text-sm font-medium">Rate</th>
                          {detailedInvoice.line_items?.some(item => item.discount_amount) && (
                            <th className="text-right p-3 text-sm font-medium">Discount</th>
                          )}
                          <th className="text-right p-3 text-sm font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedInvoice.line_items.map((item, index) => (
                          <tr key={item.line_item_id || index} className="border-t">
                            <td className="p-3">
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="text-right p-3">
                              {item.quantity} {item.unit && `${item.unit}`}
                            </td>
                            <td className="text-right p-3">
                              {formatCurrency(item.rate, invoice.currencySymbol)}
                            </td>
                            {detailedInvoice.line_items?.some(i => i.discount_amount) && (
                              <td className="text-right p-3">
                                {item.discount_amount 
                                  ? formatCurrency(item.discount_amount, invoice.currencySymbol)
                                  : '-'}
                              </td>
                            )}
                            <td className="text-right p-3 font-medium">
                              {formatCurrency(item.item_total, invoice.currencySymbol)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Financial Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Financial Summary
              </h3>
              <div className="space-y-2">
                {detailedInvoice?.sub_total !== undefined && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-medium">
                      {formatCurrency(detailedInvoice.sub_total, invoice.currencySymbol)}
                    </p>
                  </div>
                )}

                {detailedInvoice?.discount_amount !== undefined && detailedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Discount {detailedInvoice.discount && `(${detailedInvoice.discount}%)`}
                    </p>
                    <p className="font-medium text-green-600">
                      -{formatCurrency(detailedInvoice.discount_amount, invoice.currencySymbol)}
                    </p>
                  </div>
                )}

                {detailedInvoice?.taxes && detailedInvoice.taxes.length > 0 && (
                  <>
                    {detailedInvoice.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">{tax.tax_name}</p>
                        <p className="font-medium">
                          {formatCurrency(tax.tax_amount, invoice.currencySymbol)}
                        </p>
                      </div>
                    ))}
                  </>
                )}

                {detailedInvoice?.shipping_charge !== undefined && detailedInvoice.shipping_charge > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Shipping Charge</p>
                    <p className="font-medium">
                      {formatCurrency(detailedInvoice.shipping_charge, invoice.currencySymbol)}
                    </p>
                  </div>
                )}

                {detailedInvoice?.adjustment !== undefined && detailedInvoice.adjustment !== 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Adjustment {detailedInvoice.adjustment_description && `(${detailedInvoice.adjustment_description})`}
                    </p>
                    <p className={`font-medium ${detailedInvoice.adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {detailedInvoice.adjustment > 0 ? '+' : ''}
                      {formatCurrency(detailedInvoice.adjustment, invoice.currencySymbol)}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">Total Amount</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(invoice.total, invoice.currencySymbol)}
                  </p>
                </div>

                {invoice.balance < invoice.total && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(
                        invoice.total - invoice.balance,
                        invoice.currencySymbol
                      )}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">Balance Due</p>
                  <p
                    className={`font-bold text-lg ${
                      invoice.balance > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(invoice.balance, invoice.currencySymbol)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(detailedInvoice?.notes || detailedInvoice?.terms) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {detailedInvoice.notes && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {detailedInvoice.notes}
                      </p>
                    </div>
                  )}
                  {detailedInvoice.terms && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Terms & Conditions</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {detailedInvoice.terms}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
