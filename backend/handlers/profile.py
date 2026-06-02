"""
handlers/profile.py — User profile endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds

def handle_get_me(event):
    """
    Handle GET /api/profile/me
    Validates the bearer token against Cognito, verifies the user exists in RDS,
    and returns their profile data.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return error_response("Missing or invalid Authorization header.", 401)
    
    access_token = auth_header.split(" ")[1]
    
    # 1. Verify token and user existence in Cognito
    cognito_user = cognito.get_user(access_token)
    if not cognito_user:
        util.log("warning", "handle_get_me", "Cognito token invalid or user deleted.")
        return error_response("Unauthorized. User may be deleted.", 401)
    
    # Extract username from Cognito response
    username = cognito_user.get("Username")
    if not username:
        return error_response("Unauthorized. Invalid Cognito user data.", 401)
        
    # 2. Verify user existence in RDS
    rds_result = rds.get_user_by_username(username)
    if not rds_result.get("success"):
        util.log("warning", "handle_get_me", "User not found in RDS.", username=username)
        return error_response("User not found in database. Account may be deleted.", 401)
        
    user_data = rds_result.get("data")
    
    # Return user profile data
    return success_response({
        "success": True,
        "profile": user_data
    })


def lambda_handler(event, context):
    try:
        path = event.get("path", "")
        http_method = event.get("httpMethod", "")
        
        if http_method == "GET" and path.endswith("/api/profile/me"):
            return handle_get_me(event)
            
        return error_response("Profile handler not implemented yet.", 501)
    except Exception as exc:
        util.log("error", "profile.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
