"""
services/preauth_session_service.py — Service layer for managing preauth OTP sessions.
"""

from utils import sessions
from utils.Response import success_response


def get_or_create_session(token):
    """
    Return (token, session_dict).
    Creates a fresh empty session if the token is absent or not found.
    """
    result = sessions.ensure_session(token)
    if not result["success"]:
        return None, {}
    return result["data"]["token"], result["data"]["session"]


def get_session(token):
    """
    Return (token, session_dict).
    Returns (token, None) if the session does not exist.
    """
    result = sessions.get_session(token)
    if not result["success"]:
        return token, None
    return result["data"]["token"], result["data"]["session"]


def save_session(token, session_dict):
    """Persist the updated session dict back to the store."""
    result = sessions.replace_session(token, session_dict)
    if not result.get("success"):
        from utils import utilities as util
        util.log("warning", "preauth_session_service.save_session",
                 f"Session save failed: {result.get('error', 'unknown')}", token=token[:8])
    return result


def delete_session(token):
    """Remove the preauth session — called when signup is complete."""
    sessions.delete_session(token)


def preauth_response(status, body, token):
    """
    Wrap a response body with the preauth token so the frontend
    can read and store it from the JSON payload.
    """
    body["preAuthToken"] = token
    return success_response(body, status)
