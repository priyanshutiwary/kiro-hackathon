# Implementation Plan: Business Profile Management

## Overview

This implementation plan breaks down the Business Profile Management feature into discrete coding tasks. The approach follows a database-first strategy, then API development, followed by UI implementation and integration with the existing call system.

## Tasks

- [x] 1. Database Schema and Migration
  - Create business_profiles table with all required fields
  - Add foreign key constraint to users table
  - Create database migration script
  - _Requirements: 5.1, 5.2, 5.6_

- [ ] 2. Database Schema Implementation
  - [x] 2.1 Add business_profiles table to Drizzle schema
    - Define table structure with proper types
    - Add relationships and constraints
    - _Requirements: 5.1, 5.2_

  - [ ]* 2.2 Write property test for database schema
    - **Property 1: Profile Uniqueness**
    - **Validates: Requirements 5.2**

  - [x] 2.3 Create and run database migration
    - Generate migration file
    - Test migration up and down
    - _Requirements: 5.1_

- [ ] 3. Data Models and Validation
  - [x] 3.1 Create TypeScript interfaces and types
    - Define BusinessProfile interface
    - Define validation schemas using Zod
    - Create enum types for industry and payment methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.2 Write property test for validation rules
    - **Property 2: Required Field Validation**
    - **Validates: Requirements 1.2, 1.4, 3.1, 3.3**

  - [ ]* 3.3 Write property test for description word limit
    - **Property 3: Description Word Limit**
    - **Validates: Requirements 1.3, 3.2**

  - [ ]* 3.4 Write property test for phone number validation
    - **Property 4: Phone Number Format**
    - **Validates: Requirements 1.4, 3.3**

- [ ] 4. API Endpoints Implementation
  - [x] 4.1 Create GET /api/business-profile endpoint
    - Implement user authentication check
    - Query user's business profile from database
    - Return profile data or 404 if not found
    - _Requirements: 2.1, 5.3_

  - [x] 4.2 Create POST /api/business-profile endpoint
    - Implement user authentication check
    - Validate input data using Zod schemas
    - Create new business profile in database
    - Return created profile data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 4.3 Create PUT /api/business-profile endpoint
    - Implement user authentication check
    - Validate input data for updates
    - Update existing business profile
    - Return updated profile data
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ]* 4.4 Write property test for user data isolation
    - **Property 5: User Data Isolation**
    - **Validates: Requirements 5.3**

  - [ ]* 4.5 Write unit tests for API endpoints
    - Test all CRUD operations
    - Test error scenarios and validation
    - _Requirements: 1.6, 2.4_

- [ ] 5. Checkpoint - Ensure API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. User Interface Components
  - [x] 6.1 Create business profile page layout
    - Create /app/dashboard/business-profile/page.tsx
    - Add navigation item to dashboard
    - Implement basic page structure
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Implement business profile form component
    - Create form with all required fields
    - Implement form sections (Basic Info, Contact Info, Operational Details)
    - Add character counter for business description
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 6.3 Add form validation and error handling
    - Implement client-side validation
    - Display validation errors inline
    - Handle API error responses
    - _Requirements: 1.6, 6.6_

  - [x] 6.4 Implement form submission and state management
    - Handle form submission to API
    - Manage loading and success states
    - Implement save/cancel functionality
    - _Requirements: 1.5, 2.2, 2.3, 2.4_

  - [ ]* 6.5 Write unit tests for UI components
    - Test form validation behavior
    - Test form submission flows
    - Test error handling
    - _Requirements: 6.6_

- [ ] 7. Business Hours Configuration
  - [ ] 7.1 Create business hours input component
    - Implement day-by-day time selection
    - Add "Closed" option for each day
    - Validate opening/closing time logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 7.2 Write unit tests for business hours component
    - Test time validation logic
    - Test different day configurations
    - _Requirements: 9.4_

- [ ] 8. Call System Integration
  - [x] 8.1 Create business profile service
    - Implement service to fetch user's business profile
    - Add caching for frequently accessed profiles
    - Handle missing profile scenarios with defaults
    - _Requirements: 4.6, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Enhance call context preparation
    - Modify prepareFreshContext function to include business profile
    - Update CallContext interface to include business data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.3 Update voice agent prompt building
    - Modify buildAgentPrompt to use business profile data
    - Include company name, description, and contact info in prompt
    - Handle missing business profile gracefully
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.4 Write property test for call context enhancement
    - **Property 6: Call Context Enhancement**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ]* 8.5 Write property test for default fallback behavior
    - **Property 7: Default Fallback Behavior**
    - **Validates: Requirements 4.6, 7.1, 7.2, 7.3, 7.4**

- [ ] 9. Data Persistence and Audit
  - [ ] 9.1 Implement audit logging for profile changes
    - Log profile creation and updates
    - Track user actions and timestamps
    - _Requirements: 5.5_

  - [ ]* 9.2 Write property test for data persistence
    - **Property 8: Data Persistence Consistency**
    - **Validates: Requirements 5.1, 5.6**

- [ ] 10. Industry and Payment Method Configuration
  - [x] 10.1 Create industry selection component
    - Implement dropdown with predefined industries
    - Add "Other" option with custom input
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Create payment methods multi-select component
    - Implement checkbox group for payment methods
    - Use predefined payment method options
    - _Requirements: 3.6_

- [ ] 11. Final Integration and Testing
  - [ ] 11.1 Integration testing for complete workflow
    - Test end-to-end business profile creation and usage
    - Verify call system uses business profile correctly
    - Test error scenarios and edge cases
    - _Requirements: All requirements_

  - [ ]* 11.2 Write integration tests
    - Test complete user workflow from profile creation to call usage
    - Test authentication and authorization
    - _Requirements: 5.3, 5.4_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end functionality