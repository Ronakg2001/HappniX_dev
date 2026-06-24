# Discover Search Redesign — Planning Document

This document captures the historical context, requirements, and decisions made during the redesign of the Discover Search functionality for the HappniX platform.

## 1. Problem Statement

The original implementation of the Discover Search possessed several critical flaws:
- **Performance Constraints:** The frontend made multiple requests to separate APIs for Users and Events, leading to UI jitter and high latency.
- **Missing Data:** Avatars and Profile Pictures were not consistently returned because the `profilePictureUrl` column was omitted from the `manifest.json` whitelist, preventing it from being saved to RDS during signup/profile updates.
- **Privacy Leaks:** Private events, and public events hosted by users with private accounts, were leaking into the search results. Additionally, `search_users_by_name` had no `privacyMode` filter — private users were exposed.
- **Architectural Bottleneck:** Heavy wildcard search queries were routing through the core `HomePageApi` or `EventsApi`, threatening to consume concurrency limits for crucial user paths.
- **Deploy Gap:** The `deploy_app.yml` workflow was missing `EnableDiscoverApi=true` — the Lambda only deployed by accident due to SAM template defaults.

## 2. Requirements

1. **Unified Search Experience:** A single API endpoint that returns both Users and Events.
2. **Real-time UX:** The UI must display instant, top-level results while typing (max 5 per category) and expand when typing stops (max 10).
3. **Optimized "See More":** Clicking "See More" should expand the view to a full 50 items without requiring a secondary network request.
4. **Data Integrity:** Profile pictures must be successfully stored in RDS and their URLs fully resolved with the Cloudflare R2 CDN prefix by the backend before returning to the frontend.
5. **Strict Privacy:** Zero exposure of private events or private users in the search results.

## 3. Implementation Strategy

### A. Infrastructure & Backend
- **New Lambda:** Created `DiscoverApi` mapped to `/api/discover/search` within `infra/app/template.yaml`.
- **Deploy Fix:** Added `ParameterKey=EnableDiscoverApi,ParameterValue=true` to `.github/workflows/deploy_app.yml`.
- **Service Orchestration:** Created `services/discover_services.py` to handle the sequential fetching of diverse entities (Users and Events from RDS).
- **Database Fixes:**
  - Added `profilePictureUrl` (and other missing fields like `privacyMode`, `bio`, `userType`, `uniqueNationalID`, `unidIsVerified`) to the `users` table config in `backend/integration/manifest.json`.
  - Appended `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements to `happnix_auth_schema.sql` to automatically patch existing deployments.
  - Implemented `search_public_events` in `rds.py` with an `INNER JOIN` on `users` to ensure `privacyMode != 'private'` and `visibility != 'Private'`.
  - Added `privacyMode != 'private'` filter to `search_users_by_name` to fix the privacy leak.
  - Fixed `basePrice > 0` crash when `basePrice` is `None` by defaulting to `0`.

### B. Frontend Redesign
- **Hook Consolidation:** Replaced `useUserSearch.ts` with `useDiscoverSearch.ts` to fetch 50 users and 50 events under the hood.
- **Component Restructuring:** Replaced `UsersSearchPanel.tsx` with `DiscoverSearchPanel.tsx` capable of rendering both Event Cards and User Cards.
- **Data Hydration:** Implemented dynamic CDN prefixing within the `DiscoverApi` handler so the React components receive fully-qualified image URLs. The frontend also runs `fixAvatarUrl()` to handle legacy dead CDN URLs.

## 4. Bugs Fixed During Review

| # | Severity | Description |
|---|----------|-------------|
| 1 | Critical | `search_users_by_name` had no `privacyMode` filter — private users were exposed in search. Fixed by adding `AND "privacyMode" != 'private'`. |
| 2 | Critical | `discover.py` crashed with `TypeError` when `basePrice` was `None`. Fixed by defaulting to `0`. |
| 3 | Critical | `deploy_app.yml` never explicitly passed `EnableDiscoverApi=true`. Fixed. |
| 4 | Minor | `event.ts` had a missing newline between `DiscoverItem` and `CountryInfo` interfaces. Fixed. |

## 5. Retrospective & Outcomes

The redesign was a complete success. By shifting the complex filtering and CDN mapping to the backend, the React frontend became dramatically simpler. The unified hook fetching 50 items up-front allowed for instantaneous tab switching and layout expansions, vastly improving the perceived performance of the app. The database schema fixes ensured that user avatars function reliably moving forward. The security review caught a critical privacy leak that would have exposed private user accounts in the search results.
