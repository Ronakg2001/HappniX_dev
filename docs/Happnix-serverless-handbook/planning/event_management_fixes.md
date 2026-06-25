# Event Management Bug Fixes

This document serves as an archive of the rationale behind fixing the "Phantom Duplicates" bugs in the HappniX Event Management system. It provides historical context for future developers modifying the `MyEventsContext` or the Event APIs.

## The "Phantom Duplicates" Problem

### 1. The Local Storage Desync Bug
**Symptom:** When a user drafted an event, it was assigned a client-side ID (`c_12345`). When the draft was successfully synced to the backend, the backend returned a new, permanent UUID (`7d8a9f...`). The frontend failed to update its `localStorage` with this new ID, resulting in both the `c_` version and the `UUID` version appearing in the user's dashboard simultaneously upon the next refresh.

**Fix:** The frontend `apiClient.post` `.then()` handler was updated to explicitly extract the permanent `eventID` from the backend's success response and run a `.map` over the local `createdEvents` state to swap the ID inline.

### 2. The Unbounded Insert Bug
**Symptom:** Whenever a user updated an *existing* event (for example, to change its dates and move it from "Upcoming" to "Live"), the background auto-save triggered `PublishEvent`. However, the backend handler blindly called `event_services.create_event(...)` every single time, inserting a brand new row with a newly generated UUID into the PostgreSQL database. This caused events to clone exponentially in the user's feeds.

**Fix:** A unified `_handle_event_save` function was introduced in `events.py`. It inspects the incoming payload for an existing `eventID`. 
- If an `eventID` exists and is *not* a `c_` ID, it calls `event_services.update_event(...)` which executes an SQL `UPDATE`.
- If no ID is present or it is a `c_` ID, it calls `create_event(...)` to execute an `INSERT`.

### 3. The Lingerer Duplicate Bug
**Symptom:** Even after the above fixes, users who had previously corrupted `localStorage` states still saw duplicates because the legacy `c_` copies were still stuck on their devices.

**Fix:** A "deduplication filter" was added to the `GET /api/events` fetch routine. When merging backend events with local drafts, the frontend drops any local `c_` draft that shares an exact `title` match with an incoming backend event. This automatically cleans up the user's corrupted state without requiring a cache reset.

## Status Transition Fix

**Problem:** Statuses (Upcoming, Live, Completed) were static strings stored in the database. Shifting an event from Upcoming to Live would require a chron job to scan the database continuously and update rows.

**Fix:** Database statuses were generalized to simply "Published". The frontend `transformBackendEvent` now dynamically calculates the status by comparing the `startAt` and `endAt` timestamps against `Date.now()`, ensuring accurate transitions in real-time.
