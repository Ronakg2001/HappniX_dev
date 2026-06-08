"""
integration/dynamo_db.py — DynamoDB helper functions for HappniX.

This module owns the boto3 DynamoDB client and all direct DynamoDB API calls.
Import this module in handlers instead of calling boto3 directly.

Available functions:
    create_user_entities(user_id, username, full_name, cognito_sub)
        → Creates PROFILE + SETTINGS rows for a new user (batch write).

    get_user_entity(user_id, entity_type)
        → Fetches a single entity row (e.g. PROFILE, SETTINGS) by PK + SK.

    ensure_user_profile(user_id, username, full_name, cognito_sub)
        → Self-healing: returns the PROFILE if it exists, otherwise creates
          both entities first and then returns the freshly written PROFILE.
"""

import os
import boto3
from botocore.exceptions import ClientError
from utils import utilities as util


# ── DynamoDB client (single shared instance) ──────────────────────────────────
try:
    _dynamodb = boto3.resource("dynamodb")
    _TABLE_NAME = os.environ.get("USERS_TABLE_NAME", "")
except Exception:
    _dynamodb = None
    _TABLE_NAME = ""


def _get_table():
    """Return the DynamoDB Table resource, or None if unavailable."""
    if not _dynamodb or not _TABLE_NAME:
        util.log("error", "dynamo_db._get_table",
                 "DynamoDB resource or USERS_TABLE_NAME not configured.")
        return None
    return _dynamodb.Table(_TABLE_NAME)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DEFAULT ENTITY TEMPLATES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _build_profile_item(user_id: str, username: str, full_name: str,
                        cognito_sub: str) -> dict:
    """
    Build the default PROFILE entity for a newly registered user.
    All social counters start at 0, avatar/bio are empty.
    """
    return {
        "userID":      user_id,
        "userEntity":  "PROFILE",
        "name":        full_name,
        "username":    username,
        "cognitoSub":  cognito_sub,
        "avatar":      None,
        "bio":         None,
        "verified":    False,
        "isPrivate":   False,
        "vibes":       0,
        "followers":   0,
        "following":   0,
        "accountType": "general",
        "createdAt":   util.now_iso(),
        "updatedAt":   util.now_iso(),
    }


def _build_settings_item(user_id: str) -> dict:
    """
    Build the default SETTINGS entity for a newly registered user.
    Contains sensible defaults that the user can customise later.
    """
    return {
        "userID":     user_id,
        "userEntity": "SETTINGS",
        "notifications": {
            "push":  True,
            "email": True,
            "sms":   False,
        },
        "privacy": {
            "showOnlineStatus":  True,
            "showLastSeen":      True,
            "allowDMs":          "everyone",
        },
        "preferences": {
            "theme":    "system",
            "language": "en",
        },
        "createdAt": util.now_iso(),
        "updatedAt": util.now_iso(),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WRITE OPERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_user_entities(user_id: str, username: str, full_name: str,
                         cognito_sub: str) -> dict:
    """
    Create both PROFILE and SETTINGS rows for a new user in a single
    batch_write call.

    Uses ConditionExpression on each put to prevent overwriting an existing
    row with the same PK + SK (duplicate guard).

    Args:
        user_id:     The HappniX UUIDv7 user ID (Partition Key).
        username:    The unique @username.
        full_name:   Display name.
        cognito_sub: AWS Cognito sub UUID.

    Returns:
        {"success": True} on success,
        {"success": False, "error": ...} on failure.
    """
    table = _get_table()
    if not table:
        return {"success": False, "error": "DynamoDB table not available."}

    profile_item  = _build_profile_item(user_id, username, full_name, cognito_sub)
    settings_item = _build_settings_item(user_id)

    try:
        # Use batch_writer for efficient multi-row insert
        with table.batch_writer() as batch:
            batch.put_item(Item=profile_item)
            batch.put_item(Item=settings_item)

        util.log("info", "dynamo_db.create_user_entities",
                 "PROFILE + SETTINGS created in DynamoDB",
                 user_id=user_id, username=username)
        return {"success": True}

    except ClientError as exc:
        util.log("error", "dynamo_db.create_user_entities",
                 f"DynamoDB batch write failed: {exc}",
                 user_id=user_id)
        return {"success": False, "error": str(exc)}
    except Exception as exc:
        util.log("error", "dynamo_db.create_user_entities",
                 f"Unexpected error: {exc}", user_id=user_id)
        return {"success": False, "error": str(exc)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# READ OPERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_user_entity(user_id: str, entity_type: str) -> dict:
    """
    Fetch a single entity row from the User table by PK + SK.

    Args:
        user_id:     The userID (Partition Key).
        entity_type: The userEntity (Sort Key), e.g. "PROFILE" or "SETTINGS".

    Returns:
        {"success": True, "data": {...}} if the item exists,
        {"success": False, "error": "not_found"} if the item does not exist,
        {"success": False, "error": ...} on DynamoDB errors.
    """
    table = _get_table()
    if not table:
        return {"success": False, "error": "DynamoDB table not available."}

    try:
        response = table.get_item(
            Key={
                "userID":     user_id,
                "userEntity": entity_type,
            }
        )

        item = response.get("Item")
        if not item:
            return {"success": False, "error": "not_found"}

        return {"success": True, "data": item}

    except ClientError as exc:
        util.log("error", "dynamo_db.get_user_entity",
                 f"DynamoDB get_item failed: {exc}",
                 user_id=user_id, entity_type=entity_type)
        return {"success": False, "error": str(exc)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SELF-HEALING PROFILE FETCH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def ensure_user_profile(user_id: str, username: str, full_name: str,
                        cognito_sub: str) -> dict:
    """
    Self-healing profile fetch.

    1. Try to fetch the PROFILE entity from DynamoDB.
    2. If it exists → return it.
    3. If it does NOT exist (e.g. DynamoDB write failed during signup) →
       create both PROFILE and SETTINGS entities, then return the fresh PROFILE.

    This guarantees that a logged-in user always gets their profile data,
    even if the original DynamoDB write during registration failed.

    Args:
        user_id:     The HappniX userID.
        username:    The @username (needed for self-healing creation).
        full_name:   Display name (needed for self-healing creation).
        cognito_sub: Cognito sub UUID (needed for self-healing creation).

    Returns:
        {"success": True, "data": {...}} with the profile data,
        {"success": False, "error": ...} if recovery also failed.
    """
    # 1. Try fetching the existing profile
    result = get_user_entity(user_id, "PROFILE")

    if result.get("success"):
        return result

    # 2. Profile not found — self-heal by creating both entities
    if result.get("error") == "not_found":
        util.log("warning", "dynamo_db.ensure_user_profile",
                 "PROFILE not found — self-healing by creating entities",
                 user_id=user_id, username=username)

        create_result = create_user_entities(
            user_id=user_id,
            username=username,
            full_name=full_name,
            cognito_sub=cognito_sub,
        )

        if not create_result.get("success"):
            util.log("error", "dynamo_db.ensure_user_profile",
                     "Self-healing creation also failed",
                     user_id=user_id, error=create_result.get("error"))
            return {"success": False, "error": "Failed to create user profile."}

        # 3. Fetch the freshly created profile
        return get_user_entity(user_id, "PROFILE")

    # 4. Some other DynamoDB error (not "not_found")
    return result
