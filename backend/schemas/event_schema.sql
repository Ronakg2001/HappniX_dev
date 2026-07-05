-- ============================================================================
-- HappniX Event Database Schema — Phase 1
-- Run this against the RDS PostgreSQL instance to create all event tables.
-- Prerequisites: The `users` table must already exist.
-- ============================================================================

-- ─── Step 1: Core Tables ──────────────────────────────────────────────────────

-- 1a. Events
CREATE TABLE IF NOT EXISTS events (
    "eventID"           UUID PRIMARY KEY,
    "hostUserID"        UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "eventUID"          VARCHAR(12) NOT NULL UNIQUE,

    "title"             VARCHAR(255) NOT NULL,
    "description"       TEXT,
    "eventCategory"     VARCHAR(50) NOT NULL,
    "tags"              TEXT[],

    "startAt"           TIMESTAMPTZ NOT NULL,
    "endAt"             TIMESTAMPTZ,
    "startLabel"        VARCHAR(100),
    "timezone"          VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',

    "locationName"      VARCHAR(255),
    "locationAddress"   TEXT,
    "latitude"          DECIMAL(10, 7),
    "longitude"         DECIMAL(10, 7),
    "isOnline"          BOOLEAN NOT NULL DEFAULT FALSE,
    "onlineLink"        VARCHAR(500),

    "ticketType"        VARCHAR(50) NOT NULL DEFAULT 'Free',
    "basePrice"         DECIMAL(10, 2) DEFAULT 0.00,
    "currency"          VARCHAR(3) NOT NULL DEFAULT 'INR',
    "maxAttendees"      INTEGER,

    "visibility"        VARCHAR(50) NOT NULL DEFAULT 'Public',
    "status"            VARCHAR(50) NOT NULL DEFAULT 'Draft',
    "coverImageUrl"     VARCHAR(500),

    "engagementScore"   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "metadata"          JSONB DEFAULT '{}'::jsonb,
    "policies"          JSONB DEFAULT '{}'::jsonb,

    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS events_host_idx ON events("hostUserID");
CREATE INDEX IF NOT EXISTS events_category_idx ON events("eventCategory");
CREATE INDEX IF NOT EXISTS events_start_at_idx ON events("startAt");
CREATE INDEX IF NOT EXISTS events_engagement_idx ON events("engagementScore" DESC);


-- 2b. Follows (Social Graph — RDS source of truth for fan-out)
CREATE TABLE IF NOT EXISTS follows (
    "followerUserID"    UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "followingUserID"   UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("followerUserID", "followingUserID")
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON follows("followingUserID");


-- 2c. Event Collaborators (Co-Hosts & Scanners)
CREATE TABLE IF NOT EXISTS event_collaborators (
    "collaboratorID"    BIGSERIAL PRIMARY KEY,
    "eventID"           UUID NOT NULL REFERENCES events("eventID") ON DELETE CASCADE,
    "userID"            UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "role"              VARCHAR(50) NOT NULL,
    "addedAt"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_collaborator UNIQUE ("eventID", "userID")
);


-- 2d. Posts (Social Media Posts & Reels)
CREATE TABLE IF NOT EXISTS posts (
    "postID"            UUID PRIMARY KEY,
    "userID"            UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "eventID"           UUID REFERENCES events("eventID") ON DELETE SET NULL,

    "postType"          VARCHAR(20) NOT NULL DEFAULT 'Standard',
    "mediaItems"        JSONB NOT NULL,
    "caption"           TEXT,

    "likesCount"        INTEGER DEFAULT 0,
    "commentsCount"     INTEGER DEFAULT 0,
    "engagementScore"   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS posts_user_idx ON posts("userID");
CREATE INDEX IF NOT EXISTS posts_event_idx ON posts("eventID");
CREATE INDEX IF NOT EXISTS posts_engagement_idx ON posts("engagementScore" DESC);


-- 2e. User Interactions (Recommendation Engine)
CREATE TABLE IF NOT EXISTS user_interactions (
    "interactionID"     BIGSERIAL PRIMARY KEY,
    "userID"            UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "entityID"          UUID NOT NULL,
    "entityType"        VARCHAR(20) NOT NULL,
    "interactionType"   VARCHAR(20) NOT NULL,
    "weight"            DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_interaction UNIQUE ("userID", "entityID", "interactionType")
);

CREATE INDEX IF NOT EXISTS interactions_user_idx ON user_interactions("userID");
CREATE INDEX IF NOT EXISTS interactions_entity_idx ON user_interactions("entityID");


-- ─── Step 3: Ticketing & Booking ────────────────────────────────────────────

-- 3a. Event Ticket Tiers
CREATE TABLE IF NOT EXISTS event_ticket_tiers (
    "tierID"            UUID PRIMARY KEY,
    "eventID"           UUID NOT NULL REFERENCES events("eventID") ON DELETE CASCADE,
    "name"              VARCHAR(100) NOT NULL,
    "description"       TEXT,
    "price"             DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "capacity"          INTEGER,
    "ticketsSold"       INTEGER NOT NULL DEFAULT 0,
    "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tiers_event_idx ON event_ticket_tiers("eventID");


-- 3b. Event Orders (Group Booking / Cart)
CREATE TABLE IF NOT EXISTS event_orders (
    "orderID"               UUID PRIMARY KEY,
    "orderNumber"           VARCHAR(16) NOT NULL UNIQUE,
    "eventID"               UUID NOT NULL REFERENCES events("eventID") ON DELETE RESTRICT,
    "buyerUserID"           UUID NOT NULL REFERENCES users("userID"),

    "subtotal"              DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "platformFee"           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "totalAmount"           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    "paymentStatus"         VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "paymentTransactionID"  VARCHAR(255),
    "paymentMethod"         VARCHAR(50),

    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orders_buyer_idx ON event_orders("buyerUserID");
CREATE INDEX IF NOT EXISTS orders_event_idx ON event_orders("eventID");
CREATE INDEX IF NOT EXISTS orders_number_idx ON event_orders("orderNumber");


-- 3c. Event Tickets (Individual Attendee Barcodes)
CREATE TABLE IF NOT EXISTS event_tickets (
    "ticketID"              UUID PRIMARY KEY,
    "orderID"               UUID NOT NULL REFERENCES event_orders("orderID") ON DELETE RESTRICT,
    "eventID"               UUID NOT NULL REFERENCES events("eventID") ON DELETE RESTRICT,
    "tierID"                UUID NOT NULL REFERENCES event_ticket_tiers("tierID"),

    "attendeeUserID"        UUID REFERENCES users("userID"),
    "attendeeName"          VARCHAR(255),
    "attendeeEmail"         VARCHAR(255),

    "claimToken"            VARCHAR(255) UNIQUE,
    "claimedAt"             TIMESTAMPTZ,

    "status"                VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "ticketQrPayload"       TEXT,
    "checkedInAt"           TIMESTAMPTZ,

    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tickets_order_idx ON event_tickets("orderID");
CREATE INDEX IF NOT EXISTS tickets_attendee_idx ON event_tickets("attendeeUserID");
CREATE INDEX IF NOT EXISTS tickets_claim_token_idx ON event_tickets("claimToken");
CREATE INDEX IF NOT EXISTS tickets_event_idx ON event_tickets("eventID");


-- 3d. Event Waitlist (Sold-Out Queue)
CREATE TABLE IF NOT EXISTS event_waitlist (
    "waitlistID"        BIGSERIAL PRIMARY KEY,
    "eventID"           UUID NOT NULL REFERENCES events("eventID") ON DELETE CASCADE,
    "userID"            UUID NOT NULL REFERENCES users("userID") ON DELETE CASCADE,
    "tierID"            UUID REFERENCES event_ticket_tiers("tierID"),
    "status"            VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    "joinedAt"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_waitlist UNIQUE ("eventID", "userID")
);


-- ============================================================================
-- Auto-update "updatedAt" triggers (uses shared function from auth schema)
-- ============================================================================

-- events
DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- event_ticket_tiers
DROP TRIGGER IF EXISTS trg_event_ticket_tiers_updated_at ON event_ticket_tiers;
CREATE TRIGGER trg_event_ticket_tiers_updated_at
    BEFORE UPDATE ON event_ticket_tiers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- event_orders
DROP TRIGGER IF EXISTS trg_event_orders_updated_at ON event_orders;
CREATE TRIGGER trg_event_orders_updated_at
    BEFORE UPDATE ON event_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- event_tickets
DROP TRIGGER IF EXISTS trg_event_tickets_updated_at ON event_tickets;
CREATE TRIGGER trg_event_tickets_updated_at
    BEFORE UPDATE ON event_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Performance indexes for common query patterns
-- ============================================================================

-- SA-04: Composite index for has_active_ticket() lookups
CREATE INDEX IF NOT EXISTS idx_event_tickets_attendee_event_status
    ON event_tickets ("attendeeUserID", "eventID", "status");

-- ============================================================================
-- Schema creation complete. All tables use IF NOT EXISTS for idempotency.
-- ============================================================================
