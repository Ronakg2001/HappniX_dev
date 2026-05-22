"""
utilities/util.py — Shared helper functions for all HappniX Lambda functions.

Import from here instead of duplicating logic in each Lambda:

    from utilities.util import ok, err, extract_bearer_token, verify_cognito_token

All functions are stateless and pure — no side effects, no DB calls.
DB-touching helpers live in rds.py, sessions.py (pre-auth), and jwt_sessions.py (JWT).

Auth model (post-migration):
  • Pre-auth tokens  → X-HappniX-PreAuth header  (OTP/signup flow only)
  • JWT access token → Authorization: Bearer <token> (all authenticated API calls)

JWT Verification Strategy (AWS recommended):
  • Primary:  python-jose decodes and verifies the token locally using Cognito's
              public JWKS (JSON Web Key Sets). JWKS is fetched ONCE on cold start
              and cached in memory — zero network calls per request.
  • Fallback: If JWKS is unavailable (local dev / network error), falls back to
              boto3.cognito_idp.get_user() — one Cognito API call per request.
"""

import json
import os
import re
import uuid
import random
import string
from datetime import datetime, timezone
from email.utils import parseaddr

# ── python-jose (JWT local verification — AWS recommended best practice) ───────
try:
    from jose import jwt as _jose_jwt, jwk as _jose_jwk, JWTError as _JWTError
    _JOSE_AVAILABLE = True
except ImportError:
    _JOSE_AVAILABLE = False

# ── urllib for JWKS fetch (built-in, no extra dependency) ─────────────────────
try:
    from urllib.request import urlopen
    from urllib.error import URLError
except ImportError:
    urlopen = None
    URLError = Exception

# ── boto3 — still used for all OTHER Cognito operations (login, refresh, etc.) ─
try:
    import boto3
    _cognito_client = boto3.client("cognito-idp")
except Exception:
    _cognito_client = None

# ── JWKS cache (populated once on cold start, reused for the lifetime of the
#    Lambda container — Lambda re-uses containers across requests in the same
#    execution environment, so this is effectively a process-level cache) ───────
_jwks_cache: dict | None = None   # raw JWKS dict from Cognito
_jwks_keys_cache: list | None = None  # pre-parsed list of JWK key objects


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
        # X-HappniX-PreAuth — carries pre-auth token during OTP/signup flow
        # Authorization    — carries Cognito JWT Bearer token for authenticated calls
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRFToken,X-HappniX-PreAuth",
        "Access-Control-Expose-Headers": "X-Happnix-Trace-Id",
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
    DEPRECATED — no longer used post-JWT migration.
    Kept to avoid import errors during transition; safe to remove later.
    """
    return response


def clear_session_cookie(response: dict) -> dict:
    """
    DEPRECATED — no longer used post-JWT migration.
    Kept to avoid import errors during transition; safe to remove later.
    """
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
    DEPRECATED — reads happnix_session cookie. No longer used post-JWT migration.
    Kept to avoid import errors during transition. Use extract_preauth_token or
    extract_bearer_token instead.
    """
    headers = event.get("headers") or {}
    cookie_header = headers.get("Cookie") or headers.get("cookie") or ""
    for chunk in cookie_header.split(";"):
        name, sep, value = chunk.strip().partition("=")
        if sep and name == "happnix_session":
            return value.strip()
    return None


def extract_preauth_token(event: dict) -> str | None:
    """
    Extract the pre-auth token from the X-HappniX-PreAuth request header.

    This token is used ONLY during the OTP verification and signup flow.
    It is returned in the response body by SendMobileOtp/VerifyMobileOtp and
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


def extract_bearer_token(event: dict) -> str | None:
    """
    Extract the JWT access token from the Authorization: Bearer <token> header.

    Returns the raw token string or None if the header is absent or malformed.
    """
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        return token if token else None
    return None


def _get_jwks_keys() -> list | None:
    """
    Fetch and cache Cognito's public JWKS (JSON Web Key Set).

    The JWKS is downloaded ONCE per Lambda cold start and reused for every
    request in that container. Cognito rotates keys rarely, so this is safe.

    Returns:
        List of JWK key dicts, or None if unavailable.
    """
    global _jwks_cache, _jwks_keys_cache
    if _jwks_keys_cache is not None:
        return _jwks_keys_cache

    pool_id = os.environ.get("COGNITO_USER_POOL_ID", "")
    region  = (
        os.environ.get("COGNITO_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or os.environ.get("AWS_REGION", "ap-south-1")
    )

    if not pool_id or not _JOSE_AVAILABLE or urlopen is None:
        return None

    jwks_url = (
        f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"
        f"/.well-known/jwks.json"
    )
    try:
        with urlopen(jwks_url, timeout=3) as resp:
            _jwks_cache = json.loads(resp.read().decode("utf-8"))
        _jwks_keys_cache = _jwks_cache.get("keys", [])
        return _jwks_keys_cache
    except Exception as exc:
        # On any network failure, return None so we fall back to boto3 get_user()
        print(json.dumps({"level": "warning", "message": f"JWKS fetch failed: {exc}"}))
        return None


def verify_cognito_token(access_token: str) -> tuple:
    """
    Verify a Cognito access token.

    Strategy (AWS recommended):
      1. LOCAL (fast):  Use python-jose to verify the JWT signature, expiry,
                        issuer, and token_use locally against Cognito's public
                        JWKS. Zero network calls after the first cold-start fetch.
      2. FALLBACK:      If JOSE is unavailable or JWKS can't be fetched (e.g.
                        local dev without internet), fall back to boto3 get_user()
                        — one Cognito API call that validates the token server-side.

    Args:
        access_token: The raw JWT access token string.

    Returns:
        (cognito_sub: str, claims: dict) on success.
        (None, None) if the token is invalid, expired, or Cognito is unavailable.

    Usage:
        sub, claims = verify_cognito_token(token)
        if not sub:
            return util.err("Unauthorized.", 401)
    """
    if not access_token:
        return None, None

    # ── Dev mock token shortcut (non-prod only) ────────────────────────────────
    if access_token.startswith("mock-jwt-"):
        if app_env() == "prod":
            return None, None
        cognito_sub = access_token.replace("mock-jwt-", "")
        return cognito_sub, {"sub": cognito_sub, "token_use": "access"}

    # ── Primary: python-jose local verification ────────────────────────────────
    if _JOSE_AVAILABLE:
        pool_id = os.environ.get("COGNITO_USER_POOL_ID", "")
        region  = (
            os.environ.get("COGNITO_REGION")
            or os.environ.get("AWS_DEFAULT_REGION")
            or os.environ.get("AWS_REGION", "ap-south-1")
        )
        expected_issuer = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"

        keys = _get_jwks_keys()
        if keys and pool_id:
            try:
                # Peek at the header to find the correct signing key by kid
                header = _jose_jwt.get_unverified_header(access_token)
                kid = header.get("kid")
                # Find the matching key in the JWKS
                signing_key = next(
                    (k for k in keys if k.get("kid") == kid), None
                )
                if signing_key:
                    claims = _jose_jwt.decode(
                        access_token,
                        signing_key,
                        algorithms=["RS256"],
                        options={"verify_aud": False},  # Cognito access tokens have no aud
                    )
                    # Validate issuer and token_use (access tokens only)
                    if claims.get("iss") != expected_issuer:
                        return None, None
                    if claims.get("token_use") != "access":
                        return None, None
                    cognito_sub = claims.get("sub")
                    return cognito_sub, claims
            except _JWTError:
                # Token is invalid or expired — do not fall back to boto3 for security
                return None, None
            except Exception:
                pass  # Unexpected error — fall through to boto3 fallback

    # ── Fallback: boto3 get_user() (local dev / JWKS unavailable) ─────────────
    if not _cognito_client:
        return None, None
    try:
        resp = _cognito_client.get_user(AccessToken=access_token)
        attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
        cognito_sub = attrs.get("sub")
        return cognito_sub, attrs
    except Exception:
        return None, None


def get_jwt_sub(event: dict) -> str | None:
    """
    Extract the authenticated user's Cognito sub ID from the Bearer JWT token.

    Use this for lightweight auth checks when you only need to confirm WHO is
    making the request without loading their full profile from RDS.

    Args:
        event: Lambda event dict containing the HTTP headers.

    Returns:
        cognito_sub string on success, None if not authenticated.

    Usage:
        sub = util.get_jwt_sub(event)
        if not sub:
            return util.err("Not authenticated.", 401)
    """
    token = extract_bearer_token(event)
    if not token:
        return None
    sub, _ = verify_cognito_token(token)
    return sub


def get_jwt_user(event: dict, users_table: str = "", dynamo_module=None, rds_module=None):
    """
    Resolve the authenticated user from the Authorization: Bearer JWT header.

    Fetches both the Cognito sub AND the full user profile from RDS,
    optionally merging in DynamoDB fields (bio, profilePictureUrl).

    Args:
        event:        Lambda event dict containing the HTTP headers.
        users_table:  DynamoDB USERS_TABLE_NAME (pass if you want DynamoDB merge).
        dynamo_module: utilities.dynamo module (pass if you want DynamoDB merge).
        rds_module:   utilities.rds module (required).

    Returns:
        (cognito_sub: str, user: dict) on success.
        (None, None) if not authenticated or user not found in DB.

    Usage:
        sub, user = util.get_jwt_user(event, _USERS_TABLE, dynamo, rds)
        if not user:
            return util.err("Not authenticated.", 401)
    """
    token = extract_bearer_token(event)
    if not token:
        return None, None
    sub, _ = verify_cognito_token(token)
    if not sub:
        return None, None
    if rds_module is None:
        return sub, None
    user_result = rds_module.get_user_by_sub(sub)
    user = user_result["data"] if user_result["success"] else None
    if user and users_table and dynamo_module:
        dynamo_r = dynamo_module.get_item(users_table, {"userID": user["userID"]})
        if dynamo_r["success"] and dynamo_r["data"]:
            d = dynamo_r["data"]
            user["bio"] = d.get("bio") or user.get("bio") or ""
            user["profilePictureUrl"] = d.get("profilePictureUrl") or user.get("profilePictureUrl") or ""
    return sub, user


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
