"""
handlers/home_page.py — Home feed and discovery endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds

def handle_logout(event, body):
    """
    Backend logout handler located in home_page.
    Reads the Authorization Bearer token and triggers Cognito GlobalSignOut.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        # If no valid token is provided, just return success since they're already logged out locally
        return success_response({"success": True, "message": "Logged out locally."})
    
    access_token = auth_header.split(" ")[1]
    
    try:
        cognito.global_sign_out(access_token)
        util.log("info", "logout", "Successfully revoked tokens in Cognito.")
    except Exception as exc:
        util.log("warning", "logout", f"Failed to revoke tokens: {exc}")
        # We still return success to the client so they aren't stuck logged in on the frontend
    
    return success_response({"success": True, "message": "Logged out globally."})

def handle_home_feed(event):
    """
    Handle GET /api/home/feed
    Acts as the primary gateway for the home page.
    Validates the bearer token against Cognito, verifies the user exists in RDS,
    and returns initial feed data.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return error_response("Missing or invalid Authorization header.", 401)
    
    access_token = auth_header.split(" ")[1]
    
    # 1. Verify token and user existence in Cognito
    cognito_user = cognito.get_user(access_token)
    if not cognito_user:
        util.log("warning", "handle_home_feed", "Cognito token invalid or user deleted.")
        return error_response("Unauthorized. User may be deleted.", 401)
    
    # Extract username from Cognito response
    username = cognito_user.get("Username")
    if not username:
        return error_response("Unauthorized. Invalid Cognito user data.", 401)
        
    # 2. Verify user existence in RDS
    rds_result = rds.get_user_by_username(username)
    if not rds_result.get("success"):
        util.log("warning", "handle_home_feed", "User not found in RDS.", username=username)
        return error_response("User not found in database. Account may be deleted.", 401)
        
    user_data = rds_result.get("data")
    
    # TODO: Fetch live events, social graph, and personalized feed here
    
    return success_response({
        "success": True,
        "message": "Welcome to the HappniX home feed!",
        "profile": user_data,
        "feed": []
    })

def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        body = util.parse_body(event) if http_method != "GET" else {}
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)
            
        action_item = body.get("actionItem")
        path = event.get("path", "")
        
        # ── Handle GET paths (no actionItem in body) ──
        if http_method == "GET":
            if path.endswith("/feed"):
                return handle_home_feed(event)
            # Add future GET routes here (e.g. /live, /nearby)
            return error_response("GET endpoint not implemented.", 501)
            
        # ── Handle POST/PUT/DELETE paths via actionItem ──
        if action_item == "Logout" or path.endswith("/logout"):
            return handle_logout(event, body)
            
        # Add future POST actionItems here (e.g. BookTicket, UpdateTicket)
        # elif action_item == "BookTicket":
        #     return handle_book_ticket(event, body)
            
        return error_response(f"Action '{action_item}' not implemented.", 501)
        
    except Exception as exc:
        util.log("error", "home_page.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
