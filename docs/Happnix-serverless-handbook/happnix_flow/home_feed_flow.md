# Home Page Feed Flow

This document describes the request lifecycle when a user opens the HappniX app and views the Home Page.

## 1. Client Initialization (React / Next.js)

1. The user navigates to the Home Page (`/home`).
2. The custom hook `useFeed.ts` mounts, retrieves active user coordinates from `localStorage.getItem("userLocation")` (managed by `locationStore.tsx`) or browser GPS, and calls `loadFeed(isInitial = true)`.
3. An authenticated HTTP `GET` request is dispatched via `apiClient.get('api/home/feed')` with the user's Bearer token and optional `lat`, `lng`, and `radius=5` query parameters.
4. A `setInterval` is established to poll the lightweight endpoint `GET /api/home/feed/check?since=<timestamp>` every 30 seconds. If new content exists, a "New Posts" UI bubble appears without disrupting scroll position.

## 2. API Gateway & Authentication

1. The request hits the AWS API Gateway route for `GET /api/home/feed`.
2. The `HomePageApi` Lambda function (`backend/handlers/home_page.py`) is invoked.
3. The handler validates the Bearer token against Cognito, verifies user existence in RDS, and parses `cursor`, `lat`, and `lng` query parameters.

## 3. Feed Orchestration & Geolocation Providers

1. The request is routed to `feed_services.get_hybrid_feed(user_id, cursor, lat, lng)`.
2. **Cursor Parsing**: The Base64-encoded JSON cursor is decoded to restore provider-specific offsets (`own_offset`, `following_key`, `rec_offset`) and last-seen `_rankingScore` + `item_id` for tie-breaking.
3. **Carousel Data Fetching**: If no cursor score exists (fresh load), `feed_providers.get_live_events` fetches active public events within 50km using safeguarded Haversine formula.
4. **Sequential Data Fetching**: A single shared RDS connection is opened and reused across RDS-based providers:
   - `get_own_content(conn=shared)` — own posts + published events (JOINed with users table for author info)
   - `get_nearby_events(conn=shared)` — public events within 5km radius using Haversine formula safeguarded with `LEAST(1.0, GREATEST(-1.0, ...))` against DB float precision crashes
   - `get_following_content()` — DynamoDB fan-out, passes `ExclusiveStartKey` for deep pagination
   - `get_recommendations()` — Discover feed via GSI-Discover scatter-gather
5. **Deduplication**: Items are merged and deduplicated by `eventID` / `postID`.
6. **Ranking**: `ranking_services.rank_feed_items()` scores items: `Base Weight × Time Decay × Engagement Factor`.

## 4. Pagination & Security Response

1. The ranked list is sorted descending by `_rankingScore`.
2. If a cursor was provided, items are filtered by composite tie-breaker: `score < cursor_score` OR (`score == cursor_score` AND `item_id < cursor_item_id`).
3. The list is sliced to requested limit (default 15).
4. A Base64-encoded JSON `next_cursor` is generated containing score, item_id, and provider offsets.
5. **Internal fields are stripped** (`_rankingScore`, `source`, `engagementScore`, etc.) before returning to prevent algorithm leakage.
6. The API responds with HTTP 200.

## 5. Client Rendering & Event Creation Sync

1. **Event Creation**: When an event is built in `EventBuilder.tsx`, coordinates (`latitude`, `longitude`) and `visibility: 'Public'` are extracted by `event_services._format_event_payload` and saved to RDS.
2. `useFeed.ts` receives feed response and records timestamp.
3. `live_now` populates `<LiveNowCarousel />`.
4. `feed_items` render in vertical list via `<FeedItem />`, matching real author/organizer profiles.
5. **Tab filters** (`all`, `posts`, `events`, `nearby`) filter feed client-side via `useMemo`. When `"nearby"` is clicked, location-aware events (`source === 'NEARBY'`) surface immediately.
