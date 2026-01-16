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
import { DashboardTheme } from "@/lib/dashboard-theme";
import { Phone, Mail, User } from "lucide-react";

interface ContactPerson {
    contact_person_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    mobile?: string;
    is_primary_contact: boolean;
}

export interface Contact {
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

interface CustomersTableProps {
    contacts: Contact[];
    onContactClick: (contact: Contact) => void;
}

export function CustomersTable({ contacts, onContactClick }: CustomersTableProps) {
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
        <div className={DashboardTheme.table.wrapper}>
            <Table>
                <TableHeader>
                    <TableRow className={DashboardTheme.table.headerRow}>
                        <TableHead className={DashboardTheme.table.headerCell}>Customer Name</TableHead>
                        <TableHead className={DashboardTheme.table.headerCell}>Company</TableHead>
                        <TableHead className={DashboardTheme.table.headerCell}>Email</TableHead>
                        <TableHead className={DashboardTheme.table.headerCell}>Phone</TableHead>
                        <TableHead className={DashboardTheme.table.headerCell}>Type</TableHead>
                        <TableHead className={DashboardTheme.table.headerCell}>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.map((contact) => {
                        const primaryPhone = getPrimaryPhone(contact);
                        const primaryEmail = getPrimaryEmail(contact);

                        return (
                            <TableRow
                                key={contact.contact_id}
                                className={DashboardTheme.table.row + " cursor-pointer"}
                                onClick={() => onContactClick(contact)}
                            >
                                <TableCell className={DashboardTheme.table.cell + " font-medium"}>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground/50" />
                                        {contact.contact_name}
                                    </div>
                                </TableCell>
                                <TableCell className={DashboardTheme.table.cell}>
                                    {contact.company_name || "-"}
                                </TableCell>
                                <TableCell className={DashboardTheme.table.cell}>
                                    {primaryEmail ? (
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                                            {primaryEmail}
                                        </div>
                                    ) : "-"}
                                </TableCell>
                                <TableCell className={DashboardTheme.table.cell}>
                                    {primaryPhone ? (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
                                            {primaryPhone}
                                        </div>
                                    ) : "-"}
                                </TableCell>
                                <TableCell className={DashboardTheme.table.cell}>
                                    <Badge variant="outline" className="font-normal text-xs">
                                        {contact.contact_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className={DashboardTheme.table.cell}>
                                    <Badge
                                        className={contact.status === "active" ? DashboardTheme.badge.completed : DashboardTheme.badge.pending}
                                        variant="outline"
                                    >
                                        {contact.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
