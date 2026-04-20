# API Reference

This file documents the HTTP and WebSocket surface of the app.
Where exact JSON contracts are not centrally declared, request and response shapes are marked as inferred from backend code and frontend callers.

## Route Registry

- Project URL root: `Happnix_party_APP/urls.py`
- App URL registry: `HAPPNIX/urls.py`
- WebSocket routes: `HAPPNIX/routing.py`

## Code Reference Index

Use this section when you want to jump from the docs into the backend code quickly.

### Authentication And Signup

| Route | URL mapping | Handler |
| --- | --- | --- |
| `/api/auth/mobile/send-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:10) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:49) |
| `/api/auth/mobile/verify-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:11) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:95) |
| `/api/auth/mobile/resend-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:12) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:73) |
| `/api/auth/password/forgot` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:13) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:26) |
| `/api/auth/username/login` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:14) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:146) |
| `/api/signup/details` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:15) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:179) |
| `/api/signup/profile` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:16) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:261) |
| `/api/auth/aadhaar/send-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:81) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:301) |
| `/api/auth/aadhaar/verify-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:82) | [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:353) |

### Events, Tickets, Guests, Profiles, Settings, Notifications

| Route | URL mapping | Handler |
| --- | --- | --- |
| `/api/guest-invites` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:30) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:698) |
| `/api/guest-invites/<token>/send-mobile-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:31) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:747) |
| `/api/guest-invites/<token>/verify-mobile-otp` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:32) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:766) |
| `/api/guest-invites/<token>/onboarding` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:33) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:783) |
| `/api/guest-invites/<token>/pay` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:34) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:812) |
| `/api/guest-invites/<token>/pay-by-owner` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:35) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:827) |
| `/api/guest-invites/<token>/cancel` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:36) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:848) |
| `/api/guest-invites/<token>/cancel-by-owner` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:37) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:861) |
| `/api/generate-invite/` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:38) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:881) |
| `/api/guest-submit/<token>/` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:40) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:931) |
| `/api/events/create` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:17) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1051) |
| `/api/events/<event_id>` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:18) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1268) |
| `/api/events/live` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:21) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1300) |
| `/api/events/nearby` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:20) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1328) |
| `/api/events/mine` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:19) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1396) |
| `/api/users/search` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:42) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1684) |
| `/api/users/follow` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:43) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1728) |
| `/api/profile/<graph_type>` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:53) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1867) |
| `/api/users/<user_id>/profile` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:44) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1890) |
| `/api/profile/update` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:47) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1907) |
| `/api/profile/privacy` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:46) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1955) |
| `/api/profile/follow-requests` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:48) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1976) |
| `/api/notifications` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:51) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2039) |
| `/api/notifications/activity` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:52) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2065) |
| `/api/tickets` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:22) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2105) |
| `/api/tickets/book` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:23) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2135) |
| `/api/tickets/<ticket_id>/pay` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:25) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2300) |
| `/api/tickets/<ticket_id>/archive` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:28) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2382) |
| `/api/tickets/<ticket_id>/delete` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:29) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2404) |
| `/api/tickets/<ticket_id>/cancel` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:27) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2426) |
| `/api/tickets/<ticket_id>/group` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:26) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2456) |
| `/api/settings/preferences` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:49) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2607) |
| `/api/settings/people/<category>` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:50) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2644) |
| `/api/profile/me` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:45) | [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:2714) |

### Direct Messaging

| Route | URL mapping | Handler |
| --- | --- | --- |
| `/api/messages/conversations` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:54) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:421) |
| `/api/messages/conversations/start` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:55) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:440) |
| `/api/messages/conversations/<conversation_id>/messages` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:56) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:464) |
| `/api/messages/conversations/<conversation_id>/read` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:57) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:697) |
| `/api/messages/messages/<message_id>/edit` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:58) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:538) |
| `/api/messages/messages/<message_id>/forward` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:59) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:575) |
| `/api/messages/messages/<message_id>/delete` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:60) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:633) |
| `/api/messages/messages/<message_id>/unsend` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:61) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:656) |
| `/api/messages/conversations/<conversation_id>/clear` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:62) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:716) |
| `/api/messages/conversations/<conversation_id>/delete` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:63) | [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:740) |

### Group Chat

| Route | URL mapping | Handler |
| --- | --- | --- |
| `/api/messages/groups/create` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:64) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:530) |
| `/api/messages/groups/<group_id>` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:65) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:558) |
| `/api/messages/groups/<group_id>/messages` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:66) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:569) |
| `/api/messages/groups/<group_id>/members` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:67) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:613) |
| `/api/messages/groups/<group_id>/members/<member_user_id>/role` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:68) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:656) |
| `/api/messages/groups/<group_id>/members/<member_user_id>/remove` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:69) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:688) |
| `/api/messages/groups/<group_id>/rename` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:70) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:714) |
| `/api/messages/groups/<group_id>/leave` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:71) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:739) |
| `/api/messages/groups/<group_id>/clear` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:72) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:766) |
| `/api/messages/groups/<group_id>/delete` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:73) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:783) |
| `/api/messages/group-messages/<message_id>/edit` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:74) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:799) |
| `/api/messages/group-messages/<message_id>/delete` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:75) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:833) |
| `/api/messages/group-messages/<message_id>/unsend` | [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:76) | [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:852) |

## Shared Response Patterns

### Standard error shape

Most endpoints use `utils._error(...)` and return:

```json
{ "message": "Human-readable error text" }
```

with a non-200 status code.

### Common serialized objects

#### Event object

Built by: `views._serialize_event(...)`

```json
{
  "id": 12,
  "eventId": "uuid-string",
  "userId": 3,
  "hostUsername": "host_user",
  "title": "Sunset Party",
  "description": "Rooftop event",
  "startLabel": "2026-04-13 19:30",
  "endLabel": "2026-04-13 23:59",
  "startAt": "2026-04-13T19:30:00+05:30",
  "endAt": "2026-04-13T23:59:00+05:30",
  "eventCategory": "party",
  "locationName": "Mumbai",
  "latitude": 19.076,
  "longitude": 72.8777,
  "price": 499.0,
  "currency": "INR",
  "ticketType": "Paid",
  "ticketTiers": [
    { "name": "General", "price": 499.0, "qty": "100", "flex": false, "services": "" }
  ],
  "maxAttendees": 100,
  "ticketsSold": 20,
  "status": "published",
  "isEnded": false,
  "canBook": true,
  "imageUrl": "/media/events/3/file.jpg",
  "mediaUrls": ["/media/events/3/file.jpg"],
  "isActive": true,
  "createdAt": "2026-04-13T10:00:00+05:30",
  "updatedAt": "2026-04-13T10:00:00+05:30",
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=19.076,72.8777"
}
```

#### Ticket object

Built by: `views._serialize_ticket(...)`

```json
{
  "id": 5,
  "groupCode": "uuid-or-ticket-id",
  "qrCodeSvg": "<svg...>",
  "status": "active",
  "qty": 1,
  "userId": 7,
  "username": "guest_user",
  "bookedById": 3,
  "bookedByUsername": "host_user",
  "paidById": 3,
  "paidByUsername": "host_user",
  "tierName": "General",
  "inviteStatus": "confirmed",
  "pendingReason": "",
  "ticketPrice": 499.0,
  "serviceFee": 29.0,
  "amountDue": 528.0,
  "paymentTransactionId": "PAY-ABC123",
  "refundTransactionId": "",
  "createdAt": "2026-04-13T10:00:00+05:30",
  "cancelledAt": null,
  "archivedAt": null,
  "isExpired": false,
  "canPay": false,
  "participants": [],
  "guestInvites": [],
  "event": {}
}
```

#### Guest invite object

Built by: `views._serialize_guest_invite_for_response(...)`

```json
{
  "id": 4,
  "inviteToken": "uuid-token",
  "eventId": 12,
  "parentTicketId": 5,
  "inviteStatus": "onboarded",
  "paymentStatus": "PENDING",
  "mobileOtpVerified": true,
  "onboardingCompleted": true,
  "inviteLink": "http://host/guest-invite/uuid-token/",
  "ticketUrl": "http://host/guest-ticket/uuid-token/",
  "fullName": "Guest Name",
  "mobileNumber": "9876543210",
  "email": "guest@example.com",
  "paidByUserId": null,
  "paidByGuest": false,
  "canPay": true,
  "canCancel": true
}
```

#### Direct conversation object

Built by: `messaging._serialize_conversation(...)`

Contains:

- `id`
- `createdAt`
- `updatedAt`
- `otherUser`
- `lastMessage`
- `previewText`
- `unreadCount`

#### Direct message object

Built by: `messaging._serialize_message(...)`

Contains:

- `id`
- `conversationId`
- `body`
- `senderId`
- `senderUsername`
- `isOwn`
- `isEdited`
- `isUnsent`
- `isForwarded`
- `forwardedFrom`
- `repliedTo`
- `hasAttachments`
- `attachments`
- `createdAt`
- `updatedAt`
- `readAt`
- `editedAt`
- `unsentAt`
- `canEdit`
- `canDelete`
- `canUnsend`
- `canForward`
- `canReply`

#### Group conversation object

Built by: `group_chat._serialize_group_conversation(...)`

Contains:

- `id`
- `kind`
- `groupId`
- `title`
- `description`
- `avatarUrl`
- `createdByUserId`
- `createdAt`
- `updatedAt`
- `otherUser`
- `lastMessage`
- `previewText`
- `unreadCount`
- `memberCount`
- `adminCount`
- `members`
- `adminUserIds`
- `permissions`

#### Group message object

Built by: `group_chat._serialize_group_message(...)`

Contains:

- `id`
- `conversationId`
- `conversationKind`
- `groupId`
- `body`
- `senderId`
- `senderUsername`
- `senderFullName`
- `senderProfilePictureUrl`
- `isOwn`
- `isEdited`
- `isUnsent`
- `repliedTo`
- `hasAttachments`
- `attachments`
- `createdAt`
- `updatedAt`
- `deliveredCount`
- `readCount`
- `deliveredTo`
- `readBy`
- `editedAt`
- `unsentAt`
- `canEdit`
- `canDelete`
- `canUnsend`
- `canReply`

## Page Routes

| Route | Handler | Purpose |
| --- | --- | --- |
| `/` | `views.index_page` | Landing page for unauthenticated users |
| `/signin/` | `views.Signup_signin_page` | Auth screen |
| `/signin/forgot_password/` | `views.forgot_password` | Forgot password page |
| `/signup/details/` | `views.signup_details_page` | Signup step 2 |
| `/signup/profile/` | `views.signup_profile_page` | Optional profile completion |
| `/location/custom/` | `views.custom_location_page` | Custom location page |
| `/party-loader-demo/` | `views.party_loader_demo_page` | Loader demo page |
| `/home/` | `views.Home_page` | Main authenticated app shell |
| `/logout/` | `views.logout_view` | Logout and redirect |
| `/ticket/<ticket_id>/` | `views.view_ticket_page` | Ticket display page |
| `/guest-invite/<invite_token>/` | `views.guest_invite_page` | Guest onboarding page |
| `/guest-ticket/<invite_token>/` | `views.guest_ticket_page` | Guest ticket page |

## Authentication And Signup APIs

### `POST /api/auth/mobile/send-otp`

- Handler: `signin_signup.send_mobile_otp`
- Request:
  ```json
  { "mobile": "9876543210" }
  ```
- Response:
  ```json
  { "message": "OTP sent successfully to 9876543210.", "debugOtp": "123456" }
  ```

### `POST /api/auth/mobile/resend-otp`

- Handler: `signin_signup.resend_mobile_otp`
- Request:
  ```json
  { "mobile": "9876543210" }
  ```
- Response:
  ```json
  { "message": "OTP resent to 9876543210.", "debugOtp": "123456" }
  ```

### `POST /api/auth/mobile/verify-otp`

- Handler: `signin_signup.verify_mobile_otp`
- Request:
  ```json
  { "mobile": "9876543210", "otp": "123456" }
  ```
- Existing-user response:
  ```json
  {
    "message": "Welcome back, User! Mobile OTP verified.",
    "userStatus": "existing",
    "canCreateOrJoinParties": true,
    "redirectUrl": "/home/"
  }
  ```
- New-user response:
  ```json
  {
    "message": "Mobile OTP verified. User not found; continue sign up.",
    "userStatus": "new",
    "canCreateOrJoinParties": false,
    "redirectUrl": "/signup/details/"
  }
  ```

### `POST /api/auth/username/login`

- Handler: `signin_signup.login_with_password`
- Request:
  ```json
  { "identifier": "username-or-email", "password": "Secret123!" }
  ```
- Response:
  ```json
  {
    "message": "Signed in successfully. Welcome, User.",
    "userStatus": "existing",
    "canCreateOrJoinParties": true,
    "redirectUrl": "/home/"
  }
  ```

### `POST /api/auth/password/forgot`

- Handler: `signin_signup.forgot_password_request`
- Request:
  ```json
  { "email": "user@example.com" }
  ```
- Response:
  ```json
  { "message": "Verification email request accepted. Please check your inbox." }
  ```
- Notes:
  - this endpoint currently returns status messaging only

### `POST /api/signup/details`

- Handler: `signin_signup.register_user_details`
- Request:
  ```json
  {
    "fullName": "User Name",
    "username": "username",
    "password": "Secret123!",
    "sex": "mr.",
    "dateOfBirth": "2000-01-01",
    "email": "user@example.com",
    "govId": "optional-value"
  }
  ```
- Response:
  ```json
  {
    "message": "Details saved successfully. You can add profile details next.",
    "canCreateOrJoinParties": false,
    "redirectUrl": "/signup/profile/"
  }
  ```
- Side effects:
  - creates Django user
  - creates `UserProfile`
  - syncs Mongo profile
  - authenticates session

### `POST /api/signup/profile`

- Handler: `signin_signup.complete_profile_setup`
- Request:
  ```json
  { "skip": false, "bio": "Hello", "profilePictureUrl": "https://..." }
  ```
- Response:
  ```json
  {
    "message": "Profile setup completed.",
    "canCreateOrJoinParties": false,
    "redirectUrl": "/home/"
  }
  ```

### `POST /api/auth/aadhaar/send-otp`

- Handler: `signin_signup.send_aadhaar_otp_api`
- Request:
  ```json
  { "aadhaarNumber": "123412341234" }
  ```
- Success response:
  ```json
  { "message": "OTP sent successfully to mobile linked with Aadhaar ending in 1234." }
  ```
- Notes:
  - saves Aadhaar number into profile if provided
  - calls external KYC sandbox
  - stores `aadhaar_client_id` in session

### `POST /api/auth/aadhaar/verify-otp`

- Handler: `signin_signup.verify_aadhaar_otp_api`
- Request:
  ```json
  { "otp": "123456" }
  ```
- Success response:
  ```json
  {
    "message": "Aadhaar verified successfully! You can now host and join parties.",
    "isVerified": true
  }
  ```

## Event APIs

### `POST /api/events/create`

- Handler: `views.create_event_api`
- Auth: required
- Content types:
  - JSON
  - multipart form data
- Request fields used by backend:
  - `title`
  - `description`
  - `locationName`
  - `imageUrl`
  - `eventCategory`
  - `currency`
  - `latitude`
  - `longitude`
  - `price`
  - `ticketType`
  - `ticketTiers`
  - `maxAttendees`
  - `startLabel`
  - `endLabel`
  - `endTime`
  - `durationMinutes`
- Multipart file fields:
  - `vibeCover`
  - `vibeHighlights`
  - `eventMedia`
- Success response:
  ```json
  {
    "message": "Event created successfully.",
    "event": {
      "id": 12,
      "title": "Sunset Party",
      "ticketType": "Paid",
      "ticketTiers": [],
      "mediaUrls": [],
      "qr_svg": "<svg...>"
    }
  }
  ```
- Notes:
  - up to 10 image/video uploads
  - cover must be an image
  - syncs event to Mongo

### `DELETE /api/events/<event_id>`

- Handler: `views.delete_event_api`
- Auth: required
- Success response:
  ```json
  { "message": "Event deleted successfully.", "eventId": 12 }
  ```

### `GET /api/events/live`

- Handler: `views.live_events_api`
- Success response:
  ```json
  { "count": 2, "events": [/* event objects */] }
  ```
- Notes:
  - only includes currently live published events
  - adds `isLive: true` in returned event entries

### `GET /api/events/nearby`

- Handler: `views.nearby_events_api`
- Query params:
  - `latitude`
  - `longitude`
  - `radiusKm`
  - optional `north`, `south`, `east`, `west`
- Success response:
  ```json
  { "radiusKm": 10, "count": 5, "events": [/* event objects with distanceKm */] }
  ```

### `GET /api/events/mine`

- Handler: `views.my_events_api`
- Auth: required
- Success response:
  ```json
  { "count": 3, "events": [/* event objects */] }
  ```

## Ticket APIs

### `GET /api/tickets`

- Handler: `views.tickets_api`
- Auth: required
- Success response:
  ```json
  {
    "count": 2,
    "tickets": [
      {
        "id": 5,
        "status": "active",
        "participants": [],
        "guestInvites": [],
        "event": {},
        "qr_svg": "<svg...>"
      }
    ]
  }
  ```
- Notes:
  - cleans up old cancelled tickets before listing
  - adds a generated `qr_svg`
  - also includes `qrCodeSvg` from `_serialize_ticket`, so both keys may appear

### `POST /api/tickets/book`

- Handler: `views.book_ticket_api`
- Auth: required
- Request fields used:
  - `eventId`
  - `inviteeUserIds`
  - `paidForUserIds`
  - `inviteeStatuses`
  - `tierName`
  - `ticketPrice`
  - `serviceFee`
  - `participantTickets`
- Success response:
  ```json
  {
    "message": "Ticket booked successfully.",
    "ticket": { /* ticket object for current user */ }
  }
  ```
- Special conflict response:
  ```json
  {
    "message": "You already have this event in My Events.",
    "skippedUsers": ["friend1"],
    "ticket": { /* existing ticket */ }
  }
  ```

### `POST /api/tickets/<ticket_id>/pay`

- Handler: `views.pay_ticket_api`
- Auth: required
- Request fields used:
  - `payForTicketIds`
  - `tierName`
  - `ticketPrice`
  - `serviceFee`
- Success response:
  ```json
  {
    "message": "Payment completed successfully.",
    "ticket": { /* refreshed viewer ticket */ }
  }
  ```
- Already-confirmed response:
  ```json
  {
    "message": "Selected tickets are already confirmed.",
    "ticket": { /* refreshed viewer ticket */ }
  }
  ```

### `POST /api/tickets/<ticket_id>/group`

- Handler: `views.update_group_ticket_api`
- Auth: required
- Request fields used:
  - `inviteeUserIds`
  - `paidForUserIds`
  - `removeUserIds`
  - `inviteeStatuses`
  - `tierName`
  - `ticketPrice`
  - `serviceFee`
  - `participantTickets`
- Success response:
  - returns updated ticket payload for the viewer

### `POST /api/tickets/<ticket_id>/cancel`

- Handler: `views.cancel_ticket_api`
- Auth: required
- Success response:
  ```json
  {
    "message": "Ticket cancelled successfully.",
    "ticket": { /* ticket object */ }
  }
  ```

### `POST /api/tickets/<ticket_id>/archive`

- Handler: `views.archive_ticket_api`
- Auth: required
- Success response:
  ```json
  {
    "message": "Ticket archived successfully.",
    "ticket": { /* ticket object */ }
  }
  ```

### `DELETE|POST /api/tickets/<ticket_id>/delete`

- Handler: `views.delete_ticket_api`
- Auth: required
- Success response:
  ```json
  { "message": "Ticket deleted successfully.", "ticketId": 5 }
  ```

## Guest Invite And Guest Ticket APIs

### `POST /api/guest-invites`

- Handler: `views.create_guest_invite_api`
- Auth: required
- Request:
  ```json
  { "eventId": 12, "parentTicketId": 5 }
  ```
- Success response:
  ```json
  {
    "message": "Guest invite created.",
    "inviteLink": "http://host/guest-invite/token/",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/send-mobile-otp`

- Handler: `views.guest_send_mobile_otp_api`
- Request:
  ```json
  { "mobile_number": "9876543210" }
  ```
- Success response:
  ```json
  {
    "message": "OTP sent successfully to 9876543210.",
    "debugOtp": "123456",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/verify-mobile-otp`

- Handler: `views.guest_verify_mobile_otp_api`
- Request:
  ```json
  { "otp": "123456" }
  ```
- Success response:
  ```json
  {
    "message": "Mobile verified.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/onboarding`

- Handler: `views.guest_onboarding_api`
- Request:
  ```json
  {
    "full_name": "Guest Name",
    "mobile_number": "9876543210",
    "email": "guest@example.com",
    "aadhaar": "123412341234"
  }
  ```
- Success response:
  ```json
  {
    "message": "Guest onboarding completed.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/pay`

- Handler: `views.guest_pay_api`
- Success response:
  ```json
  {
    "message": "Guest ticket confirmed.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/pay-by-owner`

- Handler: `views.guest_pay_by_owner_api`
- Auth: required
- Success response:
  ```json
  {
    "message": "Guest ticket paid.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/cancel`

- Handler: `views.guest_cancel_api`
- Success response:
  ```json
  {
    "message": "Guest ticket cancelled.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/guest-invites/<invite_token>/cancel-by-owner`

- Handler: `views.guest_cancel_by_owner_api`
- Auth: required
- Success response:
  ```json
  {
    "message": "Guest ticket cancelled.",
    "guestInvite": { /* guest invite object */ }
  }
  ```

### `POST /api/generate-invite/`

- Handler: `views.generate_invite_link`
- Auth: required
- Request:
  ```json
  { "event_id": 12 }
  ```
- Success response:
  ```json
  {
    "success": true,
    "message": "Invite link generated successfully.",
    "invite_link": "http://host/guest-invite/token/"
  }
  ```

### `POST /api/guest-submit/<invite_token>/`

- Handler: `views.submit_guest_onboarding`
- Request:
  ```json
  {
    "full_name": "Guest Name",
    "age": 21,
    "mobile_number": "9876543210",
    "email": "guest@example.com",
    "aadhaar": "123412341234",
    "payment_choice": "pay"
  }
  ```
- Success response:
  ```json
  {
    "success": true,
    "message": "Details saved and payment successful!",
    "ticket_url": "http://host/guest-ticket/token/",
    "payment_status": "DONE"
  }
  ```
- Notes:
  - appears to be an older alternate guest flow kept alongside the newer invite endpoints

## User, Profile, Follow, Settings, And Notification APIs

### `GET /api/users/search`

- Handler: `views.search_users_api`
- Auth: required
- Query params:
  - `q`
  - `limit`
- Success response:
  ```json
  {
    "source": "mongo",
    "count": 2,
    "users": [
      {
        "sql_user_id": 7,
        "username": "user7",
        "full_name": "User Seven",
        "profile_picture_url": "/media/profiles/7/avatar.jpg",
        "is_private": false,
        "is_following": false,
        "follows_you": false,
        "follow_request_pending": false
      }
    ]
  }
  ```
- Notes:
  - uses Mongo first
  - falls back to SQL when Mongo is empty/unavailable

### `POST /api/users/follow`

- Handler: `views.follow_user_api`
- Auth: required
- Request:
  ```json
  { "targetUserId": 7, "action": "follow" }
  ```
- Success response:
  ```json
  {
    "message": "Followed successfully.",
    "created": true,
    "follow": {
      "sql_user_id": 7,
      "is_following": true,
      "follows_you": false,
      "follow_request_pending": false,
      "is_private": false,
      "followers_count": 10,
      "following_count": 4
    }
  }
  ```
- Other supported actions:
  - `unfollow`
  - `cancel_request`

### `GET /api/users/<user_id>/profile`

- Handler: `views.public_profile_api`
- Auth: required
- Success response:
  ```json
  {
    "profile": {
      "sql_user_id": 7,
      "username": "user7",
      "full_name": "User Seven",
      "bio": "Hello",
      "profile_picture_url": "/media/profiles/7/avatar.jpg",
      "gov_id_verified": true,
      "is_private": false,
      "can_view_content": true,
      "private_content_message": "",
      "hosted_events_count": 2,
      "hosted_events": [/* event objects */],
      "followers_count": 10,
      "following_count": 4
    },
    "is_self": false
  }
  ```

### `GET /api/profile/me`

- Handler: `views.current_profile_api`
- Auth: required
- Response:
  - current user profile payload

### `POST /api/profile/update`

- Handler: `views.profile_update_api`
- Auth: required
- Content types:
  - JSON
  - multipart form data
- Request fields:
  - `bio`
  - `profilePictureUrl`
  - `profilePictureFile` for multipart
- Success response:
  ```json
  {
    "message": "Profile updated successfully.",
    "profile": {
      "bio": "Updated bio",
      "profile_picture_url": "/media/profiles/7/avatar_x.jpg"
    }
  }
  ```

### `GET|POST /api/profile/privacy`

- Handler: `views.profile_privacy_api`
- Auth: required
- GET response:
  ```json
  { "isPrivate": true }
  ```
- POST request:
  ```json
  { "isPrivate": true }
  ```
- POST response:
  ```json
  { "message": "Privacy updated.", "isPrivate": true }
  ```

### `GET|POST /api/profile/follow-requests`

- Handler: `views.follow_requests_api`
- Auth: required
- GET response:
  ```json
  { "count": 1, "requests": [/* basic user payloads with requested_at */] }
  ```
- POST request:
  ```json
  { "requesterUserId": 9, "action": "approve" }
  ```
- POST response:
  ```json
  {
    "message": "Follow request approved.",
    "requesterUserId": 9,
    "pendingCount": 0,
    "followersCount": 12
  }
  ```

### `GET /api/profile/<graph_type>`

- Handler: `views.profile_follow_graph_api`
- Auth: required
- Valid values:
  - `followers`
  - `following`
- Success response:
  ```json
  { "graph": "followers", "count": 3, "users": [/* basic user payloads */] }
  ```

### `GET|POST /api/settings/preferences`

- Handler: `views.settings_preferences_api`
- Auth: required
- Response:
  - settings preference payload used by `home_page.js`

### `GET|POST|DELETE /api/settings/people/<category>`

- Handler: `views.settings_people_api`
- Auth: required
- Categories inferred from code:
  - `saved`
  - `blocked`
  - `restricted`
- Response:
  - list or updated people entries serialized through `_serialize_settings_user(...)`

### `GET|POST /api/notifications`

- Handler: `views.notifications_api`
- Auth: required
- GET response:
  ```json
  {
    "count": 5,
    "unreadCount": 2,
    "notifications": [
      {
        "recipient_sql_user_id": 7,
        "activity_type": "follow",
        "title": "New fan",
        "body": "User started following you.",
        "actor_sql_user_id": 3,
        "actor_username": "user3",
        "actor_full_name": "User Three",
        "actor_profile_picture_url": "/media/profiles/3/avatar.jpg",
        "payload": {},
        "is_read": false,
        "created_at": "2026-04-13T10:00:00+05:30"
      }
    ]
  }
  ```
- POST response:
  ```json
  { "message": "Notifications marked as read.", "unreadCount": 0 }
  ```

### `POST /api/notifications/activity`

- Handler: `views.log_activity_api`
- Auth: required
- Request:
  ```json
  {
    "activityType": "ticket_purchase",
    "recipientUserId": 3,
    "eventId": 12,
    "eventTitle": "Sunset Party"
  }
  ```
- Success response:
  ```json
  { "message": "Activity logged." }
  ```

## Direct Messaging APIs

### `GET /api/messages/conversations`

- Handler: `messaging.conversations_api`
- Auth: required
- Success response:
  ```json
  {
    "count": 4,
    "unreadCount": 6,
    "conversations": [/* direct and group conversation objects */]
  }
  ```

### `POST /api/messages/conversations/start`

- Handler: `messaging.start_conversation_api`
- Auth: required
- Request:
  ```json
  { "targetUserId": 7 }
  ```
- Success response:
  ```json
  { "conversation": { /* direct conversation object */ } }
  ```

### `GET|POST /api/messages/conversations/<conversation_id>/messages`

- Handler: `messaging.conversation_messages_api`
- Auth: required
- GET response:
  ```json
  {
    "conversation": { /* direct conversation object */ },
    "messages": [/* direct message objects */],
    "readCount": 3
  }
  ```
- POST request:
  - JSON or multipart
  - fields:
    - `body`
    - `repliedToId`
    - `attachments` for multipart
    - `attachmentMeta` for multipart
- POST response:
  ```json
  {
    "message": { /* direct message object */ },
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/messages/<message_id>/edit`

- Handler: `messaging.edit_message_api`
- Request:
  ```json
  { "body": "Edited text" }
  ```
- Response:
  ```json
  {
    "message": { /* direct message object */ },
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/messages/<message_id>/forward`

- Handler: `messaging.forward_message_api`
- Request:
  ```json
  { "conversationId": 10 }
  ```
  or
  ```json
  { "targetUserId": 7 }
  ```
- Response:
  ```json
  {
    "message": { /* forwarded direct message object */ },
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/messages/<message_id>/delete`

- Handler: `messaging.delete_message_for_me_api`
- Response:
  ```json
  {
    "message": "Message deleted for you.",
    "messageId": 20,
    "conversation": { /* direct conversation object */ },
    "deletedAt": "2026-04-13T10:00:00+05:30"
  }
  ```

### `POST /api/messages/messages/<message_id>/unsend`

- Handler: `messaging.unsend_message_api`
- Response:
  ```json
  {
    "message": { /* unsent direct message object */ },
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/conversations/<conversation_id>/read`

- Handler: `messaging.mark_conversation_read_api`
- Response:
  ```json
  {
    "message": "Conversation marked as read.",
    "conversationId": 10,
    "updatedCount": 3,
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/conversations/<conversation_id>/clear`

- Handler: `messaging.clear_conversation_api`
- Response:
  ```json
  {
    "message": "Chat cleared successfully.",
    "conversationId": 10,
    "conversation": { /* direct conversation object */ }
  }
  ```

### `POST /api/messages/conversations/<conversation_id>/delete`

- Handler: `messaging.delete_conversation_api`
- Response:
  ```json
  {
    "message": "Conversation deleted from your account.",
    "conversationId": 10
  }
  ```

## Group Chat APIs

### `POST /api/messages/groups/create`

- Handler: `group_chat.create_group_api`
- Auth: required
- Request:
  ```json
  { "name": "Weekend Crew", "description": "Party group", "memberUserIds": [7, 8] }
  ```
- Response:
  ```json
  { "conversation": { /* group conversation object */ } }
  ```

### `GET /api/messages/groups/<group_id>`

- Handler: `group_chat.group_details_api`
- Response:
  ```json
  { "conversation": { /* group conversation object */ } }
  ```

### `GET|POST /api/messages/groups/<group_id>/messages`

- Handler: `group_chat.group_messages_api`
- GET response:
  ```json
  {
    "conversation": { /* group conversation object */ },
    "messages": [/* group message objects */],
    "readCount": 4
  }
  ```
- POST request:
  - JSON or multipart
  - fields:
    - `body`
    - `repliedToId`
    - `attachments`
    - `attachmentMeta`
- POST response:
  ```json
  {
    "message": { /* group message object */ },
    "conversation": { /* group conversation object */ }
  }
  ```

### `POST /api/messages/groups/<group_id>/members`

- Handler: `group_chat.add_group_members_api`
- Request:
  ```json
  { "memberUserIds": [9, 10] }
  ```
- Response:
  ```json
  {
    "conversation": { /* group conversation object */ },
    "addedUserIds": [9, 10]
  }
  ```

### `POST /api/messages/groups/<group_id>/members/<member_user_id>/role`

- Handler: `group_chat.update_group_member_role_api`
- Request:
  ```json
  { "role": "admin" }
  ```
- Response:
  ```json
  { "conversation": { /* group conversation object */ } }
  ```

### `POST /api/messages/groups/<group_id>/members/<member_user_id>/remove`

- Handler: `group_chat.remove_group_member_api`
- Response:
  ```json
  { "conversation": { /* group conversation object */ } }
  ```

### `POST /api/messages/groups/<group_id>/rename`

- Handler: `group_chat.rename_group_api`
- Request:
  ```json
  { "name": "New Group Name", "description": "Updated", "avatarUrl": "https://..." }
  ```
- Response:
  ```json
  { "conversation": { /* group conversation object */ } }
  ```

### `POST /api/messages/groups/<group_id>/leave`

- Handler: `group_chat.leave_group_api`
- Response:
  ```json
  { "conversationId": 1000000012, "message": "You left the group." }
  ```

### `POST /api/messages/groups/<group_id>/clear`

- Handler: `group_chat.clear_group_conversation_api`
- Response:
  ```json
  {
    "message": "Group chat cleared successfully.",
    "conversationId": 1000000012,
    "conversation": { /* group conversation object */ }
  }
  ```

### `POST /api/messages/groups/<group_id>/delete`

- Handler: `group_chat.delete_group_api`
- Response:
  ```json
  { "message": "Group deleted.", "conversationId": 1000000012 }
  ```

### `POST /api/messages/group-messages/<message_id>/edit`

- Handler: `group_chat.edit_group_message_api`
- Request:
  ```json
  { "body": "Edited group message" }
  ```
- Response:
  ```json
  {
    "message": { /* group message object */ },
    "conversation": { /* group conversation object */ }
  }
  ```

### `POST /api/messages/group-messages/<message_id>/delete`

- Handler: `group_chat.delete_group_message_for_me_api`
- Response:
  ```json
  {
    "message": "Message deleted for you.",
    "messageId": 45,
    "conversation": { /* group conversation object */ },
    "deletedAt": "2026-04-13T10:00:00+05:30"
  }
  ```

### `POST /api/messages/group-messages/<message_id>/unsend`

- Handler: `group_chat.unsend_group_message_api`
- Response:
  ```json
  {
    "message": { /* unsent group message object */ },
    "conversation": { /* group conversation object */ }
  }
  ```

## WebSocket API

### `WS /ws/messages/`

- Route source: `HAPPNIX/routing.py`
- Consumer: `consumers.MessageConsumer`
- Auth: authenticated session required

### Client event types

- `{"type":"ping"}`
- `{"type":"typing","conversationId":10,"targetUserId":7,"isTyping":true}`
- `{"type":"messages.read","conversationId":10,"targetUserId":7}`
- `{"type":"messages.read","conversationKind":"group","groupId":12}`

### Server event types

- `socket.connected`
- `pong`
- `presence.updated`
- `user.typing`
- `message.created`
- `message.updated`
- `message.deleted_for_me`
- `conversation.updated`
- `conversation.deleted`
- `conversation.read`
- `messages.delivered.receipt`
- `messages.read.receipt`
- `group.messages.delivered.receipt`
- `group.messages.read.receipt`

## Known API Gaps Or Mismatches

- Frontend code references `/api/tickets/<id>/verify`, but no matching backend route was found.
- `tickets_api` generates QR content using that missing verify URL, so the current QR verification flow appears incomplete.
- `submit_guest_onboarding` appears to be an older parallel guest flow that overlaps with the newer `/api/guest-invites/<token>/...` endpoints.
