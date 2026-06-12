# HappniX RDS Database Tables and Schema

HappniX utilizes **AWS RDS PostgreSQL** (running on `db.t4g.micro` in the Dev environment) as the primary authoritative relational datastore (`happnix_in_dev`). The schema is applied automatically via the `AuthSchemaInit` Lambda during CI/CD deploys.

## Custom Types (Enums)

| Type Name | Values | Purpose |
| --- | --- | --- |
| `user_type_enum` | `Authority`, `Admin`, `Business`, `General`, `Temporary` | User role/tier classification |
| `"userStatus"` | `Active`, `Deactivated`, `Deleted` | Account lifecycle state |
| `sex_enum` | `Male`, `Female`, `Other` | Gender identity |

## Tables

### `users` — Primary Identity Table

Uses a **Custom UUIDv7** (`userID`) as the primary key (sortable, includes region and entity metadata).

| Column | Type | Constraints | Default | Description |
| --- | --- | --- | --- | --- |
| `userID` | UUID | PRIMARY KEY | — | Custom UUIDv7 (see `utils/uuid_generator.py`) |
| `cognitoSub` | UUID | NOT NULL, UNIQUE | — | AWS Cognito sub UUID |
| `userName` | VARCHAR(150) | NOT NULL, UNIQUE | — | User handle (case-insensitive in Cognito) |
| `fullName` | VARCHAR(255) | NOT NULL | — | Display name |
| `emailAddress` | VARCHAR(255) | NOT NULL | — | Email address |
| `userType` | `user_type_enum` | NOT NULL | `'General'` | Account type |
| `phoneNumber` | VARCHAR(20) | NOT NULL, UNIQUE | — | E.164 format phone number |
| `uniqueNationalID` | VARCHAR(20) | — | — | Aadhaar / government ID number |
| `unidIsVerified` | BOOLEAN | — | — | Whether government ID is verified |
| `emailVerified` | BOOLEAN | NOT NULL | — | Whether email is verified |
| `status` | `"userStatus"` | NOT NULL | `'Active'` | Account status |
| `region` | VARCHAR(5) | — | — | Country/region code (e.g., `IN`) |
| `dateOfBirth` | DATE | NOT NULL | — | Date of birth |
| `gender` | `sex_enum` | — | — | Gender |
| `bio` | TEXT | — | — | User bio |
| `profilePictureUrl` | VARCHAR(500) | — | — | Profile picture URL |
| `privacyMode` | VARCHAR(10) | NOT NULL | `'public'` | `public` or `private` |
| `createdAt` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Account creation time |
| `updatedAt` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Last profile update time |
| `lastLogin` | TIMESTAMPTZ | — | — | Last login timestamp |

**Indexes:**
- `users_cognito_sub_idx` on `cognitoSub`
- `users_email_address_idx` on `emailAddress`
- `users_phone_number_idx` on `phoneNumber`

### `user_devices` — Device Fingerprinting & Trust

Tracks device fingerprints for each user. Supports trusted device detection and security warnings.

| Column | Type | Constraints | Default | Description |
| --- | --- | --- | --- | --- |
| `deviceID` | BIGSERIAL | PRIMARY KEY | auto | Device record ID |
| `userID` | UUID | NOT NULL, FK → `users.userID` ON DELETE CASCADE | — | Owning user |
| `deviceFingerprintHash` | TEXT | NOT NULL | — | SHA hash of device fingerprint |
| `deviceName` | VARCHAR(255) | — | — | Human-readable device name |
| `isTrusted` | BOOLEAN | NOT NULL | `FALSE` | Whether device is trusted |
| `warningVerificationRequired` | BOOLEAN | NOT NULL | `FALSE` | Whether to prompt extra verification |
| `firstSeenAt` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | When device was first seen |
| `lastSeenAt` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | When device was last active |
| `lastIpAddress` | VARCHAR(64) | — | — | Last known IP |
| `lastUserAgent` | TEXT | — | — | Last known user agent string |

**Indexes:**
- `user_devices_user_fingerprint_idx` — UNIQUE on (`userID`, `deviceFingerprintHash`)

## Schema Relationships (Current)

- **User** 1:N `user_devices`

## Schema Relationships (Planned — Not Yet Deployed)

- **User:** 1:1 `UserProfile`, 1:N `Event`
- **Event:** 1:N `EventMedia`, 1:N `EventTicket`
- **EventTicket:** 1:N `EventGuest`
- **Messaging:** `DirectConversation` 1:N `DirectMessage` 1:N `DirectMessageAttachment`
- **Groups:** `GroupConversation` 1:N `GroupConversationMember`, 1:N `GroupMessage`
