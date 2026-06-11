"""
handlers/profile.py — User profile endpoints for HappniX.

Routes:
    GET  /api/profile/me         → getUserProfile (own profile from DynamoDB)
    GET  /api/profile/{id}       → getPublicProfile (other user's profile)
    POST /api/profile/me         → actionItem-based dispatch

Auth:
    The lambda_handler validates the Bearer token against Cognito and looks up
    the user in RDS. The extracted user context (userID, username, fullName,
    cognitoSub) is passed to every action handler via **kwargs, so individual
    handlers never touch auth logic directly.

Self-healing:
    If the PROFILE entity is missing from DynamoDB (e.g. the DynamoDB write
    failed during signup), the getUserProfile handler will automatically
    create it using the user context from kwargs, and then return it.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds
from integration import r2_bucket
from services import profile_services
from services import signup_signin_services
from utils import manifest
import time
import re


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION HANDLERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_user_profile(**kwargs):
    """
    Fetch the authenticated user's profile from DynamoDB.

    Uses ensure_user_profile() for self-healing: if the PROFILE entity is
    missing (DynamoDB write failed during signup), it creates both PROFILE +
    SETTINGS entities first, then returns the fresh profile.

    Kwargs (injected by lambda_handler):
        user_id      (str): HappniX UUIDv7 userID.
        username     (str): Cognito / RDS username.
        full_name    (str): User's display name.
        cognito_sub  (str): AWS Cognito sub UUID.
    """
    user_id     = kwargs.get("user_id")
    username    = kwargs.get("username")
    full_name   = kwargs.get("full_name")
    cognito_sub = kwargs.get("cognito_sub")

    try:
        # ── Fetch (or self-heal) the DynamoDB PROFILE ──────────────────────────────
        profile_result = profile_services.ensure_user_profile(
            user_id=user_id,
            username=username,
            full_name=full_name,
            cognito_sub=cognito_sub,
        )

        if not profile_result.get("success"):
            util.log("error", "get_user_profile",
                     "Failed to fetch/create user profile in DynamoDB.",
                     user_id=user_id, error=profile_result.get("error"))
            return error_response("Failed to load profile. Please try again.", 500)

        profile_data = profile_result.get("data", {})
        if "name" not in profile_data and full_name:
            profile_data["name"] = full_name
        if "username" not in profile_data and username:
            profile_data["username"] = username
            
        return success_response({
            "success": True,
            "profile": profile_data,
        })
    except Exception as exc:
        util.log("error", "get_user_profile", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)

def update_user_profile(**kwargs):
    """
    Updates the authenticated user's profile.
    If 'updateAvatar' is true, generates a new avatar key and a presigned URL.
    """
    user_id = kwargs.get("user_id")
    
    # Extract allowed fields
    allowed_fields = ["bio", "isPrivate", "accountType", "pronoun", "socialLinks", "name", "username", "dob", "gender"]
    updates = {}
    for f in allowed_fields:
        if f in kwargs:
            updates[f] = kwargs[f]
            
    # Handle avatar update request
    avatar_changed = kwargs.get("updateAvatar", False)
    presigned_url = None
    
    if avatar_changed:
        # Ensure the user's R2 folder structure exists before uploading
        init_res = manifest.init_user_storage(user_id)
        if not init_res.get("success"):
            util.log("warning", "update_user_profile",
                     "Failed to init R2 storage folders (non-fatal)", user_id=user_id)

        timestamp = int(time.time())
        avatar_key = manifest.get_avatar_key(user_id, timestamp)
        updates["avatar"] = avatar_key
        
        url_res = r2_bucket.generate_presigned_url(avatar_key, content_type="image/jpeg")
        if url_res.get("success"):
            presigned_url = url_res.get("url")
        else:
            util.log("error", "update_user_profile",
                     f"Failed to generate presigned URL: {url_res.get('error')}",
                     user_id=user_id, avatar_key=avatar_key)
            
    if not updates:
        return success_response({"success": True, "message": "No updates provided."})
        
    update_res = profile_services.update_user_profile(user_id, updates)
    if not update_res.get("success"):
        return error_response(update_res.get("error"), 500)
        
    response_data = {
        "success": True,
        "message": "Profile updated successfully.",
        "profile": update_res.get("data")
    }
    if presigned_url:
        response_data["avatarUploadUrl"] = presigned_url
        
    return success_response(response_data)


def check_username(**kwargs):
    """
    Checks if a username is available for profile updates.
    Frontend should pass 'target_username' or 'new_username' to avoid clashing with the authenticated user's 'username'.
    """
    try:
        target_username = str(kwargs.get("target_username") or kwargs.get("new_username") or kwargs.get("username", "")).strip()
        
        if not target_username:
            return success_response({"success": True, "available": False, "message": "Username is required."})

        if not re.match(r"^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9_.]{1,30}$", target_username):
            return success_response({"success": True, "available": False, "message": "Invalid username format."})

        available = signup_signin_services.is_username_available(target_username)
        
        return success_response({
            "success": True,
            "available": available
        })
    except Exception as exc:
        util.log("error", "profile.check_username", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def delete_account(**kwargs):
    """
    Deletes the authenticated user's account permanently from all systems.
    """
    user_id = kwargs.get("user_id")
    username = kwargs.get("username")
    access_token = kwargs.get("access_token")

    if not user_id or not username:
        return error_response("Missing user identifiers.", 400)

    try:
        result = profile_services.delete_user_data(user_id, username, access_token)
        if not result.get("success"):
            return error_response("Failed to completely delete account.", 500)

        return success_response({
            "success": True,
            "message": "Account has been successfully deleted."
        })
    except Exception as exc:
        util.log("error", "profile.delete_account", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION REGISTRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION_HANDLERS = {
    "getUserProfile": get_user_profile,
    "update_user_profile": update_user_profile,
    "check_username": check_username,
    "deleteAccount": delete_account,
    # Future: "updateProfile", "uploadAvatar", etc.
}

# Actions that map from GET path → action name
GET_ROUTE_MAP = {
    "/api/profile/me": "getUserProfile",
    # Future: "/api/profile/{id}" → "getPublicProfile"
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAMBDA HANDLER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def lambda_handler(event, context):
    """
    Entry point for all profile actions.

    Steps:
        A. Validate the Bearer token against Cognito.
        B. Look up the user in RDS to get userID, fullName, cognitoSub.
        C. Determine the action (from GET path or POST actionItem).
        D. Build a kwargs dict with the user context.
        E. Call the matching action handler with **kwargs.
    """
    try:
        # ── A. Validate Bearer token ───────────────────────────────────────────
        headers = event.get("headers", {})
        auth_header = headers.get("Authorization") or headers.get("authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return error_response("Missing or invalid Authorization header.", 401)

        access_token = auth_header.split(" ")[1]

        cognito_user = cognito.get_user(access_token)
        if not cognito_user:
            return error_response("Unauthorized. Invalid or expired token.", 401)

        username = cognito_user.get("Username")
        if not username:
            return error_response("Unauthorized. Invalid Cognito user data.", 401)

        # ── B. Look up the user in RDS ─────────────────────────────────────────
        rds_result = rds.get_record("users", userName=username)
        if not rds_result.get("success"):
            util.log("warning", "profile.lambda_handler",
                     "User not found in RDS.", username=username)
            return error_response("User not found in database.", 404)

        user_data   = rds_result.get("data", {})
        user_id     = user_data.get("userID")
        full_name   = user_data.get("fullName", "")
        cognito_sub = user_data.get("cognitoSub", "")

        if not user_id:
            return error_response("User ID not found in database.", 500)

        # ── C. Determine the action ───────────────────────────────────────────
        http_method = event.get("httpMethod", "")
        path        = event.get("path", "")
        action_name = None

        if http_method == "GET":
            # Match GET path to an action
            action_name = GET_ROUTE_MAP.get(path)
        elif http_method == "POST":
            # Extract actionItem from the POST body
            body = util.parse_body(event)
            if body == "400":
                return error_response("Malformed JSON in request body.", 400)
            action_name = body.get("actionItem")

        if not action_name:
            return error_response(f"Unknown profile action for {http_method} {path}.", 400)

        handler = ACTION_HANDLERS.get(action_name)
        if not handler:
            return error_response(f"Action '{action_name}' not implemented.", 501)

        # ── D. Build kwargs with user context ──────────────────────────────────
        kwargs = {
            "user_id":      user_id,
            "username":     username,
            "full_name":    full_name,
            "cognito_sub":  cognito_sub,
            "access_token": access_token,
        }

        # Merge POST body fields into kwargs (if any)
        if http_method == "POST":
            body = util.parse_body(event)
            if isinstance(body, dict):
                for k, v in body.items():
                    if k != "actionItem":
                        kwargs[k] = v

        # ── E. Call the action handler ─────────────────────────────────────────
        return handler(**kwargs)

    except Exception as exc:
        util.log("error", "profile.lambda_handler", f"Unhandled exception: {exc}")
        return error_response(f"Internal server error: {str(exc)}", 500)
