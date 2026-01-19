"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { InvoicesTable } from "./_components/invoices-table";
import { InvoiceDetailModal } from "./_components/invoice-detail-modal";

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

interface InvoicesResponse {
  success: boolean;
  data: ZohoInvoice[];
  pagination: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ZohoInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    hasMorePage: false,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInvoices = async (page: number = 1, shouldLoad = true) => {
    try {
      if (shouldLoad) setLoading(page === 1);
      if (page > 1) setRefreshing(true);
      setError(null);

      // Fetch from local database cache
      const response = await fetch(
        `/api/db/invoices?page=${page}&per_page=${pagination.perPage}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to fetch invoices");
      }

      const data: InvoicesResponse = await response.json();

      if (page === 1) {
        setInvoices(data.data);
      } else {
        setInvoices((prev) => [...prev, ...data.data]);
      }

      setPagination({
        page: data.pagination.page,
        perPage: data.pagination.perPage,
        hasMorePage: data.pagination.hasMorePage,
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch invoices";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (shouldLoad) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvoices(1, false);
  };

  const handleLoadMore = () => {
    fetchInvoices(pagination.page + 1);
  };

  const handleInvoiceClick = (invoice: ZohoInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={DashboardTheme.layout.container}>
      <div className="flex justify-between items-center mb-0">
        <div className="flex-1">
          {/* Header removed */}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="icon"
          className="h-9 w-9"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
          <div>
            <h2 className={DashboardTheme.typography.sectionTitle}>All Invoices</h2>
            <p className={DashboardTheme.typography.subtext}>
              {invoices.length > 0
                ? `Showing ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} from database cache`
                : "No invoices found in database"}
            </p>
          </div>
        </div>
        {invoices.length > 0 ? (
          <>
            <InvoicesTable
              invoices={invoices}
              onInvoiceClick={handleInvoiceClick}
            />
            {pagination.hasMorePage && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={refreshing}
                  variant="outline"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className={DashboardTheme.card.dashed}>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-muted-foreground mb-2">
                No invoices found in database cache
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Invoices will appear here after syncing from Zoho Books
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                If you haven&apos;t set up any integrations yet, check your{" "}
                <a href="/dashboard/settings?tab=integrations" className="text-primary underline hover:no-underline">
                  integration settings
                </a>{" "}
                to connect your accounting software.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
