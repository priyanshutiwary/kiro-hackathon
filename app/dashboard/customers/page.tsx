"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Loader2, RefreshCw } from "lucide-react";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { CustomerDetailModal } from "./_components/customer-detail-modal";
import { CustomersTable, Contact } from "./_components/customers-table";

// Types are imported from the table component

interface ContactsResponse {
  success: boolean;
  data: {
    code: number;
    message: string;
    contacts: Contact[];
    page_context?: {
      page: number;
      per_page: number;
      has_more_page: boolean;
      total: number;
    };
  };
  meta: {
    page: number;
    perPage: number;
    organizationId: string;
  };
}

export default function CustomersPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContacts = async (pageNum: number = 1, shouldLoad = true) => {
    if (shouldLoad) setLoading(true);
    setError(null);

    try {
      // Fetch from local database cache
      const response = await fetch(`/api/db/customers?page=${pageNum}&per_page=200`);
      const result: ContactsResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.data?.message || "Failed to fetch contacts");
      }

      if (result.success && result.data.contacts) {
        if (pageNum === 1) {
          setContacts(result.data.contacts);
        } else {
          setContacts((prev) => [...prev, ...result.data.contacts]);
        }
        setHasMore(result.data.page_context?.has_more_page || false);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
      console.error("Error fetching contacts:", err);
    } finally {
      if (shouldLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContacts(1, false);
    setRefreshing(false);
  };

  // Helper functions moved to table component

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  return (
    <div className={DashboardTheme.layout.container}>


      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <section className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
          <div>
            <h2 className={DashboardTheme.typography.sectionTitle}>All Customers</h2>
            <p className={DashboardTheme.typography.subtext}>
              {contacts.length} customers loaded {hasMore && " (more available)"}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {loading && contacts.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length > 0 ? (
          <CustomersTable
            contacts={contacts}
            onContactClick={handleContactClick}
          />
        ) : (
          <Card className={DashboardTheme.card.dashed}>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-muted-foreground mb-2">
                No customers found in database cache
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Customers will appear here after syncing from Zoho Books
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

      {
        hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={() => fetchContacts(page + 1)}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load More
            </Button>
          </div>
        )
      }

      <CustomerDetailModal
        contact={selectedContact}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div >
  );
}
