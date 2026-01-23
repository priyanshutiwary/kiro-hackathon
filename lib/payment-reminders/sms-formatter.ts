/**
 * SMS Message Formatter
 * Formats payment reminder messages for SMS delivery
 */

import { getCurrencySymbol } from "../currency-utils";

/**
 * Language options for SMS templates
 */
export type SMSLanguage = "english" | "hindi" | "hinglish";

/**
 * Data required to format an SMS message
 */
export interface SMSMessageData {
  customerName: string;
  invoiceNumber: string;
  amount: string | number;
  currencyCode: string;
  dueDate: string | Date;
  companyName: string;
  language?: SMSLanguage;
}

/**
 * SMS character limit (standard single SMS)
 */
const SMS_CHARACTER_LIMIT = 160;

/**
 * Format a date into a readable short format (e.g., "Feb 15")
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const month = months[dateObj.getMonth()];
  const day = dateObj.getDate();
  
  return `${month} ${day}`;
}

/**
 * Format amount with currency symbol
 * @param amount - Amount to format
 * @param currencyCode - ISO currency code
 * @returns Formatted amount string
 */
function formatAmount(amount: string | number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  // Format with 2 decimal places
  const formattedNumber = numAmount.toFixed(2);
  
  return `${symbol}${formattedNumber}`;
}

/**
 * Get SMS template for the specified language
 * @param language - Language for the template
 * @returns Template string with placeholders
 */
function getTemplate(language: SMSLanguage): string {
  switch (language) {
    case "hindi":
      return "नमस्ते {name}, याद दिलाना: चालान #{number} {amount} का {date} को देय है। - {company}";
    
    case "hinglish":
      return "Hi {name}, reminder: Invoice #{number} ka {amount} {date} ko due hai. - {company}";
    
    case "english":
    default:
      return "Hi {name}, reminder: Invoice #{number} for {amount} is due on {date}. - {company}";
  }
}

/**
 * Truncate message to fit within SMS character limit
 * Truncates customer name first, then company name if needed
 * @param message - Message to truncate
 * @param data - Original message data for smart truncation
 * @returns Truncated message
 */
function truncateMessage(message: string, data: SMSMessageData): string {
  if (message.length <= SMS_CHARACTER_LIMIT) {
    return message;
  }
  
  // Try truncating customer name first
  const maxNameLength = 15;
  if (data.customerName.length > maxNameLength) {
    const truncatedName = data.customerName.substring(0, maxNameLength) + "...";
    const newData = { ...data, customerName: truncatedName };
    const newMessage = buildMessage(newData);
    
    if (newMessage.length <= SMS_CHARACTER_LIMIT) {
      return newMessage;
    }
  }
  
  // If still too long, truncate company name
  const maxCompanyLength = 15;
  if (data.companyName.length > maxCompanyLength) {
    const truncatedCompany = data.companyName.substring(0, maxCompanyLength) + "...";
    const truncatedName = data.customerName.length > maxNameLength 
      ? data.customerName.substring(0, maxNameLength) + "..."
      : data.customerName;
    
    const newData = { 
      ...data, 
      customerName: truncatedName,
      companyName: truncatedCompany 
    };
    const newMessage = buildMessage(newData);
    
    if (newMessage.length <= SMS_CHARACTER_LIMIT) {
      return newMessage;
    }
  }
  
  // Last resort: hard truncate with ellipsis
  return message.substring(0, SMS_CHARACTER_LIMIT - 3) + "...";
}

/**
 * Build message from template and data
 * @param data - Message data
 * @returns Formatted message
 */
function buildMessage(data: SMSMessageData): string {
  const template = getTemplate(data.language || "english");
  const formattedDate = formatDateShort(data.dueDate);
  const formattedAmount = formatAmount(data.amount, data.currencyCode);
  
  return template
    .replace("{name}", data.customerName)
    .replace("{number}", data.invoiceNumber)
    .replace("{amount}", formattedAmount)
    .replace("{date}", formattedDate)
    .replace("{company}", data.companyName);
}

/**
 * Format an SMS payment reminder message
 * @param data - Message data including customer, invoice, and business info
 * @returns Formatted SMS message (max 160 characters)
 */
export function formatSMSMessage(data: SMSMessageData): string {
  const message = buildMessage(data);
  return truncateMessage(message, data);
}
