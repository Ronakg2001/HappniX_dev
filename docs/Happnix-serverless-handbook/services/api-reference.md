# HappniX Serverless API Reference

> **Note on Required Fields:** Headers or Data fields marked with `*` are mandatory.
> **Note on Error Handling:** To prevent the app from crashing, the frontend should always check the `Status Code`. Any `4xx` or `5xx` code will return a standard error JSON `{"message": "Error description"}` which should be displayed to the user as a toast/alert, or used to redirect the user to a safe previous page.

## Authentication & Signup
*(Note: These are handled by the `SignupSignin` Lambda via a single `POST /api/auth` endpoint utilizing `actionItem` routing).*

| API / Endpoint | Method | Request Header | Request Data (`actionItem`) | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/auth` | POST | `X-HappniX-PreAuth` | `SendMobileOtp`, `"mobile": "9876543210"*`, `"region": "IN"` | **200** (OK)<br>**400** (Bad Req) | `{"success": true, "message": "OTP sent to..."}` + `X-HappniX-PreAuth` header |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `VerifyMobileOtp`, `"mobile": "9876543210"*`, `"otp": "123456"*` | **200** (OK)<br>**400** (Bad Req) | `{"success": true, "userStatus": "existing" / "new", "redirectUrl": "/signin?view=password" / "/signup"}` |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `ResendMobileOtp`, `"mobile": "9876543210"*` | **200** (OK)<br>**400** (Bad Req) | `{"success": true, "message": "OTP resent to..."}` + `X-HappniX-PreAuth` header |
| `/api/auth` | POST | None | `LoginWithPassword`, `"identifier": "user"*`, `"password": "pw"*` | **200** (OK)<br>**401** (Unauth)<br>**404** (Not Found) | `{"accessToken": "...", "refreshToken": "...", "idToken": "...", "expiresIn": 3600, "tokenType": "Bearer", "redirectUrl": "/home_page.html"}` |
| `/api/auth` | POST | None | `CheckUsername`, `"username": "ronak"*` | **200** (OK) | `{"available": true, "success": true}` |
| `/api/auth` | POST | None | `GetCountryCodes` | **200** (OK) | `{"success": true, "countries": {...}}` |
| `/api/auth` | POST | None | `RefreshToken`, `"refreshToken": "..."*` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth) | `{"accessToken": "...", "refreshToken": "...", "idToken": "...", "expiresIn": 3600, "tokenType": "Bearer"}` |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `RegisterUserDetails`, `"username"*`, `"fullName"*`, `"dateOfBirth"*`, `"email"*`, `"password"*`, `"mobile"*`, `"gender"*`, `"region"*` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**409** (Conflict) | `{"success": true, "message": "Account created successfully.", "accessToken": "...", "refreshToken": "...", "idToken": "...", "expiresIn": 3600, "tokenType": "Bearer", "redirectUrl": "/login.html"}` |

## Home Page APIs
*(Note: These are handled by the `HomePageApi` Lambda. Currently a stub for most routes — only feed and logout are implemented).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/home/feed` | GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**401** (Unauth) | `{"success": true, "profile": {...}, "feed": [...]}` |
| `/api/home/logout` | POST | `Authorization: Bearer` | `{ "actionItem": "Logout" }` | **200** (OK) | `{"success": true, "message": "Logged out globally."}` |

## Events APIs
*(Note: These are handled by the `EventsApi` Lambda. Currently returns 501 — not yet implemented).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/events/create` | POST | `Authorization: Bearer`* | `title`*, `description`*, `locationName`*, `price`*, `startLabel`*, `endLabel`*, `vibeCover`* | **501** (Not Implemented) | `{"message": "Events handler not implemented yet."}` |
| `/api/events/live` | GET | `None` | `None` | **501** | — |
| `/api/events/nearby` | GET | `None` | `?geohash=*`<br>`&radiusKm=*` | **501** | — |
| `/api/events/mine` | GET | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/events/{id}` | GET | `None` | `None` | **501** | — |
| `/api/events/{id}` | DELETE | `Authorization: Bearer`* | `None` | **501** | — |

## Profiles & Settings APIs
*(Note: These are handled by the `ProfileApi` Lambda. Uses `Authorization: Bearer` for all endpoints.)*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/profile/me` | GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**401** (Unauth)<br>**404** (Not Found)<br>**500** (Error) | `{"success": true, "profile": {...}}` |
| `/api/profile/me` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "actionItem": "getUserProfile"* }` | **200** (OK)<br>**500** (Error) | `{"success": true, "profile": {...}}` |
| `/api/profile/me` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "actionItem": "update_user_profile"*, ...updates }` Allowed fields: `bio`, `isPrivate`, `accountType`, `pronoun`, `socialLinks`, `name`, `username`, `dob`, `gender`, `updateAvatar` | **200** (OK)<br>**401** (Unauth)<br>**500** (Error) | `{"success": true, "message": "Profile updated successfully.", "profile": {...}}`<br>If `updateAvatar: true`: also returns `"avatarUploadUrl": "..."` |
| `/api/profile/me` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "actionItem": "check_username"*, "target_username": "ronak"* }` | **200** (OK)<br>**500** (Error) | `{"success": true, "available": true}` |
| `/api/profile/me` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "actionItem": "deleteAccount"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"success": true, "message": "Account has been successfully deleted.", "redirectUrl": "/signin"}`<br>`{"message": "Missing user identifiers."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/{id}` | GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**404** (Not Found)<br>**500** (Error) | `{ "userId": "...", "userName": "...", "bio": "..." }` |
| `/api/profile/verify/aadhaar/send` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "aadhaarNumber": "123412341234"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "OTP sent successfully..."}` |
| `/api/profile/verify/aadhaar/verify` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "otp": "123456"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Aadhaar verified successfully!"}` |
| `/api/profile/picture/upload` | POST | `Content-Type: multipart/form-data`*<br>`Authorization: Bearer`* | `file`* | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Profile picture uploaded."}` |
| `/api/profile/notifications` | GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**401** (Unauth)<br>**500** (Error) | `{"count": 2, "notifications": [...]}` |
| `/api/profile/notifications/read` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "notificationIds": []* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Notifications marked as read."}` |

## Messaging APIs
*(Note: These are handled by the `MessagingApi` Lambda. Currently returns 501 — not yet implemented).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/messages/conversations` | GET | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/conversations/start` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "recipientId"* }` | **501** | — |
| `/api/messages/conversations/{id}/messages`| GET | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/conversations/{id}/messages`| POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "body"* }` | **501** | — |
| `/api/messages/conversations/{id}/read` | POST | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/messages/{id}/edit` | POST | `Authorization: Bearer`* | `{ "body"* }` | **501** | — |
| `/api/messages/messages/{id}/forward` | POST | `Authorization: Bearer`* | `{ "targetConversationId"* }` | **501** | — |
| `/api/messages/messages/{id}/delete` | POST | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/messages/{id}/unsend` | POST | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/groups/create` | POST | `Authorization: Bearer`* | `{...}` | **501** | — |
| `/api/messages/groups/{id}/messages` | GET | `Authorization: Bearer`* | `None` | **501** | — |
| `/api/messages/groups/{id}/{action}` | POST | `Authorization: Bearer`* | `{...}` | **501** | — |
| `/api/messages/group-messages/{id}/{action}` | POST | `Authorization: Bearer`* | `{...}` | **501** | — |
