# Backend Service Classes & Data Access Layer Reference

This document provides a comprehensive technical overview of the internal Python service modules located under `backend/services/`. These modules encapsulate all domain logic, database interaction strategies, and third-party integrations, decoupling API handlers from direct database execution.

---

## 1. Feed Orchestration Engine (`feed_services.py`)

Primary traffic controller responsible for constructing composite user timelines.

### Key Methods:
- `get_hybrid_feed(user_id: str, cursor: str, lat: float, lng: float, radius: float) -> dict`
  - **Shared DB Pooling**: Opens a single `psycopg2` database connection and passes it sequentially to all SQL providers (`get_live_events`, `get_own_content`, `get_nearby_events`). Guarantees zero connection leaks under Lambda concurrency bursts.
  - **Deduplication Matrix**: Tracks seen `eventID` and `postID` hashes to ensure multi-source items appear exactly once.
  - **Security Scrubbing**: Strips internal algorithm markers (`_rankingScore`, `source`, `engagementScore`, `discoverShard`) before JSON output.

---

## 2. Feed Data Providers (`feed_providers.py`)

Modular data retrieval handlers querying distinct SQL tables or NoSQL partitions.

### Key Providers:
- `get_live_events(conn, limit, offset, lat, lng, radius)`
  - SQL ILIKE / JOIN query fetching active public events (`startAt <= now`).
  - Safeguards Haversine cosine math against DB floating-point domain errors.
- `get_own_content(conn, user_id, limit, offset)`
  - Dual SQL query fetching logged-in user's `posts` and `events`.
- `get_nearby_events(conn, limit, offset, lat, lng, radius)`
  - Haversine geo-filter querying upcoming local events.
- `get_following_content(user_id, limit, last_key)`
  - DynamoDB fan-out query retrieving timeline items from followed users.
- `get_recommendations(limit, offset)`
  - Delegates to `interaction_services.get_discover_feed()`.

---

## 3. Algorithmic Ranking Engine (`ranking_services.py`)

Computes deterministic relevance scores for timeline ordering.

### Key Methods:
- `rank_feed_items(items: list) -> list`
  - Applies exponential time decay ($t_{1/2} = 12\text{h}$) combined with source base weights (`OWN` = 1.2, `FOLLOWING` = 1.0, `REC` = 0.8) and engagement score multipliers.

---

## 4. Event & Party Management (`event_services.py`)

Handles dual-write persistence and lifecycle state transitions for party cards.

### Key Methods:
- `create_event(host_user_id: str, raw_payload: dict, status: str) -> dict`
  - Performs synchronous write to RDS `events` table, followed by non-blocking projection write to DynamoDB `events` table (`SK: CARD`).
  - Fallback identity mapping resolves `custom:userId` or primary Cognito username.
- `get_my_events(host_user_id: str) -> dict`
  - Queries RDS `WHERE hostUserID = :id ORDER BY createdAt DESC`.

---

## 5. Booking & Ticket Engine (`booking_services.py`)

Manages inventory lockouts, capacity decrementing, and order creation.

### Key Methods:
- `create_booking(user_id, username, event_id, tier_id, quantity)`
  - Verifies event `Published` status and atomic tier capacity decrementing.

---

## 6. Discover & Scatter-Gather (`interaction_services.py`)

Manages high-throughput global trending queries.

### Key Methods:
- `get_discover_feed(limit: int) -> list`
  - Executes parallel `ThreadPoolExecutor` scatter-gather queries across 10 DynamoDB shards (`DISCOVER#SHARD_0`..`9`).
