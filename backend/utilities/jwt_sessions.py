"""
utilities/jwt_sessions.py — JWT session management for HappniX.

Stores Cognito refresh tokens in a dedicated DynamoDB table so that:
  - Multiple devices per user are supported (one item per login/device).
  - Per-device logout is possible (delete one item).
  - Global logout is possible (delete all items for a cognitoSub).
  - Tokens auto-expire via DynamoDB TTL — no cleanup job needed.

NOTE: Access tokens are NOT stored here. They are short-lived (~1 hour)
and verified directly with Cognito via cognito.get_user(AccessToken=…).
Only refresh tokens (30-day lifetime) are persisted.

Table schema (configure in SAM/CloudFormation):
  Table name : JWT_SESSIONS_TABLE_NAME  (env var)
  PK         : cognitoSub  (S)
  SK         : sessionId   (S)   ← uuid generated at login
  Attributes : refreshToken, deviceInfo, createdAt, lastUsedAt, expiresAt (TTL)
  GSI        : none required for current usage

Standard return envelope:
  {"success": True,  "data": <result>}
  {"success": False, "error": "<message>"}
"""

import json
import os
import time
import uuid
from datetime import datetime, timezone

try:
    import boto3
    _dynamodb = boto3.resource("dynamodb")
except ImportError:
    _dynamodb = None


# ── Constants ─────────────────────────────────────────────────────────────────

# 30 days — mirrors the default Cognito refresh token lifetime.
# Adjust to match your Cognito User Pool's RefreshTokenValidity setting.
REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60  # 2_592_000


# ── Internal helpers ──────────────────────────────────────────────────────────

def _ok(data):
    return {"success": True, "data": data}


def _fail(error: str):
    return {"success": False, "error": error}


def _get_table():
    """Return the DynamoDB JWT sessions table resource, or None if not configured."""
    table_name = os.environ.get("JWT_SESSIONS_TABLE_NAME")
    if not _dynamodb or not table_name:
        return None
    return _dynamodb.Table(table_name)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Public API ────────────────────────────────────────────────────────────────

def create_session(cognito_sub: str, refresh_token: str,
                   device_info: str = "") -> dict:
    """
    Persist a new refresh-token session for a user.

    Called immediately after a successful LoginWithPassword so that the
    refresh token is tracked server-side for revocation and audit.

    Args:
        cognito_sub:   The user's Cognito sub (unique user ID).
        refresh_token: The Cognito refresh token string.
        device_info:   Optional free-text describing the device
                       (e.g. "iPhone Safari", "Chrome Desktop").

    Returns:
        {"success": True, "data": {"sessionId": str}}
        or {"success": False, "error": str}
    """
    table = _get_table()
    if not table:
        # No table configured — silently skip (token still works via Cognito).
        return _ok({"sessionId": None})

    try:
        session_id = uuid.uuid4().hex
        expires_at = int(time.time()) + REFRESH_TOKEN_TTL_SECONDS
        table.put_item(Item={
            "cognitoSub":   cognito_sub,
            "sessionId":    session_id,
            "refreshToken": refresh_token,
            "deviceInfo":   device_info or "",
            "createdAt":    _now_iso(),
            "lastUsedAt":   _now_iso(),
            "expiresAt":    expires_at,   # DynamoDB TTL attribute
        })
        return _ok({"sessionId": session_id})
    except Exception as exc:
        return _fail(f"create_session failed: {exc}")


def get_session(cognito_sub: str, session_id: str) -> dict:
    """
    Retrieve a specific session record.

    Args:
        cognito_sub: User's Cognito sub.
        session_id:  Session ID returned at login.

    Returns:
        {"success": True, "data": <item_dict or None>}
        Item is None if not found or already TTL-expired.
    """
    table = _get_table()
    if not table:
        return _ok(None)

    try:
        resp = table.get_item(Key={
            "cognitoSub": cognito_sub,
            "sessionId":  session_id,
        })
        item = resp.get("Item")
        # Respect TTL even if DynamoDB hasn't physically deleted it yet
        if item and item.get("expiresAt", 0) < int(time.time()):
            return _ok(None)
        return _ok(item)
    except Exception as exc:
        return _fail(f"get_session failed: {exc}")


def refresh_session(cognito_sub: str, session_id: str) -> dict:
    """
    Update lastUsedAt timestamp after a successful token refresh.

    Args:
        cognito_sub: User's Cognito sub.
        session_id:  Session ID.

    Returns:
        {"success": True, "data": None}
    """
    table = _get_table()
    if not table:
        return _ok(None)

    try:
        table.update_item(
            Key={"cognitoSub": cognito_sub, "sessionId": session_id},
            UpdateExpression="SET lastUsedAt = :ts",
            ExpressionAttributeValues={":ts": _now_iso()},
        )
        return _ok(None)
    except Exception as exc:
        return _fail(f"refresh_session failed: {exc}")


def delete_session(cognito_sub: str, session_id: str) -> dict:
    """
    Delete a single session (per-device logout).

    Args:
        cognito_sub: User's Cognito sub.
        session_id:  Session ID to remove.

    Returns:
        {"success": True, "data": None}
    """
    table = _get_table()
    if not table:
        return _ok(None)

    try:
        table.delete_item(Key={
            "cognitoSub": cognito_sub,
            "sessionId":  session_id,
        })
        return _ok(None)
    except Exception as exc:
        return _fail(f"delete_session failed: {exc}")


def delete_all_sessions(cognito_sub: str) -> dict:
    """
    Delete all sessions for a user (global logout).

    Queries all items with PK=cognitoSub and batch-deletes them.

    Args:
        cognito_sub: User's Cognito sub.

    Returns:
        {"success": True, "data": {"deleted": int}}
    """
    table = _get_table()
    if not table:
        return _ok({"deleted": 0})

    try:
        # Query all sessions for this user
        resp = table.query(
            KeyConditionExpression="cognitoSub = :sub",
            ExpressionAttributeValues={":sub": cognito_sub},
            ProjectionExpression="cognitoSub, sessionId",
        )
        items = resp.get("Items", [])

        # Batch delete
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={
                    "cognitoSub": item["cognitoSub"],
                    "sessionId":  item["sessionId"],
                })

        return _ok({"deleted": len(items)})
    except Exception as exc:
        return _fail(f"delete_all_sessions failed: {exc}")


def list_sessions(cognito_sub: str) -> dict:
    """
    List all active sessions for a user (useful for a 'Manage devices' UI).

    Args:
        cognito_sub: User's Cognito sub.

    Returns:
        {"success": True, "data": [{"sessionId", "deviceInfo", "createdAt", "lastUsedAt"}]}
    """
    table = _get_table()
    if not table:
        return _ok([])

    try:
        now = int(time.time())
        resp = table.query(
            KeyConditionExpression="cognitoSub = :sub",
            ExpressionAttributeValues={":sub": cognito_sub},
        )
        items = [
            {
                "sessionId":  i["sessionId"],
                "deviceInfo": i.get("deviceInfo", ""),
                "createdAt":  i.get("createdAt", ""),
                "lastUsedAt": i.get("lastUsedAt", ""),
            }
            for i in resp.get("Items", [])
            if i.get("expiresAt", 0) >= now  # skip TTL-expired items
        ]
        return _ok(items)
    except Exception as exc:
        return _fail(f"list_sessions failed: {exc}")
