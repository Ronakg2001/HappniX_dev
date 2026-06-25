# Hybrid Feed Orchestration Architecture

The HappniX hybrid feed service dynamically merges, deduplicates, and ranks items from various backend sources into a single, cohesive timeline for the user.

## Core Services

### 1. `feed_services.py` (The Orchestrator)
Located in `backend/services/feed_services.py`, this service acts as the traffic controller for the user's home feed. 

- **Shared DB Connection**: Opens a single RDS connection and passes it to all RDS-based providers (`get_live_events`, `get_own_content`), then closes it before calling DynamoDB/non-RDS providers. This prevents Lambda from exhausting the RDS connection pool under concurrent load.
- **Deduplication**: Since a single piece of content might be retrieved by multiple providers (e.g. an event might be hosted by the user *and* recommended to them), `feed_services` deduplicates items based on `eventID` or `postID`.
- **Composite Pagination**: Uses a Base64-encoded JSON cursor that tracks the `offset` or `LastEvaluatedKey` for *every* provider, plus a tie-breaker (`_rankingScore` + `itemID`) to prevent cursor collisions.
- **Internal Field Stripping**: Before returning to the client, internal metadata (`_rankingScore`, `source`, `engagementScore`, `engagementSortKey`, `discoverShard`) is stripped to prevent algorithm leakage.

### 2. `feed_providers.py` (Data Access Layer)
Located in `backend/services/feed_providers.py`, this file contains modular functions to fetch distinct "slices" of content. All RDS-based providers accept an optional `conn` parameter for connection sharing.

| Provider | Description | Backend Source | User Data |
| :--- | :--- | :--- | :--- |
| `get_live_events` | Fetches active events where `startAt <= now`. Supports Haversine geo-filter (50 km radius) when `lat`/`lng` are provided. | RDS (events + users JOIN) | Host name, avatar |
| `get_own_content` | Fetches recent posts and published events by the logged-in user. | RDS (posts + users JOIN, events + users JOIN) | Author name, avatar |
| `get_following_content` | Fetches posts/events from followed users via DynamoDB fan-out. Returns `LastEvaluatedKey` for deep pagination. | DynamoDB | Embedded in fan-out item |
| `get_recommendations` | Leverages the discover feed scatter-gather across GSI-Discover shards. | DynamoDB | Embedded in item |

### 3. `ranking_services.py` (The Algorithm)
Located in `backend/services/ranking_services.py`, this applies a heuristic mathematical formula to assign a `_rankingScore` to each feed item.

**Formula Overview:**
`Final Score = Base Weight × Time Decay × Engagement Factor`

- **Base Weight**: Content is weighted by importance (e.g. `OWN_CONTENT` = 1.2, `FOLLOWING` = 1.0, `RECOMMENDATION` = 0.8).
- **Time Decay**: Uses an exponential decay function. Content loses half its value every 12 hours (`half_life_hours = 12.0`). This ensures fresh content quickly rises to the top.
- **Engagement Factor**: Uses the 0-100 `engagementScore` from the database to give popular content a slight boost (`1.0 + engagement/100`).

### 4. Lightweight Polling Endpoint
`GET /api/home/feed/check?since=<ISO timestamp>` — A dedicated endpoint that runs a single `EXISTS` SQL query instead of rebuilding the entire feed. The frontend polls this every 30 seconds and only shows a "New Posts" bubble if new content exists.

## Extending the Feed

Because of this modular design, adding a new feed source (e.g. a "Sponsored Posts" engine) is simple:
1. Create a `get_sponsored_posts(user_id, limit, offset, conn=None)` function in `feed_providers.py`.
2. Add it to the sequential execution list in `feed_services.py`, and add a dedicated `sponsored_offset` to the composite cursor state.
3. Give it a base weight in `ranking_services.py`.
4. Add the new internal fields (if any) to the `_INTERNAL_FIELDS` set in `feed_services.py`.

## Known Limitations (V1)

- **Geo-filtering requires `latitude`/`longitude` columns** on the `events` table. If these columns don't exist yet, the Haversine filter is silently skipped (the `lat IS NOT NULL` check ensures no crash).
- **Sequential fetching adds latency** (~100-200ms per provider). If a connection pooler like PgBouncer is deployed in front of RDS, we can safely switch back to `ThreadPoolExecutor` for concurrent fetching.
- **Recommendation personalization depends on `PREF#CLUSTER`** being populated. New users with no interactions will receive generic high-engagement content until the preference worker runs.
- **Tab filters are client-side** (`posts`, `events`, `nearby`). This means all item types are always fetched regardless of which tab is active. Server-side filtering can be added as an optimization if needed.
