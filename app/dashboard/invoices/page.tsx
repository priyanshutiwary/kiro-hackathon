"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
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

interface IntegrationStatus {
  connected: boolean;
  status?: string;
  organizationId?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ZohoInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    hasMorePage: false,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check integration status
  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  // Fetch invoices when integration is connected
  useEffect(() => {
    if (integrationStatus?.connected) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [integrationStatus]);

  const checkIntegrationStatus = async () => {
    try {
      const response = await fetch("/api/zoho/status");
      const data = await response.json();
      setIntegrationStatus(data);
    } catch (error) {
      console.error("Error checking integration status:", error);
      setError("Failed to check integration status");
    }
  };

  const fetchInvoices = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      setRefreshing(page > 1);
      setError(null);

      const response = await fetch(
        `/api/zoho/invoices?page=${page}&per_page=${pagination.perPage}`
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
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchInvoices(1);
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

  // Show connection prompt if not connected
  if (!integrationStatus?.connected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Zoho Books Integration Required</CardTitle>
            <CardDescription>
              Connect your Zoho Books account to view your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                You need to connect your Zoho Books account before you can view
                invoices. Go to the integrations page to connect.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild>
                <a href="/dashboard/integrations">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Go to Integrations
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            View and manage your customer invoices from Zoho Books
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {integrationStatus.errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Integration Error</AlertTitle>
          <AlertDescription>
            {integrationStatus.errorMessage}
            <Button
              asChild
              variant="link"
              className="ml-2 p-0 h-auto"
            >
              <a href="/dashboard/integrations">Reconnect</a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Invoices</CardTitle>
          <CardDescription>
            {invoices.length > 0
              ? `Showing ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`
              : "No invoices found"}
            {integrationStatus.lastSyncAt && (
              <span className="ml-2">
                • Last synced:{" "}
                {new Date(integrationStatus.lastSyncAt).toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No invoices found in your Zoho Books account
              </p>
              <p className="text-sm text-muted-foreground">
                Invoices you create in Zoho Books will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
