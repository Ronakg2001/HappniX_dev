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

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userStatus') THEN
        CREATE TYPE "userStatus" AS ENUM ('Active', 'Deactivated', 'Deleted','Temporary');
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS users (
    "userID" UUID PRIMARY KEY,
    "cognitoSub" UUID NOT NULL UNIQUE,
    "userName" VARCHAR(150) NOT NULL,
    "emailAddress" VARCHAR(255) NOT NULL,
    "userType" user_type_enum NOT NULL DEFAULT 'General',
    "phoneNumber" VARCHAR(20) NOT NULL UNIQUE,
    "uniqueNationalID" VARCHAR(20),
    "unidIsVerified" BOOLEAN,
    "emailVerified" BOOLEAN NOT NULL,
    "status" "userStatus" NOT NULL DEFAULT 'Active',
    "region" VARCHAR(5),
    "dateOfBirth" DATE NOT NULL,
    "gender" VARCHAR(20),
    "bio" TEXT,
    "profilePictureUrl" VARCHAR(500),
    "privacyMode" VARCHAR(10) NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_cognito_sub_idx ON users ("cognitoSub");
CREATE INDEX IF NOT EXISTS users_email_address_idx ON users ("emailAddress");
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users ("phoneNumber");

CREATE TABLE IF NOT EXISTS user_devices (
    "deviceID" BIGSERIAL PRIMARY KEY,
    "userID" UUID NOT NULL REFERENCES users ("userID") ON DELETE CASCADE,
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
