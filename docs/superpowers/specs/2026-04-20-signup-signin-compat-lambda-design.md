# Signup/Signin Compatibility Lambda Design

## Goal

Migrate the auth and signup backend contract from `E:\project\Party_connect_hub_redefine\HAPPNIX\signin_signup.py` into this repo's Lambda deployment model while preserving the existing frontend-facing API paths and response shapes.

This design chooses a Lambda-native compatibility layer rather than a Django-faithful port. The current repo has a SAM template, a placeholder Lambda in `backend/SignupSignin.py`, and frontend files that already expect the HAPPNIX auth endpoints. It does not include Django auth, session middleware, ORM models, or the original `mongo_store` integration, so the old backend must be adapted rather than copied verbatim.

## Scope

### In scope

- Replace the placeholder `backend/SignupSignin.py` with a routed Lambda handler.
- Expose the HAPPNIX auth and signup API routes through API Gateway.
- Preserve request and response contracts used by the existing frontend.
- Implement Lambda-friendly helpers for:
  - JSON request parsing
  - validation and error responses
  - route dispatch
  - session-like state handling
  - auth state lookup
- Update frontend auth pages to call the deployed API endpoint rather than assuming same-origin Django paths.
- Add tests for route dispatch, validation, and key success/failure flows.

### Out of scope

- Migrating the full Django application into this repo.
- Recreating Django sessions, Django authentication, or ORM models literally.
- Migrating unrelated messaging, event, ticket, or profile APIs outside the auth/signup flow.
- Building the final production persistence model if the required backing services are still missing from this repo.

## Source Contract To Preserve

The Lambda layer should preserve these paths and their current semantics from HAPPNIX:

- `POST /api/auth/mobile/send-otp`
- `POST /api/auth/mobile/resend-otp`
- `POST /api/auth/mobile/verify-otp`
- `POST /api/auth/password/forgot`
- `POST /api/auth/username/login`
- `POST /api/signup/details`
- `POST /api/signup/profile`
- `POST /api/auth/aadhaar/send-otp`
- `POST /api/auth/aadhaar/verify-otp`

### Behavior to preserve

- Mobile OTP endpoints validate 10-digit numbers and return user-facing messages compatible with the current UI.
- OTP verification distinguishes between existing users and new users.
- Password login returns the same success/error structure the current frontend expects.
- Signup details flow requires a verified mobile-first session and returns a redirect to profile completion.
- Profile completion returns a redirect to `/home/`.
- Aadhaar endpoints keep their request/response contract, but external KYC integration must be treated as optional/configured behavior.

## Architecture

### Entry point

`backend/SignupSignin.py` becomes a single Lambda router with:

- `lambda_handler(event, context)` as the public entry point
- route matching by HTTP method plus request path
- one handler function per migrated endpoint

### Internal module shape

The file can stay as one module initially, but it should be structured into clear sections:

- request parsing helpers
- response/error helpers
- routing table
- auth/session helpers
- endpoint handlers

If the file grows too large during implementation, the helpers should move into small backend support modules without changing the public Lambda handler.

### API Gateway mapping

`template.yaml` should register the compatibility Lambda for each preserved auth/signup path instead of only `POST /signup`.

This keeps frontend code simple and avoids introducing a custom path multiplexing scheme that the existing HAPPNIX contract never used.

## State And Persistence Design

### Problem

The source Django code depends on:

- `request.session`
- Django auth login state
- `User` and `UserProfile` ORM models
- `mongo_store.sync_user_profile`

Those dependencies are not available in the current repo.

### Compatibility strategy

Implementation should introduce explicit abstractions rather than hardcoding temporary logic into route handlers:

- `session_store`
  - save and fetch OTP state
  - save pending signup mobile
  - save pending profile setup marker
  - save Aadhaar client ID
- `user_store`
  - look up users by username, email, and mobile
  - create users
  - update profile details
  - read whether the user is verified
- `auth_context`
  - resolve signed-in user from request headers/cookies/session token

The first implementation may use a simple compatibility-backed store if that is all the repo currently supports, but handlers must talk only through those abstractions so the real backing store can be swapped in later.

### Session model

The old flow is session-based. The Lambda version should preserve that behavior conceptually by issuing or consuming a session token and using it to resolve state server-side.

Required state keys:

- OTP by mobile number
- last mobile number
- pending signup mobile
- pending profile setup flag
- Aadhaar client ID
- authenticated user identity

### Data fidelity note

If the repo does not yet contain a real user/profile database, implementation can ship with a clearly isolated compatibility store for deployment testing, but the design must avoid pretending that placeholder storage is full production auth.

## Endpoint Design

### `POST /api/auth/mobile/send-otp`

- Parse `{ "mobile": "9876543210" }`
- Validate 10-digit mobile number
- Generate OTP
- Save OTP against the session and mobile
- Return:
  - `message`
  - `debugOtp` when allowed in non-production environments

### `POST /api/auth/mobile/resend-otp`

- Same validation and OTP generation behavior
- Overwrite the OTP for the mobile/session combination
- Return the same response shape as HAPPNIX

### `POST /api/auth/mobile/verify-otp`

- Validate `mobile` and `otp`
- Compare against saved OTP state
- If user exists:
  - authenticate session
  - return `userStatus: "existing"`
  - return `redirectUrl: "/home/"`
- If user does not exist:
  - save `pending_signup_mobile`
  - return `userStatus: "new"`
  - return `redirectUrl: "/signup/details/"`

### `POST /api/auth/password/forgot`

- Validate email
- Return privacy-safe message
- Preserve current HAPPNIX wording behavior for registered vs unregistered accounts if the backing store can determine that.

### `POST /api/auth/username/login`

- Validate `identifier` and `password`
- Resolve candidate user by username or email
- Validate password using the chosen user store/auth mechanism
- Mark the request session authenticated
- Return the same existing-user success shape

### `POST /api/signup/details`

- Require `pending_signup_mobile`
- Validate mandatory fields:
  - `fullName`
  - `username`
  - `password`
  - `sex`
  - `dateOfBirth`
  - `email`
- Enforce existing uniqueness and password rules as closely as possible
- Create the user and profile records through the compatibility store
- Mark profile setup pending
- Authenticate the user session
- Return redirect to `/signup/profile/`

### `POST /api/signup/profile`

- Require authenticated user
- Require pending profile setup marker
- Support `skip`
- Save `bio` and `profilePictureUrl` when provided
- Clear pending profile setup state
- Return redirect to `/home/`

### `POST /api/auth/aadhaar/send-otp`

- Require authenticated user
- Validate `aadhaarNumber` if supplied
- Save the number if appropriate
- If external KYC is configured, call it
- If external KYC is not configured, return a clear compatibility-safe error or configured stub response

### `POST /api/auth/aadhaar/verify-otp`

- Require authenticated user
- Require saved Aadhaar client/session state
- Verify OTP with external KYC if configured
- Mark the user verified on success
- Return the same message shape as HAPPNIX

## Frontend Integration

The current frontend already uses the correct logical routes, but it assumes same-origin paths. In this repo, the frontend should read an API base URL from configuration and prepend it when calling auth/signup endpoints.

This should be done with a small helper in the signup-related frontend files so we do not scatter deployment URL logic across every fetch call.

Files that should be updated on the frontend side:

- `web_frontend/signup_signin.js`
- `web_frontend/signup_details.js`
- `web_frontend/signup_profile_optional.js`
- any runtime config or boot config file used to inject the deployed API base

## Error Handling

All handlers should return a consistent JSON error shape:

- `message`
- appropriate HTTP status code

Validation and auth failures should mirror the existing user-facing messages where practical so the frontend UX remains stable.

## Testing Strategy

Tests should cover:

- route dispatch by path and method
- JSON parsing and bad-request handling
- mobile validation
- OTP failure and success flows
- existing-user vs new-user OTP verification behavior
- password login success and invalid-credential cases
- signup details session gating
- profile completion auth gating
- Aadhaar handler behavior when integration is disabled

Test doubles should be used for store abstractions and KYC calls so route behavior can be verified without real infrastructure.

## Rollout Notes

- Keep response payloads stable first; do not redesign the contract during migration.
- Keep debug OTP output behind an environment-aware check so development stays usable without leaking OTPs in production.
- Do not silently fake durable user auth if the backing store is only temporary; document compatibility limitations clearly in code and follow-up notes.

## Implementation Summary

Build a routed Lambda compatibility layer that preserves the HAPPNIX auth/signup HTTP contract, replaces Django-only dependencies with explicit backend abstractions, updates the frontend to call the deployed API base cleanly, and verifies the migrated behavior with focused tests.
