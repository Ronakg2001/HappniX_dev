# Backend Auth Progress

## Current Scope

- Lambda entry file: `backend/SignupSignin.py`
- Frontend clients:
  - `web_frontend/signup_signin.js`
  - `web_frontend/signup_details.js`
  - `web_frontend/signup_profile_optional.js`

## API Inventory

| Method | Path | Frontend file | Lambda handler | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/mobile/send-otp` | `web_frontend/signup_signin.js` | `send_mobile_otp` | Start OTP sign-in and create or resume a session cookie | `{ "mobile": "9876543210" }` | `{ "message": "OTP sent successfully to 9876543210.", "debugOtp": "123456" }` in non-prod |
| POST | `/api/auth/mobile/resend-otp` | `web_frontend/signup_signin.js` | `resend_mobile_otp` | Replace the current OTP for a mobile number in the active session | `{ "mobile": "9876543210" }` | `{ "message": "OTP resent to 9876543210.", "debugOtp": "123456" }` in non-prod |
| POST | `/api/auth/mobile/verify-otp` | `web_frontend/signup_signin.js` | `verify_mobile_otp` | Verify OTP, then branch to existing-user home or new-user signup details | `{ "mobile": "9876543210", "otp": "123456" }` | Existing user: `{ "message": "Welcome back, Name! Mobile OTP verified.", "userStatus": "existing", "canCreateOrJoinParties": false, "redirectUrl": "/home/" }`; new user: `{ "message": "Mobile OTP verified. User not found; continue sign up.", "userStatus": "new", "canCreateOrJoinParties": false, "redirectUrl": "/signup/details/" }` |
| POST | `/api/auth/password/forgot` | `web_frontend/forgot_password.js` | `forgot_password_request` | Accept forgot-password requests with privacy-safe messaging | `{ "email": "user@example.com" }` | `{ "message": "Verification email request accepted. Please check your inbox." }` or `{ "message": "If this email is registered, verification instructions will be sent." }` |
| POST | `/api/auth/username/login` | `web_frontend/signup_signin.js` | `login_with_password` | Sign in an existing user by username or email plus password | `{ "identifier": "username-or-email", "password": "Secret123!" }` | `{ "message": "Signed in successfully. Welcome, Name.", "userStatus": "existing", "canCreateOrJoinParties": false, "redirectUrl": "/home/" }` |
| POST | `/api/signup/details` | `web_frontend/signup_details.js` | `register_user_details` | Create a user after OTP verification and move the flow to profile completion | `{ "fullName": "User Name", "username": "username", "password": "Secret123!", "sex": "mr.", "dateOfBirth": "2000-01-01", "email": "user@example.com", "govId": "ABC1234" }` | `{ "message": "Details saved successfully. You can add profile details next.", "canCreateOrJoinParties": false, "redirectUrl": "/signup/profile/" }` |
| POST | `/api/signup/profile` | `web_frontend/signup_profile_optional.js` | `complete_profile_setup` | Save optional profile metadata or skip the step | `{ "skip": false, "profilePictureUrl": "https://example.com/pic.jpg", "bio": "About me" }` or `{ "skip": true }` | `{ "message": "Profile setup completed.", "canCreateOrJoinParties": false, "redirectUrl": "/home/" }` |
| POST | `/api/auth/aadhaar/send-otp` | future Aadhaar/KYC client | `send_aadhaar_otp_api` | Start the Aadhaar verification flow for an authenticated user | `{ "aadhaarNumber": "123412341234" }` | `{ "message": "OTP sent successfully to mobile linked with Aadhaar ending in 1234." }` |
| POST | `/api/auth/aadhaar/verify-otp` | future Aadhaar/KYC client | `verify_aadhaar_otp_api` | Verify the Aadhaar OTP and unlock verified-party actions | `{ "otp": "123456" }` | `{ "message": "Aadhaar verified successfully! You can now host and join parties.", "isVerified": true, "canCreateOrJoinParties": true }` |

## Frontend Attachments

- `web_frontend/signup_signin.js`
  - `/api/auth/mobile/send-otp`
  - `/api/auth/mobile/resend-otp`
  - `/api/auth/mobile/verify-otp`
  - `/api/auth/username/login`
- `web_frontend/forgot_password.js`
  - `/api/auth/password/forgot`
- `web_frontend/signup_details.js`
  - `/api/signup/details`
- `web_frontend/signup_profile_optional.js`
  - `/api/signup/profile`

## Response And Exception Flow

- Every Lambda response now carries `X-Happnix-Trace-Id` in headers so a frontend/API error can be matched to a specific backend log line.
- Error responses created through `_error(...)` include:
  - `message`
  - `traceId` when the request reached the Lambda wrapper
- `lambda_handler(...)` now centrally handles:
  - unknown routes as `404`
  - malformed JSON bodies as `400` with `Invalid JSON body.`
  - unexpected runtime exceptions as `500` with `Internal server error.`
- `lambda_handler(...)` also prints structured JSON logs for:
  - incoming request
  - request completed
  - invalid JSON body
  - unhandled exception with traceback
- This makes it easier to trace request flow without adding route-specific `try/except` blocks everywhere.
- Aadhaar endpoints are covered by the same trace flow now, so both success and failure responses from:
  - `/api/auth/aadhaar/send-otp`
  - `/api/auth/aadhaar/verify-otp`
  also include `traceId` in the JSON body and `X-Happnix-Trace-Id` in headers.

## Test Coverage

- Test file: `tests/test_signup_signin_lambda.py`
- Current automated coverage includes:
  - valid mobile OTP send
  - invalid mobile OTP send
  - new-user OTP verification redirect
  - existing-user OTP verification redirect
  - invalid password login
  - signup details without pending session
  - profile completion without authenticated user
  - route table registration for `/api/signup/profile`
  - malformed JSON returns traceable `400`
  - unhandled exception returns traceable `500`
  - Aadhaar OTP send without authentication
  - Aadhaar OTP send with invalid Aadhaar number
  - Aadhaar OTP send success for authenticated user
  - Aadhaar OTP verification failure for wrong OTP
  - Aadhaar OTP verification success with verified-party access enabled

## Latest Verification

- Command run:
  - `python -m unittest tests.test_signup_signin_lambda -v`
- Latest result:
  - `15` tests passed
  - `0` failures

## Lambda Functions

| Function | Purpose | Inputs | Output |
| --- | --- | --- | --- |
| `lambda_handler` | Route API Gateway events to the correct auth/signup handler | `event`, `context` | API Gateway response dict with `statusCode`, `headers`, and JSON `body` |
| `_json_response` | Build a JSON response envelope | `status_code`, `payload` | Response dict |
| `_error` | Build a standard error payload with a message | `message`, optional `status_code` | Error response dict |
| `_parse_body` | Parse the incoming JSON request body | API Gateway `event` | Python dict |
| `_route_key` | Normalize the request into a route lookup key | API Gateway `event` | Tuple of `(method, path)` |
| `_trace_id` | Resolve or generate a trace ID for the request | API Gateway `event` | Trace ID string |
| `_log_trace` | Emit structured logs for request lifecycle and failures | `level`, `trace_id`, `message`, optional metadata | log line written via `print(...)` |
| `_generate_otp` | Produce a 6-digit OTP for dev compatibility flows | no parameters | OTP string |
| `_set_session_cookie` | Attach the `happnix_session` cookie to a response | `response`, `session_token` | Response dict with `Set-Cookie` |
| `_extract_session_token` | Read the session token from request cookies | API Gateway `event` | Session token string or `None` |
| `_get_or_create_session` | Reuse an existing session or create a new one | API Gateway `event` | `(session_token, session_dict)` |
| `_save_session` | Persist session mutations through the dev store | `token`, `session` | no return value |
| `_with_session` | Return a JSON response and attach the active session cookie | `status_code`, `payload`, `session_token` | Response dict |
| `_is_valid_email` | Lightweight email validation for forgot-password and signup flows | `email` | Boolean |
| `_is_strong_password` | Enforce the migrated password-strength rule | `password` | Boolean |
| `_current_user` | Resolve the authenticated user from the active session | API Gateway `event` | `(session_token, session_dict, user_dict_or_none)` |
| `_can_create_or_join_parties` | Derive the permission flag from KYC verification state | `user` | Boolean |
| `send_mobile_otp` | Validate a mobile number, generate OTP, and store it in session state | API Gateway `event` with `mobile` JSON body | Success or validation-error response |
| `resend_mobile_otp` | Replace the stored OTP for the active mobile auth session | API Gateway `event` with `mobile` JSON body | Success or validation-error response |
| `verify_mobile_otp` | Validate OTP and branch into existing-user sign-in or new-user signup continuation | API Gateway `event` with `mobile` and `otp` | Auth flow response with `userStatus` and `redirectUrl` |
| `forgot_password_request` | Accept forgot-password email requests with safe messaging | API Gateway `event` with `email` | Status response |
| `login_with_password` | Authenticate a user by username/email and password | API Gateway `event` with `identifier` and `password` | Existing-user login response |
| `register_user_details` | Create the compatibility user/profile record after OTP verification | API Gateway `event` with signup detail fields | Signup completion step response |
| `complete_profile_setup` | Save or skip optional profile details for the authenticated user | API Gateway `event` with `skip`, optional `bio`, optional `profilePictureUrl` | Completion response |
| `send_aadhaar_otp_api` | Start Aadhaar verification for the authenticated user in compatibility mode | API Gateway `event` with optional `aadhaarNumber` | KYC OTP-send response |
| `verify_aadhaar_otp_api` | Complete Aadhaar verification in compatibility mode | API Gateway `event` with `otp` | Verification response |

## Supporting Store Module

- `backend/dev_store.py`
  - Persists compatibility auth state in JSON for development and deployment testing.
  - Owns session creation, password hashing, user lookup, user creation, and profile updates.
  - Reads `HAPPNIX_DEV_STORE_PATH` when tests need isolated state files.
