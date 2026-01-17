# Implementation Plan: Email/Password Authentication

## Overview

This implementation plan adds email/password authentication to the existing InvoCall application using BetterAuth's built-in capabilities and Resend for email delivery. The implementation maintains the existing Google OAuth functionality while adding the new authentication method.

## Tasks

- [x] 1. Set up Resend email service integration
  - Install Resend package and configure API key
  - Create email service utility with template support
  - Set up environment variables for Resend configuration
  - _Requirements: 7.1, 7.2, 7.5_

- [ ]* 1.1 Write property test for email service
  - **Property 13: Email template consistency**
  - **Validates: Requirements 7.2, 7.5**

- [ ]* 1.2 Write property test for email error handling
  - **Property 14: Email delivery error handling**
  - **Validates: Requirements 7.3**

- [x] 2. Configure BetterAuth for email/password authentication
  - Enable email/password authentication in BetterAuth config
  - Integrate Resend email service with BetterAuth email plugin
  - Configure password requirements and security settings
  - _Requirements: 1.2, 5.1, 5.2_

- [ ]* 2.1 Write property test for password validation
  - **Property 2: Input validation rejects invalid data**
  - **Validates: Requirements 1.3, 1.4, 5.1**

- [ ]* 2.2 Write property test for password hashing
  - **Property 10: Password security and hashing**
  - **Validates: Requirements 5.2**

- [x] 3. Create email templates for authentication flows
  - Design and implement email verification template
  - Design and implement password reset template
  - Design and implement welcome email template
  - _Requirements: 7.2, 7.5_

- [x] 4. Update sign-up page with email/password option
  - Add email/password registration form alongside Google OAuth
  - Implement form validation and error handling
  - Add loading states and user feedback
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.3, 6.4, 6.5_

- [ ]* 4.1 Write property test for registration flow
  - **Property 1: Valid registration creates accounts**
  - **Validates: Requirements 1.2, 1.6**

- [ ]* 4.2 Write unit test for duplicate email handling
  - Test registration with existing email addresses
  - _Requirements: 1.5_

- [ ]* 4.3 Write property test for UI state management
  - **Property 12: UI state preservation and feedback**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

- [x] 5. Update sign-in page with email/password option
  - Add email/password sign-in form alongside Google OAuth
  - Implement authentication logic and error handling
  - Add support for unverified email prompts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.3, 6.4, 6.5_

- [ ]* 5.1 Write property test for authentication flow
  - **Property 3: Authentication with valid credentials succeeds**
  - **Validates: Requirements 2.2, 2.6**

- [ ]* 5.2 Write property test for invalid credentials
  - **Property 4: Authentication with invalid credentials fails securely**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write property test for unverified account restrictions
  - **Property 5: Unverified accounts are restricted**
  - **Validates: Requirements 2.4, 4.4**

- [x] 6. Implement email verification system
  - Create email verification handler and UI
  - Implement verification token validation
  - Add resend verification email functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6.1 Write property test for token lifecycle management
  - **Property 8: Token validation and lifecycle management**
  - **Validates: Requirements 4.2, 4.5**

- [ ]* 6.2 Write property test for email sending timing
  - **Property 9: Email sending timing and rate limiting**
  - **Validates: Requirements 4.1, 7.4**

- [ ]* 6.3 Write unit test for token expiration
  - Test behavior with expired verification tokens
  - _Requirements: 4.3_

- [x] 7. Implement password reset functionality
  - Create forgot password page and form
  - Create reset password page with token validation
  - Implement password reset logic and email sending
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 7.1 Write property test for password reset emails
  - **Property 6: Password reset emails are sent appropriately**
  - **Validates: Requirements 3.2, 3.3**

- [ ]* 7.2 Write property test for password updates
  - **Property 7: Password updates invalidate reset tokens and sessions**
  - **Validates: Requirements 3.5, 5.4**

- [ ]* 7.3 Write unit test for reset token expiration
  - Test behavior with expired reset tokens
  - _Requirements: 3.6_

- [x] 8. Implement security features
  - Add account lockout after failed login attempts
  - Implement recent authentication checks for sensitive operations
  - Add rate limiting for email sending
  - _Requirements: 2.5, 5.3, 5.5, 7.4_

- [ ]* 8.1 Write unit test for account lockout
  - Test lockout behavior after 5 failed attempts
  - _Requirements: 2.5, 5.3_

- [ ]* 8.2 Write property test for recent authentication
  - **Property 11: Recent authentication requirements**
  - **Validates: Requirements 5.5**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update middleware and route protection
  - Update authentication middleware to handle email/password sessions
  - Ensure protected routes work with both authentication methods
  - Add email verification checks where needed
  - _Requirements: 2.6, 4.4, 5.5_

- [ ]* 10.1 Write integration tests for route protection
  - Test protected routes with both authentication methods
  - _Requirements: 2.6, 4.4_

- [x] 11. Add navigation and user experience improvements
  - Add links between sign-in and sign-up pages
  - Add "Forgot Password" link to sign-in page
  - Ensure consistent styling across all auth pages
  - _Requirements: 6.1, 6.2_

- [ ] 12. Final integration and testing
  - Test complete authentication flows end-to-end
  - Verify email delivery in development environment
  - Test error scenarios and edge cases
  - _Requirements: All requirements_

- [ ]* 12.1 Write integration tests for complete flows
  - Test full registration → verification → sign-in flow
  - Test password reset flow end-to-end
  - _Requirements: All requirements_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The implementation maintains existing Google OAuth functionality
- All email functionality uses Resend for reliable delivery