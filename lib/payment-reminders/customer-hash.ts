/**
 * Customer Hash Calculation and Change Detection
 * Implements hash-based change detection for customer synchronization
 */

import crypto from 'crypto';
import { ZohoContact, ZohoContactPerson } from './zoho-contacts-client';

/**
 * Customer changes detected during sync
 */
export interface CustomerChanges {
  nameChanged: boolean;
  phoneChanged: boolean;
  emailChanged: boolean;
  contactPersonsChanged: boolean;
}

/**
 * Cached customer data for comparison
 */
export interface CachedCustomer {
  customerName: string;
  companyName: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  contactPersons: string; // JSON string
  syncHash: string;
}

/**
 * Calculate SHA-256 hash of relevant customer fields
 * 
 * The hash includes:
 * - contact_id: Unique identifier
 * - contact_name: Customer name
 * - primary phone: Primary contact phone number
 * - primary email: Primary contact email
 * - last_modified_time: Zoho's last modification timestamp
 * 
 * @param customer - Zoho contact data
 * @param primaryPhone - Extracted primary phone number
 * @param primaryEmail - Extracted primary email
 * @returns SHA-256 hash as hex string
 * 
 * Requirements: TR-2, FR-2
 */
export function calculateCustomerHash(
  customer: ZohoContact,
  primaryPhone: string | null,
  primaryEmail: string | null
): string {
  // Create a deterministic string representation of relevant fields
  const hashInput = [
    customer.contact_id,
    customer.contact_name,
    primaryPhone || '',
    primaryEmail || '',
    customer.last_modified_time,
  ].join('|');

  // Calculate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
}

/**
 * Detect changes between existing cached customer and Zoho customer
 * 
 * Compares relevant fields to identify what has changed:
 * - Name changes update cached values
 * - Phone changes may affect reminder eligibility
 * - Email changes update contact information
 * - Contact persons changes update the full contact list
 * 
 * @param existingCustomer - Cached customer from database
 * @param zohoCustomer - Fresh customer data from Zoho Contacts
 * @param newPrimaryPhone - Newly extracted primary phone
 * @param newPrimaryEmail - Newly extracted primary email
 * @returns Object with flags for each change type
 * 
 * Requirements: FR-2, TR-2
 */
export function detectCustomerChanges(
  existingCustomer: CachedCustomer,
  zohoCustomer: ZohoContact,
  newPrimaryPhone: string | null,
  newPrimaryEmail: string | null
): CustomerChanges {
  // Parse contact persons for comparison
  const existingContactPersons = JSON.parse(existingCustomer.contactPersons);
  const newContactPersons = zohoCustomer.contact_persons;

  // Compare names (including company name)
  const nameChanged =
    existingCustomer.customerName !== zohoCustomer.contact_name ||
    existingCustomer.companyName !== (zohoCustomer.company_name || null);

  // Compare phone numbers
  const phoneChanged = existingCustomer.primaryPhone !== newPrimaryPhone;

  // Compare email addresses
  const emailChanged = existingCustomer.primaryEmail !== newPrimaryEmail;

  // Compare contact persons array (deep comparison)
  const contactPersonsChanged = !areContactPersonsEqual(
    existingContactPersons,
    newContactPersons
  );

  return {
    nameChanged,
    phoneChanged,
    emailChanged,
    contactPersonsChanged,
  };
}

/**
 * Deep comparison of contact persons arrays
 * 
 * Compares two arrays of contact persons to detect changes.
 * Considers arrays equal if they have the same contact person IDs
 * with the same data.
 * 
 * @param existing - Existing contact persons array
 * @param updated - Updated contact persons array
 * @returns true if arrays are equal, false otherwise
 */
function areContactPersonsEqual(
  existing: ZohoContactPerson[],
  updated: ZohoContactPerson[]
): boolean {
  // Different lengths means changed
  if (existing.length !== updated.length) {
    return false;
  }

  // Sort both arrays by contact_person_id for consistent comparison
  const sortedExisting = [...existing].sort((a, b) =>
    a.contact_person_id.localeCompare(b.contact_person_id)
  );
  const sortedUpdated = [...updated].sort((a, b) =>
    a.contact_person_id.localeCompare(b.contact_person_id)
  );

  // Compare each contact person
  for (let i = 0; i < sortedExisting.length; i++) {
    const existingPerson = sortedExisting[i];
    const updatedPerson = sortedUpdated[i];

    // Compare relevant fields
    if (
      existingPerson.contact_person_id !== updatedPerson.contact_person_id ||
      existingPerson.first_name !== updatedPerson.first_name ||
      existingPerson.last_name !== updatedPerson.last_name ||
      existingPerson.email !== updatedPerson.email ||
      existingPerson.phone !== updatedPerson.phone ||
      existingPerson.mobile !== updatedPerson.mobile ||
      existingPerson.is_primary_contact !== updatedPerson.is_primary_contact
    ) {
      return false;
    }
  }

  return true;
}
