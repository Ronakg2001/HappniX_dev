# HappniX Serverless API Reference

> **Note on Required Fields:** Headers or Data fields marked with `*` are mandatory.
> **Note on Error Handling:** To prevent the app from crashing, the frontend should always check the `Status Code`. Any `4xx` or `5xx` code will return a standard error JSON `{"message": "Error description"}` which should be displayed to the user as a toast/alert, or used to redirect the user to a safe previous page.

## Authentication & Signup
*(Note: These are handled by the `SignupSignin` Lambda via a single `POST /api/auth` endpoint utilizing `actionItem` routing).*

| API / Endpoint | Method | Request Header | Request Data (`actionItem`) | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/auth` | POST | `X-HappniX-PreAuth` | `SendMobileOtp`, `"mobile": "9876543210"*` | **200** (OK)<br>**400** (Bad Req) | `{"message": "OTP sent to..."}` |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `VerifyMobileOtp`, `"mobile": "9876543210"*, "otp": "123456"*` | **200** (OK)<br>**400** (Bad Req) | `{"message": "Mobile verified.", "userStatus": "existing" / "new"}` |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `ResendMobileOtp`, `"mobile": "9876543210"*` | **200** (OK)<br>**400** (Bad Req) | `{"message": "OTP resent to..."}` |
| `/api/auth` | POST | None | `LoginWithPassword`, `"identifier": "user"*, "password": "pw"*` | **200** (OK)<br>**401** (Unauth) | `{"accessToken": "...", "idToken": "..."}` |
| `/api/auth` | POST | None | `CheckUsername`, `"username": "ronak"*` | **200** (OK) | `{"available": true, "success": true}` |
| `/api/auth` | POST | `X-HappniX-PreAuth`* | `RegisterUserDetails`, `"username"*, "fullName"*, "dateOfBirth"*, "email"*, "password"*, "mobile"*, "gender"*` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**409** (Conflict) | `{"message": "Account created successfully..."}` |

## Events APIs
*(Note: These are handled by the `EventsApi` Lambda).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/events/create` | POST | `multipart/form-data`*<br>`Authorization: Bearer`* | `title`*, `description`*, `locationName`*, `price`*, `startLabel`*, `endLabel`*, `vibeCover`* | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Event created...", "event": {...}}`<br>`{"message": "Missing required fields."}`<br>`{"message": "Unauthorized access."}`<br>`{"message": "Internal server error"}` |
| `/api/events/live` | GET | `None` | `None` | **200** (OK)<br>**500** (Error) | `{"count": 2, "events": [...]}`<br>`{"message": "Internal server error"}` |
| `/api/events/nearby` | GET | `None` | `?geohash=*`<br>`&radiusKm=*` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"geohash": "tps", "events": [...]}`<br>`{"message": "Missing parameters."}`<br>`{"message": "Internal server error"}` |
| `/api/events/mine` | GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**401** (Unauth)<br>**500** (Error) | `{"count": 5, "events": [...]}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |

## Tickets APIs
*(Note: These are handled by the `EventsApi` Lambda).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/tickets/book` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "eventId"*, "inviteeUserIds": [], "tierName"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**409** (Conflict)<br>**500** (Error) | `{"message": "Ticket booked...", "ticket": {...}}`<br>`{"message": "Invalid event ID."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "You already have this event."}`<br>`{"message": "Internal server error"}` |
| `/api/tickets/<id>/pay` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "payForTicketIds"*, "tierName"*, "ticketPrice"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Payment completed...", "ticket": {...}}`<br>`{"message": "Selected tickets are already confirmed."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |

## Profiles & Settings APIs
*(Note: These are handled by the `ProfileApi` Lambda).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/profile/<id>` | GET | `None` | `None` | **200** (OK)<br>**404** (Not Found)<br>**500** (Error) | `{ "userId": "...", "userName": "...", "bio": "..." }`<br>`{"message": "Profile not found."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/verify/aadhaar/send` | POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "aadhaarNumber": "123412341234"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "OTP sent successfully..."}`<br>`{"message": "Please enter a valid 12-digit..."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/verify/aadhaar/verify` | POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "otp": "123456"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Aadhaar verified successfully!"}`<br>`{"message": "Invalid OTP."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/picture/upload` | POST | `Content-Type: multipart/form-data`*<br>`Cookie: happnix_session`* | `file`* | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Profile picture uploaded."}`<br>`{"message": "Upload failed."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/notifications` | GET | `Cookie: happnix_session`* | `None` | **200** (OK)<br>**401** (Unauth)<br>**500** (Error) | `{"count": 2, "notifications": [...]}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/profile/notifications/read` | POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "notificationIds": []* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Notifications marked as read."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |

## Messaging APIs
*(Note: These are handled by the `MessagingApi` Lambda).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/messages/conversations/start` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "recipientId"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{ "id": 1, "otherUser": {...} }`<br>`{"message": "Invalid recipient."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |
| `/api/messages/groups/<id>/messages`| GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `[ { "id": 1, "body": "Hello", ... } ]`<br>`{"message": "Group not found."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |
