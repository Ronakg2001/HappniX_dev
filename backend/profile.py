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

import os
import boto3
import utilities.util as util
import utilities.rds as rds
import utilities.dynamo as dynamo
import utilities.sessions as sessions

_USER_INFO_TABLE = os.environ.get("USER_INFO_TABLE_NAME", "")
_COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
try:
    _cognito = boto3.client("cognito-idp")
except Exception:
    _cognito = None

def _get_session_sub(event):
    token = util.extract_session_token(event)
    if not token:
        return None
    result = sessions.get_session(token)
    if not result["success"] or not result["data"]["session"]:
        return None
    return result["data"]["session"].get("authenticated_user_id")


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


def DeleteAccount(event, path_params, query_params, body):
    cognito_sub = _get_session_sub(event)
    if not cognito_sub:
        return util.err("Unauthorized.", 401)

    try:
        # Delete from Cognito
        if _cognito and _COGNITO_USER_POOL_ID:
            _cognito.admin_delete_user(
                UserPoolId=_COGNITO_USER_POOL_ID,
                Username=cognito_sub
            )
            
        # Delete from DynamoDB
        if _USER_INFO_TABLE:
            # We need the userID to delete from DynamoDB, fetch from RDS first
            user_result = rds.get_user_by_sub(cognito_sub)
            if user_result["success"] and user_result["data"]:
                user_id = user_result["data"].get("userID")
                user_name = user_result["data"].get("userName")
                if user_id and user_name:
                    dynamo.delete_item(_USER_INFO_TABLE, {"userID": user_id, "userName": user_name})

        # Delete from RDS
        rds.delete_user_hard(cognito_sub)

        return util.ok({"success": True, "message": "Account successfully deleted."})
    except Exception as exc:
        util.log("error", "profile", f"DeleteAccount failed: {exc}")
        return util.err("Failed to delete account.", 500)


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
    if m == "DELETE" and p == ["api", "profile", "delete"]:                                return DeleteAccount, {}
    if m == "POST" and p == ["api", "profile", "delete"]:                                  return DeleteAccount, {}

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
        util.log("error", "profile", f"Unhandled error in {handler.__name__}: {exc}")
        return util.err("An internal error occurred.", 500)
