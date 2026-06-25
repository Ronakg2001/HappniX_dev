# Event Management Flow

This document details the end-to-end flow of event creation, synchronization, status transitions, and deletion in the HappniX ecosystem.

## 1. Local Draft Creation

When a host creates an event on the frontend, the event is initially stored exclusively in the browser's `localStorage` to allow for rapid, offline-capable editing.

1. **Temporary ID Generation:** The frontend assigns the event a temporary client-side ID prefixed with `c_` (e.g., `c_1781293849102`).
2. **Local Storage:** The event object is persisted into the `happnix_created_events_v4` localStorage array.
3. **Draft Status:** The event's status is intrinsically "Draft".

## 2. Background Synchronization

To preserve the host's work, the frontend automatically syncs drafts and published events to the backend in the background.

1. **Trigger:** `updateCreatedEvent` in the `MyEventsContext` detects a change.
2. **Media Processing:** `processEventMedia` scans the event object for local file URIs (e.g., `blob:` URLs for banner images) and requests presigned R2 upload URLs. The media is uploaded, and the event object is patched with the permanent R2 URLs.
3. **API Call:** The frontend sends a `POST /api/events` request with:
   - `actionItem: "CreateEventDraft"` (if the event is a Draft)
   - `actionItem: "PublishEvent"` (if the event is Upcoming or Live)
4. **Backend Processing:** 
   - If the backend receives an event ID starting with `c_`, it treats it as a **New Event**. It generates a real UUID (`eventID`), inserts it into RDS, and syncs an `EVENT_CARD` to DynamoDB for feed discovery.
   - If the backend receives a real UUID, it maps to `update_event`, executing an SQL `UPDATE` against the existing row, ensuring data isn't duplicated.

## 3. ID Swapping & Deduplication

A critical step in the sync process occurs when the backend successfully creates the event and returns the permanent `eventID`.

1. **ID Swap:** The frontend intercepts the success response, scans its `localStorage`, finds the `c_` ID, and replaces it with the permanent UUID.
2. **Fetch Deduplication:** When pulling a fresh list of events via `GET /api/events`, the frontend merges the backend data with local drafts. To prevent "phantom duplicates," it filters out any local `c_` drafts that share the exact same title as a backend event (handling cases where the ID swap failed or the user refreshed mid-sync).

## 4. Automated Status Transitions

HappniX determines an event's state (`Upcoming`, `Live`, `Completed`) dynamically, rather than relying on heavy CRON jobs or background workers constantly updating database rows.

1. **Backend State:** The database simply stores the `startAt` and `endAt` timestamps, alongside a generic `status` of "Published".
2. **Frontend Evaluation:** When `transformBackendEvent` runs, it compares the timestamps against the current clock:
   - **Upcoming:** `now < startAt`
   - **Live:** `startAt <= now <= endAt`
   - **Completed:** `now > endAt`
3. This guarantees that event statuses transition instantly and accurately for every user viewing them, without database write bottlenecks.

## 5. Event Deletion

1. **Frontend:** The user selects the Trash icon. The `deleteCreatedEvent` function immediately strips the event from React state and `localStorage` for a snappy UI update.
2. **API Call:** An asynchronous `actionItem: "DeleteEvent"` payload is dispatched.
3. **Backend Security:** The `delete_event` service queries RDS to verify the `hostUserID` matches the requesting user.
4. **Cleanup:** If authorized, the event is purged from PostgreSQL and its `EVENT_CARD` is deleted from DynamoDB, immediately removing it from all user feeds.

## 6. CQRS Architecture (Event Services)

HappniX event storage follows a Command Query Responsibility Segregation (CQRS) inspired pattern to optimize for both heavy relational writes and blazing-fast feed reads. This logic is orchestrated by the backend `event_services.py` module.

### The "Write" Path (RDS)
PostgreSQL (RDS) is the primary source of truth for all events.
- **`create_event`**: Takes raw JSON payloads, flattens them via `_format_event_payload`, and inserts the data into the `events` table with a newly generated UUID.
- **`update_event`**: Executes a SQL `UPDATE` against the `events` table. It ensures data security by verifying that the requesting `hostUserID` matches the row's owner before applying any patches.
- **`delete_event`**: Removes the event row entirely. Again, authorization via `hostUserID` is strictly enforced.

### The "Read" Projection (DynamoDB)
To populate user Home Feeds instantly without expensive SQL joins, a condensed projection of the event is synced to DynamoDB.
- **Sync Trigger**: Whenever `create_event` or `update_event` successfully mutates the RDS table, a subsequent function (`_build_event_card`) packages the essential UI fields (title, banner, location, price, dates) into an `EVENT_CARD`.
- **Storage**: This card is stored in DynamoDB under the partition key `EVENT#{eventID}` and sort key `CARD`. 
- **Feed Rendering**: The Home Feed query simply scans/queries these `CARD` records, avoiding RDS entirely.
- **Cleanup**: `delete_event` issues a `delete_item` call to DynamoDB to purge the `EVENT_CARD`, instantly pulling it from all user feeds.

### Data Parsing Details
The API receives nested, complex JSON from the frontend (e.g., `schedule: { startDate, startTime }`).
- **`_format_event_payload`**: This private utility flattens the nested structures into the flat schema required by the RDS `events` table. It automatically handles timezone construction (defaulting to `+05:30`) and ISO 8601 conversions.
