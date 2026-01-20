/**
 * Daily Invoice Sync Cron Job
 * 
 * This endpoint is called by a cron scheduler (e.g., Vercel Cron) to sync invoices
 * for all users with Zoho Books integration.
 * 
 * Requirements: 3.1
 */

import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { syncInvoicesForUser } from "@/lib/payment-reminders/sync-engine";

/**
 * POST handler for the cron job
 * 
 * This should be called by a cron scheduler (e.g., Vercel Cron, external cron service)
 * to trigger daily invoice synchronization for all users.
 * 
 * Security: In production, this endpoint should be protected with:
 * - Vercel Cron Secret header verification
 * - Or API key authentication
 * - Or IP whitelist
 */

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting daily invoice sync...');
    
    // Track critical errors for alerting
    const criticalErrors: Array<{ userId: string; error: string }> = [];
    
    // Get all users with active Zoho Books integration
    const integrations = await db
      .select({
        userId: agentIntegrations.userId,
        organizationId: agentIntegrations.config,
      })
      .from(agentIntegrations)
      .where(
        and(
          eq(agentIntegrations.provider, 'zoho_books'),
          eq(agentIntegrations.enabled, true),
          eq(agentIntegrations.status, 'active')
        )
      );

    console.log(`[Cron] Found ${integrations.length} users with Zoho Books integration`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Sync invoices for each user
    for (const integration of integrations) {
      try {
        // Parse organization ID from config
        const config = integration.organizationId 
          ? JSON.parse(integration.organizationId) 
          : {};
        const organizationId = config.organizationId || config.organization_id;

        if (!organizationId) {
          console.error(`[Cron] No organization ID found for user ${integration.userId}`);
          errorCount++;
          results.push({
            userId: integration.userId,
            success: false,
            error: 'No organization ID configured',
          });
          continue;
        }

        console.log(`[Cron] Syncing invoices for user ${integration.userId}...`);
        
        const syncResult = await syncInvoicesForUser(
          integration.userId,
          organizationId
        );

        if (syncResult.errors.length > 0) {
          console.error(`[Cron] Sync completed with errors for user ${integration.userId}:`, syncResult.errors);
          errorCount++;
          
          // Track critical errors for alerting
          criticalErrors.push({
            userId: integration.userId,
            error: syncResult.errors.join('; '),
          });
        } else {
          console.log(`[Cron] Sync successful for user ${integration.userId}:`, {
            fetched: syncResult.invoicesFetched,
            inserted: syncResult.invoicesInserted,
            updated: syncResult.invoicesUpdated,
          });
          successCount++;
        }

        results.push({
          userId: integration.userId,
          success: syncResult.errors.length === 0,
          ...syncResult,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Cron] Error syncing for user ${integration.userId}:`, error);
        errorCount++;
        
        // Track critical errors for alerting
        criticalErrors.push({
          userId: integration.userId,
          error: errorMessage,
        });
        
        results.push({
          userId: integration.userId,
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log(`[Cron] Daily sync complete. Success: ${successCount}, Errors: ${errorCount}`);
    
    // Alert on sync failures (Requirement 4.1)
    if (criticalErrors.length > 0) {
      console.error('[Cron] ALERT: Sync failures detected for the following users:');
      criticalErrors.forEach(({ userId, error }) => {
        console.error(`  - User ${userId}: ${error}`);
      });
      
      // In production, this would trigger an alert to monitoring service
      // Examples: Sentry, DataDog, PagerDuty, email notification, etc.
      // await sendAlert('Sync Failures', criticalErrors);
    }

    return NextResponse.json({
      success: true,
      message: 'Daily invoice sync completed',
      summary: {
        totalUsers: integrations.length,
        successCount,
        errorCount,
      },
      results,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Cron] Fatal error in daily sync:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute daily sync',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for manual testing
 * 
 * This allows manual triggering of the sync job for testing purposes.
 * In production, you may want to disable this or add authentication.
 */
export async function GET(request: Request) {
  // Check if manual trigger is allowed
  const allowManualTrigger = process.env.ALLOW_MANUAL_CRON_TRIGGER === 'true';
  
  if (!allowManualTrigger) {
    return NextResponse.json(
      { error: 'Manual trigger not allowed' },
      { status: 403 }
    );
  }

  // Forward to POST handler
  return POST(request);
}
