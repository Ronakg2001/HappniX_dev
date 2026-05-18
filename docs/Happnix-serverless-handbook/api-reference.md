# HappniX Serverless API Reference

> **Note on Required Fields:** Headers or Data fields marked with `*` are mandatory.
> **Note on Error Handling:** To prevent the app from crashing, the frontend should always check the `Status Code`. Any `4xx` or `5xx` code will return a standard error JSON `{"message": "Error description"}` which should be displayed to the user as a toast/alert, or used to redirect the user to a safe previous page.

## Authentication & Signup
*(Note: These are handled by the `SignupSignin` Lambda. In your single-endpoint routing setup, you call `POST /api/auth` and include `"actionItem": "EndpointName"` in the Request Data).*

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/auth/mobile/send-otp` | POST | `Content-Type: application/json`* | `{ "mobile": "9876543210"* }` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"message": "OTP sent successfully..."}`<br>`{"message": "Please enter a valid..."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/mobile/verify-otp` | POST | `Content-Type: application/json`* | `{ "mobile": "9876543210"*, "otp": "123456"* }` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"message": "Mobile OTP verified.", "userStatus": "existing"}`<br>`{"message": "Invalid OTP."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/mobile/resend-otp` | POST | `Content-Type: application/json`* | `{ "mobile": "9876543210"* }` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"message": "OTP resent to..."}`<br>`{"message": "Please enter a valid..."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/username/login` | POST | `Content-Type: application/json`* | `{ "identifier": "user"*, "password": "pw"* }` | **200** (OK)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Signed in successfully..."}`<br>`{"message": "Invalid username/email or password."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/password/forgot` | POST | `Content-Type: application/json`* | `{ "email": "user@example.com"* }` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"message": "Verification email request accepted..."}`<br>`{"message": "Please enter a valid email."}`<br>`{"message": "Internal server error"}` |
| `/api/signup/details` | POST | `Content-Type: application/json`* | `{ "fullName"*, "username"*, "password"*, "sex"*, "dateOfBirth"*, "email"*, "govId" }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Details saved..."}`<br>`{"message": "Username already exists."}`<br>`{"message": "Signup session expired."}`<br>`{"message": "Internal server error"}` |
| `/api/signup/profile` | POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "skip": false, "bio": "", "profilePictureUrl": "" }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Profile setup completed."}`<br>`{"message": "Profile setup session not found."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/aadhaar/send-otp` | POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "aadhaarNumber": "123412341234"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "OTP sent successfully..."}`<br>`{"message": "Please enter a valid 12-digit..."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |
| `/api/auth/aadhaar/verify-otp`| POST | `Content-Type: application/json`*<br>`Cookie: happnix_session`* | `{ "otp": "123456"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Aadhaar verified successfully!"}`<br>`{"message": "Invalid OTP."}`<br>`{"message": "Please sign in first."}`<br>`{"message": "Internal server error"}` |

## Events APIs

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/events/create` | POST | `multipart/form-data`*<br>`Authorization: Bearer`* | `title`*, `description`*, `locationName`*, `price`*, `startLabel`*, `endLabel`*, `vibeCover`* | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Event created...", "event": {...}}`<br>`{"message": "Missing required fields."}`<br>`{"message": "Unauthorized access."}`<br>`{"message": "Internal server error"}` |
| `/api/events/live` | GET | `None` | `None` | **200** (OK)<br>**500** (Error) | `{"count": 2, "events": [...]}`<br>`{"message": "Internal server error"}` |
| `/api/events/nearby` | GET | `None` | `?latitude=*`<br>`&longitude=*`<br>`&radiusKm=*` | **200** (OK)<br>**400** (Bad Req)<br>**500** (Error) | `{"radiusKm": 10, "events": [...]}`<br>`{"message": "Missing coordinates."}`<br>`{"message": "Internal server error"}` |

## Tickets APIs

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/tickets/book` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "eventId"*, "inviteeUserIds": [], "tierName"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**409** (Conflict)<br>**500** (Error) | `{"message": "Ticket booked...", "ticket": {...}}`<br>`{"message": "Invalid event ID."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "You already have this event."}`<br>`{"message": "Internal server error"}` |
| `/api/tickets/<id>/pay` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "payForTicketIds"*, "tierName"*, "ticketPrice"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{"message": "Payment completed...", "ticket": {...}}`<br>`{"message": "Selected tickets are already confirmed."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |

## Messaging APIs

| API / Endpoint | Method | Request Header | Request Data | Status Code | Response Data |
|---|---|---|---|---|---|
| `/api/messages/conversations/start` | POST | `Content-Type: application/json`*<br>`Authorization: Bearer`* | `{ "recipientId"* }` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `{ "id": 1, "otherUser": {...} }`<br>`{"message": "Invalid recipient."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |
| `/api/messages/groups/<id>/messages`| GET | `Authorization: Bearer`* | `None` | **200** (OK)<br>**400** (Bad Req)<br>**401** (Unauth)<br>**500** (Error) | `[ { "id": 1, "body": "Hello", ... } ]`<br>`{"message": "Group not found."}`<br>`{"message": "Unauthorized."}`<br>`{"message": "Internal server error"}` |
