"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Phone, Mail, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CustomerDetailModal } from "./_components/customer-detail-modal";

interface ContactPerson {
  contact_person_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  is_primary_contact: boolean;
}

interface Contact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  contact_type: string;
  customer_sub_type: string;
  status: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contact_persons: ContactPerson[];
  last_modified_time: string;
}

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContacts = async (pageNum: number = 1) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, []);

  const getPrimaryPhone = (contact: Contact): string | null => {
    // Check contact-level phone
    if (contact.mobile) return contact.mobile;
    if (contact.phone) return contact.phone;

    // Check contact persons
    const primaryPerson = contact.contact_persons?.find((p) => p.is_primary_contact);
    if (primaryPerson?.mobile) return primaryPerson.mobile;
    if (primaryPerson?.phone) return primaryPerson.phone;

    // Fallback to first contact person
    const firstPerson = contact.contact_persons?.[0];
    if (firstPerson?.mobile) return firstPerson.mobile;
    if (firstPerson?.phone) return firstPerson.phone;

    return null;
  };

  const getPrimaryEmail = (contact: Contact): string | null => {
    if (contact.email) return contact.email;
    const primaryPerson = contact.contact_persons?.find((p) => p.is_primary_contact);
    if (primaryPerson?.email) return primaryPerson.email;
    const firstPerson = contact.contact_persons?.[0];
    return firstPerson?.email || null;
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            View customer data from local database cache
          </p>
        </div>
        <Button
          onClick={() => fetchContacts(1)}
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {contacts.length} customers loaded
              {hasMore && " (more available)"}
            </CardDescription>
          </CardHeader>
        </Card>

        {contacts.map((contact) => {
          const primaryPhone = getPrimaryPhone(contact);
          const primaryEmail = getPrimaryEmail(contact);

          return (
            <Card 
              key={contact.contact_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleContactClick(contact)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {contact.contact_name}
                    </CardTitle>
                    {contact.company_name && (
                      <CardDescription className="text-base">
                        {contact.company_name}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                      {contact.status}
                    </Badge>
                    <Badge variant="outline">{contact.contact_type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Contact Info */}
                <div className="grid gap-2">
                  {primaryPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{primaryPhone}</span>
                      <Badge variant="secondary" className="text-xs">
                        Primary Phone
                      </Badge>
                    </div>
                  )}
                  {!primaryPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>No phone number</span>
                    </div>
                  )}
                  {primaryEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{primaryEmail}</span>
                    </div>
                  )}
                </div>

                {/* Contact Persons */}
                {contact.contact_persons && contact.contact_persons.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Persons ({contact.contact_persons.length})
                    </h4>
                    <div className="space-y-2 pl-6">
                      {contact.contact_persons.map((person) => (
                        <div
                          key={person.contact_person_id}
                          className="text-sm border-l-2 pl-3 py-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {person.first_name} {person.last_name}
                            </span>
                            {person.is_primary_contact && (
                              <Badge variant="default" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          {person.email && (
                            <div className="text-muted-foreground">{person.email}</div>
                          )}
                          <div className="flex gap-3 text-muted-foreground">
                            {person.mobile && <span>Mobile: {person.mobile}</span>}
                            {person.phone && <span>Phone: {person.phone}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <div>Contact ID: {contact.contact_id}</div>
                  <div>Last Modified: {new Date(contact.last_modified_time).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
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
      )}

      {loading && contacts.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <CustomerDetailModal
        contact={selectedContact}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
