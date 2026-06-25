# HappniX Home Page Feed & Recommendation Algorithm

This document outlines the implementation plan for the HappniX home page feed. The feed combines users' own content, followed users' content, and algorithmic recommendations, with a "Live Now" carousel at the top. The architecture is designed to be highly flexible, allowing us to tweak ranking algorithms and add new content sources (like live location) without rewriting the entire feed process.

## Resolved Decisions

1. **Live Status Definition:** An event is considered "Live" based strictly on the `startAt` and `endAt` timestamps.
2. **Real-time Updates:** For V1, we implement **pull-to-refresh** and a "New Posts" polling bubble. WebSockets will be considered for a future update.
3. **Pagination Strategy (Cursor-based):** 
   - *Explanation:* Instead of using page numbers (Page 1, Page 2) which can cause duplicate or missed items when new posts are added to the top of the feed, we use a "cursor" (like a timestamp or unique ID of the last item seen). 
   - *How it works:* When the app asks the backend for the next set of items, it says "Give me 10 items *older than* this specific post ID." This ensures that even if 5 new posts were just added at the top, the feed seamlessly picks up exactly where the user left off.

## Architecture Changes

We introduced a modular "Feed Aggregator" pattern in the backend. Instead of relying solely on fan-out on write to DynamoDB, the Feed API fetches from multiple *Providers*, ranks the items, and returns a unified, paginated feed. 

---

### Backend Components

#### `backend/services/feed_services.py`
A central Feed Service that acts as the orchestrator.
- **Feed Orchestrator:** Receives a user's feed request, calls registered Feed Providers concurrently, and passes the results to a Ranker.
- **LiveEventsProvider:** Fetches ongoing events (where `startAt` <= now <= `endAt` or status='Live') from followed users, own user, and nearby public events.
- **OwnContentProvider:** Fetches recent posts and upcoming/incomplete events from the logged-in user.
- **FollowingProvider:** Fetches posts and events created by followed users. (Leverages DynamoDB fan-out).
- **RecommendationProvider:** Uses the `user_interactions` table and event geospatial data (radius-based) to suggest content. 

#### `backend/services/ranking_services.py`
A module dedicated to scoring and sorting feed items.
- **Heuristic Ranker:** Combines chronological ordering with relevance scores. For example, recent posts get a high initial score that decays over time. Recommended items get scored based on interaction similarity. 
- **Flexibility:** By isolating the ranking logic, we can easily tweak weights (e.g., boosting Live Location events) later without touching the data-fetching logic.

#### `backend/handlers/feed_handler.py` (API Layer)
- Update the `GET /feed` endpoint to support cursor-based pagination and return two distinct payloads in one response:
  1. `live_now`: A list of currently live events for the top carousel.
  2. `feed_items`: The ranked mix of posts and events for the vertical feed.

---

### Frontend Components

#### `web/src/app/home/page.tsx`
Update the main page layout to incorporate the new feed structure.
- **Live Now Section:** A horizontally scrollable carousel (`overflow-x-auto`, `snap-x`) pinned at the top. It displays live events.
- **Main Feed List:** An infinite scrolling vertical list for posts and events. 

#### `web/src/components/feed/FeedItem.tsx`
A polymorphic component that renders differently based on the item type (Post vs Event vs Recommended Event).

#### `web/src/components/feed/LiveNowCarousel.tsx`
A component dedicated to the "Live Now" swipable top section.

#### `web/src/hooks/useFeed.ts` (State Management)
- Implementation of robust cursor-based pagination.
- Handle "New Posts Available" state: When the user scrolls down and new items arrive at the top, a "New Posts" bubble appears rather than forcibly jumping the user's scroll position.
