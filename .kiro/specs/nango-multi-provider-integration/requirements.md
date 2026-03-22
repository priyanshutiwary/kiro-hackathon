# Nango Multi-Provider Integration - Requirements

## Executive Summary

Enable the InvoCall platform to support 10-15+ invoicing software integrations through Nango, a code-first integration platform, while maintaining existing custom integrations and providing a seamless migration path.

## Business Requirements

### BR-1: Rapid Provider Onboarding
**Priority:** High  
**Description:** Add support for new invoicing providers in < 2 hours of development time.  
**Rationale:** Manual integration takes 2-3 days per provider. With 10-15 providers planned, this saves 20-35 days of development.  
**Success Criteria:** New provider from start to production in < 2 hours.

### BR-2: Zero User Disruption
**Priority:** Critical  
**Description:** Existing users on Zoho Books, Google Sheets, and Excel Upload must experience zero downtime or data loss during migration.  
**Rationale:** Any disruption risks losing customers and damaging reputation.  
**Success Criteria:** 100% uptime during migration, zero data loss incidents.

### BR-3: Cost Efficiency
**Priority:** High  
**Description:** Total cost of ownership (development + maintenance + subscription) must be lower than manual integration approach.  
**Rationale:** Nango subscription starts at free tier, then $500/month for growth plan.  
**Success Criteria:** Break-even within 6 months, positive ROI after 12 months.

### BR-4: Scalability
**Priority:** High  
**Description:** Architecture must support 15+ providers without performance degradation.  
**Rationale:** Business growth requires supporting more accounting platforms.  
**Success Criteria:** Sync time < 5 minutes per user regardless of number of providers.

### BR-5: Maintainability
**Priority:** High  
**Description:** Reduce ongoing maintenance burden by 80%.  
**Rationale:** Current approach requires constant updates for API changes, OAuth flows, etc.  
**Success Criteria:** < 4 hours/month spent on provider maintenance.

## Functional Requirements

### FR-1: Nango SDK Integration
**Priority:** Critical  
**Description:** Integrate Nango SDK into the backend and frontend application.  
**Acceptance Criteria:**
- Backend SDK installed via `pnpm add @nangohq/node`
- Frontend SDK installed via `pnpm add @nangohq/frontend`
- Secret key securely stored in environment variables
- SDK client initialized and reusable across providers

### FR-2: Nango Integrations Folder
**Priority:** Critical  
**Description:** Create `nango-integrations/` folder for custom integration functions.  
**Acceptance Criteria:**
- Folder structure follows Nango conventions
- Each provider has its own subfolder
- Actions defined for fetching invoices and customers
- Functions written in TypeScript
- Version controlled in git
- Deployable via Nango CLI

### FR-3: Provider Action Functions
**Priority:** Critical  
**Description:** Create Nango actions for each provider to fetch invoices and customers.  
**Acceptance Criteria:**
- `fetch-invoices` action for each provider
- `fetch-customers` action for each provider
- Actions use Nango's authenticated API proxy
- Actions return normalized data
- Actions handle pagination automatically
- Actions include error handling and logging

### FR-4: QuickBooks Integration
**Priority:** High  
**Description:** Add QuickBooks as the first Nango-based provider.  
**Acceptance Criteria:**
- Users can connect QuickBooks account via OAuth
- Customer data syncs to `customersCache` table
- Invoice data syncs to `invoicesCache` table
- Data normalized to match existing schema
- Reminders created for unpaid invoices

### FR-5: Xero Integration
**Priority:** High  
**Description:** Add Xero as a Nango-based provider.  
**Acceptance Criteria:**
- Same as FR-4 but for Xero

### FR-6: FreshBooks Integration
**Priority:** High  
**Description:** Add FreshBooks as a Nango-based provider.  
**Acceptance Criteria:**
- Same as FR-4 but for FreshBooks

### FR-7: Unified OAuth Flow
**Priority:** Critical  
**Description:** Single OAuth callback endpoint handles all Nango providers.  
**Acceptance Criteria:**
- Route: `/api/nango/auth/callback`
- Accepts `provider` query parameter
- Handles OAuth via Nango frontend SDK
- Stores integration metadata in `agentIntegrations` table
- Triggers initial sync after connection
- Redirects to integrations page with success message

### FR-8: Provider Registry Update
**Priority:** Critical  
**Description:** Update provider registry to support both custom and Nango providers.  
**Acceptance Criteria:**
- Registry maps provider name to provider instance
- Supports custom providers (Zoho, Google Sheets, Excel)
- Supports Nango providers (QuickBooks, Xero, FreshBooks)
- Sync engine works with both types transparently

### FR-9: Zoho Migration Path
**Priority:** High  
**Description:** Provide migration path from custom Zoho to Nango Zoho.  
**Acceptance Criteria:**
- Zoho Books Nango actions created
- Feature flag controls which implementation is used
- Users can be migrated individually
- Rollback capability if issues occur
- Both implementations can coexist during migration

### FR-10: Integration Status API
**Priority:** Medium  
**Description:** API endpoint to check connection status for any provider.  
**Acceptance Criteria:**
- Route: `/api/nango/status?provider={provider}`
- Returns connection status, last sync time, error message
- Works for both custom and Nango providers
- Uses Nango's connection API

### FR-11: Error Handling
**Priority:** High  
**Description:** Comprehensive error handling for Nango operations.  
**Acceptance Criteria:**
- Custom error classes for different error types
- Errors logged with structured data
- User-friendly error messages in UI
- Automatic retry for transient errors
- Integration marked as error state for permanent failures
- Nango logs provide detailed debugging info

### FR-12: Data Normalization
**Priority:** Critical  
**Description:** All providers must normalize data to common schema.  
**Acceptance Criteria:**
- `NormalizedCustomer` interface matches `customersCache` schema
- `NormalizedInvoice` interface matches `invoicesCache` schema
- Currency codes standardized (ISO 4217)
- Date formats standardized (ISO 8601)
- Phone numbers normalized to E.164 format
- Normalization logic in Nango action functions

### FR-13: Additional Providers (Wave, Sage, etc.)
**Priority:** Medium  
**Description:** Add 7-10 additional invoicing providers via Nango.  
**Acceptance Criteria:**
- Each provider has Nango actions
- Each provider implements normalization logic
- Each provider tested with real account
- Each provider added to registry

## Non-Functional Requirements

### NFR-1: Performance
**Priority:** High  
**Description:** Nango integration must not significantly degrade sync performance.  
**Acceptance Criteria:**
- Sync time increase < 20% compared to custom implementation
- API latency < 500ms for Nango action calls
- Concurrent syncs supported (10+ users simultaneously)
- Nango adds < 100ms overhead per API call

### NFR-2: Security
**Priority:** Critical  
**Description:** Nango integration must maintain or improve security posture.  
**Acceptance Criteria:**
- Nango secret key stored securely (environment variable)
- No tokens stored in our database for Nango providers
- All API calls over HTTPS/TLS 1.3
- Nango is SOC 2 Type II, GDPR, and HIPAA compliant
- User can revoke access anytime
- Connection credentials encrypted at rest by Nango

### NFR-3: Reliability
**Priority:** High  
**Description:** System must handle Nango outages gracefully.  
**Acceptance Criteria:**
- Circuit breaker pattern implemented
- Fallback to cached data if Nango unavailable
- Retry logic with exponential backoff
- User notified of sync failures
- Nango provides 99.9% uptime SLA

### NFR-4: Maintainability
**Priority:** High  
**Description:** Code must be easy to understand and modify.  
**Acceptance Criteria:**
- Clear separation between custom and Nango providers
- Nango functions are TypeScript with full type safety
- Comprehensive inline documentation
- Functions stored in git for version control
- Local testing with Nango CLI

### NFR-5: Testability
**Priority:** High  
**Description:** All components must be unit testable.  
**Acceptance Criteria:**
- Nango SDK can be mocked in tests
- Each provider has unit tests for normalization
- Integration tests with Nango sandbox
- Test coverage > 80%
- Nango CLI supports local dry-run testing

### NFR-6: Observability
**Priority:** Medium  
**Description:** System must provide visibility into Nango operations.  
**Acceptance Criteria:**
- Structured logging for all Nango calls
- Metrics tracked (latency, error rate, success rate)
- Errors logged with full context
- Dashboard shows provider health
- Nango logs searchable with full-text search
- OpenTelemetry export available

## User Stories

### US-1: Connect QuickBooks Account
**As a** business owner  
**I want to** connect my QuickBooks account  
**So that** InvoCall can automatically call customers about overdue invoices

**Acceptance Criteria:**
- User clicks "Connect QuickBooks" button
- User redirected to QuickBooks OAuth page (via Nango)
- User authorizes InvoCall
- User redirected back to InvoCall
- Success message displayed
- QuickBooks appears as "Connected" in integrations list

### US-2: Automatic Invoice Sync
**As a** business owner  
**I want** my QuickBooks invoices to sync automatically  
**So that** I don't have to manually import data

**Acceptance Criteria:**
- Invoices sync daily via cron job
- New invoices appear in InvoCall dashboard
- Invoice details match QuickBooks (amount, due date, customer)
- Reminders automatically created for unpaid invoices

### US-3: Disconnect Integration
**As a** business owner  
**I want to** disconnect my QuickBooks account  
**So that** InvoCall no longer has access to my data

**Acceptance Criteria:**
- User clicks "Disconnect" button
- Confirmation dialog appears
- User confirms disconnection
- Integration removed from database
- QuickBooks access revoked via Nango
- Success message displayed

### US-4: View Integration Status
**As a** business owner  
**I want to** see the status of my integrations  
**So that** I know if there are any sync issues

**Acceptance Criteria:**
- Integrations page shows all connected providers
- Each provider shows status (Connected, Error, Syncing)
- Last sync time displayed
- Error message displayed if sync failed
- "Retry" button available for failed syncs

### US-5: Seamless Zoho Migration
**As an** existing Zoho Books user  
**I want** my integration to continue working  
**So that** I don't experience any disruption

**Acceptance Criteria:**
- No action required from user
- Invoices continue syncing
- Reminders continue being created
- No data loss
- No downtime

## Technical Constraints

### TC-1: Existing Architecture
**Constraint:** Must maintain existing `InvoiceProvider` interface.  
**Rationale:** Sync engine, cron jobs, and UI depend on this interface.  
**Impact:** All providers (custom and Nango) must implement same interface.

### TC-2: Database Schema
**Constraint:** Cannot modify `invoicesCache` or `customersCache` schema.  
**Rationale:** Would require data migration and risk data loss.  
**Impact:** Normalization layer must map all providers to existing schema.

### TC-3: Node.js Runtime
**Constraint:** Must work in Node.js 18+ environment.  
**Rationale:** Current deployment uses Node.js 18.  
**Impact:** Nango SDK must be compatible with Node.js 18+.

### TC-4: PostgreSQL Database
**Constraint:** Must use existing PostgreSQL database.  
**Rationale:** All data stored in Neon PostgreSQL.  
**Impact:** No additional database required for Nango integration.

### TC-5: Environment Variables
**Constraint:** Configuration via environment variables only.  
**Rationale:** Follows 12-factor app principles, works with deployment platform.  
**Impact:** Nango secret key stored in `.env` file.

### TC-6: TypeScript Codebase
**Constraint:** All code must be TypeScript.  
**Rationale:** Existing codebase is TypeScript.  
**Impact:** Nango functions written in TypeScript (native support).

## Dependencies

### External Dependencies
- **Nango SDK:** `@nangohq/node` and `@nangohq/frontend` npm packages
- **Nango CLI:** For deploying functions and local testing
- **Nango Account:** Active Nango account with secret key
- **Provider Accounts:** Test accounts for QuickBooks, Xero, FreshBooks

### Internal Dependencies
- **Provider Abstraction:** Existing `InvoiceProvider` interface
- **Sync Engine:** Existing `syncGenericProviderForUser()` function
- **Database:** Existing `agentIntegrations`, `invoicesCache`, `customersCache` tables
- **Authentication:** Existing user authentication system

## Assumptions

1. Nango supports all required providers (QuickBooks, Xero, FreshBooks, etc.)
2. Nango API is stable and reliable (99.9% uptime)
3. Nango pricing is predictable and affordable
4. Nango handles OAuth token refresh automatically
5. Nango provides adequate rate limiting and error handling
6. Users are willing to re-authenticate during Zoho migration
7. Existing custom providers (Google Sheets, Excel) can remain custom
8. Nango functions can be deployed from CI/CD pipeline
9. Nango's free tier is sufficient for initial development

## Out of Scope

### Phase 1 (Current Spec)
- ❌ Bi-directional sync (writing data back to providers)
- ❌ Real-time webhooks (will use daily cron sync)
- ❌ Multi-organization support (one integration per user)
- ❌ Custom field mapping (use default field mappings)
- ❌ Historical data import (only sync recent invoices)
- ❌ Provider-specific features (use common denominator)

### Future Phases
- ✅ Webhook support for real-time updates (Nango supports this)
- ✅ Write-back capabilities (mark invoices as paid)
- ✅ Advanced filtering and custom field mapping
- ✅ Multi-organization support
- ✅ Provider health dashboard
- ✅ Unified API layer across providers

## Success Criteria

### Development Metrics
- [ ] New provider added in < 2 hours
- [ ] Code reduction: 70% fewer lines for provider logic
- [ ] Test coverage: > 80% for new code
- [ ] Functions deployable via CI/CD

### Performance Metrics
- [ ] Sync time: < 5 minutes per user
- [ ] API latency: < 500ms for Nango action calls
- [ ] Error rate: < 1% for Nango operations
- [ ] Nango overhead: < 100ms per API call

### Business Metrics
- [ ] 3+ new providers launched in first month
- [ ] Zero downtime during Zoho migration
- [ ] Maintenance time: < 4 hours/month
- [ ] Break-even: Within 6 months

### User Satisfaction
- [ ] Zero user complaints about data loss
- [ ] < 5% support tickets related to integrations
- [ ] Positive feedback on new provider options

## Risks

### High Risk
- **Nango Service Outage:** Mitigation: Circuit breaker, fallback to cache
- **Data Quality Issues:** Mitigation: Extensive testing, validation layer
- **Zoho Migration Failures:** Mitigation: Gradual rollout, rollback capability

### Medium Risk
- **Cost Overruns:** Mitigation: Monitor usage, start with free tier
- **Performance Degradation:** Mitigation: Load testing, optimization
- **Custom Function Complexity:** Mitigation: Use Nango templates, AI code generation

### Low Risk
- **Provider API Changes:** Mitigation: Nango handles auth, we update functions
- **OAuth Flow Issues:** Mitigation: Nango manages OAuth
- **Token Refresh Failures:** Mitigation: Nango auto-refreshes

## Approval

This requirements document must be approved by:
- [ ] Product Owner
- [ ] Technical Lead
- [ ] Security Team
- [ ] DevOps Team

**Approved By:** _________________  
**Date:** _________________
