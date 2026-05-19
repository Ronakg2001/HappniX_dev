"""
utilities/rds.py — PostgreSQL (RDS) helper for HappniX backend.

Replaces auth_db.py. Handles all direct database interactions with the
users table in RDS (PostgreSQL via psycopg2).

Every public function returns a standard response envelope:
  {"success": True,  "data": <result>}
  {"success": False, "error": "<message>"}

Import example:
    from utilities.rds import get_user_by_sub, upsert_user
"""

import json
import os
import random
import string

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, DictCursor
except ImportError:
    psycopg2 = None
    RealDictCursor = None
    DictCursor = None

try:
    import boto3
    _cognito_client = boto3.client("cognito-idp")
except ImportError:
    _cognito_client = None


# ── Internal helpers ──────────────────────────────────────────────────────────

def _ok(data):
    return {"success": True, "data": data}


def _fail(error: str):
    return {"success": False, "error": error}


def _connect():
    """Open and return a psycopg2 connection from environment variables."""
    if psycopg2 is None:
        raise RuntimeError("psycopg2 is required for RDS operations.")
    return psycopg2.connect(
        host=os.environ["AUTH_DB_HOST"],
        port=os.environ.get("AUTH_DB_PORT", "5432"),
        dbname=os.environ["AUTH_DB_NAME"],
        user=os.environ["AUTH_DB_USER"],
        password=os.environ["AUTH_DB_PASSWORD"],
        connect_timeout=int(os.environ.get("AUTH_DB_CONNECT_TIMEOUT", "5")),
    )


def _row_to_dict(row) -> dict:
    """Convert a psycopg2 row to a plain dict; serialize datetime fields."""
    if row is None:
        return None
    d = dict(row)
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
    return d


# ── Schema Utilities ──────────────────────────────────────────────────────────

def execute_sql_script(sql_text: str) -> dict:
    """
    Execute a raw SQL script (used by AuthSchemaInit Lambda).

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql_text)
            conn.commit()
        return _ok(None)
    except Exception as exc:
        return _fail(f"execute_sql_script failed: {exc}")


def table_exists(table_name: str) -> dict:
    """
    Check whether a table exists in the public schema.

    Returns:
        {"success": True, "data": True/False}  or  {"success": False, "error": "..."}
    """
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = %s
                    )
                    """,
                    (table_name,),
                )
                exists = bool(cur.fetchone()[0])
        return _ok(exists)
    except Exception as exc:
        return _fail(f"table_exists check failed: {exc}")


# ── User Read Operations ──────────────────────────────────────────────────────

def get_user_by_sub(cognito_sub: str) -> dict:
    """
    Fetch a user row by Cognito sub (primary lookup key).

    Falls back to Cognito auto-heal if user is missing from RDS.

    Returns:
        {"success": True, "data": <user dict or None>}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute('SELECT * FROM users WHERE "cognitoSub" = %s', (cognito_sub,))
                row = _row_to_dict(cur.fetchone())

        if not row:
            heal_result = _auto_heal({"sub": cognito_sub}, lookup_by="sub")
            row = heal_result.get("data")

        return _ok(row)
    except Exception as exc:
        return _fail(f"get_user_by_sub failed: {exc}")


def get_user_by_mobile(phone_number: str) -> dict:
    """
    Fetch a user row by phone number.

    Returns:
        {"success": True, "data": <user dict or None>}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute('SELECT * FROM users WHERE "phoneNumber" = %s', (phone_number,))
                row = _row_to_dict(cur.fetchone())

        if not row:
            heal_result = _auto_heal({"phone_number": phone_number}, lookup_by="phone")
            row = heal_result.get("data")

        return _ok(row)
    except Exception as exc:
        return _fail(f"get_user_by_mobile failed: {exc}")


def get_user_by_identifier(identifier: str) -> dict:
    """
    Fetch a user by userName or emailAddress (used for password login).

    Returns:
        {"success": True, "data": <user dict or None>}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute(
                    'SELECT * FROM users WHERE "userName" = %s OR "emailAddress" = %s',
                    (identifier, identifier),
                )
                row = _row_to_dict(cur.fetchone())

        if not row:
            heal_result = _auto_heal({"identifier": identifier}, lookup_by="identifier")
            row = heal_result.get("data")

        return _ok(row)
    except Exception as exc:
        return _fail(f"get_user_by_identifier failed: {exc}")


def get_user_claims_by_sub(cognito_sub: str) -> dict:
    """
    Fetch minimal claims (userID, userType, isActive) needed for Cognito pre-token trigger.

    Returns:
        {"success": True, "data": <claims dict or None>}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'SELECT "userID", "userType", "isActive" FROM users WHERE "cognitoSub" = %s',
                    (cognito_sub,),
                )
                row = dict(cur.fetchone()) if cur.rowcount > 0 else None
        return _ok(row)
    except Exception as exc:
        return _fail(f"get_user_claims_by_sub failed: {exc}")


def get_all_users() -> dict:
    """
    Fetch all users (dev endpoint only — do not expose in prod).

    Returns:
        {"success": True, "data": [<user dicts>]}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users;")
                rows = [_row_to_dict(dict(r)) for r in cur.fetchall()]
        return _ok(rows)
    except Exception as exc:
        return _fail(f"get_all_users failed: {exc}")


def user_id_exists(user_id: str) -> dict:
    """
    Check if a userID already exists (for collision-free ID generation).

    Returns:
        {"success": True, "data": True/False}
    """
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT 1 FROM users WHERE "userID" = %s', (user_id,))
                exists = cur.fetchone() is not None
        return _ok(exists)
    except Exception as exc:
        return _fail(f"user_id_exists check failed: {exc}")


def find_overlap_candidates(email: str, phone: str) -> dict:
    """
    Find users with the same email or phone (called during Cognito post-confirmation).

    Returns:
        {"success": True, "data": [<overlap rows>]}
    """
    try:
        with _connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT "userID", "emailAddress", "phoneNumber"
                    FROM users
                    WHERE "emailAddress" = %s OR "phoneNumber" = %s
                    """,
                    (email, phone),
                )
                rows = [dict(r) for r in cur.fetchall()]
        return _ok(rows)
    except Exception as exc:
        return _fail(f"find_overlap_candidates failed: {exc}")


def search_users_by_username(query: str, limit: int = 20) -> dict:
    """
    Case-insensitive prefix search on userName and displayName.

    Returns:
        {"success": True, "data": [<user dicts>]}
    """
    try:
        safe_q = str(query or "").strip()
        if not safe_q:
            return _ok([])
        pattern = f"%{safe_q}%"
        with _connect() as conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM users
                    WHERE "isActive" = TRUE
                      AND ("userName" ILIKE %s OR "displayName" ILIKE %s)
                    ORDER BY "userName" ASC
                    LIMIT %s
                    """,
                    (pattern, pattern, limit),
                )
                rows = [_row_to_dict(r) for r in cur.fetchall()]
        return _ok(rows)
    except Exception as exc:
        return _fail(f"search_users_by_username failed: {exc}")


# ── User Write Operations ─────────────────────────────────────────────────────

def upsert_user(record: dict) -> dict:
    """
    Insert or update a user record (ON CONFLICT on cognitoSub).

    Args:
        record: Dict with keys matching the users table columns:
                userID, cognitoSub, userName, emailAddress, userType,
                phoneNumber, emailVerified, isActive, dateOfBirth.

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (
                        "userID", "cognitoSub", "userName", "emailAddress",
                        "userType", "phoneNumber", "emailVerified", "isActive", "dateOfBirth"
                    )
                    VALUES (
                        %(userID)s, %(cognitoSub)s, %(userName)s, %(emailAddress)s,
                        %(userType)s, %(phoneNumber)s, %(emailVerified)s, %(isActive)s, %(dateOfBirth)s
                    )
                    ON CONFLICT ("cognitoSub") DO UPDATE SET
                        "userName"      = EXCLUDED."userName",
                        "emailAddress"  = EXCLUDED."emailAddress",
                        "userType"      = EXCLUDED."userType",
                        "phoneNumber"   = EXCLUDED."phoneNumber",
                        "emailVerified" = EXCLUDED."emailVerified",
                        "isActive"      = EXCLUDED."isActive",
                        "dateOfBirth"   = EXCLUDED."dateOfBirth",
                        "updatedAt"     = CURRENT_TIMESTAMP
                    """,
                    record,
                )
            conn.commit()
        return _ok(None)
    except Exception as exc:
        return _fail(f"upsert_user failed: {exc}")


def update_user_profile(cognito_sub: str, bio: str = None,
                        profile_picture_url: str = None,
                        privacy_mode: str = None) -> dict:
    """
    Update mutable profile fields for a user identified by cognitoSub.

    Only non-None arguments are included in the UPDATE statement.

    Returns:
        {"success": True, "data": <updated user dict>}  or  {"success": False, "error": "..."}
    """
    try:
        updates = []
        params = []
        if bio is not None:
            updates.append('"bio" = %s')
            params.append(bio)
        if profile_picture_url is not None:
            updates.append('"profilePictureUrl" = %s')
            params.append(profile_picture_url)
        if privacy_mode is not None:
            updates.append('"privacyMode" = %s')
            params.append(privacy_mode)

        with _connect() as conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                if updates:
                    updates.append('"updatedAt" = CURRENT_TIMESTAMP')
                    query = f'UPDATE users SET {", ".join(updates)} WHERE "cognitoSub" = %s'
                    params.append(cognito_sub)
                    cur.execute(query, tuple(params))
                    conn.commit()

                cur.execute('SELECT * FROM users WHERE "cognitoSub" = %s', (cognito_sub,))
                row = _row_to_dict(cur.fetchone())

        return _ok(row)
    except Exception as exc:
        return _fail(f"update_user_profile failed: {exc}")


def execute_raw_sql(sql: str) -> dict:
    """
    Execute a raw SQL statement (dev/admin use only — DELETE, TRUNCATE, etc.).

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()
        return _ok(None)
    except Exception as exc:
        return _fail(f"execute_raw_sql failed: {exc}")


# ── Auto-Heal (Internal) ──────────────────────────────────────────────────────

def _auto_heal(lookup_hint: dict, lookup_by: str) -> dict:
    """
    If a user is missing from RDS but exists in Cognito, re-sync them.

    This is a best-effort recovery path — errors are logged but not raised.

    Args:
        lookup_hint: Dict with the value to search for in Cognito.
        lookup_by:   "sub" | "phone" | "identifier"

    Returns:
        {"success": True, "data": <healed user dict or None>}
    """
    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    if not _cognito_client or not pool_id:
        return _ok(None)

    try:
        cognito_user = None

        if lookup_by == "sub":
            resp = _cognito_client.list_users(
                UserPoolId=pool_id, Filter=f'sub = "{lookup_hint["sub"]}"'
            )
            users = resp.get("Users", [])
            if users:
                cognito_user = users[0]

        elif lookup_by == "phone":
            resp = _cognito_client.list_users(
                UserPoolId=pool_id,
                Filter=f'phone_number = "{lookup_hint["phone_number"]}"',
            )
            users = resp.get("Users", [])
            if users:
                cognito_user = users[0]

        elif lookup_by == "identifier":
            identifier = lookup_hint["identifier"]
            try:
                cognito_user = _cognito_client.admin_get_user(
                    UserPoolId=pool_id, Username=identifier
                )
            except _cognito_client.exceptions.UserNotFoundException:
                if "@" in identifier:
                    resp = _cognito_client.list_users(
                        UserPoolId=pool_id, Filter=f'email = "{identifier}"'
                    )
                    users = resp.get("Users", [])
                    if users:
                        cognito_user = users[0]

        if not cognito_user:
            return _ok(None)

        # Build upsert record
        attrs = {
            a["Name"]: a["Value"]
            for a in cognito_user.get("Attributes", cognito_user.get("UserAttributes", []))
        }
        alphabet = string.ascii_uppercase + string.digits
        candidate = "".join(random.choice(alphabet) for _ in range(8))

        record = {
            "userID": candidate,
            "cognitoSub": attrs.get("sub"),
            "userName": cognito_user.get("Username") or attrs.get("preferred_username", ""),
            "emailAddress": attrs.get("email", ""),
            "userType": attrs.get("custom:userType", "General"),
            "phoneNumber": attrs.get("phone_number", ""),
            "emailVerified": str(attrs.get("email_verified", "false")).lower() == "true",
            "isActive": True,
            "dateOfBirth": attrs.get("custom:dateOfBirth", "2000-01-01"),
        }
        upsert_result = upsert_user(record)
        if not upsert_result["success"]:
            print(json.dumps({"level": "error", "message": "auto-heal upsert failed",
                              "error": upsert_result["error"]}))
            return _ok(None)

        return _ok(record)

    except Exception as exc:
        print(json.dumps({"level": "error", "message": "auto-heal failed", "error": str(exc)}))
        return _ok(None)
