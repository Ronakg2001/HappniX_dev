BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('Authority', 'Admin', 'Business', 'General');
    ELSE
        -- Add 'Authority' to existing enum if not present (safe for re-runs)
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Authority'
                       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_type_enum')) THEN
            ALTER TYPE user_type_enum ADD VALUE 'Authority' BEFORE 'Admin';
        END IF;
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS users (
    "userID" CHAR(8) PRIMARY KEY,
    "cognitoSub" UUID NOT NULL UNIQUE,
    "userName" VARCHAR(150) NOT NULL,
    "emailAddress" VARCHAR(255) NOT NULL,
    "userType" user_type_enum NOT NULL DEFAULT 'General',
    "phoneNumber" VARCHAR(20) NOT NULL UNIQUE,
    "adharNumber" VARCHAR(20),
    "adharVerified" BOOLEAN,
    "emailVerified" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "bio" TEXT,
    "profilePictureUrl" VARCHAR(500),
    "privacyMode" VARCHAR(10) NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMPTZ,
    "loginDeviceCount" INTEGER NOT NULL DEFAULT 0,
    "cognitoIdToken" TEXT,
    "cognitoAccessToken" TEXT,
    "cognitoRefreshToken" TEXT,
    CONSTRAINT users_userid_format_chk CHECK ("userID" ~ '^[A-Z0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS users_cognito_sub_idx ON users ("cognitoSub");
CREATE INDEX IF NOT EXISTS users_email_address_idx ON users ("emailAddress");
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users ("phoneNumber");

COMMENT ON COLUMN users."cognitoIdToken" IS
'Storing Cognito tokens is usually discouraged because they expire quickly and raise security risk; kept here only for this requested architecture.';
COMMENT ON COLUMN users."cognitoAccessToken" IS
'Storing Cognito tokens is usually discouraged because they expire quickly and raise security risk; kept here only for this requested architecture.';
COMMENT ON COLUMN users."cognitoRefreshToken" IS
'Storing Cognito refresh tokens is usually discouraged because of persistence and security risk; kept here only for this requested architecture.';

CREATE TABLE IF NOT EXISTS user_devices (
    "deviceID" BIGSERIAL PRIMARY KEY,
    "userID" CHAR(8) NOT NULL REFERENCES users ("userID") ON DELETE CASCADE,
    "deviceFingerprintHash" TEXT NOT NULL,
    "deviceName" VARCHAR(255),
    "isTrusted" BOOLEAN NOT NULL DEFAULT FALSE,
    "warningVerificationRequired" BOOLEAN NOT NULL DEFAULT FALSE,
    "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIpAddress" VARCHAR(64),
    "lastUserAgent" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS user_devices_user_fingerprint_idx
ON user_devices ("userID", "deviceFingerprintHash");

COMMIT;
