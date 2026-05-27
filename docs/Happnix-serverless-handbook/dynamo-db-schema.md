# HappniX DynamoDB Status and Schema

DynamoDB runs in **PAY_PER_REQUEST (On-Demand)** mode for optimal free-tier usage. It is used for fast NoSQL lookups, temporary states, and real-time operations.

| Table Name (Environment suffixed) | Partition Key (HASH) | Sort Key (RANGE) | Purpose / Status | TTL Field |
| --- | --- | --- | --- | --- |
| **Happnix-userInfoTable** | `userID` (String) | `userName` (String) | Fast username and profile metadata lookups. | N/A |
| **HappniX-sessions-v2** | `sessionToken` (String) | None | Replaces file-based session storage. Tracks active user sessions. | `expiresAt` |
| **HappniX-otp-v2** | `mobile` (String) | None | Stores OTPs temporarily with a 5-minute expiry. | `expiresAt` |
| **HappniX-connections-v2** | `connectionId` (String) | None | WebSocket connections registry. Includes `userId-index` GSI. | N/A |
| **HappniX-presence** | `userId` (String) | None | Tracks online/offline status with heartbeat TTLs. | `expiresAt` |
| **HappniX-notifications** | `recipientUserId` (String) | `createdAt` (String) | NoSQL Notifications inbox projection. | `expiresAt` |
