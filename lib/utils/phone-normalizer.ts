/**
 * Phone Number Normalizer
 * Normalizes phone numbers from various formats to E.164 format for voice calling.
 * Uses libphonenumber-js for international phone number parsing and validation.
 * 
 * E.164 format: +[country code]-[subscriber number]
 * Example: +91-9876543210, +1-6175551234
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneNormalizationResult {
  success: boolean;
  normalized?: string; // E.164 format with dash: +91-9876543210
  original: string;
  error?: string;
  country?: string;
  nationalNumber?: string;
}

/**
 * Normalize a phone number to E.164 format with dash separator.
 * Automatically detects country code from the number.
 * 
 * @param phoneNumber - Raw phone number in any format
 * @param defaultCountry - Default country code if not specified in number (e.g., 'IN', 'US')
 * @returns Normalization result with E.164 formatted number
 * 
 * @example
 * normalizePhoneNumber('916202390324') // { success: true, normalized: '+91-6202390324' }
 * normalizePhoneNumber('+91-6202390324') // { success: true, normalized: '+91-6202390324' }
 * normalizePhoneNumber('(617) 555-1234', 'US') // { success: true, normalized: '+1-6175551234' }
 * normalizePhoneNumber('+1 703 285 8909') // { success: true, normalized: '+1-7032858909' }
 * normalizePhoneNumber('17032858909') // { success: true, normalized: '+1-7032858909' }
 * normalizePhoneNumber('446202390324') // { success: true, normalized: '+44-6202390324' }
 */
export function normalizePhoneNumber(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'IN'
): PhoneNormalizationResult {
  // Handle empty/null input
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      success: false,
      original: phoneNumber || '',
      error: 'Phone number is empty',
    };
  }

  const original = phoneNumber.trim();

  // Clean the phone number: remove all spaces, dashes, parentheses, dots, brackets
  let cleaned = original.replace(/[\s\-\(\)\.\[\]]/g, '');

  try {
    // Strategy 1: If it starts with +, it's already in international format
    if (cleaned.startsWith('+')) {
      const parsed = parsePhoneNumber(cleaned);
      
      if (parsed && parsed.isValid()) {
        const countryCode = parsed.countryCallingCode;
        const nationalNumber = parsed.nationalNumber;
        
        return {
          success: true,
          normalized: `+${countryCode}-${nationalNumber}`,
          original,
          country: parsed.country,
          nationalNumber: parsed.nationalNumber,
        };
      }
    }

    // Strategy 2: Try parsing as international number by adding +
    // This works for numbers like "17032858909", "916202390324", "446202390324"
    if (cleaned.length >= 10) {
      try {
        const withPlus = '+' + cleaned;
        const parsed = parsePhoneNumber(withPlus);
        
        if (parsed && parsed.isValid()) {
          const countryCode = parsed.countryCallingCode;
          const nationalNumber = parsed.nationalNumber;
          
          return {
            success: true,
            normalized: `+${countryCode}-${nationalNumber}`,
            original,
            country: parsed.country,
            nationalNumber: parsed.nationalNumber,
          };
        }
      } catch {
        // If this fails, continue to next strategy
      }
    }

    // Strategy 3: Parse with default country as fallback
    const parsed = parsePhoneNumber(cleaned, defaultCountry);

    if (!parsed) {
      return {
        success: false,
        original,
        error: 'Could not parse phone number',
      };
    }

    // Validate the parsed number
    if (!parsed.isValid()) {
      return {
        success: false,
        original,
        error: 'Phone number is not valid',
        country: parsed.country,
      };
    }

    // Return E.164 format with dash
    const countryCode = parsed.countryCallingCode;
    const nationalNumber = parsed.nationalNumber;
    
    return {
      success: true,
      normalized: `+${countryCode}-${nationalNumber}`,
      original,
      country: parsed.country,
      nationalNumber: parsed.nationalNumber,
    };
  } catch (error) {
    return {
      success: false,
      original,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Validate if a phone number is valid for voice calling.
 * 
 * @param phoneNumber - Phone number to validate
 * @param defaultCountry - Default country code
 * @returns true if valid, false otherwise
 */
export function isValidPhoneForCalling(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'IN'
): boolean {
  if (!phoneNumber) return false;
  
  try {
    return isValidPhoneNumber(phoneNumber, defaultCountry);
  } catch {
    return false;
  }
}

/**
 * Batch normalize multiple phone numbers.
 * Useful for processing customer lists.
 * 
 * @param phoneNumbers - Array of phone numbers to normalize
 * @param defaultCountry - Default country code
 * @returns Array of normalization results
 */
export function normalizePhoneNumbers(
  phoneNumbers: (string | null | undefined)[],
  defaultCountry: CountryCode = 'IN'
): PhoneNormalizationResult[] {
  return phoneNumbers.map(phone => normalizePhoneNumber(phone, defaultCountry));
}
