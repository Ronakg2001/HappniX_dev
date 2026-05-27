import json

def _cors_headers() -> dict:
    """Standard CORS + content-type headers for all API responses."""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        # X-HappniX-PreAuth — carries pre-auth token during OTP/signup flow
        # Authorization    — carries Cognito JWT Bearer token for authenticated calls
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRFToken,X-HappniX-PreAuth",
        "Access-Control-Expose-Headers": "X-Happnix-Trace-Id",
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
        "body": json.dumps(body),
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
        "body": json.dumps(body),
    }

