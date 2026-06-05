# HappniX — Serverless API Migration Plan

> **Goal:** Wire up `home_page.js` and every connected page to the AWS serverless backend,
> replacing all Django `/api/...` calls with Lambda-backed API Gateway routes.
> Introduce a DynamoDB **Users** table as the fast, scalable profile/social-graph store.

---

## Phase 0 — Fix Broken URL Routing (Immediate, ~30 min)

The `getJson` / `postJson` helpers in `home_page.js` still call bare relative paths like  
`/api/profile/me` — they hit the Cloudflare Worker, which has no such route.  
Every call must be rewritten to go through `HAPPNIX_RUNTIME_CONFIG.buildApiUrl(...)`.

**Action:** Patch `getJson`, `postJson`, `deleteJson`, `postFormData` in `home_page.js`  
to route through the configured API base URL, exactly like `signup_signin.js` does now.

```js
async function getJson(path) {
  const url = (window.HAPPNIX_RUNTIME_CONFIG?.buildApiUrl?.(path)) ?? path;
  const response = await fetch(url, { credentials: "include" });
  ...
}
```

---

## Phase 1 — DynamoDB Users Table (Infrastructure, ~1 hr)

### Why DynamoDB alongside PostgreSQL?

| Concern | PostgreSQL (RDS) | DynamoDB |
|---------|-----------------|----------|
| Auth / account record | ✅ Source of truth | Mirror |
| Profile reads (avatar, bio, username) | Too slow inside VPC | ✅ < 5 ms |
| Social graph (followers/following) | Joins required | ✅ adjacency list pattern |
| Feed, discover search | Not suited | ✅ GSI queries |
| Cost on free tier | $0 (existing RDS) | $0 (25 GB / 200M req free) |

### Table design — `happnix-dev-users`

| Key | Type | Purpose |
|-----|------|---------|
| `PK` (partition) | `USER#<cognitoSub>` | All user data |
| `SK` (sort) | `PROFILE` | The user's own profile record |
| `PK` | `USER#<cognitoSub>` | Relationships |
| `SK` | `FOLLOW#<targetSub>` | Who this user follows |
| GSI1-PK | `USERNAME#<userName>` | Lookup by username |
| GSI1-SK | `USER#<cognitoSub>` | |
| GSI2-PK | `PHONE#<e164>` | Lookup by phone |

**Profile record attributes:**
```
cognitoSub, userName, displayName, phoneNumber, emailAddress,
bio, profilePictureUrl, isVerified, userType,
followersCount, followingCount, postsCount,
privacyMode (public/private), createdAt, updatedAt
```

### `data/template.yaml` change — add UsersTable resource

```yaml
HappnixUsersTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: !Sub "happnix-${EnvironmentName}-users"
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - { AttributeName: PK, AttributeType: S }
      - { AttributeName: SK, AttributeType: S }
      - { AttributeName: GSI1PK, AttributeType: S }
      - { AttributeName: GSI1SK, AttributeType: S }
    KeySchema:
      - { AttributeName: PK, KeyType: HASH }
      - { AttributeName: SK, KeyType: RANGE }
    GlobalSecondaryIndexes:
      - IndexName: gsi1-username
        KeySchema:
          - { AttributeName: GSI1PK, KeyType: HASH }
          - { AttributeName: GSI1SK, KeyType: RANGE }
        Projection: { ProjectionType: ALL }
    TimeToLiveSpecification:
      AttributeName: ttl
      Enabled: true
```

---

## Phase 2 — New Lambda Files (Backend, ~2 hrs)

### `backend/user_api.py` — Profile & social graph

| Action | Method | Django equivalent |
|--------|--------|-------------------|
| `GetMe` | GET `/api/profile/me` | `profile_view` |
| `UpdateProfile` | POST `/api/profile/update` | `update_profile_view` |
| `GetPublicProfile` | GET `/api/users/{id}/profile` | `public_profile_view` |
| `SearchUsers` | GET `/api/users/search?q=` | `search_users_view` |
| `FollowUser` | POST `/api/users/follow` | `follow_user_view` |
| `GetFollowing` | GET `/api/profile/following` | `following_view` |
| `GetFollowers` | GET `/api/profile/followers` | `followers_view` |
| `GetFollowRequests` | GET `/api/profile/follow-requests` | `follow_requests_view` |
| `HandleFollowRequest` | POST `/api/profile/follow-requests` | `handle_request_view` |
| `SetPrivacy` | POST `/api/profile/privacy` | `set_privacy_view` |

### `backend/events_api.py` — Events & feed

| Action | Method | Django equivalent |
|--------|--------|-------------------|
| `GetLiveEvents` | GET `/api/events/live` | `live_events_view` |
| `GetMyEvents` | GET `/api/events/mine` | `my_events_view` |
| `GetNearbyEvents` | GET `/api/events/nearby?lat=&lng=...` | `nearby_events_view` |
| `CreateEvent` | POST `/api/events` | `create_event_view` |
| `DeleteEvent` | DELETE `/api/events/{id}` | `delete_event_view` |

### `backend/tickets_api.py` — Tickets

| Action | Method |
|--------|--------|
| `ListTickets` | GET `/api/tickets` |
| `BookTicket` | POST `/api/tickets/book` |
| `CancelTicket` | POST `/api/tickets/{id}/cancel` |
| `ArchiveTicket` | POST `/api/tickets/{id}/archive` |
| `DeleteTicket` | DELETE `/api/tickets/{id}/delete` |
| `GroupTicket` | POST `/api/tickets/{id}/group` |
| `PayTicket` | POST `/api/tickets/{id}/pay` |

### `backend/notifications_api.py`

| Action | Method |
|--------|--------|
| `ListNotifications` | GET `/api/notifications?limit=N` |
| `MarkAllRead` | POST `/api/notifications` |
| `LogActivity` | POST `/api/notifications/activity` |

### `backend/settings_api.py`

| Action | Method |
|--------|--------|
| `GetPreferences` | GET `/api/settings/preferences` |
| `SavePreferences` | POST `/api/settings/preferences` |
| `GetPeople` | GET `/api/settings/people/{category}` |
| `AddPerson` | POST `/api/settings/people/{category}` |
| `RemovePerson` | DELETE `/api/settings/people/{category}` |

### `backend/guests_api.py`

| Action | Method |
|--------|--------|
| `CreateGuestInvite` | POST `/api/guest-invites` |
| `PayByOwner` | POST `/api/guest-invites/{token}/pay-by-owner` |
| `CancelByOwner` | POST `/api/guest-invites/{token}/cancel-by-owner` |

---

## Phase 3 — API Gateway Routes (Infrastructure, ~30 min)

Add to `infra/app/template.yaml` under `HappnixDevApi`:

```
GET  /api/profile/me            → ProfilesFunction
POST /api/profile/update        → ProfilesFunction
GET  /api/users/{userId}/profile → ProfilesFunction
GET  /api/users/search          → ProfilesFunction
POST /api/users/follow          → ProfilesFunction
...
GET  /api/events/live           → EventsFunction
GET  /api/events/mine           → EventsFunction
GET  /api/events/nearby         → EventsFunction
POST /api/events                → EventsFunction
...
GET  /api/tickets               → TicketsFunction
POST /api/tickets/book          → TicketsFunction
...
```

---

## Phase 4 — Frontend Wiring (Frontend, ~1 hr)

**Changes to `home_page.js`:**
1. Patch the 4 HTTP helpers (`getJson`, `postJson`, etc.) to prepend the API base URL
2. On page load, call `GET /api/profile/me` (replaces the Django session-based user injection)
3. All existing `/api/...` calls work as-is once the base URL is prepended

---

## Execution Order

```
Step 1 ✅  Phase 0  —  Fix getJson/postJson helpers in home_page.js  (quick win)
Step 2     Phase 1  —  Add DynamoDB Users table to data/template.yaml + deploy data stack
Step 3     Phase 2  —  Create user_api.py (GetMe, UpdateProfile, SearchUsers, Follow*)
Step 4     Phase 3  —  Add /api/profile/* routes to app/template.yaml + deploy app stack
Step 5     Phase 2b —  Create events_api.py stub (returns empty lists for now)
Step 6     Phase 3b —  Add /api/events/* routes
Step 7     Phase 2c —  Create tickets_api.py stub
Step 8     Phase 3c —  Add /api/tickets/* routes
Step 9     Phase 2d —  Notifications + Settings + Guests (all stub → real over time)
Step 10    Phase 4  —  Full frontend smoke test end to end
```

---

> **Up next:** Step 2 — creating the DynamoDB Users table in `data/template.yaml`.
> Ready when you are!
