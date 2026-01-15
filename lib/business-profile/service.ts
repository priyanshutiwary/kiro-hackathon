/**
 * Business Profile Service
 * 
 * Handles fetching and managing business profile data for use in payment reminder calls.
 */

import { db } from "@/db/drizzle";
import { businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Business profile data structure
 */
export interface BusinessProfile {
  id: string;
  companyName: string;
  businessDescription: string;
  industry: string | null;
  supportPhone: string;
  supportEmail: string | null;
  businessHours: Record<string, string> | null;
  preferredPaymentMethods: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch business profile for a user
 * 
 * @param userId - User ID
 * @returns Business profile or null if not found
 */
export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  try {
    const profiles = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);

    if (profiles.length === 0) {
      return null;
    }

    const profile = profiles[0];

    // Parse JSON fields
    const businessHours = profile.businessHours 
      ? JSON.parse(profile.businessHours) 
      : null;
    const preferredPaymentMethods = JSON.parse(profile.preferredPaymentMethods);

    return {
      id: profile.id,
      companyName: profile.companyName,
      businessDescription: profile.businessDescription,
      industry: profile.industry,
      supportPhone: profile.supportPhone,
      supportEmail: profile.supportEmail,
      businessHours,
      preferredPaymentMethods,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }
}

/**
 * Get default business profile values when no profile exists
 * 
 * @returns Default business profile
 */
export function getDefaultBusinessProfile(): Partial<BusinessProfile> {
  return {
    companyName: 'Your Company',
    businessDescription: 'A professional business providing quality services to our customers.',
    industry: null,
    supportPhone: '1-800-555-0100',
    supportEmail: null,
    businessHours: null,
    preferredPaymentMethods: ['credit_card', 'bank_transfer', 'check'],
  };
}

/**
 * Format payment methods for agent prompt
 * 
 * @param methods - Array of payment method IDs
 * @returns Human-readable payment methods string
 */
export function formatPaymentMethods(methods: string[]): string {
  const methodLabels: Record<string, string> = {
    credit_card: 'credit card',
    bank_transfer: 'bank transfer',
    check: 'check',
    cash: 'cash',
    online_portal: 'online payment portal',
  };

  const formatted = methods
    .map(method => methodLabels[method] || method)
    .filter(Boolean);

  if (formatted.length === 0) {
    return 'various payment methods';
  }

  if (formatted.length === 1) {
    return formatted[0];
  }

  if (formatted.length === 2) {
    return formatted.join(' and ');
  }

  return formatted.slice(0, -1).join(', ') + ', and ' + formatted[formatted.length - 1];
}

/**
 * Format business hours for agent prompt
 * 
 * @param businessHours - Business hours object
 * @returns Human-readable business hours string
 */
export function formatBusinessHours(businessHours: Record<string, string> | null): string {
  if (!businessHours) {
    return 'during business hours';
  }

  // Check if it's a standard Monday-Friday schedule
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const weekdayHours = weekdays.map(day => businessHours[day]).filter(Boolean);
  
  if (weekdayHours.length === 5 && weekdayHours.every(hours => hours === weekdayHours[0])) {
    return `Monday through Friday, ${weekdayHours[0]}`;
  }

  // Otherwise, list all days with hours
  const daysWithHours = Object.entries(businessHours)
    .filter(([_, hours]) => hours && hours.toLowerCase() !== 'closed')
    .map(([day, hours]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`);

  if (daysWithHours.length === 0) {
    return 'during business hours';
  }

  return daysWithHours.join(', ');
}