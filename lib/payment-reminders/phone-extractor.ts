/**
 * Phone Extraction Logic
 * Extracts primary phone number from Zoho contact
 * Priority: Contact mobile > Contact phone > Primary contact person mobile > Primary contact person phone > First contact person mobile > First contact person phone
 * Requirements: FR-6
 */

import { ZohoContactPerson } from "./zoho-contacts-client";

/**
 * Extract primary phone number from contact and contact persons
 * 
 * Priority order:
 * 1. Contact-level mobile number
 * 2. Contact-level phone number
 * 3. Primary contact person's mobile number
 * 4. Primary contact person's phone number
 * 5. First contact person's mobile number
 * 6. First contact person's phone number
 * 
 * @param contactPersons - Array of contact persons from Zoho contact
 * @param contactMobile - Mobile number at contact level
 * @param contactPhone - Phone number at contact level
 * @returns Primary phone number or null if no valid phone found
 */
export function extractPrimaryPhone(
  contactPersons: ZohoContactPerson[] | undefined | null,
  contactMobile?: string | null,
  contactPhone?: string | null
): string | null {
  // Priority 1: Contact-level mobile
  if (isValidPhone(contactMobile)) {
    return normalizePhone(contactMobile!);
  }

  // Priority 2: Contact-level phone
  if (isValidPhone(contactPhone)) {
    return normalizePhone(contactPhone!);
  }

  // Handle missing or empty contact persons array
  if (!contactPersons || contactPersons.length === 0) {
    return null;
  }

  // Find primary contact person
  const primaryContact = contactPersons.find(
    (person) => person.is_primary_contact === true
  );

  // Priority 3: Primary contact person's mobile
  if (primaryContact && isValidPhone(primaryContact.mobile)) {
    return normalizePhone(primaryContact.mobile);
  }

  // Priority 4: Primary contact person's phone
  if (primaryContact && isValidPhone(primaryContact.phone)) {
    return normalizePhone(primaryContact.phone);
  }

  // Priority 5: First contact person's mobile
  const firstContact = contactPersons[0];
  if (firstContact && isValidPhone(firstContact.mobile)) {
    return normalizePhone(firstContact.mobile);
  }

  // Priority 6: First contact person's phone
  if (firstContact && isValidPhone(firstContact.phone)) {
    return normalizePhone(firstContact.phone);
  }

  // No valid phone found
  return null;
}

/**
 * Check if a phone number is valid (not empty or whitespace)
 * @param phone - Phone number to validate
 * @returns True if phone is valid, false otherwise
 */
function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) {
    return false;
  }

  // Check if phone is not just whitespace
  const trimmed = phone.trim();
  return trimmed.length > 0;
}

/**
 * Normalize phone number by trimming whitespace
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
function normalizePhone(phone: string): string {
  return phone.trim();
}
