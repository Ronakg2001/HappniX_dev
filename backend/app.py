import json
import os


def _json_response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def lambda_handler(event, _context):
    path = (event or {}).get("rawPath") or (
        ((event or {}).get("requestContext") or {}).get("http") or {}
    ).get("path")
    method = (((event or {}).get("requestContext") or {}).get("http") or {}).get(
        "method", "GET"
    )

    if path == "/health" and method == "GET":
        return _json_response(
            200,
            {
                "status": "ok",
                "service": "happnix-backend",
                "environment": os.environ.get("APP_ENVIRONMENT", "dev"),
                "apiVersion": "v1",
                "r2Configured": bool(os.environ.get("R2_BUCKET_NAME")),
            },
        )

    return _json_response(
        404,
        {
            "message": "Route not found.",
            "path": path or "",
            "method": method,
        },
    )
