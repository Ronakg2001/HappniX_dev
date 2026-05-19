"""
utilities/util.py — Shared helper functions for all HappniX Lambda functions.

Import from here instead of duplicating logic in each Lambda:

    from utilities.util import ok, err, get_session_user, format_phone_in

All functions are stateless and pure — no side effects, no DB calls.
DB-touching helpers live in rds.py and sessions.py.
"""

import json
import os
import re
import uuid
import random
import string
from datetime import datetime, timezone
from email.utils import parseaddr


# ── Environment ───────────────────────────────────────────────────────────────

def env(key: str, default: str = "") -> str:
    """Safe os.environ.get with a default."""
    return os.environ.get(key, default)


def app_env() -> str:
    """Return lowercase APP_ENVIRONMENT ('dev', 'qa', 'prod')."""
    return env("APP_ENVIRONMENT", "dev").strip().lower()


def is_test_otp_mode() -> bool:
    """True when TEST_OTP_MODE=true — allows fixed OTP 123456 in non-prod."""
    return env("TEST_OTP_MODE", "false").strip().lower() == "true"


# ── Response Builders ─────────────────────────────────────────────────────────

def _cors_headers() -> dict:
    """Standard CORS + content-type headers for all API responses."""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": env("FRONTEND_URL", "https://happnix-dev.ronakgo1.workers.dev"),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRFToken",
    }


def ok(body: dict, status: int = 200, trace_id: str = None) -> dict:
    """
    Build a successful Lambda HTTP response.

    Args:
        body:     Dict to serialize as JSON body.
        status:   HTTP status code (default 200).
        trace_id: Optional X-Happnix-Trace-Id header value.

    Returns:
        Lambda-compatible response dict.
    """
    headers = _cors_headers()
    if trace_id:
        headers["X-Happnix-Trace-Id"] = trace_id
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body),
    }


def err(message: str, status: int = 400, trace_id: str = None) -> dict:
    """
    Build an error Lambda HTTP response.

    Args:
        message:  Human-readable error message.
        status:   HTTP status code (default 400).
        trace_id: Optional trace ID added to both header and body.

    Returns:
        Lambda-compatible response dict.
    """
    body = {"success": False, "message": message}
    if trace_id:
        body["traceId"] = trace_id
    headers = _cors_headers()
    if trace_id:
        headers["X-Happnix-Trace-Id"] = trace_id
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body),
    }


def with_session_cookie(response: dict, session_token: str) -> dict:
    """
    Attach a Set-Cookie header to an existing response dict.

    Args:
        response:      Lambda response dict (mutated in-place and returned).
        session_token: Value for the happnix_session cookie.

    Returns:
        The same response dict with the cookie header added.
    """
    if session_token:
        response.setdefault("headers", {})
        response["headers"]["Set-Cookie"] = (
            f"happnix_session={session_token}; Path=/; HttpOnly; SameSite=None; Secure"
        )
    return response


def clear_session_cookie(response: dict) -> dict:
    """Expire the happnix_session cookie (used on logout)."""
    response.setdefault("headers", {})
    response["headers"]["Set-Cookie"] = (
        "happnix_session=; Path=/; HttpOnly; SameSite=None; Secure; "
        "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    )
    return response


# ── Request Parsing ───────────────────────────────────────────────────────────

def parse_body(event: dict) -> dict:
    """
    Safely parse the JSON body from a Lambda event.

    Returns an empty dict if body is absent or invalid JSON.
    """
    try:
        return json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


def extract_session_token(event: dict) -> str | None:
    """
    Extract the happnix_session cookie value from the request headers.

    Returns the token string or None if not present.
    """
    headers = event.get("headers") or {}
    cookie_header = headers.get("Cookie") or headers.get("cookie") or ""
    for chunk in cookie_header.split(";"):
        name, sep, value = chunk.strip().partition("=")
        if sep and name == "happnix_session":
            return value.strip()
    return None


def extract_trace_id(event: dict) -> str:
    """
    Extract or generate a trace ID for structured logging.

    Uses requestContext.requestId from API Gateway; falls back to a UUID.
    """
    return (event.get("requestContext") or {}).get("requestId") or uuid.uuid4().hex


# ── Validators ────────────────────────────────────────────────────────────────

def is_valid_email(email: str) -> bool:
    """
    Return True if `email` parses as a syntactically valid email address.

    Uses the stdlib email.utils.parseaddr — not a strict RFC 5321 check,
    but good enough to catch obvious typos.
    """
    _, parsed = parseaddr(str(email or ""))
    return bool(parsed and "@" in parsed and "." in parsed.split("@")[-1])


def is_valid_mobile(mobile: str) -> bool:
    """Return True if mobile is exactly 10 digits (Indian format without country code)."""
    return str(mobile or "").strip().isdigit() and len(str(mobile).strip()) == 10


def is_strong_password(password: str) -> bool:
    """
    Return True if password meets HappniX requirements:
      - Minimum 8 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
      - At least one special character
    """
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
    return bool(re.match(pattern, str(password or "")))


def is_valid_date(date_str: str) -> bool:
    """Return True if date_str matches YYYY-MM-DD format."""
    return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", str(date_str or "")))


# ── Formatters ────────────────────────────────────────────────────────────────

def format_phone_in(mobile: str) -> str:
    """
    Prepend +91 to a 10-digit Indian mobile if no country code is present.

    Examples:
        "9876543210"  → "+919876543210"
        "+919876543210" → "+919876543210"  (unchanged)
    """
    raw = str(mobile or "").strip()
    if raw.startswith("+"):
        return raw
    return f"+91{raw}" if raw else ""


def now_iso() -> str:
    """Return the current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def new_id(length: int = 16) -> str:
    """Return a random hex ID of `length` characters."""
    return uuid.uuid4().hex[:length]


def new_user_id(length: int = 8) -> str:
    """Return a random 8-char uppercase alphanumeric user ID (e.g. 'AB3X9KZ1')."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def generate_otp(digits: int = 6) -> str:
    """Return a zero-padded random numeric OTP string of `digits` length."""
    return "".join(str(random.randint(0, 9)) for _ in range(digits))


def format_public_profile(user_row: dict, following_count: int = 0,
                           followers_count: int = 0, is_following: bool = False) -> dict:
    """
    Convert a raw RDS users row into the public profile shape the frontend expects.

    Args:
        user_row:        Row dict from the users table (may be empty/None).
        following_count: Number of people this user follows.
        followers_count: Number of followers this user has.
        is_following:    Whether the viewer is following this user.

    Returns:
        Formatted profile dict, or empty dict if user_row is falsy.
    """
    if not user_row:
        return {}
    user_id = user_row.get("userID")
    username = user_row.get("userName")
    full_name = user_row.get("displayName") or username
    profile_picture_url = user_row.get("profilePictureUrl") or ""
    privacy_mode = user_row.get("privacyMode") or "public"
    is_private = privacy_mode == "private"
    is_verified = bool(user_row.get("adharVerified"))
    return {
        "userID": user_row.get("userID"),
        "sql_user_id": user_id,
        "cognitoSub": user_row.get("cognitoSub"),
        "cognito_sub": user_row.get("cognitoSub"),
        "username": username,
        "fullName": full_name,
        "full_name": full_name,
        "email": user_row.get("emailAddress") or "",
        "mobile": user_row.get("phoneNumber") or "",
        "dateOfBirth": str(user_row.get("dateOfBirth") or ""),
        "date_of_birth": str(user_row.get("dateOfBirth") or ""),
        "sex": user_row.get("sex") or "",
        "bio": user_row.get("bio") or "",
        "profilePictureUrl": profile_picture_url,
        "profile_picture_url": profile_picture_url,
        "isVerified": is_verified,
        "gov_id_verified": is_verified,
        "privacyMode": privacy_mode,
        "privacy_mode": privacy_mode,
        "isPrivate": is_private,
        "is_private": is_private,
        "followingCount": following_count,
        "following_count": following_count,
        "followersCount": followers_count,
        "followers_count": followers_count,
        "isFollowing": is_following,
        "is_following": is_following,
    }


def can_create_or_join_parties(user: dict) -> bool:
    """Return True if the user has completed Aadhaar verification."""
    return bool(user and user.get("adharVerified"))


# ── Logging ───────────────────────────────────────────────────────────────────

def log(level: str, trace_id: str, message: str, **extra):
    """
    Emit a structured JSON log line to stdout (CloudWatch picks this up).

    Args:
        level:    "info" | "warning" | "error"
        trace_id: Request trace ID.
        message:  Human-readable log message.
        **extra:  Any additional key/value pairs to include.

    Usage:
        log("info", trace_id, "OTP sent", mobile="9876543210")
        log("error", trace_id, "DB failure", error=str(exc))
    """
    payload = {"level": level, "traceId": trace_id, "message": message}
    if extra:
        payload["extra"] = extra
    print(json.dumps(payload, sort_keys=True))
