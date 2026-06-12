# HappniX DynamoDB Status and Schema

DynamoDB runs in **PAY_PER_REQUEST (On-Demand)** mode for optimal free-tier usage. It is used for fast NoSQL lookups, temporary states, and real-time operations.

## Tables

| Table Name Pattern | Env Var | Partition Key (HASH) | Sort Key (RANGE) | Purpose | TTL Field |
| --- | --- | --- | --- | --- | --- |
| **HappniX-User-{env}** | `USERS_TABLE_NAME` | `userID` (String) | `userEntity` (String) | Single-table design storing `PROFILE` and `SETTINGS` entities per user. | N/A |
| **HappniX-sessions-v2-{env}** | `SESSIONS_TABLE_NAME` | `sessionToken` (String) | None | Pre-auth session storage. Tracks OTP state during signup flow. | `expiresAt` |
| **HappniX-otp-v2-{env}** | `OTP_TABLE_NAME` | `mobile` (String) | None | Stores OTPs temporarily with a 5-minute expiry. | `expiresAt` |
| **HappniX-jwt-sessions-{env}** | `JWT_SESSIONS_TABLE_NAME` | *(TBD)* | *(TBD)* | Stores one refresh token per user-device with 30-day TTL. | *(TBD)* |
| **HappniX-notifications-{env}** | `NOTIFICATIONS_TABLE_NAME` | `recipientUserId` (String) | `createdAt` (String) | NoSQL Notifications inbox projection. | `expiresAt` |
| **HappniX-connections-v2** | *(N/A)* | `connectionId` (String) | None | WebSocket connections registry. Includes `userId-index` GSI. | N/A |
| **HappniX-presence** | *(N/A)* | `userId` (String) | None | Tracks online/offline status with heartbeat TTLs. | `expiresAt` |

> **Note:** Table names are suffixed with the environment name (e.g., `dev`, `qa`, `prod`) via `Fn::Sub` in the SAM template. The env var column indicates which environment variable maps to each table in Lambda.

## Users Table — Single-Table Entity Design

The **Users** table uses a single-table design driven by `integration/manifest.json`. Each user has multiple entity rows sharing the same `userID` partition key, distinguished by the `userEntity` sort key.

### Entity: `PROFILE`

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `userID` | String | *(required)* | HappniX UUIDv7 primary key |
| `userEntity` | String | `"PROFILE"` | Sort key |
| `username` | String | *(set on create)* | User's handle |
| `name` | String | *(set on create)* | Display name |
| `cognitoSub` | String | *(set on create)* | AWS Cognito sub UUID |
| `avatar` | String | `null` | R2 storage key for profile picture |
| `bio` | String | `null` | User bio text |
| `verified` | Boolean | `false` | Identity verification status |
| `isPrivate` | Boolean | `false` | Private account toggle |
| `vibes` | Number | `0` | Vibes / engagement count |
| `followers` | Number | `0` | Follower count |
| `following` | Number | `0` | Following count |
| `accountType` | String | `"general"` | Account type (general, business, etc.) |
| `createdAt` | String | *(ISO 8601)* | Creation timestamp |
| `updatedAt` | String | *(ISO 8601)* | Last update timestamp |

### Entity: `SETTINGS`

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `userID` | String | *(required)* | HappniX UUIDv7 primary key |
| `userEntity` | String | `"SETTINGS"` | Sort key |
| `notifications.push` | Boolean | `true` | Push notification toggle |
| `notifications.email` | Boolean | `true` | Email notification toggle |
| `notifications.sms` | Boolean | `false` | SMS notification toggle |
| `privacy.showOnlineStatus` | Boolean | `true` | Online status visibility |
| `privacy.showLastSeen` | Boolean | `true` | Last seen visibility |
| `privacy.allowDMs` | String | `"everyone"` | DM permission level |
| `preferences.theme` | String | `"system"` | UI theme preference |
| `preferences.language` | String | `"en"` | Language preference |
| `createdAt` | String | *(ISO 8601)* | Creation timestamp |
| `updatedAt` | String | *(ISO 8601)* | Last update timestamp |

### Self-Healing Behavior

The `ProfileApi` Lambda implements self-healing: if a `GET /api/profile/me` call finds no `PROFILE` entity in DynamoDB (e.g., the write failed during signup), it automatically creates both `PROFILE` and `SETTINGS` entities from the RDS user context before returning the profile.
