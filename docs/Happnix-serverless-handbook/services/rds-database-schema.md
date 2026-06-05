# HappniX RDS Database Tables and Schema

HappniX utilizes **AWS RDS PostgreSQL** (running on `db.t4g.micro` in the Dev environment) as the primary authoritative relational datastore (`happnixdb`). It replaces the local SQLite storage used in earlier monorepo stages.

### Schema Relationships
- **User:** 1:1 `UserProfile`, 1:N `Event`
- **Event:** 1:N `EventMedia`, 1:N `EventTicket`
- **EventTicket:** 1:N `EventGuest`
- **Messaging:** `DirectConversation` 1:N `DirectMessage` 1:N `DirectMessageAttachment`
- **Groups:** `GroupConversation` 1:N `GroupConversationMember`, 1:N `GroupMessage`

### Key Tables
1. **User / UserProfile:** The primary table for identity. 
   - Uses a **Custom UUIDv7** (`userID`) as the primary key (sortable, includes region and entity metadata).
   - Contains `cognito_sub`, `userName`, `emailAddress`, `phoneNumber`, `full_name`, `gender`, `dob`, `region`, `email_verified`, `bio`, `profile_picture_url`, `gov_id_number`, `gov_id_verified`, `is_private`, `last_active`.
2. **Follow / SavedProfile / BlockedAccount / RestrictedAccount:** Social graphs tracking relationships with constraints like unique pairs.
3. **Event:** Contains `host`, `title`, `description`, `location_name`, `latitude`, `longitude`, `price`, `ticket_type`, `status`, `start_at`, `end_at`.
4. **EventTicket:** Tracks attendees, `booked_by`, `paid_by`, `tier_name`, `ticket_price`, `payment_transaction_id`, `status`.
5. **EventGuest:** Tracks external invites, `invite_status`, `mobile_otp_verified`, `aadhaar_token`, `payment_status`.
6. **ActivityNotification:** Stores in-app push notifications, `recipient`, `actor`, `activity_type`, `is_read`.
7. **Messaging Tables:** `DirectConversation`, `DirectMessage`, `GroupConversation`, `GroupMessage`, mapping senders, replies, and attachments.
