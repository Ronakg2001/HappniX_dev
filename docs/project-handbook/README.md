# Happnix Project Handbook

This folder is a human-readable handbook for the current `Party_connect_hub_redefine` app.
It is written from the codebase as it exists now, not from an idealized design.

## What This Project Is

Happnix is a Django-based social/event platform with:

- mobile OTP and username/password sign-in
- signup and profile onboarding
- event creation and discovery
- ticket booking, payment-state simulation, cancellation, archive, and group booking
- guest invite and guest ticket flows
- user search, follow, privacy, and notifications
- direct messaging and group chat
- WebSocket-based real-time messaging presence and receipts

## Tech Stack

- Backend: Django, Django Channels, Daphne
- Primary database: SQLite (`db.sqlite3`)
- Secondary projection/search store: MongoDB when `MONGO_URI` is configured
- Frontend: Django templates, vanilla JavaScript, CSS, Tailwind CDN on the home page
- Realtime: Channels `InMemoryChannelLayer` + WebSocket consumer
- Media storage: Django `default_storage` under `/media/`

## Source Of Truth

- SQL is the source of truth for auth, relational data, tickets, conversations, and groups.
- MongoDB is optional and acts as a projection/search/read-model for:
  - `user_profiles`
  - `events`
  - `notifications`
- If MongoDB is unavailable, the app falls back to SQL for several flows.

## Runtime Architecture

1. `Happnix_party_APP/settings.py` configures Django, Channels, SQLite, static/media, and optional Mongo env vars.
2. `Happnix_party_APP/urls.py` includes all app routes from `HAPPNIX.urls`.
3. `HAPPNIX/urls.py` maps page routes and API routes to:
   - `views.py`
   - `signin_signup.py`
   - `messaging.py`
   - `group_chat.py`
4. Templates in `HAPPNIX/templates/` load frontend scripts from `HAPPNIX/static/js/`.
5. Frontend scripts call JSON or multipart endpoints under `/api/...`.
6. Messaging UI also opens `ws/messages/` for socket events.

## Documents In This Folder

- `api-reference.md`
  Full route inventory with handler functions, request patterns, and response patterns.
- `database-and-schemas.md`
  SQL models, Mongo collections, relationships, and data storage behavior.
- `codebase-map.md`
  Important files, modules, classes, functions, and responsibility map.
- `frontend-backend-flow.md`
  Which page loads which script, which script calls which API, and which backend function handles it.

## Main App Entry Points

- Landing page: `/`
- Sign in / sign up: `/signin/`
- Signup details: `/signup/details/`
- Profile completion: `/signup/profile/`
- Main authenticated app: `/home/`
- Ticket page: `/ticket/<ticket_id>/`
- Guest onboarding: `/guest-invite/<invite_token>/`
- Guest ticket page: `/guest-ticket/<invite_token>/`
- WebSocket endpoint: `/ws/messages/`

## Important Databases And State Stores

- SQLite tables generated from `HAPPNIX/models.py`
- Session storage for:
  - mobile OTP map
  - guest mobile OTP map
  - pending signup mobile
  - pending profile setup
  - Aadhaar client id
- Mongo collections created lazily by `HAPPNIX/mongo_store.py`

## External Services And External Libraries

- Optional MongoDB via `pymongo`
- Aadhaar/KYC sandbox endpoint in `signin_signup.py`
- Tailwind CDN in `home_page.html`
- Lucide icons and Phosphor icons on the home page
- Leaflet CSS on the home page
- QR helpers:
  - `qrcode`
  - `segno`
  - `qr-code-styling` CDN

## Important Notes About The Current Codebase

- The backend is mostly function-based views.
- A large amount of business logic lives directly in `HAPPNIX/views.py`.
- The home page is the biggest UI surface and centralizes many features in:
  - `HAPPNIX/templates/home_page.html`
  - `HAPPNIX/static/js/home_page.js`
  - `HAPPNIX/static/js/messages.js`
- Some request/response shapes are inferred from both JS and Python because the app does not use typed serializers or OpenAPI schemas.
- There appears to be at least one stale frontend reference to `/api/tickets/<id>/verify`; no matching URL was found in `HAPPNIX/urls.py`.

## Best Reading Order For A New Developer

1. Read `codebase-map.md`
2. Read `database-and-schemas.md`
3. Read `frontend-backend-flow.md`
4. Use `api-reference.md` while tracing individual flows
