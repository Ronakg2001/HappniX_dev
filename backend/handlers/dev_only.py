"""
handlers/dev_only.py — Dev/QA only endpoints for HappniX.

These actions are blocked in production (app_env == 'prod').
Use them to inspect backend config, test Cognito connectivity, and
verify auth flow settings without touching the main signup flow.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds


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


def wipe_all_users(**kwargs):
    """
    Wipe all users from Cognito and RDS. DEV/QA only.
    """
    # 1. Wipe Cognito Users
    cognito_deleted = 0
    if cognito._client and cognito.POOL_ID:
        try:
            paginator = cognito._client.get_paginator('list_users')
            for page in paginator.paginate(UserPoolId=cognito.POOL_ID):
                for user in page.get('Users', []):
                    cognito._client.admin_delete_user(
                        UserPoolId=cognito.POOL_ID,
                        Username=user['Username']
                    )
                    cognito_deleted += 1
        except Exception as exc:
            util.log("error", "dev_only.wipe_all_users", f"Cognito wipe failed: {exc}")
            return error_response("Failed to wipe Cognito users. Check logs.", 500)
    
    # 2. Wipe RDS Users
    rds_result = rds.execute_raw_sql("DELETE FROM user_devices; DELETE FROM users;")
    if not rds_result.get("success"):
        util.log("error", "dev_only.wipe_all_users", f"RDS wipe failed: {rds_result.get('error')}")
        return error_response("Failed to wipe RDS users. Check logs.", 500)

    return success_response({
        "success": True,
        "message": f"Successfully wiped {cognito_deleted} user(s) from Cognito and cleared RDS user tables."
    })


def wipe_dev_rds_users(**kwargs):
    """Wipe only the RDS users (leaves Cognito intact)."""
    rds_result = rds.execute_raw_sql("DELETE FROM user_devices; DELETE FROM users;")
    if not rds_result.get("success"):
        util.log("error", "dev_only.wipe_dev_rds_users", f"RDS wipe failed: {rds_result.get('error')}")
        return error_response("Failed to wipe RDS users. Check logs.", 500)
    
    return success_response({
        "success": True,
        "message": "Successfully cleared RDS user tables."
    })


def get_dev_all_users(**kwargs):
    """Retrieve all users from RDS."""
    result = rds.get_all_users()
    if not result.get("success"):
        return error_response(f"Failed to fetch users: {result.get('error')}", 500)
    
    return success_response({
        "success": True,
        "users": result.get("data", [])
    })


def get_dev_rds_user(**kwargs):
    """Retrieve a selective user from RDS by username."""
    username = str(kwargs.get("username", "")).strip()
    if not username:
        return error_response("Username is required.", 400)
    
    result = rds.get_user_by_username(username)
    if not result.get("success"):
        return error_response(f"Failed to fetch user: {result.get('error')}", 404)
    
    return success_response({
        "success": True,
        "user": result.get("data")
    })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION REGISTRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION_HANDLERS = {
    "GetAuthConfig":     get_auth_config,
    "TestCognitoLogin":  test_cognito_login,
    "WipeAllUsers":      wipe_all_users,
    "WipeDevRDSUsers":   wipe_dev_rds_users,
    "GetDevAllUsers":    get_dev_all_users,
    "GetDevRDSUser":     get_dev_rds_user,
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
