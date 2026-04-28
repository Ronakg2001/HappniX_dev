# HappniX Cognito + RDS Authentication Design

## Goal

Design a secure, scalable authentication system for HappniX web using AWS Cognito User Pools, AWS Lambda in Python, and AWS RDS PostgreSQL. The design must support:

- Cognito-backed identity for email/username and phone-capable accounts
- RDS-backed user metadata and authorization context
- device-aware soft linking between overlapping email and phone identities
- non-production OTP bypass flows for low-cost development and testing
- token customization so downstream backends can authorize requests without an extra database lookup on every request

## Scope

### In scope

- PostgreSQL schema for the core `users` table
- companion device-trust schema for suspicious-login handling
- Post Confirmation Lambda trigger design
- Pre Token Generation Lambda trigger design
- Cognito User Pool configuration guidance
- non-production OTP bypass strategy with API-returned OTP and fixed OTP fallback

### Out of scope

- production SMS provider integration
- frontend UI implementation for suspicious-login warnings
- full deployment scripts, Terraform, or CloudFormation for all resources
- advanced fraud detection beyond basic device trust and warning verification

## Recommended Architecture

- AWS Cognito User Pool is the primary identity provider.
- Email/username plus password is handled natively by Cognito.
- Phone OTP is handled through a custom Lambda/API testing flow for now, because Cognito-native SMS OTP would add recurring cost under the intended plan.
- AWS RDS PostgreSQL stores HappniX application user metadata, authorization fields, device trust data, and the mapping from Cognito identity to application identity.
- A Cognito Post Confirmation trigger syncs confirmed users into PostgreSQL and creates the durable 8-character HappniX `userID`.
- A Cognito Pre Token Generation trigger reads PostgreSQL using the Cognito `sub` and injects `userID` and `userType` into token claims.
- A custom backend login/linking workflow evaluates device trust and decides whether a login can continue immediately or requires a warning verification step.

## Identity Model

### Core rule

Keep one primary `users` row per Cognito identity, mapped by unique `cognitoSub`.

### Linking model

- Do not automatically merge overlapping email and phone identities on a new device.
- If the login attempt comes from a trusted device already associated with the target user, allow the login to continue and merge verification status conservatively.
- If the login attempt comes from a new or untrusted device and the backend detects an overlapping identity, return a warning-verification response and require additional confirmation before linking or granting full access.

### Why this model

- It reduces accidental or malicious account takeover risk.
- It preserves a smooth user experience for returning users on familiar devices.
- It matches the user expectation of Instagram/Google-style suspicious-login protection.

## Database Design

### `users` table

The `users` table stores application-level identity and authorization data.

Required columns:

- `userID`
  - primary key
  - fixed-length 8-character string using uppercase letters `A-Z` and digits `0-9`
- `cognitoSub`
  - UUID
  - not null
  - unique
  - indexed for fast trigger and backend lookups
- `userName`
  - not null
- `emailAddress`
  - not null
- `userType`
  - enum with values `Admin`, `Business`, `General`
  - not null
  - default `General`
- `phoneNumber`
  - not null
  - unique
- `adharNumber`
  - nullable
- `adharVerified`
  - nullable boolean
- `emailVerified`
  - not null boolean
- `isActive`
  - not null boolean
- `dateOfBirth`
  - not null date
- `createdAt`
  - timestamp
- `updatedAt`
  - timestamp
- `lastLogin`
  - timestamp
- `loginDeviceCount`
  - integer
  - default `0`
- `cognitoIdToken`
  - nullable text
- `cognitoAccessToken`
  - nullable text
- `cognitoRefreshToken`
  - nullable text

### Token storage note

The schema may include Cognito token columns because this architecture explicitly requested them, but the implementation should document that storing Cognito ID, access, and refresh tokens in a database is usually discouraged:

- access and ID tokens expire quickly
- refresh tokens are sensitive and should not be broadly persisted
- if these fields are retained, they should be encrypted at rest and treated as operational data with strict retention rules

### Companion `user_devices` table

The core `users` table should not be overloaded with multi-device state. Add a companion table:

- `deviceID` primary key
- `userID` foreign key to `users.userID`
- `deviceFingerprintHash` not null
- `deviceName` nullable
- `isTrusted` not null boolean default `false`
- `warningVerificationRequired` not null boolean default `false`
- `firstSeenAt` timestamp not null
- `lastSeenAt` timestamp not null
- `lastIpAddress` nullable
- `lastUserAgent` nullable

This table enables:

- trusted-device continuation for known devices
- suspicious-login warning flows for new devices
- device count aggregation into `users.loginDeviceCount`

### Verification merge rules

When a trusted-device login confirms a known email or phone path for the same person:

- `emailVerified` becomes `true` if any trusted path verifies email
- phone verification status should be derived from the successful phone OTP flow
- `isActive` remains a server-controlled flag and must not be activated solely because a conflicting login exists

## Post Confirmation Trigger Design

### Purpose

Synchronize Cognito-confirmed users into PostgreSQL and assign the HappniX application `userID`.

### Trigger source

Cognito User Pool Post Confirmation trigger.

### Data source

Read attributes from the trigger event, including where available:

- `sub`
- `email`
- `phone_number`
- `email_verified`
- `phone_number_verified`
- `preferred_username`
- `name`
- `custom:userType`
- `custom:dateOfBirth`

### `userID` generation

- Generate an 8-character candidate string using uppercase letters and digits.
- Before insert, query PostgreSQL to confirm the candidate does not already exist.
- Retry until a unique value is found.
- The database should also enforce the format with a check constraint so application bugs cannot insert invalid values.

### Upsert behavior

- Upsert by `cognitoSub`.
- If the `cognitoSub` does not exist, insert a new `users` row.
- If it already exists, update mutable fields such as:
  - `userName`
  - `emailAddress`
  - `phoneNumber`
  - `emailVerified`
  - `updatedAt`
  - `lastLogin` when appropriate
- Keep `createdAt` stable on updates.

### Soft-link awareness

The trigger itself should not blindly merge accounts by email or phone on a new device. If overlapping identifiers are found:

- log the overlap
- leave final merge/linking decisions to the backend device-trust workflow
- only merge verification status automatically when the backend has already established a trusted-device path

## Pre Token Generation Trigger Design

### Purpose

Attach application authorization data directly to Cognito-issued tokens.

### Trigger source

Cognito User Pool Pre Token Generation trigger.

### Query behavior

- Read the Cognito `sub` from the trigger event.
- Query PostgreSQL by `cognitoSub`.
- Load:
  - `userID`
  - `userType`
  - optionally `isActive` for gating decisions

### Claim injection

Inject:

- `userID`
- `userType`

into the access token claims so backend services can authorize immediately without a separate database trip on normal requests.

### Failure handling

If the database row is missing:

- log the event with enough context to investigate
- fail safely according to backend tolerance

Recommended behavior:

- for production, deny token customization if the account mapping is missing and alert through logs/monitoring
- for development, allow the token issuance to continue only if the environment explicitly permits a reduced-claims fallback

## OTP Bypass Design For Building And Testing

### Goal

Support phone-login and phone-linking development without paying for Cognito SMS OTP during early build and test phases.

### Enabled modes

In non-production environments only:

- return `debugOtp` in API responses
- allow a fixed universal test OTP such as `123456`

### Environment gating

Use explicit environment variables such as:

- `APP_ENV=dev|qa|prod`
- `TEST_OTP_MODE=true|false`
- `ALLOW_FIXED_TEST_OTP=true|false`

Rules:

- `dev` and `qa` may return `debugOtp`
- fixed test OTP is allowed only when both testing flags are enabled
- `prod` must reject both bypass behaviors

### Security controls

- never expose `debugOtp` in `prod`
- log when a fixed test OTP path is used
- rate-limit OTP endpoints even in testing mode
- expire OTPs quickly
- do not confuse testing OTP verification with real proof of phone ownership in production

## Suspicious Login And Device Trust Flow

### Trusted device path

- User signs in by email/password or phone OTP.
- Backend computes a device fingerprint and compares its hash against `user_devices`.
- If the device is already trusted for that user, allow normal continuation.
- Update `lastSeenAt`, `lastLogin`, and aggregate `loginDeviceCount` if needed.

### New device path

- If identifiers overlap with an existing account but the device is not trusted, do not auto-link.
- Return a warning-verification state to the frontend.
- Require an additional confirmation step before linking the identity or granting full access.

### Suggested backend response contract

- `loginStatus: "allowed"` for trusted-device continuation
- `loginStatus: "warning_verification_required"` for suspicious-login review
- `overlapType: "email" | "phone" | "both"`

This preserves a clean separation between Cognito identity issuance and HappniX risk decisions.

## Cognito Configuration Guidance

### Sign-in configuration

Configure the User Pool so that:

- sign-in supports username and email for password-based login
- phone number is collected as a standard attribute for account records
- phone is not used through Cognito native SMS OTP for this phase

Because the requirement is to support both password-based and phone-based flows while avoiding Cognito SMS cost:

- use Cognito for account creation and password login
- implement phone OTP in your own API for development/testing
- after successful custom phone OTP verification, complete account linking or session issuance in the backend

### Refresh token settings

Set refresh token expiration to 30 days.

Enable token revocation so issued refresh tokens can be invalidated if a device is removed, an account is compromised, or a user signs out from all sessions.

### Lambda trigger attachments

Attach:

- Post Confirmation Lambda
- Pre Token Generation Lambda

to the User Pool trigger configuration.

### User attributes

Mark as required where appropriate:

- `email`
- `phone_number`

If the onboarding experience cannot always provide both at signup time, keep one required in Cognito and store the other later through profile completion plus backend sync.

### Recommended custom attributes

If needed, define:

- `custom:userType`
- `custom:dateOfBirth`

Only store values in Cognito that genuinely benefit identity workflows. Prefer RDS for broader profile data.

## Scaling And Reliability Notes

- Use RDS connection reuse in Lambda where possible.
- Protect PostgreSQL with least-privilege database credentials.
- Prefer Secrets Manager for database credentials.
- Add retries around transient database connection failures.
- Index `cognitoSub` and `phoneNumber` because they are on the hot path.
- Consider using RDS Proxy if Lambda concurrency grows.

## SQL And Lambda Deliverables To Produce In Implementation

Implementation should produce:

- a PostgreSQL SQL script for `users`, enum type, indexes, check constraints, and token-storage comment
- optional SQL for `user_devices`
- a Python Post Confirmation Lambda using `psycopg2` and `INSERT ... ON CONFLICT`
- a Python Pre Token Generation Lambda using `psycopg2`
- a Cognito setup guide aligned with the testing OTP bypass design

## Open Decisions Already Resolved

- Use Cognito as the primary identity provider.
- Support both identity types while avoiding Cognito SMS cost initially.
- Enable both `debugOtp` response mode and fixed OTP mode for non-production testing.
- Use device-aware soft linking as the merge strategy.

## Implementation Summary

Build Cognito-backed identity with PostgreSQL-backed authorization metadata, sync users through Post Confirmation, inject `userID` and `userType` through Pre Token Generation, and route phone OTP through a custom non-production-friendly backend flow with trusted-device continuation and suspicious-login warnings for new devices.
