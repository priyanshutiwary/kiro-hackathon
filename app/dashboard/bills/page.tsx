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
import { BillsTable } from "./_components/bills-table";

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

interface BillsResponse {
  bills: ZohoBill[];
  pageContext: {
    page: number;
    perPage: number;
    hasMorePage: boolean;
  };
}

export default function BillsPage() {
  const [bills, setBills] = useState<ZohoBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  useEffect(() => {
    checkConnectionAndFetchBills();
  }, []);

  const checkConnectionAndFetchBills = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Zoho integration is connected
      const statusResponse = await fetch("/api/zoho/status");
      if (!statusResponse.ok) {
        throw new Error("Failed to check integration status");
      }

      const statusData = await statusResponse.json();
      setIsConnected(statusData.connected);

      if (!statusData.connected) {
        setIsLoading(false);
        return;
      }

      // Fetch bills
      await fetchBills(1);
    } catch (err) {
      console.error("Error checking connection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load bills"
      );
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBills = async (page: number = 1, append: boolean = false) => {
    try {
      const response = await fetch(`/api/zoho/bills?page=${page}&per_page=50`);

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (errorData.action === "connect" || errorData.action === "reconnect") {
          setIsConnected(false);
          throw new Error(errorData.message || "Please connect your Zoho Books account");
        }

        throw new Error(errorData.message || "Failed to fetch bills");
      }

      const data: BillsResponse = await response.json();

      if (append) {
        setBills((prev) => [...prev, ...data.bills]);
      } else {
        setBills(data.bills);
      }

      setCurrentPage(data.pageContext.page);
      setHasMorePages(data.pageContext.hasMorePage);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch bills";
      setError(errorMessage);
      throw err;
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await fetchBills(1);
      toast.success("Bills refreshed successfully");
    } catch (err) {
      console.error("Error refreshing bills:", err);
      toast.error("Failed to refresh bills");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      await fetchBills(currentPage + 1, true);
    } catch (err) {
      console.error("Error loading more bills:", err);
      toast.error("Failed to load more bills");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/dashboard/integrations";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>

          <p className="text-muted-foreground mt-2">
            View and manage your business bills from Zoho Books
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading bills...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected state
  if (isConnected === false) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>

          <p className="text-muted-foreground mt-2">
            View and manage your business bills from Zoho Books
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Zoho Books Not Connected</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              Connect your Zoho Books account to view and manage your business bills.
            </p>
            <Button onClick={handleConnect}>
              Connect Zoho Books
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (error && bills.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>

          <p className="text-muted-foreground mt-2">
            View and manage your business bills from Zoho Books
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Bills</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={handleConnect}>
                Go to Integrations
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (bills.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>

            <p className="text-muted-foreground mt-2">
              View and manage your business bills from Zoho Books
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Bills Found</CardTitle>
            <CardDescription>
              You don't have any bills in your Zoho Books account yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bills will appear here once they are created in Zoho Books.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bills list state
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>

          <p className="text-muted-foreground mt-2">
            View and manage your business bills from Zoho Books
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <BillsTable bills={bills} onRefresh={handleRefresh} />

      {hasMorePages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Showing {bills.length} bill{bills.length !== 1 ? "s" : ""}
        {hasMorePages && " • More available"}
      </div>
    </div>
  );
}
