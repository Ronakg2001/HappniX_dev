import json
import os
from decimal import Decimal

# ── CORS Configuration ─────────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS env var as comma-separated list in production:
#   e.g. "https://happnix.com,https://www.happnix.com,https://app.happnix.com"
# Falls back to "*" ONLY when unset (local dev).
_ALLOWED_ORIGINS_RAW = os.environ.get("ALLOWED_ORIGINS", "*")
_ALLOWED_ORIGINS = [o.strip() for o in _ALLOWED_ORIGINS_RAW.split(",") if o.strip()]


class _DecimalEncoder(json.JSONEncoder):
    """Handle DynamoDB Decimal values during JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Return int if there's no fractional part, otherwise float
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)

def _cors_headers(origin: str = None) -> dict:
    """Standard CORS + content-type headers for all API responses."""
    # If ALLOWED_ORIGINS is "*", allow everything (dev mode)
    if _ALLOWED_ORIGINS == ["*"]:
        allowed_origin = "*"
    elif origin and origin in _ALLOWED_ORIGINS:
        allowed_origin = origin
    elif _ALLOWED_ORIGINS:
        # Default to first allowed origin if request origin not matched
        allowed_origin = _ALLOWED_ORIGINS[0]
    else:
        allowed_origin = "*"

    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowed_origin,
        # X-HappniX-PreAuth — carries pre-auth token during OTP/signup flow
        # Authorization    — carries Cognito JWT Bearer token for authenticated calls
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRFToken,X-HappniX-PreAuth",
        "Access-Control-Expose-Headers": "X-Happnix-Trace-Id",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }


def success_response(body: dict, status: int = 200, trace_id: str = None) -> dict:
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
        "body": json.dumps(body, cls=_DecimalEncoder),
    }


def error_response(message: str, status: int = 400, trace_id: str = None) -> dict:
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
        "body": json.dumps(body, cls=_DecimalEncoder),
    }

