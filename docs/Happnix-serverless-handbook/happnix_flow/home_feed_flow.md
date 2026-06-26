# Home Page Feed & Hybrid Orchestration Flow

This document details the end-to-end request lifecycle, hybrid service orchestration, and modular provider architecture when a user opens the HappniX app and views the Home Page timeline.

---

## 1. Client Initialization (React / Next.js)

1. **Navigation**: The user navigates to the Home Page (`/home`).
2. **State & Location Mounting**: The custom hook `useFeed.ts` mounts. It retrieves active user coordinates from `localStorage.getItem("userLocation")` (managed by `locationStore.tsx`) or browser GPS fallback, and invokes `loadFeed(isInitial = true)`.
3. **HTTP Dispatch**: An authenticated HTTP `GET` request is dispatched via `apiClient.get('api/home/feed')` attaching the user's Bearer JWT access token and optional `lat`, `lng`, and `radius` query parameters.
4. **Non-Disruptive Polling**: A lightweight background `setInterval` polls `GET /api/home/feed/check?since=<timestamp>` every 30 seconds. If new content is detected, a "New Posts" UI bubble appears without shifting the scroll position.

---

## 2. API Gateway & Authentication Gateway

1. **API Gateway Routing**: The HTTP request hits AWS API Gateway route `GET /api/home/feed`.
2. **Lambda Handler**: `HomePageApi` Lambda function (`backend/handlers/home_page.py`) is invoked.
3. **Dual Auth Resolution**: The handler extracts the token and queries `cognito.get_user(access_token)`. To support both modern UUIDv7 logins and legacy handle signups, it performs a dual-lookup via `rds.get_user_by_username()`:
   - First checks `SELECT * FROM users WHERE "userID" = :cognito_username`
   - Fallback checks `SELECT * FROM users WHERE "userName" = :cognito_username`
4. **Parameter Extraction**: Parses `cursor`, `lat`, and `lng` query parameters before delegating to the service layer.

---

## 3. Hybrid Feed Orchestration (`feed_services.py`)

Located in `backend/services/feed_services.py`, the orchestrator merges disparate SQL and NoSQL data sources into a unified timeline:

```
                      ┌─────────────────────────────────────────┐
                      │      HomePageApi Lambda Handler         │
                      └────────────────────┬────────────────────┘
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │   feed_services.get_hybrid_feed()       │
                      └──────┬───────────────────────────┬──────┘
                             │ (Shared DB Conn)          │ (Scatter-Gather)
                             ▼                           ▼
                 ┌───────────────────────┐   ┌───────────────────────┐
                 │    RDS PostgreSQL     │   │     AWS DynamoDB      │
                 ├───────────────────────┤   ├───────────────────────┤
                 │ • get_live_events()   │   │ • get_following()     │
                 │ • get_own_content()   │   │ • get_recs() (10 Shrd)│
                 │ • get_nearby_events() │   └───────────────────────┘
                 └───────────┬───────────┘               │
                             │                           │
                             └─────────────┬─────────────┘
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │  Deduplication & Heuristic Ranking      │
                      └────────────────────┬────────────────────┘
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │ Composite Cursor & Stripped Payload     │
                      └─────────────────────────────────────────┘
```

### Key Architectural Safeguards:
1. **Connection Sharing**: A single PostgreSQL connection is opened and injected into all SQL providers (`get_live_events`, `get_own_content`, `get_nearby_events`), then closed *before* querying DynamoDB. This prevents Lambda concurrency spikes from exhausting RDS connection limits (`max_connections = 80` on `db.t4g.micro`).
2. **Precision Crash Prevention**: Trigonometric Haversine SQL queries wrap domain values inside `LEAST(1.0, GREATEST(-1.0, ...))` to prevent floating-point arithmetic errors (`ACOS > 1.0`) from crashing PostgreSQL queries.
3. **Deduplication**: Since items can appear across multiple sources (e.g., an event hosted by the user and also recommended trending), items are deduplicated strictly by `eventID` / `postID`.

---

## 4. Modular Data Providers (`feed_providers.py`)

Located in `backend/services/feed_providers.py`, each function isolates a specific content slice:

| Provider | Backend Source | Retrieval Strategy | User Metadata Joined |
| :--- | :--- | :--- | :--- |
| **`get_live_events`** | RDS PostgreSQL | `startAt <= now AND (endAt IS NULL OR endAt >= now) AND status != Cancelled`. Safeguarded Haversine filter (50km). | `hostName`, `hostUserName`, `hostAvatar` |
| **`get_own_content`** | RDS PostgreSQL | Fetches user's active posts + published events (`hostUserID = current_user`). | `authorName`, `authorAvatar` |
| **`get_nearby_events`** | RDS PostgreSQL | Public events within 5km radius using Haversine formula. | `hostName`, `hostUserName`, `hostAvatar` |
| **`get_following_content`**| AWS DynamoDB | Fan-out lookup across followed target tables. Returns `ExclusiveStartKey`. | Embedded in fan-out item |
| **`get_recommendations`** | AWS DynamoDB | Scatter-gather query across 10 sharded GSI partitions (`DISCOVER#SHARD_0`..`9`). | Embedded in projection |

---

## 5. Ranking Engine (`ranking_services.py`)

Each item is assigned a dynamic mathematical `_rankingScore`:

$$\text{Final Score} = \text{Base Weight} \times \text{Time Decay} \times \text{Engagement Factor}$$

- **Base Weights**: `OWN_CONTENT` ($1.2$), `FOLLOWING` ($1.0$), `RECOMMENDATION` ($0.8$).
- **Time Decay**: Exponential half-life decay where content loses $50\%$ score every 12 hours ($\text{half\_life\_hours} = 12.0$).
- **Engagement Boost**: $+1\%$ boost per database engagement score point ($1.0 + \frac{\text{score}}{100}$).

---

## 6. Composite Pagination & Security Stripping

1. **Tie-Breaker Sort**: Items are sorted descending by `_rankingScore`. Tie-breakers compare `item_id` to ensure deterministic ordering across refreshes.
2. **Composite State**: Generates a Base64 JSON `next_cursor` preserving exact offsets/keys (`own_offset`, `following_key`, `rec_offset`) for independent provider resumption.
3. **Security Stripping**: Strips internal algorithmic markers (`_rankingScore`, `source`, `engagementScore`, `discoverShard`) before JSON serialization to eliminate proprietary algorithm leakage.

---

## 7. Extending the Pipeline

To add a new content provider (e.g., Sponsored Ads):
1. Define `get_sponsored_posts(user_id, limit, offset, conn)` in `feed_providers.py`.
2. Register provider execution in `feed_services.py` and attach `sponsored_offset` to cursor state.
3. Assign algorithm base weight in `ranking_services.py`.
4. Append any proprietary metadata tags to `_INTERNAL_FIELDS` blacklist.
