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
import { Phone, Mail, Building2, User } from "lucide-react";

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

interface DetailedContact extends Contact {
  billing_address?: {
    address?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    fax?: string;
  };
  shipping_address?: {
    address?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    fax?: string;
  };
  website?: string;
  notes?: string;
  currency_code?: string;
  payment_terms?: number;
  payment_terms_label?: string;
  credit_limit?: number;
  outstanding_receivable_amount?: number;
  unused_credits_receivable_amount?: number;
}

interface CustomerDetailModalProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailModal({
  contact,
  open,
  onOpenChange,
}: CustomerDetailModalProps) {
  const [detailedContact, setDetailedContact] = useState<DetailedContact | null>(null);

  useEffect(() => {
    if (open && contact) {
      // Initialize with contact data from DB
      setDetailedContact(contact as DetailedContact);
    } else if (!open) {
      setDetailedContact(null);
    }
  }, [open, contact]);

  if (!contact) return null;

  const formatAddress = (address: any) => {
    if (!address) return null;
    
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.street2) parts.push(address.street2);
    
    const cityStateZip = [];
    if (address.city) cityStateZip.push(address.city);
    if (address.state) cityStateZip.push(address.state);
    if (address.zip) cityStateZip.push(address.zip);
    if (cityStateZip.length > 0) parts.push(cityStateZip.join(", "));
    
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join("\n") : null;
  };

  const getPrimaryPhone = (contact: Contact): string | null => {
    if (contact.mobile) return contact.mobile;
    if (contact.phone) return contact.phone;
    const primaryPerson = contact.contact_persons?.find((p) => p.is_primary_contact);
    if (primaryPerson?.mobile) return primaryPerson.mobile;
    if (primaryPerson?.phone) return primaryPerson.phone;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{contact.contact_name}</span>
            <Badge variant={contact.status === "active" ? "default" : "secondary"}>
              {contact.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Customer details from database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{contact.contact_name}</p>
                </div>
                {contact.company_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{contact.company_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Customer Type</p>
                  <p className="font-medium capitalize">{contact.contact_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sub Type</p>
                  <p className="font-medium capitalize">{contact.customer_sub_type}</p>
                </div>
              </div>

              {detailedContact?.website && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a 
                    href={detailedContact.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {detailedContact.website}
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="space-y-3">
                {getPrimaryPhone(contact) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getPrimaryPhone(contact)}</span>
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  </div>
                )}
                {getPrimaryEmail(contact) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{getPrimaryEmail(contact)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Persons */}
            {contact.contact_persons && contact.contact_persons.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Persons ({contact.contact_persons.length})
                  </h3>
                  <div className="space-y-3">
                    {contact.contact_persons.map((person) => (
                      <div
                        key={person.contact_person_id}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {person.email}
                          </div>
                        )}
                        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                          {person.mobile && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Mobile: {person.mobile}
                            </div>
                          )}
                          {person.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Phone: {person.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div>Contact ID: {contact.contact_id}</div>
              <div>Last Modified: {new Date(contact.last_modified_time).toLocaleString()}</div>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
