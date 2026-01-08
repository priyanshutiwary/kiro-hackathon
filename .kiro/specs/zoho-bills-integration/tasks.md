# Implementation Plan: Zoho Bills Integration

## Overview

This plan outlines the implementation steps for integrating Zoho Books API to fetch and display user business bills. The implementation follows an incremental approach, building authentication, token management, API client, and UI components in sequence.

## Tasks

- [x] 1. Set up environment configuration and dependencies
  - Add Zoho OAuth credentials to `.env` file (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI, ZOHO_SCOPE)
  - Install any required dependencies for encryption (if not already present)
  - Create utility for encryption/decryption of tokens
  - _Requirements: 8.2, 8.3_

- [x] 2. Implement OAuth authentication service
  - [x] 2.1 Create `lib/zoho-oauth.ts` with OAuth flow methods
    - Implement `getAuthorizationUrl()` to generate Zoho auth URL with correct parameters
    - Implement `exchangeCodeForTokens()` to exchange auth code for access/refresh tokens
    - Implement `refreshAccessToken()` to refresh expired tokens
    - Implement `revokeTokens()` for disconnecting integration
    - Support Multi-DC by handling `location` and `accounts-server` parameters
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [ ]* 2.2 Write property test for OAuth token exchange
  - **Property 1: OAuth Flow Completion**
  - **Validates: Requirements 1.3, 1.4**

- [x] 3. Implement token management service
  - [x] 3.1 Create `lib/zoho-token-manager.ts` for secure token storage
    - Implement `storeTokens()` to save encrypted tokens in `agentIntegrations` table
    - Implement `getIntegration()` to retrieve and decrypt tokens
    - Implement `updateTokens()` to update tokens after refresh
    - Implement `deleteIntegration()` to remove integration
    - Implement `hasValidIntegration()` to check token validity
    - Implement `updateStatus()` to update integration status and error messages
    - Use `provider: "zoho_books"` and `integrationType: "oauth"`
    - Store organizationId and accountsServer in `config` JSON field
    - _Requirements: 1.4, 2.2, 2.4, 2.5_

- [ ]* 3.2 Write property test for token encryption round-trip
  - **Property 2: Token Encryption**
  - **Validates: Requirements 2.4**

- [ ]* 3.3 Write property test for token deletion
  - **Property 8: Token Deletion on Disconnect**
  - **Validates: Requirements 2.5**

- [-] 4. Implement Zoho API client
  - [ ] 4.1 Create `lib/zoho-api-client.ts` for API requests
    - Implement `getBills()` to fetch bills with pagination support
    - Implement `getBill()` to fetch single bill details
    - Implement private `makeRequest()` method with automatic token refresh
    - Handle Multi-DC by using correct API base URL from config
    - Implement exponential backoff for rate limiting
    - Map API responses to internal Bill data model
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [ ]* 4.2 Write property test for automatic token refresh
  - **Property 3: Token Refresh on Expiry**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.3 Write property test for bills retrieval
  - **Property 4: Bills Retrieval Success**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 4.4 Write unit tests for API error handling
  - Test rate limiting (429) error handling
  - Test service unavailable (503) error handling
  - Test authentication errors
  - Test network timeout errors
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. Checkpoint - Ensure backend services work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create API routes for OAuth flow
  - [x] 6.1 Create `/api/zoho/auth/connect` route
    - Generate OAuth authorization URL
    - Redirect user to Zoho authorization page
    - Include state parameter for CSRF protection
    - _Requirements: 1.1, 1.2_

  - [x] 6.2 Create `/api/zoho/auth/callback` route
    - Handle OAuth callback from Zoho
    - Extract authorization code, location, and accounts-server
    - Exchange code for tokens
    - Store tokens using token manager
    - Redirect to integrations page with success/error message
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 6.3 Create `/api/zoho/auth/disconnect` route
    - Revoke tokens with Zoho
    - Delete integration from database
    - Return success response
    - _Requirements: 2.5_

  - [x] 6.4 Create `/api/zoho/status` route
    - Check if user has valid Zoho integration
    - Return connection status and organization ID
    - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 6.5 Write integration tests for OAuth flow
  - Test complete OAuth flow from start to finish
  - Test callback handling with valid code
  - Test callback handling with invalid code
  - Test disconnect flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_

- [x] 7. Create API routes for bills data
  - [x] 7.1 Create `/api/zoho/bills` route
    - Authenticate user
    - Fetch bills using API client
    - Handle pagination via query parameters
    - Return bills data or error
    - Update lastSyncAt timestamp
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 7.1, 7.2, 7.4_

- [ ]* 7.2 Write unit tests for bills API route
  - Test successful bills fetch
  - Test pagination
  - Test error handling when integration not connected
  - Test error handling when API fails
  - _Requirements: 3.1, 3.5, 6.1, 6.2, 6.3_

- [x] 8. Update integrations page
  - [x] 8.1 Update `app/dashboard/integrations/page.tsx`
    - Add Zoho Books integration card to integrations array
    - Fetch integration status on page load
    - Display "Connected" badge when integration is active
    - Display "Available" badge when not connected
    - Display error status if integration has errors
    - Wire up "Connect" button to `/api/zoho/auth/connect`
    - Wire up "Configure/Disconnect" button based on status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 8.2 Write property test for integration status accuracy
  - **Property 7: Integration Status Accuracy**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 9. Create bills list page
  - [x] 9.1 Create `app/dashboard/bills/page.tsx`
    - Check if Zoho integration is connected
    - Display connection prompt if not connected
    - Fetch bills from `/api/zoho/bills` on page load
    - Display loading state while fetching
    - Render bills using BillsTable component
    - Handle pagination (Load More or infinite scroll)
    - Display empty state if no bills found
    - Provide refresh button to fetch latest data
    - _Requirements: 3.1, 4.1, 4.6, 7.1, 7.2, 7.4_

- [ ]* 9.2 Write unit tests for bills page
  - Test loading state display
  - Test empty state display
  - Test connection prompt when not connected
  - Test bills rendering when data is available
  - _Requirements: 4.6, 7.1_

- [x] 10. Create bills display component
  - [x] 10.1 Create `app/dashboard/bills/_components/bills-table.tsx`
    - Display bills in table or card layout
    - Show columns: Vendor Name, Bill Number, Date, Due Date, Amount, Status
    - Format currency using locale and currency symbol
    - Format dates in readable format (e.g., "Jan 15, 2026")
    - Apply status badges with appropriate colors (Paid=green, Unpaid=yellow, Overdue=red, Void=gray)
    - Make table responsive for mobile devices
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 10.2 Write property test for currency formatting
  - **Property 5: Currency Formatting Consistency**
  - **Validates: Requirements 4.3**

- [ ]* 10.3 Write property test for status badge mapping
  - **Property 6: Status Badge Mapping**
  - **Validates: Requirements 4.5**

- [ ]* 10.4 Write unit tests for bills table component
  - Test rendering with sample bills data
  - Test empty state
  - Test date formatting
  - Test status badge colors
  - Test responsive layout
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11. Implement error handling and user feedback
  - [ ] 11.1 Create error mapping utility
    - Map Zoho API error codes to user-friendly messages
    - Provide actionable guidance for each error type
    - Include error codes for: rate limiting, service unavailable, authentication, permissions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 11.2 Add error display to UI components
    - Display error messages in bills page
    - Display error status in integrations page
    - Show toast notifications for transient errors
    - Provide "Reconnect" or "Retry" buttons based on error type
    - _Requirements: 6.5, 1.5, 3.5_

- [ ]* 11.3 Write property test for error message clarity
  - **Property 9: Error Message Clarity**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [ ] 12. Add navigation and routing
  - [ ] 12.1 Add bills page to dashboard navigation
    - Add "Bills" link to sidebar navigation
    - Add appropriate icon for bills
    - Ensure proper routing to `/dashboard/bills`
    - _Requirements: 4.1_

- [ ] 13. Implement security measures
  - [ ] 13.1 Verify security implementation
    - Confirm all API calls use HTTPS
    - Verify tokens are encrypted in database
    - Verify no tokens exposed in client-side code
    - Verify proper CORS headers on API routes
    - Add rate limiting to API routes if not already present
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 13.2 Write property test for HTTPS communication
  - **Property 10: HTTPS Communication**
  - **Validates: Requirements 8.1**

- [ ]* 13.3 Write security tests
  - Test that tokens are encrypted in database
  - Test that tokens are not exposed in API responses
  - Test CORS headers
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 14. Final checkpoint - End-to-end testing
  - Test complete flow: Connect → Fetch Bills → Display → Disconnect
  - Test error scenarios and recovery
  - Test Multi-DC support with different regions
  - Test pagination with large datasets
  - Verify all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses the existing `agentIntegrations` table for consistency
- Multi-DC support is built-in from the start to handle users in different regions
