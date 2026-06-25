# HappniX Modernization: Gap Analysis & AI Implementation Roadmap

## 1. Executive Summary & Architectural Context

HappniX is undergoing a complete cloud-native modernization from a monolithic legacy architecture to a decoupled, serverless CQRS system.

### Legacy Architecture (`project-handbook`)
* **Framework**: Monolithic Django 4.x + Django Channels WebSockets (`Daphne`).
* **State & Auth**: Django Sessions + Custom SMS OTP / Password state stored in SQLite.
* **Databases**: SQLite (authoritative relational store) + MongoDB (asynchronous read projections).
* **Frontend**: Server-Rendered HTML Templates (`Jinja/Django`) + Vanilla JS / jQuery.

### Modern V4 Architecture (`HappniX_dev`)
* **Frontend**: Next.js 15 App Router (React 19, TypeScript, Tailwind CSS, Lucide Icons, Glassmorphic UI).
* **Backend**: AWS Lambda micro-handlers (`Python 3.11+`) behind Amazon API Gateway.
* **Authentication**: AWS Cognito User Pools (JWT Bearer tokens via `Authorization: Bearer <access_token>`).
* **Databases (CQRS Pattern)**:
  * **Amazon RDS PostgreSQL**: Authoritative write store for relational transactions (`users`, `events`, `event_orders`, `event_tickets`, `event_ticket_tiers`, `posts`, `follows`).
  * **Amazon DynamoDB**: High-speed NoSQL read projections & social timeline feeds (`USERS` table [PROFILE, SETTINGS], `EVENTS` table [EVENT_CARD, FEED_POST, CELEB], Sharded Discover GSIs).
* **Media Storage**: Cloudflare R2 Object Storage via AWS SDK S3 presigned URLs.

---

## 2. System Modernization Status Matrix

| Feature Module | Legacy Status | Modern V4 Status | Completion | Source Files (Modern) |
| :--- | :---: | :---: | :---: | :--- |
| **Cognito Auth & Onboarding** | Complete | **Complete (Superior)** | 100% | `handlers/signup_signin.py`, `services/signup_signin_services.py` |
| **Event Creation & CQRS Sync** | Complete | **Complete (Superior)** | 100% | `handlers/events.py`, `services/event_services.py` |
| **Event Discovery & Feeds** | Complete | **Complete (Superior)** | 100% | `handlers/discover.py`, `services/discover_services.py` |
| **Ticket Booking & Orders** | Complete | **Complete (Newly Built)** | 100% | `handlers/booking.py`, `services/booking_services.py` |
| **User Profile & Social Graph** | Complete | **Complete (Superior)** | 100% | `handlers/profile.py`, `services/profile_services.py` |
| **Direct Messaging (1-on-1)** | Complete | **Missing (Stub 501)** | 0% | `handlers/messaging.py` (Stub) |
| **Group Chat System** | Complete | **Missing** | 0% | *None* |
| **Guest Invites & Claim Gate** | Complete | **Missing** | 10% | Schema defined in RDS `event_tickets.claimToken` |
| **Activity Notifications Feed**| Complete | **Frontend Mock Only** | 15% | Schema defined in DynamoDB projections |
| **Identity Verification (Aadhaar)**| Complete| **Missing (Stub 501)** | 10% | `handlers/varification.py` (Stub) |

---

## 3. Detailed Gap Specifications (What Needs To Be Built)

The following sections define the exact functional gaps relative to the legacy system that must be implemented in the V4 serverless architecture.

### Gap A: Realtime Direct Messaging (1-on-1 DMs)
* **Legacy Reference**: `docs/project-handbook/api-reference.md` (Lines 69–82), `HAPPNIX/messaging.py`.
* **Current State**: `handlers/messaging.py` returns `501 Not Implemented`. Next.js chat modal uses hardcoded state.
* **Requirements**:
  1. **Data Schema (Postgres RDS)**:
     * `direct_conversations` table: `conversationID (PK)`, `userOneID`, `userTwoID`, `lastMessageText`, `lastMessageAt`, `createdAt`.
     * `direct_messages` table: `messageID (PK)`, `conversationID (FK)`, `senderUserID`, `body`, `mediaItems (JSONB)`, `isEdited`, `isUnsent`, `readAt`, `createdAt`.
  2. **API Endpoints (`handlers/messaging.py`)**:
     * `GET /api/messages/conversations` → List active DMs for authenticated user.
     * `POST /api/messages/conversations/start` → Get or create conversation between `user_id` and `recipientUserID`.
     * `GET /api/messages/conversations/{id}/messages` → Cursor-paginated message history.
     * `POST /api/messages/send` → Send text + attachment keys.
     * `POST /api/messages/action` → Actions: `markRead`, `unsend`, `edit`, `delete`.
  3. **Realtime / Polling Bridge**: Implement short-polling (every 4s when chat window is active) or AWS API Gateway WebSocket connection handler.

### Gap B: Group Chat & Collaboration Rooms
* **Legacy Reference**: `docs/project-handbook/api-reference.md` (Lines 84–100), `HAPPNIX/group_chat.py`.
* **Current State**: Completely unbuilt.
* **Requirements**:
  1. **Data Schema (Postgres RDS)**:
     * `group_conversations`: `groupID (PK)`, `creatorUserID`, `eventID (Optional FK)`, `name`, `description`, `avatarUrl`, `createdAt`.
     * `group_members`: `groupID (PK)`, `userID (PK)`, `role (admin|member)`, `joinedAt`.
     * `group_messages`: Mirror `direct_messages` with `groupID (FK)`.
  2. **API Actions**:
     * `CreateGroup`, `AddMembers`, `RemoveMember`, `UpdateRole`, `LeaveGroup`, `RenameGroup`.

### Gap C: Standalone Guest Invites & Ticket Claim Gate
* **Legacy Reference**: `/guest-invite/<token>` and `/guest-ticket/<token>` flows in legacy templates.
* **Current State**: When hosts buy multiple tickets, extra tickets receive a `claimToken` in Postgres `event_tickets`. However, there is no public web route or backend handler for external friends to claim them.
* **Requirements**:
  1. **Backend Handler (`handlers/guest_invites.py`)**:
     * `GET /api/guest-invites/{claimToken}` → Validate token, return event title, tier name, host name, and claim status.
     * `POST /api/guest-invites/{claimToken}/claim` → Require Cognito Bearer token. Assign `attendeeUserID`, `attendeeName`, `attendeeEmail` to the ticket, set status to `Confirmed`, set `claimedAt = NOW()`.
  2. **Frontend Page (`web/src/app/claim/[token]/page.tsx`)**:
     * Public glassmorphic landing page showing the ticket invitation card.
     * If unauthenticated, prompt Cognito login/signup with return redirect.
     * On click "Claim Pass to Digital Wallet", hit claim API and redirect to `/my-bookings`.

### Gap D: Activity Notifications Engine
* **Legacy Reference**: `ActivityNotification` SQL model + MongoDB notification sync.
* **Current State**: `NotificationsModal` in UI shows mock notifications.
* **Requirements**:
  1. **Storage**: Write notifications to DynamoDB under `PK=USER#{userID}`, `SK=NOTIF#{timestamp}#{notifID}`.
  2. **Triggers**: In `booking_services.py` (on order complete) and `interaction_services.py` (on follow/like), write asynchronous notification items.
  3. **Backend Handler (`handlers/notifications.py`)**:
     * `GET /api/notifications` → Fetch user's unread & recent notifications.
     * `POST /api/notifications/read` → Mark items read.

### Gap E: Aadhaar Identity & National ID Verification
* **Legacy Reference**: `/api/auth/aadhaar/*` legacy endpoints.
* **Current State**: `handlers/varification.py` returns `501 Not Implemented`.
* **Requirements**:
  1. Implement mock/production API integration for UIDAI / Sandbox KYC verification.
  2. Update `users.unidIsVerified = TRUE` and `users.uniqueNationalID` in Postgres RDS upon successful OTP match.

---

## 4. AI Implementation Prompts & Execution Roadmap

Copy and paste the following standalone prompts to an AI coding assistant (Claude 3.5 Sonnet / Gemini 1.5 Pro) to execute the remaining roadmap systematically.

### Phase 1: Implement Standalone Guest Claim Gate (Highest Value)
```text
You are pair programming on the HappniX serverless repository. 
Task: Implement the Standalone Guest Ticket Claim flow (Gap C).

1. Analyze `backend/handlers/booking.py` and `backend/integration/rds.py`.
2. Create a new Lambda handler `backend/handlers/guest_invites.py` with actions:
   - `GetClaimDetails`: Expects `claimToken`. Query RDS `event_tickets` JOIN `events` and `users` (host). Return ticket details.
   - `ClaimTicket`: Expects `claimToken` + authenticated user context (`user_id`, `username`, `email`). Update RDS `event_tickets` setting `attendeeUserID=%s`, `status='Confirmed'`, `claimedAt=NOW()` WHERE `claimToken=%s AND attendeeUserID IS NULL`.
3. Update `web/src/lib/api.ts` to export `guestInviteApi = { getDetails(token), claim(token) }`.
4. Create Next.js public page `web/src/app/claim/[token]/page.tsx` displaying a premium glassmorphic invitation card with a "Claim to Wallet" action button.
```

### Phase 2: Implement Direct Messaging Backend & UI Integration
```text
You are pair programming on the HappniX serverless repository.
Task: Implement 1-on-1 Direct Messaging (Gap A).

1. Review `docs/project-handbook/database-and-schemas.md` for legacy DM field specifications.
2. In `backend/handlers/messaging.py`, replace the 501 stub with real Lambda action routing:
   - `ListConversations`: Query RDS for conversations where `userOneID = user_id OR userTwoID = user_id`, ordered by `lastMessageAt DESC`.
   - `GetMessages`: Query RDS `direct_messages` WHERE `conversationID = %s` ORDER BY `createdAt ASC` LIMIT 50.
   - `SendMessage`: Insert into `direct_messages`, update `direct_conversations.lastMessageText` and `lastMessageAt`.
3. In `web/src/components/modals/HomeModals.tsx` (or dedicated chat drawer), connect the messaging UI to `messagingApi.listConversations()` and `messagingApi.getMessages()`, replacing mock arrays. Add a 4-second polling interval when the chat drawer is open.
```

### Phase 3: Implement Activity Notifications Feed
```text
You are pair programming on the HappniX serverless repository.
Task: Implement the Activity Notifications Engine (Gap D).

1. Create `backend/handlers/notifications.py` handling `GET` (fetch user notifications from DynamoDB or RDS) and `POST` (mark read).
2. In `backend/services/booking_services.py` inside `create_order`, add a helper call `record_notification(user_id, title="Ticket Confirmed", body=...)`.
3. In `web/src/components/modals/HomeModals.tsx` (`NotificationsModal`), fetch real items from `apiClient.get('/api/notifications')` and display them with read/unread status badges.
```
