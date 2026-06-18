"""
utils/utilities.py — Shared helper functions for HappniX Lambda handlers.

Only contains functions actively used by the current handler (signup_signin.py).
Add new helpers here as additional handlers are built.
"""

import json
import os
import re
import secrets
from datetime import datetime, timezone
from email.utils import parseaddr


# ── Environment ───────────────────────────────────────────────────────────────

from utils import dependencies

def env(key: str, default: str = "") -> str:
    """Safe os.environ.get with a fallback to dependencies.enviroment_variable."""
    if key in os.environ:
        return os.environ[key]
    return dependencies.enviroment_variable.get(key, default)


def app_env() -> str:
    """Return lowercase APP_ENVIRONMENT ('dev', 'qa', 'prod')."""
    return env("APP_ENVIRONMENT", "dev").strip().lower()


def is_test_otp_mode() -> bool:
    """True when TEST_OTP_MODE=true — allows fixed OTP 123456 in non-prod."""
    return env("TEST_OTP_MODE", "false").strip().lower() == "true"


# ── Request Parsing ───────────────────────────────────────────────────────────

def parse_body(event: dict) -> dict:
    """
    Safely parse the JSON body from a Lambda event.

    Returns an empty dict if body is absent, or '400' string if JSON is invalid.
    """
    try:
        return json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        return "400"


def extract_preauth_token(event: dict) -> str | None:
    """
    Extract the preauth token from the X-HappniX-PreAuth request header.

    This token is used only during the OTP verification and signup flow.
    It is returned in the response body by SendMobileOtp / VerifyMobileOtp and
    sent back by the frontend in this header on subsequent signup steps.

    Returns the token string or None if not present.
    """
    headers = event.get("headers") or {}
    return (
        headers.get("X-HappniX-PreAuth")
        or headers.get("x-happnix-preauth")
        or headers.get("X-Happnix-Preauth")
        or None
    )


# ── Validators ────────────────────────────────────────────────────────────────

def is_valid_email(email: str) -> bool:
    """
    Return True if email parses as a syntactically valid email address.

    Uses the stdlib email.utils.parseaddr — not a strict RFC 5321 check,
    but good enough to catch obvious typos.
    """
    _, parsed = parseaddr(str(email or ""))
    return bool(parsed and "@" in parsed and "." in parsed.split("@")[-1])


def is_valid_mobile(mobile: str) -> bool:
    """
    Return True if mobile is:
      - Exactly 10 digits (legacy Indian format, no country code), OR
      - E.164 format: starts with '+' followed by 7–15 digits
        (e.g. "+919876543210", "+12025551234").
    """
    raw = str(mobile or "").strip()
    if raw.startswith("+"):
        digits_only = raw[1:]
        return digits_only.isdigit() and 7 <= len(digits_only) <= 15
    return raw.isdigit() and len(raw) == 10


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
        "9876543210"   → "+919876543210"
        "+919876543210" → "+919876543210"  (unchanged)
    """
    raw = str(mobile or "").strip()
    if raw.startswith("+"):
        return raw
    return f"+91{raw}" if raw else ""


def now_iso() -> str:
    """Return the current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()





# ── Logging ───────────────────────────────────────────────────────────────────

def log(level: str, trace_id: str, message: str, **extra):
    """
    Emit a structured JSON log line to stdout (CloudWatch picks this up).

    Args:
        level:    "info" | "warning" | "error"
        trace_id: Request trace ID or function name for context.
        message:  Human-readable log message.
        **extra:  Any additional key/value pairs to include.

    Usage:
        log("info",    "send_mobile_otp", "OTP generated", mobile="9876543210")
        log("error",   "lambda_handler",  "Unhandled exception", error=str(exc))
        log("warning", "cognito_lookup",  "Cognito unavailable")
    """
    payload = {"level": level, "traceId": trace_id, "message": message}
    if extra:
        payload["extra"] = extra
    print(json.dumps(payload, sort_keys=True))

def format_rds_row(row: dict) -> dict:
    """
    Format a database row dictionary so it can be safely serialized to JSON.
    - Datetimes/Dates are converted to ISO strings
    - Nested dicts/lists (JSONB/Array columns) are kept as dicts/lists so `json.dumps`
      in the response handler will serialize them into valid JSON objects, NOT Python strings.
    - Other types are converted to strings to match legacy behavior.
    """
    from datetime import date, datetime
    
    formatted = {}
    for k, v in row.items():
        if v is None:
            formatted[k] = None
        elif isinstance(v, (dict, list)):
            formatted[k] = v
        elif isinstance(v, (datetime, date)):
            formatted[k] = v.isoformat()
        else:
            formatted[k] = str(v)
    return formatted
