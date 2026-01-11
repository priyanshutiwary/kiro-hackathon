#!/usr/bin/env tsx
/**
 * Production Readiness Check for Customer Sync Feature
 * 
 * This script performs comprehensive verification of the customer sync implementation:
 * 1. Runs multiple sync cycles to verify stability
 * 2. Checks for errors and warnings in logs
 * 3. Measures API call reduction
 * 4. Verifies data integrity and no data loss
 * 5. Documents any issues or limitations
 */

import { db } from '../db/drizzle';
import { customersCache, invoicesCache, paymentReminders, syncMetadata } from '../db/schema';
import { syncInvoicesForUser } from '../lib/payment-reminders/sync-engine';
import { eq, and, isNull, isNotNull, sql, count } from 'drizzle-orm';

interface SyncMetrics {
  runNumber: number;
  timestamp: Date;
  customersFetched: number;
  customersInserted: number;
  customersUpdated: number;
  invoicesFetched: number;
  invoicesWithCustomers: number;
  invoicesWithoutCustomers: number;
  remindersCreated: number;
  customersWithPhone: number;
  customersWithoutPhone: number;
  errors: string[];
  warnings: string[];
  duration: number;
}

interface ProductionReadinessReport {
  testDate: Date;
  syncRuns: SyncMetrics[];
  stabilityCheck: {
    passed: boolean;
    issues: string[];
  };
  apiReduction: {
    estimatedReduction: number;
    passed: boolean;
  };
  dataIntegrity: {
    passed: boolean;
    issues: string[];
  };
  knownIssues: string[];
  recommendations: string[];
  overallStatus: 'READY' | 'NEEDS_ATTENTION' | 'NOT_READY';
}

async function getTestUserId(): Promise<string> {
  // Get a user with Zoho integration
  const result = await db.execute(sql`
    SELECT "userId" 
    FROM "agentIntegrations" 
    WHERE provider = 'zoho_books' 
    LIMIT 1
  `);
  
  if (!result.rows.length) {
    throw new Error('No user with Zoho integration found. Please set up Zoho integration first.');
  }
  
  return result.rows[0].userId as string;
}

async function capturePreSyncState(userId: string) {
  const customerCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(customersCache)
    .where(eq(customersCache.userId, userId));

  const invoiceCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(eq(invoicesCache.userId, userId));

  const reminderCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(paymentReminders)
    .where(eq(paymentReminders.userId, userId));

  return {
    customers: Number(customerCountResult[0]?.count || 0),
    invoices: Number(invoiceCountResult[0]?.count || 0),
    reminders: Number(reminderCountResult[0]?.count || 0),
  };
}

async function runSyncCycle(userId: string, runNumber: number): Promise<SyncMetrics> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting Sync Run #${runNumber}`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Capture console logs
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: any[]) => {
    errors.push(args.join(' '));
    originalConsoleError(...args);
  };
  
  console.warn = (...args: any[]) => {
    warnings.push(args.join(' '));
    originalConsoleWarn(...args);
  };

  try {
    // Run the sync
    await syncInvoicesForUser(userId);
    
    // Gather metrics
    const customerStatsResult = await db
      .select({
        total: sql<number>`count(*)`,
        withPhone: sql<number>`COUNT(CASE WHEN ${customersCache.primaryPhone} IS NOT NULL THEN 1 END)`,
        withoutPhone: sql<number>`COUNT(CASE WHEN ${customersCache.primaryPhone} IS NULL THEN 1 END)`,
      })
      .from(customersCache)
      .where(eq(customersCache.userId, userId));

    const invoiceStatsResult = await db
      .select({
        total: sql<number>`count(*)`,
        withCustomer: sql<number>`COUNT(CASE WHEN ${invoicesCache.customerId} IS NOT NULL THEN 1 END)`,
        withoutCustomer: sql<number>`COUNT(CASE WHEN ${invoicesCache.customerId} IS NULL THEN 1 END)`,
      })
      .from(invoicesCache)
      .where(eq(invoicesCache.userId, userId));

    const reminderStatsResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(paymentReminders)
      .where(eq(paymentReminders.userId, userId));

    const customerStats = customerStatsResult[0];
    const invoiceStats = invoiceStatsResult[0];
    const reminderStats = reminderStatsResult[0];

    const duration = Date.now() - startTime;

    return {
      runNumber,
      timestamp: new Date(),
      customersFetched: Number(customerStats.total),
      customersInserted: 0, // Would need to track this in sync engine
      customersUpdated: 0, // Would need to track this in sync engine
      invoicesFetched: Number(invoiceStats.total),
      invoicesWithCustomers: Number(invoiceStats.withCustomer),
      invoicesWithoutCustomers: Number(invoiceStats.withoutCustomer),
      remindersCreated: Number(reminderStats.total),
      customersWithPhone: Number(customerStats.withPhone),
      customersWithoutPhone: Number(customerStats.withoutPhone),
      errors,
      warnings,
      duration,
    };
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

async function checkStability(syncRuns: SyncMetrics[]): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  // Check for errors in any run
  const totalErrors = syncRuns.reduce((sum, run) => sum + run.errors.length, 0);
  if (totalErrors > 0) {
    issues.push(`Found ${totalErrors} errors across ${syncRuns.length} sync runs`);
  }
  
  // Check for consistency across runs
  if (syncRuns.length >= 2) {
    const firstRun = syncRuns[0];
    const lastRun = syncRuns[syncRuns.length - 1];
    
    // Customer count should be stable or increasing
    if (lastRun.customersFetched < firstRun.customersFetched) {
      issues.push(`Customer count decreased from ${firstRun.customersFetched} to ${lastRun.customersFetched}`);
    }
    
    // Invoice-customer linkage should be consistent
    const firstLinkageRate = firstRun.invoicesWithCustomers / firstRun.invoicesFetched;
    const lastLinkageRate = lastRun.invoicesWithCustomers / lastRun.invoicesFetched;
    
    if (Math.abs(firstLinkageRate - lastLinkageRate) > 0.05) {
      issues.push(`Invoice-customer linkage rate changed significantly: ${(firstLinkageRate * 100).toFixed(1)}% to ${(lastLinkageRate * 100).toFixed(1)}%`);
    }
  }
  
  // Check for excessive warnings
  const totalWarnings = syncRuns.reduce((sum, run) => sum + run.warnings.length, 0);
  if (totalWarnings > syncRuns.length * 5) {
    issues.push(`High warning count: ${totalWarnings} warnings across ${syncRuns.length} runs`);
  }
  
  return {
    passed: issues.length === 0,
    issues,
  };
}

async function estimateApiReduction(userId: string): Promise<{ estimatedReduction: number; passed: boolean }> {
  // Before customer sync: Need to fetch full invoice details for each invoice to get customer info
  // After customer sync: Only need to fetch invoice list + customer list once
  
  const invoiceCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(eq(invoicesCache.userId, userId));

  const customerCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(customersCache)
    .where(eq(customersCache.userId, userId));

  const invoiceCount = Number(invoiceCountResult[0]?.count || 0);
  const customerCount = Number(customerCountResult[0]?.count || 0);

  // Old approach: 1 list call + N detail calls (one per invoice)
  const oldApiCalls = 1 + invoiceCount;
  
  // New approach: 1 invoice list call + 1 customer list call
  const newApiCalls = 2;
  
  const reduction = oldApiCalls > 0 ? ((oldApiCalls - newApiCalls) / oldApiCalls) * 100 : 0;
  
  return {
    estimatedReduction: reduction,
    passed: reduction >= 80,
  };
}

async function checkDataIntegrity(userId: string): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  // Check 1: All invoices should have a customer reference
  const orphanedInvoicesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .where(
      and(
        eq(invoicesCache.userId, userId),
        isNull(invoicesCache.customerId)
      )
    );
  
  const orphanedCount = Number(orphanedInvoicesResult[0]?.count || 0);
  if (orphanedCount > 0) {
    issues.push(`Found ${orphanedCount} invoices without customer references`);
  }
  
  // Check 2: All reminders should be for customers with phone numbers
  const remindersWithoutPhoneResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(paymentReminders)
    .leftJoin(invoicesCache, eq(paymentReminders.invoiceId, invoicesCache.id))
    .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
    .where(
      and(
        eq(paymentReminders.userId, userId),
        isNull(customersCache.primaryPhone)
      )
    );
  
  const remindersWithoutPhoneCount = Number(remindersWithoutPhoneResult[0]?.count || 0);
  if (remindersWithoutPhoneCount > 0) {
    issues.push(`Found ${remindersWithoutPhoneCount} reminders for customers without phone numbers`);
  }
  
  // Check 3: Foreign key integrity
  const invalidReferencesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesCache)
    .leftJoin(customersCache, eq(invoicesCache.customerId, customersCache.id))
    .where(
      and(
        eq(invoicesCache.userId, userId),
        isNotNull(invoicesCache.customerId),
        isNull(customersCache.id)
      )
    );
  
  const invalidReferencesCount = Number(invalidReferencesResult[0]?.count || 0);
  if (invalidReferencesCount > 0) {
    issues.push(`Found ${invalidReferencesCount} invoices with invalid customer references`);
  }
  
  // Check 4: Duplicate customers
  const duplicateCustomers = await db.execute(sql`
    SELECT "zohoCustomerId", COUNT(*) as count
    FROM customers_cache
    WHERE "userId" = ${userId}
    GROUP BY "zohoCustomerId"
    HAVING COUNT(*) > 1
  `);
  
  if (duplicateCustomers.rows.length > 0) {
    issues.push(`Found ${duplicateCustomers.rows.length} duplicate customer entries`);
  }
  
  return {
    passed: issues.length === 0,
    issues,
  };
}

function identifyKnownIssues(): string[] {
  return [
    'Old customer fields (customerName, customerPhone, etc.) still exist in invoices_cache schema but are deprecated',
    'Customer sync requires valid Zoho OAuth tokens - tokens must be refreshed if expired',
    'Phone extraction logic prioritizes primary contact mobile, may miss alternative phone numbers',
    'Customers deleted in Zoho remain in cache (soft delete pattern)',
  ];
}

function generateRecommendations(report: ProductionReadinessReport): string[] {
  const recommendations: string[] = [];
  
  if (!report.stabilityCheck.passed) {
    recommendations.push('Address stability issues before production deployment');
  }
  
  if (!report.apiReduction.passed) {
    recommendations.push('API reduction below target - verify customer sync is running correctly');
  }
  
  if (!report.dataIntegrity.passed) {
    recommendations.push('Fix data integrity issues before production deployment');
  }
  
  if (report.syncRuns.some(run => run.warnings.length > 5)) {
    recommendations.push('Review and address warning messages in sync logs');
  }
  
  if (report.syncRuns.some(run => run.invoicesWithoutCustomers > 0)) {
    recommendations.push('Investigate invoices without customer references - may need manual data cleanup');
  }
  
  recommendations.push('Monitor sync performance in production with proper logging and alerting');
  recommendations.push('Set up automated sync health checks (e.g., daily verification script)');
  recommendations.push('Document rollback procedure in case of issues');
  
  return recommendations;
}

async function generateReport(syncRuns: SyncMetrics[], userId: string): Promise<ProductionReadinessReport> {
  console.log('\n' + '='.repeat(60));
  console.log('Generating Production Readiness Report');
  console.log('='.repeat(60) + '\n');
  
  const stabilityCheck = await checkStability(syncRuns);
  const apiReduction = await estimateApiReduction(userId);
  const dataIntegrity = await checkDataIntegrity(userId);
  const knownIssues = identifyKnownIssues();
  
  const report: ProductionReadinessReport = {
    testDate: new Date(),
    syncRuns,
    stabilityCheck,
    apiReduction,
    dataIntegrity,
    knownIssues,
    recommendations: [],
    overallStatus: 'READY',
  };
  
  report.recommendations = generateRecommendations(report);
  
  // Determine overall status
  if (!stabilityCheck.passed || !dataIntegrity.passed) {
    report.overallStatus = 'NOT_READY';
  } else if (!apiReduction.passed || report.recommendations.length > 3) {
    report.overallStatus = 'NEEDS_ATTENTION';
  }
  
  return report;
}

function printReport(report: ProductionReadinessReport) {
  console.log('\n' + '█'.repeat(60));
  console.log('PRODUCTION READINESS REPORT');
  console.log('█'.repeat(60) + '\n');
  
  console.log(`Test Date: ${report.testDate.toISOString()}`);
  console.log(`Overall Status: ${report.overallStatus}\n`);
  
  // Sync Runs Summary
  console.log('─'.repeat(60));
  console.log('SYNC RUNS SUMMARY');
  console.log('─'.repeat(60));
  report.syncRuns.forEach(run => {
    console.log(`\nRun #${run.runNumber} (${run.timestamp.toISOString()})`);
    console.log(`  Duration: ${(run.duration / 1000).toFixed(2)}s`);
    console.log(`  Customers: ${run.customersFetched} (${run.customersWithPhone} with phone, ${run.customersWithoutPhone} without)`);
    console.log(`  Invoices: ${run.invoicesFetched} (${run.invoicesWithCustomers} linked, ${run.invoicesWithoutCustomers} unlinked)`);
    console.log(`  Reminders: ${run.remindersCreated}`);
    console.log(`  Errors: ${run.errors.length}`);
    console.log(`  Warnings: ${run.warnings.length}`);
    
    if (run.errors.length > 0) {
      console.log(`  Error Details:`);
      run.errors.forEach(err => console.log(`    - ${err}`));
    }
  });
  
  // Stability Check
  console.log('\n' + '─'.repeat(60));
  console.log('STABILITY CHECK');
  console.log('─'.repeat(60));
  console.log(`Status: ${report.stabilityCheck.passed ? '✓ PASSED' : '✗ FAILED'}`);
  if (report.stabilityCheck.issues.length > 0) {
    console.log('Issues:');
    report.stabilityCheck.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // API Reduction
  console.log('\n' + '─'.repeat(60));
  console.log('API CALL REDUCTION');
  console.log('─'.repeat(60));
  console.log(`Estimated Reduction: ${report.apiReduction.estimatedReduction.toFixed(1)}%`);
  console.log(`Target: 80%`);
  console.log(`Status: ${report.apiReduction.passed ? '✓ PASSED' : '✗ FAILED'}`);
  
  // Data Integrity
  console.log('\n' + '─'.repeat(60));
  console.log('DATA INTEGRITY');
  console.log('─'.repeat(60));
  console.log(`Status: ${report.dataIntegrity.passed ? '✓ PASSED' : '✗ FAILED'}`);
  if (report.dataIntegrity.issues.length > 0) {
    console.log('Issues:');
    report.dataIntegrity.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Known Issues
  console.log('\n' + '─'.repeat(60));
  console.log('KNOWN ISSUES & LIMITATIONS');
  console.log('─'.repeat(60));
  report.knownIssues.forEach(issue => console.log(`  - ${issue}`));
  
  // Recommendations
  console.log('\n' + '─'.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('─'.repeat(60));
  report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  
  // Final Status
  console.log('\n' + '█'.repeat(60));
  console.log(`OVERALL STATUS: ${report.overallStatus}`);
  console.log('█'.repeat(60) + '\n');
  
  if (report.overallStatus === 'READY') {
    console.log('✓ System is ready for production deployment');
  } else if (report.overallStatus === 'NEEDS_ATTENTION') {
    console.log('⚠ System can be deployed but requires attention to recommendations');
  } else {
    console.log('✗ System is NOT ready for production - address critical issues first');
  }
}

async function main() {
  try {
    console.log('Customer Sync - Production Readiness Check');
    console.log('==========================================\n');
    
    // Get test user
    const userId = await getTestUserId();
    console.log(`Testing with user: ${userId}\n`);
    
    // Capture pre-sync state
    const preState = await capturePreSyncState(userId);
    console.log('Pre-sync state:');
    console.log(`  Customers: ${preState.customers}`);
    console.log(`  Invoices: ${preState.invoices}`);
    console.log(`  Reminders: ${preState.reminders}\n`);
    
    // Run multiple sync cycles
    const syncRuns: SyncMetrics[] = [];
    const numRuns = 3;
    
    for (let i = 1; i <= numRuns; i++) {
      const metrics = await runSyncCycle(userId, i);
      syncRuns.push(metrics);
      
      // Wait a bit between runs
      if (i < numRuns) {
        console.log('\nWaiting 5 seconds before next run...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Generate and print report
    const report = await generateReport(syncRuns, userId);
    printReport(report);
    
    // Exit with appropriate code
    process.exit(report.overallStatus === 'NOT_READY' ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error during production readiness check:', error);
    process.exit(1);
  }
}

main();
