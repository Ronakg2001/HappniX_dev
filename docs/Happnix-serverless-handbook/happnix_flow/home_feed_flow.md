# Home Page Feed Flow

This document describes the request lifecycle when a user opens the HappniX app and views the Home Page.

## 1. Client Initialization (React / Next.js)

1. The user navigates to the Home Page (`/home`).
2. The custom hook `useFeed.ts` mounts, requests the user's geolocation via `navigator.geolocation`, and calls `loadFeed(isInitial = true)`.
3. An HTTP `GET` request is dispatched to `/api/home/feed` with the user's Bearer token and optional `lat`/`lng` query parameters.
4. A `setInterval` is established to poll the lightweight endpoint `GET /api/home/feed/check?since=<timestamp>` every 30 seconds. If new content exists, a "New Posts" UI bubble appears without disrupting the user's scroll position.

## 2. API Gateway & Authentication

1. The request hits the AWS API Gateway route for `GET /api/home/feed`.
2. The `HomePageApi` Lambda function (`backend/handlers/home_page.py`) is invoked.
3. The handler validates the Bearer token against Cognito, extracts the `user_id`, and parses the `cursor`, `lat`, and `lng` query parameters.

## 3. Feed Orchestration

1. The request is routed to `feed_services.get_hybrid_feed(user_id, cursor, lat, lng)`.
2. **Cursor Parsing**: The Base64-encoded JSON cursor is decoded to restore provider-specific offsets (`own_offset`, `following_key`, `rec_offset`) and the last-seen `_rankingScore` + `item_id` for tie-breaking.
3. **Carousel Data Fetching**: If no cursor score exists (fresh load), `feed_providers.get_live_events` fetches currently active events. If `lat`/`lng` are provided, a Haversine radius filter restricts results to ~50 km.
4. **Sequential Data Fetching**: A single shared RDS connection is opened and reused across all RDS-based providers:
   - `get_own_content(conn=shared)` — own posts + published events (JOINed with users table for author info)
   - `get_following_content()` — DynamoDB fan-out, passes `ExclusiveStartKey` for deep pagination
   - `get_recommendations()` — Discover feed via GSI-Discover scatter-gather
5. **Deduplication**: Items are merged and deduplicated by `eventID` / `postID`.
6. **Ranking**: `ranking_services.rank_feed_items()` scores items: `Base Weight × Time Decay × Engagement Factor`.

## 4. Pagination & Response

1. The ranked list is sorted descending by `_rankingScore`.
2. If a cursor was provided, items are filtered by composite tie-breaker: `score < cursor_score` OR (`score == cursor_score` AND `item_id < cursor_item_id`).
3. The list is sliced to the requested limit (default 15).
4. A Base64-encoded JSON `next_cursor` is generated containing the score, item_id, and all provider offsets.
5. **Internal fields are stripped** (`_rankingScore`, `source`, `engagementScore`, etc.) before returning — they are never exposed to the client.
6. The API responds with HTTP 200:
   ```json
   {
     "success": true,
     "data": {
       "live_now": [...],
       "feed_items": [...],
       "next_cursor": "eyJzY29yZSI6MC44NSwi..."
     }
   }
   ```

## 5. Client Rendering

1. `useFeed.ts` receives the response and records the current timestamp for future polling.
2. `live_now` is passed to `<LiveNowCarousel />` — swipeable cards with a red "LIVE" badge.
3. `feed_items` are appended to the main vertical scroll view.
4. The polymorphic `<FeedItem />` component renders either `<SocialPostCard />` or `<EventCard />` based on `entityType`. It uses real author/organizer data from the backend JOIN (name, avatar, username).
5. **Tab filters** (`all`, `posts`, `events`, `nearby`) filter the feed client-side via `useMemo`.
6. When the user scrolls to the bottom, `loadMore()` sends the stored `next_cursor`.

## 6. Polling for New Content

1. Every 30 seconds, the hook hits `GET /api/home/feed/check?since=<lastFetchedAt>`.
2. The backend runs a single lightweight `EXISTS` query against `posts` and `events` tables.
3. If `has_new: true`, a "New Posts" button appears. Clicking it triggers a full `refresh()`.
