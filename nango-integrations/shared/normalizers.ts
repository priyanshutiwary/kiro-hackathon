/**
 * Common normalization functions shared across providers
 * These utilities help standardize data from different providers
 */

/**
 * Normalize a date string to a Date object
 * Handles various date formats from different providers
 */
export function normalizeDate(dateStr: string | Date | undefined): Date | undefined {
  if (!dateStr) return undefined;
  if (dateStr instanceof Date) return dateStr;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Normalize currency code to ISO 4217 format
 * Handles common variations and defaults to USD
 */
export function normalizeCurrency(currency: string | undefined): string {
  if (!currency) return 'USD';
  
  const normalized = currency.toUpperCase().trim();
  
  // Handle common variations
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'DOLLAR': 'USD',
    'DOLLARS': 'USD',
    'EURO': 'EUR',
    'POUND': 'GBP',
    'YEN': 'JPY',
  };
  
  return currencyMap[normalized] || normalized;
}

/**
 * Normalize phone number to E.164 format
 * Basic normalization - removes common formatting characters
 */
export function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Add + prefix if not present and number starts with country code
  if (cleaned.length > 0 && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned || undefined;
}

/**
 * Normalize email address
 * Converts to lowercase and trims whitespace
 */
export function normalizeEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  return email.toLowerCase().trim();
}

/**
 * Determine invoice status based on amount due and due date
 */
export function determineInvoiceStatus(
  amountDue: number,
  dueDate: Date | undefined
): 'paid' | 'unpaid' | 'overdue' {
  if (amountDue <= 0) return 'paid';
  if (!dueDate) return 'unpaid';
  
  const now = new Date();
  return dueDate < now ? 'overdue' : 'unpaid';
}

/**
 * Safely parse a number from various input types
 */
export function parseNumber(value: string | number | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
