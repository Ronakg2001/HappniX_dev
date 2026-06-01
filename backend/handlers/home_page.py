"""
handlers/home_page.py — Home feed and discovery endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito

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

def lambda_handler(event, context):
    try:
        body = util.parse_body(event)
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)
            
        action_item = body.get("actionItem")
        path = event.get("path", "")
        
        if action_item == "Logout" or path.endswith("/logout"):
            return handle_logout(event, body)
            
        return error_response("Home page handler not implemented yet.", 501)
        
    except Exception as exc:
        util.log("error", "home_page.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
