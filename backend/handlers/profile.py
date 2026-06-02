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
    Currently a placeholder. Strict authentication is now handled by the Home Page API.
    """
    return success_response({
        "success": True,
        "message": "Profile fetching logic will be implemented here."
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
