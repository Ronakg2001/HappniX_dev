# Database And Schemas

## Primary Database

- Engine: SQLite
- Config file: `Happnix_party_APP/settings.py`
- Database file: `db.sqlite3`

SQLite is the authoritative relational store for:

- Django users and auth
- user profiles
- follows, saved, blocked, restricted lists
- events and event media
- event tickets and guest tickets
- notifications fallback storage
- direct messaging
- group chat

## Optional Secondary Database

- MongoDB is enabled when `MONGO_URI` exists and `pymongo` is installed.
- Main access module: `HAPPNIX/mongo_store.py`
- Default DB name: `party_connect_hub`

Mongo is used as a read model / projection layer for:

- `user_profiles`
- `events`
- `notifications`

It is not the source of truth for login, permissions, or ownership.

## Session-Stored Temporary State

The app stores short-lived flow data in the Django session:

- `mobile_otp_map`
- `guest_mobile_otp_map`
- `last_mobile`
- `pending_signup_mobile`
- `pending_profile_setup`
- `aadhaar_client_id`

## SQL Model Map

### `UserProfile`

- one-to-one with Django `User`
- fields:
  - `sex`
  - `date_of_birth`
  - `mobile`
  - `bio`
  - `profile_picture_url`
  - `gov_id_number`
  - `gov_id_verified`
  - `is_private`
  - `tags_and_mentions_permission`
  - `family_role`
  - `last_active`

### `Follow`

- relationship fields:
  - `follower`
  - `following`
  - `status`
  - `created_at`
- constraints:
  - unique pair
  - cannot follow self

### `SavedProfile`

- fields:
  - `owner`
  - `target`
  - `created_at`

### `BlockedAccount`

- fields:
  - `owner`
  - `target`
  - `created_at`

### `RestrictedAccount`

- fields:
  - `owner`
  - `target`
  - `created_at`

### `Event`

- fields:
  - `host`
  - `event_uid`
  - `title`
  - `description`
  - `start_label`
  - `end_label`
  - `start_at`
  - `end_at`
  - `location_name`
  - `latitude`
  - `longitude`
  - `price`
  - `currency`
  - `ticket_type`
  - `ticket_tiers`
  - `event_category`
  - `max_attendees`
  - `tickets_sold`
  - `status`
  - `image_url`
  - `is_active`
  - `created_at`
  - `updated_at`

### `EventMedia`

- fields:
  - `event`
  - `media_type`
  - `file_url`
  - `sort_order`
  - `created_at`

### `EventTicket`

- fields:
  - `attendee`
  - `event`
  - `booked_by`
  - `paid_by`
  - `group_code`
  - `tier_name`
  - `invite_status`
  - `pending_reason`
  - `ticket_price`
  - `service_fee`
  - `payment_transaction_id`
  - `refund_transaction_id`
  - `status`
  - `quantity`
  - `booked_at`
  - `cancelled_at`
  - `archived_at`
  - `updated_at`
- constraint:
  - unique ticket per attendee per event

### `EventGuest`

- fields:
  - `invited_by`
  - `event`
  - `parent_ticket`
  - `invite_status`
  - `mobile_otp_verified`
  - `aadhaar_otp_skipped`
  - `full_name`
  - `age`
  - `mobile_number`
  - `email`
  - `aadhaar_token`
  - `paid_by_user`
  - `paid_by_guest`
  - `payment_reference`
  - `onboarding_completed`
  - `payment_status`
  - `cancelled_at`
  - `ticket_qr_payload`
  - `email_delivery_status`
  - `whatsapp_delivery_status`
  - `email_sent_at`
  - `whatsapp_sent_at`
  - `invite_token`
  - `created_at`

### `ActivityNotification`

- fields:
  - `recipient`
  - `actor`
  - `activity_type`
  - `title`
  - `body`
  - `payload`
  - `is_read`
  - `created_at`
  - `read_at`

### `DirectConversation`

- fields:
  - `user_one`
  - `user_two`
  - `deleted_by`
  - `created_at`
  - `updated_at`

### `DirectMessage`

- fields:
  - `conversation`
  - `sender`
  - `forwarded_from`
  - `replied_to`
  - `body`
  - `read_at`
  - `edited_at`
  - `unsent_at`
  - `created_at`
  - `updated_at`

### `DirectMessageAttachment`

- fields:
  - `message`
  - `attachment_type`
  - `file_url`
  - `original_name`
  - `mime_type`
  - `file_size`
  - `duration_seconds`
  - `created_at`

### `DirectMessageDeletion`

- fields:
  - `message`
  - `user`
  - `deleted_at`

### `GroupConversation`

- fields:
  - `created_by`
  - `name`
  - `description`
  - `avatar_url`
  - `created_at`
  - `updated_at`

### `GroupConversationMember`

- fields:
  - `group`
  - `user`
  - `role`
  - `added_by`
  - `joined_at`
  - `last_read_at`
  - `removed_at`

### `GroupMessage`

- fields:
  - `group`
  - `sender`
  - `replied_to`
  - `body`
  - `edited_at`
  - `unsent_at`
  - `created_at`
  - `updated_at`

### `GroupMessageAttachment`

- fields mirror `DirectMessageAttachment`

### `GroupMessageDeletion`

- fields:
  - `message`
  - `user`
  - `deleted_at`

### `GroupMessageStatus`

- fields:
  - `message`
  - `recipient`
  - `delivered_at`
  - `read_at`

## Relationship Summary

- `User` 1:1 `UserProfile`
- `User` 1:N `Event`
- `Event` 1:N `EventMedia`
- `Event` 1:N `EventTicket`
- `EventTicket` 1:N `EventGuest`
- `DirectConversation` 1:N `DirectMessage`
- `DirectMessage` 1:N `DirectMessageAttachment`
- `GroupConversation` 1:N `GroupConversationMember`
- `GroupConversation` 1:N `GroupMessage`
- `GroupMessage` 1:N `GroupMessageAttachment`
- `GroupMessage` 1:N `GroupMessageStatus`

## Mongo Collections

### `user_profiles`

Built by:
- `mongo_store.sync_user_profile`

Main fields:
- `sql_user_id`
- `username`
- `email`
- `full_name`
- `mobile`
- `sex`
- `date_of_birth`
- `bio`
- `profile_picture_url`
- `gov_id_verified`
- `is_private`
- `hosted_events_count`
- `pending_follow_requests_count`
- `search_text`
- `created_at`
- `updated_at`

### `events`

Built by:
- `mongo_store.sync_event`

Main fields:
- `sql_event_id`
- `event_id`
- `host_sql_user_id`
- `host_username`
- `title`
- `description`
- `start_label`
- `end_label`
- `start_at`
- `end_at`
- `event_category`
- `location_name`
- `location`
- `latitude`
- `longitude`
- `price`
- `currency`
- `ticket_type`
- `ticket_tiers`
- `max_attendees`
- `tickets_sold`
- `status`
- `image_url`
- `media_assets`
- `is_active`
- `created_at`
- `updated_at`

### `notifications`

Built by:
- `mongo_store.log_notification`

Main fields:
- `recipient_sql_user_id`
- `activity_type`
- `title`
- `body`
- `actor_sql_user_id`
- `actor_username`
- `actor_full_name`
- `actor_profile_picture_url`
- `payload`
- `is_read`
- `created_at`
- `read_at`

## Data Flow Between SQL And Mongo

- signup and profile completion trigger user-profile sync
- event create/update/delete flows trigger event sync
- notification creation writes to Mongo when available
- if Mongo is unavailable, notifications fall back to SQL `ActivityNotification`

## Media Storage

Media files are stored under paths such as:

- `media/messages/<user_id>/...`
- `media/events/<user_id>/...`
- `media/profiles/<user_id>/...`

Attachment limits encoded in code:

- max 5 attachments per message
- max 25 MB per attachment

## Data Integrity Notes

- Event numeric values are repaired by `views._repair_invalid_event_numeric_storage(...)`.
- Several business states are stored as plain strings rather than separate workflow tables.
- QR payloads and payment references are app-generated strings.
