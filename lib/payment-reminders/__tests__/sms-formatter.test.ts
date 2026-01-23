/**
 * Unit tests for SMS message formatter
 */

import { describe, it, expect } from "vitest";
import { formatSMSMessage, type SMSMessageData } from "../sms-formatter";

describe("formatSMSMessage", () => {
  const baseData: SMSMessageData = {
    customerName: "John Smith",
    invoiceNumber: "INV-1234",
    amount: 500.00,
    currencyCode: "USD",
    dueDate: new Date("2024-02-15"),
    companyName: "Acme Corp",
  };

  describe("Basic message formatting", () => {
    it("should format a complete SMS message with all fields", () => {
      const message = formatSMSMessage(baseData);
      
      expect(message).toContain("Hi John Smith");
      expect(message).toContain("Invoice #INV-1234");
      expect(message).toContain("$500.00");
      expect(message).toContain("Feb 15");
      expect(message).toContain("Acme Corp");
    });

    it("should format message in correct template structure", () => {
      const message = formatSMSMessage(baseData);
      
      expect(message).toBe(
        "Hi John Smith, reminder: Invoice #INV-1234 for $500.00 is due on Feb 15. - Acme Corp"
      );
    });
  });

  describe("Currency formatting", () => {
    it("should format USD with dollar sign", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 1234.56,
        currencyCode: "USD",
      });
      
      expect(message).toContain("$1234.56");
    });

    it("should format INR with rupee symbol", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 5000,
        currencyCode: "INR",
      });
      
      expect(message).toContain("₹5000.00");
    });

    it("should format EUR with euro symbol", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 750.25,
        currencyCode: "EUR",
      });
      
      expect(message).toContain("€750.25");
    });

    it("should format GBP with pound symbol", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 999.99,
        currencyCode: "GBP",
      });
      
      expect(message).toContain("£999.99");
    });

    it("should handle string amounts", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: "1500.50",
        currencyCode: "USD",
      });
      
      expect(message).toContain("$1500.50");
    });

    it("should format amounts with 2 decimal places", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 100,
        currencyCode: "USD",
      });
      
      expect(message).toContain("$100.00");
    });
  });

  describe("Date formatting", () => {
    it("should format January date", () => {
      const message = formatSMSMessage({
        ...baseData,
        dueDate: new Date("2024-01-05"),
      });
      
      expect(message).toContain("Jan 5");
    });

    it("should format December date", () => {
      const message = formatSMSMessage({
        ...baseData,
        dueDate: new Date("2024-12-25"),
      });
      
      expect(message).toContain("Dec 25");
    });

    it("should handle date strings", () => {
      const message = formatSMSMessage({
        ...baseData,
        dueDate: "2024-03-10",
      });
      
      expect(message).toContain("Mar 10");
    });

    it("should format all months correctly", () => {
      const months = [
        { date: "2024-01-15", expected: "Jan 15" },
        { date: "2024-02-15", expected: "Feb 15" },
        { date: "2024-03-15", expected: "Mar 15" },
        { date: "2024-04-15", expected: "Apr 15" },
        { date: "2024-05-15", expected: "May 15" },
        { date: "2024-06-15", expected: "Jun 15" },
        { date: "2024-07-15", expected: "Jul 15" },
        { date: "2024-08-15", expected: "Aug 15" },
        { date: "2024-09-15", expected: "Sep 15" },
        { date: "2024-10-15", expected: "Oct 15" },
        { date: "2024-11-15", expected: "Nov 15" },
        { date: "2024-12-15", expected: "Dec 15" },
      ];

      months.forEach(({ date, expected }) => {
        const message = formatSMSMessage({
          ...baseData,
          dueDate: date,
        });
        expect(message).toContain(expected);
      });
    });
  });

  describe("Message truncation", () => {
    it("should not truncate messages under 160 characters", () => {
      const message = formatSMSMessage(baseData);
      
      expect(message.length).toBeLessThanOrEqual(160);
      expect(message).not.toContain("...");
    });

    it("should truncate long customer names", () => {
      const longNameData: SMSMessageData = {
        ...baseData,
        customerName: "Christopher Alexander Montgomery Wellington III Esquire Junior",
        companyName: "Very Long Company Name International Corporation Limited",
      };
      
      const message = formatSMSMessage(longNameData);
      
      expect(message.length).toBeLessThanOrEqual(160);
      expect(message).toContain("...");
    });

    it("should truncate long company names", () => {
      const longCompanyData: SMSMessageData = {
        ...baseData,
        companyName: "International Business Machines Corporation Limited",
      };
      
      const message = formatSMSMessage(longCompanyData);
      
      expect(message.length).toBeLessThanOrEqual(160);
    });

    it("should truncate both name and company if needed", () => {
      const longData: SMSMessageData = {
        ...baseData,
        customerName: "Christopher Alexander Montgomery Wellington III",
        companyName: "International Business Machines Corporation Limited",
      };
      
      const message = formatSMSMessage(longData);
      
      expect(message.length).toBeLessThanOrEqual(160);
    });

    it("should hard truncate if smart truncation is not enough", () => {
      const extremeData: SMSMessageData = {
        ...baseData,
        customerName: "A".repeat(50),
        invoiceNumber: "INV-" + "1".repeat(50),
        companyName: "B".repeat(50),
      };
      
      const message = formatSMSMessage(extremeData);
      
      expect(message.length).toBeLessThanOrEqual(160);
      expect(message.endsWith("...")).toBe(true);
    });
  });

  describe("Multi-language support", () => {
    it("should format message in English (default)", () => {
      const message = formatSMSMessage({
        ...baseData,
        language: "english",
      });
      
      expect(message).toContain("Hi John Smith");
      expect(message).toContain("reminder");
      expect(message).toContain("is due on");
    });

    it("should format message in Hindi", () => {
      const message = formatSMSMessage({
        ...baseData,
        language: "hindi",
      });
      
      expect(message).toContain("नमस्ते");
      expect(message).toContain("John Smith");
      expect(message).toContain("याद दिलाना");
      expect(message).toContain("देय है");
    });

    it("should format message in Hinglish", () => {
      const message = formatSMSMessage({
        ...baseData,
        language: "hinglish",
      });
      
      expect(message).toContain("Hi John Smith");
      expect(message).toContain("reminder");
      expect(message).toContain("due hai");
    });

    it("should default to English if language not specified", () => {
      const message = formatSMSMessage(baseData);
      
      expect(message).toContain("Hi John Smith");
      expect(message).toContain("is due on");
    });
  });

  describe("Edge cases", () => {
    it("should handle single character names", () => {
      const message = formatSMSMessage({
        ...baseData,
        customerName: "A",
        companyName: "B",
      });
      
      expect(message).toContain("Hi A");
      expect(message).toContain("- B");
      expect(message.length).toBeLessThanOrEqual(160);
    });

    it("should handle zero amount", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 0,
      });
      
      expect(message).toContain("$0.00");
    });

    it("should handle large amounts", () => {
      const message = formatSMSMessage({
        ...baseData,
        amount: 999999.99,
      });
      
      expect(message).toContain("$999999.99");
    });

    it("should handle special characters in names", () => {
      const message = formatSMSMessage({
        ...baseData,
        customerName: "O'Brien & Sons",
        companyName: "Smith's Co.",
      });
      
      expect(message).toContain("O'Brien & Sons");
      expect(message).toContain("Smith's Co.");
    });

    it("should handle invoice numbers with special characters", () => {
      const message = formatSMSMessage({
        ...baseData,
        invoiceNumber: "INV-2024/001",
      });
      
      expect(message).toContain("Invoice #INV-2024/001");
    });
  });

  describe("Real-world scenarios", () => {
    it("should format typical US invoice reminder", () => {
      const message = formatSMSMessage({
        customerName: "Sarah Johnson",
        invoiceNumber: "INV-2024-001",
        amount: 1250.00,
        currencyCode: "USD",
        dueDate: "2024-03-15",
        companyName: "Tech Solutions Inc",
      });
      
      expect(message).toBe(
        "Hi Sarah Johnson, reminder: Invoice #INV-2024-001 for $1250.00 is due on Mar 15. - Tech Solutions Inc"
      );
      expect(message.length).toBeLessThanOrEqual(160);
    });

    it("should format typical Indian invoice reminder", () => {
      const message = formatSMSMessage({
        customerName: "Rajesh Kumar",
        invoiceNumber: "INV-1001",
        amount: 50000,
        currencyCode: "INR",
        dueDate: "2024-04-20",
        companyName: "Mumbai Traders",
      });
      
      expect(message).toContain("Rajesh Kumar");
      expect(message).toContain("₹50000.00");
      expect(message).toContain("Apr 20");
      expect(message.length).toBeLessThanOrEqual(160);
    });

    it("should format reminder with short names and numbers", () => {
      const message = formatSMSMessage({
        customerName: "Li Wei",
        invoiceNumber: "123",
        amount: 99.99,
        currencyCode: "USD",
        dueDate: "2024-05-01",
        companyName: "ABC Co",
      });
      
      expect(message).toBe(
        "Hi Li Wei, reminder: Invoice #123 for $99.99 is due on May 1. - ABC Co"
      );
      expect(message.length).toBeLessThanOrEqual(160);
    });
  });
});
