"""
handlers/dev_only.py — Dev/QA only endpoints for HappniX.

These actions are blocked in production (app_env == 'prod').
Use them to inspect backend config, test Cognito connectivity, and
verify auth flow settings without touching the main signup flow.
"""

from backend.utils.Response import success_response, error_response
from backend.utils import utilities as util
from backend.integration import cognito_auth as cognito


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION HANDLERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_auth_config(**kwargs):
    """
    Report the current auth-related environment configuration.

    Returns:
        - Whether TEST_OTP_MODE is enabled (123456 accepted as universal OTP)
        - Whether Cognito pool ID and client ID are configured
        - Current app environment
    """
    test_otp_enabled = util.is_test_otp_mode()
    pool_configured = bool(cognito.POOL_ID)
    client_configured = bool(cognito.CLIENT_ID)
    cognito_reachable = False

    pool = cognito.describe_pool()
    cognito_reachable = pool is not None

    return success_response({
        "success": True,
        "environment": util.app_env(),
        "testOtpMode": {
            "enabled": test_otp_enabled,
            "universalOtp": "123456" if test_otp_enabled else None,
            "note": (
                "OTP 123456 is accepted for any mobile in dev/qa."
                if test_otp_enabled
                else "TEST_OTP_MODE is off — real OTP required."
            ),
        },
        "cognito": {
            "poolConfigured": bool(cognito.POOL_ID),
            "clientConfigured": bool(cognito.CLIENT_ID),
            "poolReachable": cognito_reachable,
            "poolId": cognito.POOL_ID if cognito.POOL_ID else None,
        },
        "note": (
            "Cognito gives an access token only via username + password "
            "(admin_initiate_auth). OTP verification alone does NOT produce "
            "a Cognito access token — it only confirms phone ownership."
        ),
    })


def test_cognito_login(**kwargs):
    """
    Test whether Cognito can authenticate a user with username + password.

    Frontend sends:
        { "actionItem": "TestCognitoLogin",
          "username": "testuser",
          "password": "Secret@123" }

    Returns the Cognito access token on success so you can confirm
    that the auth chain (OTP verify → register → login) is working end-to-end.

    Only available in dev/qa.
    """
    username = str(kwargs.get("username", "")).strip()
    password = str(kwargs.get("password", "")).strip()

    if not username or not password:
        return error_response("username and password are required.", 400)

    if not cognito.POOL_ID or not cognito.CLIENT_ID:
        return error_response("Cognito is not configured.", 503)

    try:
        result = cognito.authenticate_user(username, password)

        return success_response({
            "success": True,
            "message": "Cognito authentication successful.",
            "accessToken": result["accessToken"],
            "expiresIn": result["expiresIn"],
            "tokenType": "Bearer",
            "note": (
                "This confirms Cognito is working correctly. "
                "The access token above is a real Cognito JWT — "
                "it was obtained via username + password, not via OTP."
            ),
        })

    except Exception as exc:
        if hasattr(exc, '__class__'):
            name = exc.__class__.__name__
            if name == "NotAuthorizedException":
                return error_response("Invalid username or password.", 401)
            if name == "UserNotFoundException":
                return error_response("User not found in Cognito.", 404)
        util.log("error", "test_cognito_login",
                 f"Cognito auth failed: {exc}", username=username)
        return error_response(f"Cognito error: {exc}", 500)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION REGISTRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION_HANDLERS = {
    "GetAuthConfig":     get_auth_config,
    "TestCognitoLogin":  test_cognito_login,
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAMBDA HANDLER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def lambda_handler(event, context):
    # Hard block in production
    if util.app_env() == "prod":
        return error_response("Not found.", 404)

    try:
        body = util.parse_body(event)
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)

        action_item = body.get("actionItem")
        if not action_item:
            return error_response("Missing 'actionItem' in request body.", 400)

        handler = ACTION_HANDLERS.get(action_item)
        if not handler:
            return error_response(f"Unknown dev action: {action_item}.", 400)

        payload = {k: v for k, v in body.items() if k != "actionItem"}
        return handler(**payload)

    except Exception as exc:
        util.log("error", "dev_only.lambda_handler",
                 f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
