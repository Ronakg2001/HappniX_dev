# Home Page Feed Flow

This document describes the request lifecycle when a user opens the HappniX app and views the Home Page.

## 1. Client Initialization (React / Next.js)

1. The user navigates to the Home Page (`/home`).
2. The custom hook `useFeed.ts` mounts and calls `loadFeed(isInitial = true)`.
3. An HTTP `GET` request is dispatched to `/api/home/feed` with the user's Bearer token.
4. Concurrently, a `setInterval` is established to poll `/api/home/feed` every 30 seconds to check for new content (updating a "New Posts" UI bubble without disrupting the user's scroll position).

## 2. API Gateway & Authentication

1. The request hits the AWS API Gateway route for `GET /api/home/feed`.
2. The `HomePageApi` Lambda function (`backend/handlers/home_page.py`) is invoked.
3. The custom `CognitoPreToken` authorizer validates the JWT and injects `user_id` context.
4. The handler extracts the `user_id` and checks for a `cursor` query parameter.

## 3. Feed Orchestration

1. The request is routed to `feed_services.get_hybrid_feed(user_id, cursor)`.
2. **Carousel Data Fetching**: If `cursor` is empty (meaning it's the top of the feed), `feed_providers.get_live_events` fetches currently active events for the Live Now carousel.
3. **Concurrent Data Fetching**: The service spins up a ThreadPoolExecutor to fetch from three sources simultaneously:
   - `get_own_content()` (RDS)
   - `get_following_content()` (DynamoDB Fan-out)
   - `get_recommendations()` (RDS / Graph)
4. **Deduplication**: Items are merged into a single list and deduplicated using their primary IDs.
5. **Ranking**: The combined list is passed to `ranking_services.rank_feed_items()`, which scores every item based on freshness, relevance, and engagement.

## 4. Pagination & Response

1. The ranked list is sorted descending by `_rankingScore`.
2. If a `cursor` was provided, the list is filtered to only include items with a score strictly less than the cursor.
3. The list is sliced to the requested limit (e.g. 15 items).
4. The `_rankingScore` of the very last item in the slice is saved as `next_cursor`.
5. The API responds with HTTP 200:
   ```json
   {
     "success": true,
     "data": {
       "live_now": [...],
       "feed_items": [...],
       "next_cursor": "0.8523910"
     }
   }
   ```

## 5. Client Rendering

1. `useFeed.ts` receives the response.
2. `live_now` is passed to the `<LiveNowCarousel />` component to render swipeable event bubbles.
3. `feed_items` are appended to the main vertical scroll view.
4. The polymorphic `<FeedItem />` component dynamically renders either an `<EventCard />` or `<SocialPostCard />` depending on the item's `entityType`.
5. When the user scrolls to the bottom, `useFeed.ts` triggers a new `loadFeed()` passing the stored `next_cursor`.
