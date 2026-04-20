# Codebase Map

This file explains the major folders, files, classes, functions, and responsibilities.

## Top-Level Layout

## Quick Links

- Project settings: [settings.py](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:24)
- Project URLs: [urls.py](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/urls.py:23)
- App URLs: [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:4)
- WebSocket routes: [routing.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/routing.py:5)
- WebSocket consumer: [consumers.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/consumers.py:29)
- SQL models: [models.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/models.py:11)
- Mongo projection layer: [mongo_store.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/mongo_store.py:32)

### `manage.py`

- Django management entry point

### `Happnix_party_APP/`

Project configuration package.

- `settings.py`
  - Django settings
  - SQLite config
  - Channels and Daphne config
  - static/media config
  - optional Mongo env vars
  - key anchors:
    - [INSTALLED_APPS](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:24)
    - [CHANNEL_LAYERS](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:65)
    - [DATABASES](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:75)
    - [STATICFILES_DIRS](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:118)
    - [MEDIA_ROOT](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:123)
    - [MONGO_URI](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/settings.py:126)
- `urls.py`
  - includes `HAPPNIX.urls`
  - exposes `/admin/`
  - [route list](/e:/project/Party_connect_hub_redefine/Happnix_party_APP/urls.py:23)
- `asgi.py`
  - ASGI entrypoint for Channels/WebSockets
- `wsgi.py`
  - WSGI entrypoint

### `HAPPNIX/`

Main Django app.

#### Core backend modules

- `urls.py`
  - central route registry for pages and APIs
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:4)
- `views.py`
  - main event, ticket, guest invite, profile, settings, search, notification, and page handlers
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:154)
- `signin_signup.py`
  - auth, signup, OTP, password login, and Aadhaar verification handlers
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:26)
- `messaging.py`
  - direct messaging HTTP APIs and message serialization/broadcast helpers
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:421)
- `group_chat.py`
  - group messaging HTTP APIs and group serialization/broadcast helpers
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:530)
- `models.py`
  - all SQL models for social graph, eventing, tickets, guests, DMs, and group chat
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/models.py:11)
- `mongo_store.py`
  - optional MongoDB projection/search integration
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/mongo_store.py:32)
- `consumers.py`
  - WebSocket consumer and presence/read-receipt logic
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/consumers.py:29)
- `routing.py`
  - websocket route registry
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/routing.py:5)
- `utils.py`
  - shared JSON parsing, error responses, OTP generation, age helper, QR generation

#### Service modules

- `services/guest_tickets.py`
  - focused guest-ticket rules and helpers
  - [open file](/e:/project/Party_connect_hub_redefine/HAPPNIX/services/guest_tickets.py:7)

#### Admin/testing/support

- `admin.py`
- `tests.py`
- `management/commands/sync_mongo.py`

## Main Backend Responsibility Map

### `views.py`

Page handlers:

- `index_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:154)
- `Signup_signin_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:166)
- `forgot_password` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:180)
- `Home_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:185)
- `signup_details_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:214)
- `signup_profile_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:223)
- `party_loader_demo_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:233)
- `custom_location_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:238)
- `logout_view` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:248)
- `view_ticket_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:397)
- `guest_invite_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:917)
- `guest_ticket_page` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:973)

Major API groups:

- guest invite/ticket APIs
- event create/list/delete APIs
- ticket booking/payment/update/cancel/archive/delete APIs
- user search/follow/profile APIs
- profile privacy/update/follow-request APIs
- notifications and settings APIs

Important helpers:

- `_serialize_event` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:296)
- `_serialize_ticket` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:431)
- `_serialize_guest_invite_for_response` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:674)
- `_serialize_public_profile` in [views.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:1652)

### `signin_signup.py`

Responsibilities:

- mobile OTP sign-in
- password sign-in
- forgot-password placeholder flow
- signup details registration
- profile completion
- Aadhaar OTP integration

Key functions:

- `send_mobile_otp` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:49)
- `verify_mobile_otp` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:95)
- `login_with_password` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:146)
- `register_user_details` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:179)
- `complete_profile_setup` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:261)
- `send_aadhaar_otp_api` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:301)
- `verify_aadhaar_otp_api` in [signin_signup.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/signin_signup.py:353)

### `messaging.py`

Responsibilities:

- direct conversation discovery
- start conversation
- fetch/send direct messages
- attachment save and serialization
- edit/forward/delete/unsend actions
- conversation read/clear/delete actions
- socket broadcast payload generation

Key functions:

- `_serialize_message` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:139)
- `_serialize_conversation` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:188)
- `_save_message_attachments` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:361)
- `_broadcast_message_created` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:263)
- `conversations_api` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:421)
- `conversation_messages_api` in [messaging.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/messaging.py:464)

### `group_chat.py`

Responsibilities:

- group creation and membership management
- group message fetch/send
- per-recipient delivery and read tracking
- group-level broadcast payload generation

Key functions:

- `_serialize_group_message` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:249)
- `_serialize_group_conversation` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:308)
- `_create_group_message_statuses` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:168)
- `list_group_conversations_payload` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:352)
- `create_group_api` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:530)
- `group_messages_api` in [group_chat.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/group_chat.py:569)

### `mongo_store.py`

Responsibilities:

- Mongo connection management
- collection index creation
- profile projection sync
- event projection sync
- notification projection storage
- profile search

### `consumers.py`

Responsibilities:

- websocket auth gate
- online connection tracking
- typing events
- read receipts
- presence updates
- pending delivery receipt flush

### `models.py`

Contains all SQL models for:

- profile/social graph
- events/media
- tickets/guest tickets
- notifications
- direct messages
- group chat

## Frontend Structure

### Templates

Main templates:

- [templates/index.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/index.html:57)
- [templates/signup_signin.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_signin.html:117)
- [templates/signup_details.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_details.html:56)
- [templates/signup_profile_optional.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_profile_optional.html:32)
- [templates/home_page.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/home_page.html:1472)
- [templates/ticket_view.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/ticket_view.html:69)
- [templates/guest_onboarding.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_onboarding.html:199)
- [templates/guest_ticket.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_ticket.html:212)

Supporting/demo templates:

- `custom_location.html`
- `forgot_password.html`
- `create_post_event.html`
- `temp_create_post_host.html`
- `party_loader_demo.html`
- `messages_modal.html`
- `mobile_navigation.html`
- `data_and_time.html`
- `logo.html`

### JavaScript files

- `static/js/index.js`
- `static/js/signup_signin.js`
- `static/js/signup_details.js`
- `static/js/signup_profile_optional.js`
- `static/js/forgot_password.js`
- `static/js/create_post_event.js`
- `static/js/home_page.js`
- `static/js/messages.js`
- `static/js/ticket_view.js`
- `static/js/custom_location.js`
- `static/js/qr_generator.js`
- `static/js/frontend_config.js`
- key files:
  - [index.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/index.js:1)
  - [signup_signin.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_signin.js:1)
  - [signup_details.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_details.js:1)
  - [signup_profile_optional.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_profile_optional.js:1)
  - [forgot_password.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/forgot_password.js:1)
  - [create_post_event.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/create_post_event.js:563)
  - [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
  - [ticket_view.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/ticket_view.js:1)
  - [custom_location.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/custom_location.js:88)
  - [qr_generator.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/qr_generator.js:1)
  - [frontend_config.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/frontend_config.js:1)

## File-to-Feature Summary

| Feature | Main backend files | Main frontend files |
| --- | --- | --- |
| Auth and signup | `signin_signup.py`, `views.py` | `signup_signin.html`, `signup_signin.js`, `signup_details.js`, `signup_profile_optional.js` |
| Event creation | `views.py`, `models.py`, `mongo_store.py` | `create_post_event.html`, `create_post_event.js` |
| Event discovery | `views.py`, `mongo_store.py` | `home_page.html`, `home_page.js` |
| Tickets | `views.py`, `models.py`, `utils.py` | `home_page.js`, `ticket_view.html`, `ticket_view.js` |
| Guest invites | `views.py`, `services/guest_tickets.py`, `models.py` | `home_page.js`, `guest_onboarding.html`, `guest_ticket.html` |
| Profile/follow/settings | `views.py`, `models.py`, `mongo_store.py` | `home_page.js` |
| Notifications | `views.py`, `mongo_store.py`, `models.py` | `home_page.js` |
| Direct messages | `messaging.py`, `models.py`, `consumers.py` | `messages.js` |
| Group chat | `group_chat.py`, `models.py`, `consumers.py` | `messages.js` |

## Important Operational Observations

- `views.py` is the largest concentration of business logic.
- `home_page.js` is the largest frontend orchestration file.
- The app mixes inline template JavaScript with dedicated static JS files.
- Request/response schemas are handwritten and not centrally versioned.
