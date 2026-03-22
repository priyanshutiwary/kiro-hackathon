# Nango Multi-Provider Integration - Implementation Tasks

> **Note:** Each numbered task (1, 2, 3, etc.) represents a complete unit of work. When you execute a task, ALL sub-tasks within it will be completed together.

## Phase 1: Foundation & First Provider (Week 1-2)

### 1. Setup Nango Infrastructure
- [x] Complete Nango account setup and SDK installation.
  - [x] 1.1 Create Nango account at nango.dev (free tier, no credit card)
  - [x] 1.2 Install backend SDK: `pnpm add @nangohq/node`
  - [x] 1.3 Install frontend SDK: `pnpm add @nangohq/frontend`
  - [x] 1.4 Install Nango CLI globally: `pnpm add -g nango`
  - [x] 1.5 Add `NANGO_SECRET_KEY` to `.env.local` and `.env.example`
  - [x] 1.6 Create Nango client initialization utility in `lib/nango/client.ts`
  - [x] 1.7 Add TypeScript types for Nango SDK

### 2. Setup Nango Integrations Folder
- [-] Create and configure the nango-integrations folder structure.
  - [x] 2.1 Run `nango init` in project root to create `nango-integrations/` folder
  - [x] 2.2 Configure `nango-integrations/package.json` with dependencies
  - [x] 2.3 Configure `nango-integrations/tsconfig.json` for TypeScript
  - [x] 2.4 Create `nango-integrations/shared/types.ts` for shared types
  - [x] 2.5 Create `nango-integrations/shared/normalizers.ts` for common functions
  - [x] 2.6 Create `nango-integrations/shared/utils.ts` for utilities
  - [x] 2.7 Add nango-integrations to git (not .gitignore)
  - [x] 2.8 Test local development with `nango dev`

### 3. Create NangoProviderBase Abstract Class
- [x] Build the abstract base class that all Nango providers will extend.
  - [x] 3.1 Create `lib/providers/nango-base.ts`
  - [x] 3.2 Implement constructor with Nango SDK initialization
  - [x] 3.3 Implement `getCustomers()` method calling Nango actions
  - [x] 3.4 Implement `getInvoices()` method calling Nango actions
  - [x] 3.5 Add `triggerAction()` helper method
  - [x] 3.6 Add `getConnectionId()` helper method (format: `{userId}_{provider}`)
  - [x] 3.7 Add `checkConnection()` method using Nango connection API
  - [x] 3.8 Add error handling with custom error classes
  - [x] 3.9 Add comprehensive JSDoc documentation

### 4. Configure QuickBooks Integration in Nango
- [x] Set up QuickBooks as an integration in Nango dashboard.
  - [x] 4.1 Log into Nango dashboard
  - [x] 4.2 Navigate to Integrations tab
  - [x] 4.3 Click "Add Integration" and select QuickBooks
  - [x] 4.4 Set integration ID to "quickbooks"
  - [x] 4.5 Configure OAuth scopes (com.intuit.quickbooks.accounting)
  - [x] 4.6 Add OAuth redirect URL: `https://api.nango.dev/oauth/callback`
  - [x] 4.7 Save QuickBooks Client ID and Secret from Intuit Developer Portal
  - [x] 4.8 Test connection with "Add Test Connection" button

### 5. Implement QuickBooks Nango Actions
- [x] Create Nango action functions for QuickBooks.
  - [x] 5.1 Create `nango-integrations/quickbooks/actions/` folder
  - [x] 5.2 Create `fetch-invoices.ts` action
    - [x] 5.2.1 Define input schema (startDate, endDate optional)
    - [x] 5.2.2 Define output schema (NormalizedInvoice array)
    - [x] 5.2.3 Implement API call to QuickBooks `/query` endpoint
    - [x] 5.2.4 Implement pagination handling
    - [x] 5.2.5 Implement normalization logic
    - [x] 5.2.6 Add error handling and logging
  - [x] 5.3 Create `fetch-customers.ts` action
    - [x] 5.3.1 Define input schema (void)
    - [x] 5.3.2 Define output schema (NormalizedCustomer array)
    - [x] 5.3.3 Implement API call to QuickBooks `/query` endpoint
    - [x] 5.3.4 Implement pagination handling
    - [x] 5.3.5 Implement normalization logic
    - [x] 5.3.6 Add error handling and logging
  - [x] 5.4 Export actions in `nango-integrations/index.ts`
  - [x] 5.5 Test locally with `nango dryrun quickbooks/fetch-invoices <CONNECTION-ID>`
  - [x] 5.6 Deploy to Nango dev environment: `nango deploy dev`

### 6. Implement QuickBooks Provider Class
- [x] Create the QuickBooks provider that extends NangoProviderBase.
  - [x] 6.1 Create `lib/providers/quickbooks.ts`
  - [x] 6.2 Extend `NangoProviderBase`
  - [x] 6.3 Set `providerName = 'quickbooks'`
  - [x] 6.4 Set `integrationId = 'quickbooks'` (must match Nango dashboard)
  - [x] 6.5 Add unit tests for provider instantiation
  - [x] 6.6 Add integration tests with mocked Nango SDK

### 7. Create Unified OAuth Flow
- [x] Build the OAuth endpoints and UI components for Nango providers.
  - [x] 7.1 Create `app/api/nango/session/route.ts`
    - [x] 7.1.1 Authenticate user session
    - [x] 7.1.2 Generate Nango connect session token
    - [x] 7.1.3 Return session token to frontend
  - [x] 7.2 Update `app/dashboard/integrations/page.tsx`
    - [x] 7.2.1 Import Nango frontend SDK
    - [x] 7.2.2 Fetch session token from backend
    - [x] 7.2.3 Initialize Nango with session token
    - [x] 7.2.4 Implement `connectProvider()` function using `nango.openConnectUI()`
    - [x] 7.2.5 Handle connection success event
    - [x] 7.2.6 Handle connection error event
  - [x] 7.3 Create `app/api/nango/webhook/route.ts`
    - [x] 7.3.1 Verify Nango webhook signature
    - [x] 7.3.2 Handle `connection.created` event
    - [x] 7.3.3 Store integration in agentIntegrations table
    - [x] 7.3.4 Trigger initial sync
    - [x] 7.3.5 Handle `connection.deleted` event
  - [x] 7.4 Create `app/api/nango/disconnect/route.ts`
    - [x] 7.4.1 Accept provider in request body
    - [x] 7.4.2 Authenticate user session
    - [x] 7.4.3 Delete connection via Nango SDK
    - [x] 7.4.4 Delete integration from database
    - [x] 7.4.5 Return success response
  - [x] 7.5 Create `app/api/nango/status/route.ts`
    - [x] 7.5.1 Accept provider query parameter
    - [x] 7.5.2 Authenticate user session
    - [x] 7.5.3 Query Nango connection status
    - [x] 7.5.4 Query agentIntegrations table for last sync
    - [x] 7.5.5 Return combined status

### 8. Update Provider Registry
- [x] Integrate QuickBooks into the existing provider system.
  - [x] 8.1 Update `lib/providers/index.ts`
  - [x] 8.2 Import QuickBooksProvider
  - [x] 8.3 Add quickbooks to registry
  - [x] 8.4 Update `getProvider()` to handle both custom and Nango
  - [x] 8.5 Add type guards for provider type detection
  - [x] 8.6 Add unit tests for registry

### 9. Update Integrations UI
- [x] Add QuickBooks to the dashboard integrations page.
  - [x] 9.1 Update `app/dashboard/integrations/page.tsx`
  - [x] 9.2 Add QuickBooks to integrations list
  - [x] 9.3 Add QuickBooks logo/icon
  - [x] 9.4 Update connect handler to support Nango providers
  - [x] 9.5 Update disconnect handler to support Nango providers
  - [x] 9.6 Update status display to show Nango connection state
  - [x] 9.7 Add loading states for OAuth flow
  - [x] 9.8 Add error handling UI

### 10. Testing & Validation
- [ ] Comprehensive testing of QuickBooks integration.
  - [ ] 10.1 Create test QuickBooks sandbox account
  - [ ] 10.2 Test OAuth connection flow end-to-end
  - [ ] 10.3 Test customer data sync
  - [ ] 10.4 Test invoice data sync
  - [ ] 10.5 Verify data in invoicesCache and customersCache
  - [ ] 10.6 Verify reminders created for unpaid invoices
  - [ ] 10.7 Test disconnect flow
  - [ ] 10.8 Test error handling (invalid credentials, network errors)
  - [ ] 10.9 Load test with 100+ invoices
  - [ ] 10.10 Deploy to staging environment

### 11. Documentation
- [ ] Document the Nango integration for developers.
  - [ ] 11.1 Update README with Nango setup instructions
  - [ ] 11.2 Document environment variables
  - [ ] 11.3 Create developer guide for adding new providers
  - [ ] 11.4 Document Nango action structure and patterns
  - [ ] 11.5 Document error codes and handling
  - [ ] 11.6 Update API documentation
  - [ ] 11.7 Create troubleshooting guide

## Phase 2: Add More Providers (Week 2-3)

### 12. Implement Xero Provider
- [ ] Add Xero as the second Nango provider.
  - [ ] 12.1 Configure Xero integration in Nango dashboard
  - [ ] 12.2 Create `nango-integrations/xero/actions/fetch-invoices.ts`
  - [ ] 12.3 Create `nango-integrations/xero/actions/fetch-customers.ts`
  - [ ] 12.4 Implement Xero-specific normalization logic
  - [ ] 12.5 Deploy actions: `nango deploy dev`
  - [ ] 12.6 Create `lib/providers/xero.ts` extending NangoProviderBase
  - [ ] 12.7 Add to provider registry
  - [ ] 12.8 Add to integrations UI
  - [ ] 12.9 Test with real Xero account
  - [ ] 12.10 Deploy to production

### 13. Implement FreshBooks Provider
- [ ] Add FreshBooks as the third Nango provider.
  - [ ] 13.1 Configure FreshBooks integration in Nango dashboard
  - [ ] 13.2 Create `nango-integrations/freshbooks/actions/fetch-invoices.ts`
  - [ ] 13.3 Create `nango-integrations/freshbooks/actions/fetch-customers.ts`
  - [ ] 13.4 Implement FreshBooks-specific normalization logic
  - [ ] 13.5 Deploy actions: `nango deploy dev`
  - [ ] 13.6 Create `lib/providers/freshbooks.ts` extending NangoProviderBase
  - [ ] 13.7 Add to provider registry
  - [ ] 13.8 Add to integrations UI
  - [ ] 13.9 Test with real FreshBooks account
  - [ ] 13.10 Deploy to production

## Phase 3: Zoho Migration (Week 3-4)

### 14. Create Zoho Nango Provider
- [ ] Build Nango-based Zoho provider for migration.
  - [ ] 14.1 Configure Zoho Books integration in Nango dashboard
  - [ ] 14.2 Create `nango-integrations/zoho-books/actions/fetch-invoices.ts`
  - [ ] 14.3 Create `nango-integrations/zoho-books/actions/fetch-customers.ts`
  - [ ] 14.4 Implement normalization matching existing Zoho format
  - [ ] 14.5 Deploy actions: `nango deploy dev`
  - [ ] 14.6 Create `lib/providers/zoho-books-nango.ts`
  - [ ] 14.7 Add unit tests comparing with custom implementation
  - [ ] 14.8 Verify data parity with custom Zoho provider

### 15. Implement Feature Flag System
- [ ] Create system to toggle between custom and Nango Zoho.
  - [ ] 15.1 Add `useNangoZoho` flag to user settings or database
  - [ ] 15.2 Create `getZohoBooksProvider()` function with flag check
  - [ ] 15.3 Update provider registry to use flag-based provider
  - [ ] 15.4 Add admin UI to toggle flag per user
  - [ ] 15.5 Add logging to track which implementation is used
  - [ ] 15.6 Add metrics to monitor migration progress

### 16. Migration Preparation
- [ ] Prepare for safe Zoho migration.
  - [ ] 16.1 Create migration script for user data validation
  - [ ] 16.2 Create rollback script to revert to custom implementation
  - [ ] 16.3 Set up monitoring for migration metrics
  - [ ] 16.4 Create migration runbook for operations team
  - [ ] 16.5 Identify beta test users (10% of Zoho users)
  - [ ] 16.6 Set up alerts for migration issues

### 17. Beta Migration
- [ ] Migrate 10% of Zoho users to Nango.
  - [ ] 17.1 Enable Nango Zoho for beta users
  - [ ] 17.2 Monitor sync success rates
  - [ ] 17.3 Compare data quality with custom implementation
  - [ ] 17.4 Collect user feedback
  - [ ] 17.5 Fix any issues discovered
  - [ ] 17.6 Validate reminder creation works correctly
  - [ ] 17.7 Document lessons learned

### 18. Full Zoho Migration
- [ ] Gradually migrate all Zoho users to Nango.
  - [ ] 18.1 Enable Nango Zoho for 25% of users
  - [ ] 18.2 Monitor for 48 hours
  - [ ] 18.3 Enable for 50% of users
  - [ ] 18.4 Monitor for 48 hours
  - [ ] 18.5 Enable for 75% of users
  - [ ] 18.6 Monitor for 48 hours
  - [ ] 18.7 Enable for 100% of users
  - [ ] 18.8 Monitor for 1 week
  - [ ] 18.9 Mark custom Zoho as deprecated

### 19. Cleanup Old Zoho Code
- [ ] Remove deprecated custom Zoho implementation.
  - [ ] 19.1 Keep legacy code for 1 week as safety net
  - [ ] 19.2 Remove feature flag (default to Nango)
  - [ ] 19.3 Delete `lib/zoho-oauth.ts`
  - [ ] 19.4 Delete `lib/zoho-token-manager.ts`
  - [ ] 19.5 Delete `lib/zoho-api-client.ts`
  - [ ] 19.6 Delete `lib/payment-reminders/zoho-books-client.ts`
  - [ ] 19.7 Delete `lib/payment-reminders/zoho-contacts-client.ts`
  - [ ] 19.8 Delete `app/api/zoho/auth/connect/route.ts`
  - [ ] 19.9 Delete `app/api/zoho/auth/callback/route.ts`
  - [ ] 19.10 Delete `app/api/zoho/auth/disconnect/route.ts`
  - [ ] 19.11 Update imports across codebase
  - [ ] 19.12 Run full test suite
  - [ ] 19.13 Deploy to production

## Phase 4: Scale to 10+ Providers (Week 5-6)

### 20. Add Wave Provider
- [ ] Implement Wave accounting integration.
  - [ ] 20.1 Configure Wave in Nango dashboard
  - [ ] 20.2 Create Nango actions for Wave
  - [ ] 20.3 Create `lib/providers/wave.ts` extending NangoProviderBase
  - [ ] 20.4 Add to registry and UI
  - [ ] 20.5 Test and deploy

### 21. Add Sage Provider
- [ ] Implement Sage accounting integration.
  - [ ] 21.1 Configure Sage in Nango dashboard
  - [ ] 21.2 Create Nango actions for Sage
  - [ ] 21.3 Create `lib/providers/sage.ts` extending NangoProviderBase
  - [ ] 21.4 Add to registry and UI
  - [ ] 21.5 Test and deploy

### 22. Add Invoice Ninja Provider
- [ ] Implement Invoice Ninja integration.
  - [ ] 22.1 Configure Invoice Ninja in Nango dashboard
  - [ ] 22.2 Create Nango actions for Invoice Ninja
  - [ ] 22.3 Create `lib/providers/invoice-ninja.ts` extending NangoProviderBase
  - [ ] 22.4 Add to registry and UI
  - [ ] 22.5 Test and deploy

### 23. Add Zoho Invoice Provider
- [ ] Implement Zoho Invoice (separate from Zoho Books).
  - [ ] 23.1 Configure Zoho Invoice in Nango dashboard
  - [ ] 23.2 Create Nango actions for Zoho Invoice
  - [ ] 23.3 Create `lib/providers/zoho-invoice.ts` extending NangoProviderBase
  - [ ] 23.4 Add to registry and UI
  - [ ] 23.5 Test and deploy

### 24. Add 6 More Providers
- [ ] Scale to 10+ total providers based on user demand.
  - [ ] 24.1 Research and prioritize next 6 providers based on user demand
  - [ ] 24.2 Configure each provider in Nango dashboard
  - [ ] 24.3 Create Nango actions for each provider (2 hours each)
  - [ ] 24.4 Create provider classes extending NangoProviderBase
  - [ ] 24.5 Add to registry and UI
  - [ ] 24.6 Test with real accounts
  - [ ] 24.7 Deploy incrementally

## Phase 5: Google Sheets Migration (Optional, Week 6-7)

### 25. Evaluate Google Sheets Nango Support
- [ ] Determine if Google Sheets should migrate to Nango.
  - [ ] 25.1 Check if Nango supports Google Sheets API
  - [ ] 25.2 Review Nango's Google Sheets API coverage
  - [ ] 25.3 Compare with custom implementation features
  - [ ] 25.4 Evaluate cost-benefit of migration
  - [ ] 25.5 Decide: migrate or keep custom

### 26. Migrate Google Sheets (If Applicable)
- [ ] Migrate Google Sheets to Nango if evaluation is positive.
  - [ ] 26.1 Configure Google Sheets in Nango dashboard
  - [ ] 26.2 Create Nango actions for Google Sheets
  - [ ] 26.3 Create `lib/providers/google-sheets-nango.ts`
  - [ ] 26.4 Test with existing Google Sheets users
  - [ ] 26.5 Gradual migration similar to Zoho
  - [ ] 26.6 Delete custom Google Sheets code

## Phase 6: Monitoring & Optimization (Ongoing)

### 27. Implement Monitoring
- [ ] Set up comprehensive monitoring for Nango operations.
  - [ ] 27.1 Add structured logging for all Nango operations
  - [ ] 27.2 Track metrics: latency, error rate, success rate
  - [ ] 27.3 Set up alerts for high error rates
  - [ ] 27.4 Create dashboard for provider health
  - [ ] 27.5 Monitor Nango API usage and costs
  - [ ] 27.6 Set up OpenTelemetry export from Nango logs

### 28. Performance Optimization
- [ ] Optimize sync performance across all providers.
  - [ ] 28.1 Profile sync performance for each provider
  - [ ] 28.2 Identify bottlenecks in Nango actions
  - [ ] 28.3 Implement caching where appropriate
  - [ ] 28.4 Optimize batch operations
  - [ ] 28.5 Reduce unnecessary API calls
  - [ ] 28.6 Optimize normalization logic

### 29. Error Handling Improvements
- [ ] Enhance error handling and recovery.
  - [ ] 29.1 Analyze error patterns from Nango logs
  - [ ] 29.2 Improve error messages for users
  - [ ] 29.3 Add automatic retry for transient errors
  - [ ] 29.4 Implement circuit breaker for Nango outages
  - [ ] 29.5 Add fallback to cached data
  - [ ] 29.6 Improve error recovery in Nango actions

### 30. Documentation Updates
- [ ] Keep documentation current and comprehensive.
  - [ ] 30.1 Update user documentation with new providers
  - [ ] 30.2 Create troubleshooting guide for Nango issues
  - [ ] 30.3 Document common error scenarios
  - [ ] 30.4 Update API documentation
  - [ ] 30.5 Create video tutorials for connecting providers
  - [ ] 30.6 Document Nango action development workflow

## Success Metrics Tracking

Track these metrics throughout implementation:

**Development Metrics:**
- Time to add each new provider
- Lines of code deleted vs added
- Test coverage percentage
- Build and deployment times
- Nango function deployment time

**Performance Metrics:**
- Sync time per provider
- Nango API latency
- Error rates by provider
- Concurrent sync capacity
- Nango overhead per API call

**Business Metrics:**
- Active integrations per provider
- User adoption of new providers
- Support ticket volume
- Cost savings vs manual approach
- Nango usage costs

**User Satisfaction:**
- User feedback on new providers
- Integration connection success rate
- Data quality issues
- Time to first successful sync

## Notes

- **Task Execution:** Each numbered task (1-30) is a complete unit. When you start a task, complete ALL sub-tasks within it.
- **Testing:** Always test with real accounts before deploying to production.
- **Monitoring:** Watch metrics closely during migrations - rollback if issues arise.
- **Fallback:** Keep custom implementations available during transition period.
- **Documentation:** Document everything for future team members.
- **Time Estimates:** Each provider after the base should take < 2 hours to implement.
- **Nango CLI:** Use `nango dev` for local development and `nango dryrun` for testing.
- **Deployment:** Deploy Nango functions separately from main application.
