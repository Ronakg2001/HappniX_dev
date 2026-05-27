"""
utilities/sessions.py — Pre-auth session management for HappniX.

Post-JWT-migration, this module is used ONLY for the short-lived pre-auth
tokens that carry OTP state and pending-signup state between:
  SendMobileOtp → VerifyMobileOtp → RegisterUserDetails → CompleteProfileSetup

The pre-auth token is returned in the response body (not a cookie) and sent
back by the frontend in the X-HappniX-PreAuth header. This is fully
cross-browser compatible and bypasses Safari ITP cookie restrictions.

For authenticated JWT sessions (post-login), see utilities/jwt_sessions.py.

Every function returns a standard response envelope:
  {"success": True,  "data": <result>}
  {"success": False, "error": "<message>"}
"""

import json
import os
import time
import uuid
from pathlib import Path


try:
    import boto3
    _dynamodb = boto3.resource("dynamodb")
except ImportError:
    _dynamodb = None


# ── Internal helpers ──────────────────────────────────────────────────────────

# 30 minutes — pre-auth tokens are short-lived by design.
# Users have 30 minutes to complete the OTP → signup flow before the token expires.
PREAUTH_TTL_SECONDS = 1_800   # 30 minutes

# Keep the old name as an alias so any existing references don't break.
SESSION_TTL_SECONDS = PREAUTH_TTL_SECONDS


def _ok(data):
    return {"success": True, "data": data}


def _fail(error: str):
    return {"success": False, "error": error}


def _get_sessions_table():
    """Return the DynamoDB sessions table resource, or None if not configured."""
    table_name = os.environ.get("SESSIONS_TABLE_NAME")
    if not _dynamodb or not table_name:
        return None
    return _dynamodb.Table(table_name)


# ── Local file fallback (dev only) ────────────────────────────────────────────

def _state_path() -> Path:
    """Resolve the path for the local dev auth_state.json file."""
    configured = os.environ.get("HAPPNIX_DEV_STORE_PATH", "").strip()
    if configured:
        return Path(configured)
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return Path("/tmp/auth_state.json")
    return Path(__file__).resolve().parent.parent / "dev_data" / "auth_state.json"


def _default_state() -> dict:
    return {"sessions": {}}


def _load_local_state() -> dict:
    path = _state_path()
    if not path.exists():
        return _default_state()
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return _default_state()


def _save_local_state(state: dict):
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


# ── Public API ────────────────────────────────────────────────────────────────

def ensure_session(session_token: str = None) -> dict:
    """
    Return an existing session or create a new empty one.

    Args:
        session_token: Existing token from cookie, or None to generate a new one.

    Returns:
        {"success": True, "data": {"token": str, "session": dict}}
    """
    try:
        token = session_token or uuid.uuid4().hex
        table = _get_sessions_table()

        if table:
            resp = table.get_item(Key={"sessionToken": token})
            if "Item" in resp:
                session_data = json.loads(resp["Item"].get("data", "{}"))
                return _ok({"token": token, "session": session_data})
            # New session
            table.put_item(Item={
                "sessionToken": token,
                "data": "{}",
                "expiresAt": int(time.time()) + SESSION_TTL_SECONDS,
            })
            return _ok({"token": token, "session": {}})

        # Local fallback
        state = _load_local_state()
        state["sessions"].setdefault(token, {})
        _save_local_state(state)
        return _ok({"token": token, "session": state["sessions"][token]})

    except Exception as exc:
        return _fail(f"ensure_session failed: {exc}")


def get_session(session_token: str) -> dict:
    """
    Retrieve session data for an existing token.

    Args:
        session_token: The cookie token value.

    Returns:
        {"success": True, "data": {"token": str, "session": dict or None}}
        session is None if the token does not exist.
    """
    try:
        if not session_token:
            return _ok({"token": None, "session": None})

        table = _get_sessions_table()

        if table:
            resp = table.get_item(Key={"sessionToken": session_token})
            if "Item" in resp:
                session_data = json.loads(resp["Item"].get("data", "{}"))
                return _ok({"token": session_token, "session": session_data})
            return _ok({"token": session_token, "session": None})

        # Local fallback
        state = _load_local_state()
        session_data = state["sessions"].get(session_token)
        return _ok({"token": session_token, "session": session_data})

    except Exception as exc:
        return _fail(f"get_session failed: {exc}")


def replace_session(token: str, session_data: dict) -> dict:
    """
    Overwrite the entire session data for an existing token.

    Args:
        token:        Session token string.
        session_data: New session dict to persist.

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        if not token:
            return _fail("replace_session called with empty token.")

        table = _get_sessions_table()

        if table:
            table.put_item(Item={
                "sessionToken": token,
                "data": json.dumps(session_data),
                "expiresAt": int(time.time()) + SESSION_TTL_SECONDS,
            })
            return _ok(None)

        # Local fallback
        state = _load_local_state()
        state["sessions"][token] = session_data
        _save_local_state(state)
        return _ok(None)

    except Exception as exc:
        return _fail(f"replace_session failed: {exc}")


def delete_session(token: str) -> dict:
    """
    Delete a session (called on logout).

    Args:
        token: Session token string.

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        if not token:
            return _ok(None)

        table = _get_sessions_table()

        if table:
            table.delete_item(Key={"sessionToken": token})
            return _ok(None)

        # Local fallback
        state = _load_local_state()
        state["sessions"].pop(token, None)
        _save_local_state(state)
        return _ok(None)

    except Exception as exc:
        return _fail(f"delete_session failed: {exc}")
