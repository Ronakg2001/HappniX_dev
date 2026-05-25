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
import utilities.util as util
import utilities.rds as rds
import utilities.dynamo as dynamo

_USER_INFO_TABLE = os.environ.get("USER_INFO_TABLE_NAME", "")
_COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")

# ── Placeholder handlers ──────────────────────────────────────────────────────

def get_profile(event, path_params, query_params, body):
    # TODO: Fetch full profile by userId from RDS + DynamoDB social counts
    return util.err("GetProfile not implemented yet.", 501)


def send_aadhaar_otp(event, path_params, query_params, body):
    # TODO: Validate aadhaarNumber, create OTP session, trigger verification
    return util.err("SendAadhaarOtp not implemented yet.", 501)


def verify_aadhaar_otp(event, path_params, query_params, body):
    # TODO: Validate OTP, update adharVerified=True in RDS
    return util.err("VerifyAadhaarOtp not implemented yet.", 501)


def upload_profile_picture(event, path_params, query_params, body):
    # TODO: Generate presigned S3 URL for client to upload directly to S3
    return util.err("UploadProfilePicture not implemented yet.", 501)


def get_notifications(event, path_params, query_params, body):
    # TODO: query_items NOTIFICATIONS_TABLE by cognitoSub
    return util.err("GetNotifications not implemented yet.", 501)


def mark_notifications_read(event, path_params, query_params, body):
    # TODO: batch_write updated notifications with isRead=True
    return util.err("MarkNotificationsRead not implemented yet.", 501)


def delete_account(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")

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


ACTION_HANDLERS = {
    "GET_PROFILE": get_profile,
    "SEND_AADHAAR_OTP": send_aadhaar_otp,
    "VERIFY_AADHAAR_OTP": verify_aadhaar_otp,
    "UPLOAD_PROFILE_PICTURE": upload_profile_picture,
    "GET_NOTIFICATIONS": get_notifications,
    "MARK_NOTIFICATIONS_READ": mark_notifications_read,
    "DELETE_ACCOUNT": delete_account,
}

import utilities.cognito_auth as auth
import json

def lambda_handler(event, context):
    try:
        # A. Parse Request Body
        body_str = event.get('body')
        if body_str:
            try:
                body = json.loads(body_str)
            except json.JSONDecodeError:
                return auth.build_response(400, {"error": "Malformed JSON in request body"})
        else:
            body = event.get('body') if isinstance(event.get('body'), dict) else {}
            if not body:
                body = event

        action_item = body.get('actionItem')
        if not action_item:
            return auth.build_response(400, {"error": "Missing 'actionItem' in payload"})

        # B. Verify Authorization
        UNPROTECTED_ACTIONS = set()
        
        decoded_token = {}
        if action_item not in UNPROTECTED_ACTIONS:
            headers = event.get('headers', {})
            auth_header = headers.get('Authorization') or headers.get('authorization')
            if not auth_header:
                return auth.build_response(401, {"error": "Missing Authorization header"})

            token = auth_header.replace('Bearer ', '').replace('bearer ', '')
            try:
                decoded_token = auth.verify_token(token)
                event["auth_sub"] = decoded_token.get("sub")
            except Exception as auth_error:
                print(f"Token verification failed: {str(auth_error)}")
                return auth.build_response(401, {"error": "Unauthorized: Invalid or expired token"})

        # C. Route to the requested function
        selected_action = ACTION_HANDLERS.get(action_item)
        if not selected_action:
            return auth.build_response(400, {"error": f"Invalid actionItem: {action_item}"})

        # Separate payload from actionItem
        payload = {k: v for k, v in body.items() if k != 'actionItem'}

        # Backward compatibility for existing handlers that expect path_params/query_params
        path_params = payload
        query_params = payload

        # D. Execute the function
        result = selected_action(event, path_params, query_params, payload)

        if "statusCode" in result and "body" in result:
            return result
        return auth.build_response(200, result)

    except Exception as e:
        print(f"Internal Server Error: {str(e)}")
        return auth.build_response(500, {"error": "Internal Server Error"})
