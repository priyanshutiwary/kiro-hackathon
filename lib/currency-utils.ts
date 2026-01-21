/**
 * Currency utility functions
 * Provides currency symbol mapping and formatting helpers
 */

/**
 * Map of ISO currency codes to their symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  // Major currencies
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  
  // Asia Pacific
  INR: "₹",
  AUD: "A$",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
  KRW: "₩",
  THB: "฿",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  
  // Americas
  CAD: "C$",
  BRL: "R$",
  MXN: "MX$",
  ARS: "AR$",
  CLP: "CL$",
  COP: "CO$",
  
  // Europe
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  TRY: "₺",
  RUB: "₽",
  
  // Middle East & Africa
  AED: "د.إ",
  SAR: "﷼",
  QAR: "ر.ق",
  KWD: "د.ك",
  BHD: "د.ب",
  OMR: "ر.ع.",
  ILS: "₪",
  ZAR: "R",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
};

/**
 * Get currency symbol from ISO currency code
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "INR", "EUR")
 * @returns Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format amount with currency symbol
 * @param amount - Numeric amount to format
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale for number formatting (default: "en-US")
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = "en-US"
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // For some currencies, symbol goes after the amount
  const symbolAfter = ["SEK", "NOK", "DKK", "CZK", "HUF", "PLN", "RON"];
  if (symbolAfter.includes(currencyCode.toUpperCase())) {
    return `${formattedAmount} ${symbol}`;
  }
  
  return `${symbol}${formattedAmount}`;
}

/**
 * Get currency name from code
 * @param currencyCode - ISO 4217 currency code
 * @returns Full currency name
 */
export function getCurrencyName(currencyCode: string): string {
  const names: Record<string, string> = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    INR: "Indian Rupee",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    SEK: "Swedish Krona",
    NZD: "New Zealand Dollar",
    SGD: "Singapore Dollar",
    HKD: "Hong Kong Dollar",
    NOK: "Norwegian Krone",
    KRW: "South Korean Won",
    TRY: "Turkish Lira",
    RUB: "Russian Ruble",
    BRL: "Brazilian Real",
    ZAR: "South African Rand",
    MXN: "Mexican Peso",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
  };
  
  return names[currencyCode.toUpperCase()] || currencyCode;
}
