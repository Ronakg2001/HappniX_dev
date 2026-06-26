# Home Feed Feature Analysis: Red Team Scrutiny & Scaling Roadmap

**Modes Active**: `/truthmode /human /red /eli10 /future`

Hey! Let’s sit down and do a brutally honest, transparent review of the Home Page Feed pipeline we just built. We’ve wired together PostgreSQL RDS and sharded DynamoDB GSIs into a responsive timeline. It works great for our dev sandbox today, but if we put on our **Red Team** hats and stress-test this architecture against real production traffic (say, 100,000 concurrent users or 1,000 live events), we can spot several critical architectural bottlenecks ("holes").

Here is our transparent engineering breakdown of those holes, explained simply (**ELI10**), along with our exact roadmap to future-proof them (**Future**).

---

## Hole 1: The Dual-Write Race Condition (Split-Brain State)

### The Truth (/truthmode)
When a creator publishes an event (`POST /api/events`), `event_services.create_event()` executes two consecutive network operations:
1. `INSERT INTO events ...` in PostgreSQL RDS (Synchronous commit)
2. `dynamo_db.put_item(table="events", sk="CARD", ...)` via HTTP Boto3 SDK

If step #1 succeeds but step #2 fails (due to network timeout, DynamoDB throttling, or a table name mismatch like `HappniX-events-dev` vs `HappniX-events-v2-dev`), our backend catches the error and marks it `(non-fatal)` to prevent client-side 500 crashes.

### The ELI10 Mental Model
Imagine writing your party invitation in pen in your personal notebook (RDS), but when you walk over to stick a copy on the public town bulletin board (DynamoDB), a gust of wind blows it away. Your notebook says the party is happening, but nobody walking by the bulletin board will ever see it.

### The Impact
The event exists in RDS (so the host can book tickets or view it via direct SQL ID lookups), but it is completely invisible to the recommendation Discover algorithm (`GSI-Discover`).

### Future Roadmap (/future)
**Implement Transactional Outbox or CDC (Change Data Capture)**:
- Lambda should write **strictly** to PostgreSQL RDS within a single ACID database transaction.
- Attach an AWS DMS task or Debezium CDC worker (or PostgreSQL `NOTIFY` trigger) that listens to the `events` table WAL (Write-Ahead Log) and asynchronously projects the `EVENT_CARD` into DynamoDB with automatic retry guarantees and dead-letter queues (DLQ).

---

## Hole 2: Full Table Scan Haversine Trigonometry in SQL

### The Truth (/truthmode)
In `feed_providers.get_nearby_events()`, we filter nearby events by executing raw trigonometric math inside the SQL `WHERE` clause:
```sql
WHERE ACOS(SIN(RADIANS(:lat)) * SIN(RADIANS(latitude)) + ...) * 6371 <= :radius
```

### The ELI10 Mental Model
Imagine being in a library with 100,000 books and wanting books about dogs. Instead of checking the "Animals" section index, you pick up every single book one by one, read the entire back cover, calculate the word count, and put it back down if it doesn't mention dogs.

### The Impact
Because PostgreSQL cannot index an ad-hoc trigonometric calculation across unconstrained rows, this forces a **Full Table Scan (Seq Scan)** on the `events` table. On our free-tier `db.t4g.micro` instance, doing millions of floating-point cosine operations during a traffic spike will instantly lock up the CPU (100% utilization) and timeout API requests.

### Future Roadmap (/future)
**SQL Bounding Box Pre-Filtering**:
Before running exact Haversine math, compute a rough coordinate square (bounding box) in Python:
```python
# 1 degree lat is ~111km. For 5km radius, delta is ~0.045 degrees
min_lat, max_lat = user_lat - 0.045, user_lat + 0.045
min_lng, max_lng = user_lng - 0.045, user_lng + 0.045
```
Add this pre-filter to SQL:
```sql
WHERE latitude BETWEEN :min_lat AND :max_lat 
  AND longitude BETWEEN :min_lng AND :max_lng
  AND ACOS(...) <= :radius
```
This lets PostgreSQL use a standard B-Tree index on `(latitude, longitude)` to instantly narrow 100,000 rows down to 30 rows *before* running the heavy cosine math!

---

## Hole 3: Discover Feed Shard Thundering Herd

### The Truth (/truthmode)
`get_discover_feed()` queries all 10 shards (`DISCOVER#SHARD_0`..`9`) simultaneously using `ThreadPoolExecutor`.

### The ELI10 Mental Model
Imagine 1,000 students running into a cafeteria at noon and all shouting at 10 lunch ladies at the exact same second to ask what the soup of the day is. The lunch ladies get overwhelmed and drop their ladles.

### The Impact
If 1,000 concurrent users refresh their home feed, DynamoDB gets slammed with **10,000 parallel GSI read requests** instantly. This will trigger AWS `ProvisionedThroughputExceededException` throttling errors or cause severe on-demand billing spikes.

### Future Roadmap (/future)
**Algorithmic Edge Caching**:
Discover trending content is global (non-personalized). We should run a background Lambda scheduled cron every 60 seconds that pre-computes the top 100 trending discover cards across the 10 shards and saves the merged JSON payload into **AWS ElastiCache (Redis)** or Cloudflare R2/Workers KV. User home feed requests read directly from sub-millisecond edge cache memory.

---

## Hole 4: Stateless Cognito Access Token Lifetime Gap

### The Truth (/truthmode)
Our `handle_logout()` endpoint triggers `cognito.global_sign_out(access_token)`. However, AWS Cognito JWT access tokens are stateless cryptographic strings valid for 1 hour by default.

### The ELI10 Mental Model
Imagine giving someone a guest pass to your amusement park stamped "Valid until 5 PM." Even if you kick them out at 3 PM and cross their name off your master clipboard, if they sneak back in at 4 PM and show the guard their stamped pass, the guard will let them right back onto the rollercoasters.

### The Impact
An attacker with a stolen Bearer token can continue accessing private backend endpoints for up to 60 minutes after the user explicitly clicked "Log Out."

### Future Roadmap (/future)
**Active JWT Session Registry**:
Enforce validation against our `HappniX-jwt-sessions-dev` DynamoDB table (mirrored with 30-day TTL). On sensitive actions (booking tickets, updating profile), verify the `sessionId` exists in active DynamoDB storage, or configure Cognito access token expiration down to 5 minutes.

---

## Hole 5: UUID vs. Username Identity Split (Resolved)

### The Truth (/truthmode)
Cognito signups inject UUIDv7 strings as primary `Username` claims (`0193bb...`), whereas legacy test routines assumed human-readable handles (`john_party`).

### Resolution Status: FIXED
We modernized `integration/rds.py -> get_user_by_username()` to execute a dual-probe pattern:
```python
res = get_record("users", userID=username)
if not res["success"]:
    res = get_record("users", userName=username)
```
This guarantees 100% backwards compatibility for legacy developers while supporting modern UUIDv7 production auth tokens.

---

## Summary of Immediate System Fixes Applied Today

1. **DynamoDB Table Alignment**: Fixed `infra/app/template.yaml` to inject `HappniX-events-v2-dev` matching CloudFormation data stack table names.
2. **Cognito Fallback Extraction**: Updated `handlers/events.py` and `handlers/booking.py` to gracefully fallback `user_id = user_id or cognito_username` when `custom:userId` claims are absent.
3. **Unified Identity Lookup**: Upgraded RDS user resolver routines to support both UUID primary keys and username handles.
