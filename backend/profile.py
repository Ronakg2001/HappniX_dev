"""
profile.py — Dedicated Profile Lambda for HappniX.

Handles deep profile operations that are separate from the home page
(e.g. Aadhaar verification, profile picture upload, full settings management).

Routes (all /api/profile/* and /api/settings/*):
  GET  /api/profile/{id}                   → GetProfile
  POST /api/profile/verify/aadhaar/send    → SendAadhaarOtp
  POST /api/profile/verify/aadhaar/verify  → VerifyAadhaarOtp
  POST /api/profile/picture/upload         → UploadProfilePicture
  GET  /api/profile/notifications          → GetNotifications
  POST /api/profile/notifications/read     → MarkNotificationsRead

TODO: Implement each handler when the feature is being built.
      The lambda_handler skeleton below is ready to deploy to AWS as-is.
"""

import utilities.util as util


# ── Placeholder handlers ──────────────────────────────────────────────────────

def GetProfile(event, path_params, query_params, body):
    # TODO: Fetch full profile by userId from RDS + DynamoDB social counts
    return util.err("GetProfile not implemented yet.", 501)


def SendAadhaarOtp(event, path_params, query_params, body):
    # TODO: Validate aadhaarNumber, create OTP session, trigger verification
    return util.err("SendAadhaarOtp not implemented yet.", 501)


def VerifyAadhaarOtp(event, path_params, query_params, body):
    # TODO: Validate OTP, update adharVerified=True in RDS
    return util.err("VerifyAadhaarOtp not implemented yet.", 501)


def UploadProfilePicture(event, path_params, query_params, body):
    # TODO: Generate presigned S3 URL for client to upload directly to S3
    return util.err("UploadProfilePicture not implemented yet.", 501)


def GetNotifications(event, path_params, query_params, body):
    # TODO: query_items NOTIFICATIONS_TABLE by cognitoSub
    return util.err("GetNotifications not implemented yet.", 501)


def MarkNotificationsRead(event, path_params, query_params, body):
    # TODO: batch_write updated notifications with isRead=True
    return util.err("MarkNotificationsRead not implemented yet.", 501)


# ── Router ────────────────────────────────────────────────────────────────────

def _resolve(method, path):
    m = method.upper()
    p = [s for s in path.split("/") if s]

    if m == "GET"  and len(p) == 3 and p[:2] == ["api", "profile"]:                        return GetProfile, {"id": p[2]}
    if m == "POST" and p == ["api", "profile", "verify", "aadhaar", "send"]:               return SendAadhaarOtp, {}
    if m == "POST" and p == ["api", "profile", "verify", "aadhaar", "verify"]:             return VerifyAadhaarOtp, {}
    if m == "POST" and p == ["api", "profile", "picture", "upload"]:                       return UploadProfilePicture, {}
    if m == "GET"  and p == ["api", "profile", "notifications"]:                           return GetNotifications, {}
    if m == "POST" and p == ["api", "profile", "notifications", "read"]:                   return MarkNotificationsRead, {}

    return None, {}


# ── Lambda Entry Point ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    if http_method == "OPTIONS":
        return util.ok({}, 200)

    query_params = event.get("queryStringParameters") or {}
    path_params  = event.get("pathParameters") or {}
    body = util.parse_body(event)

    handler, resolved_params = _resolve(http_method, path)
    merged_params = {**path_params, **resolved_params}

    if handler is None:
        return util.err(f"Route not found: {http_method} {path}", 404)

    try:
        return handler(event, merged_params, query_params, body)
    except Exception as exc:
        log("error", "profile", f"Unhandled error in {handler.__name__}: {exc}")
        return util.err("An internal error occurred.", 500)
