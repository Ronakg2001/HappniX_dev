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
from integration import dynamo_db
from integration import r2_bucket


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
    rds_result = rds.execute_raw_sql("DELETE FROM users;")
    if not rds_result.get("success"):
        util.log("error", "dev_only.wipe_all_users", f"RDS wipe failed: {rds_result.get('error')}")
        return error_response("Failed to wipe RDS users. Check logs.", 500)

    return success_response({
        "success": True,
        "message": f"Successfully wiped {cognito_deleted} user(s) from Cognito and cleared RDS user tables."
    })


def wipe_dev_rds_users(**kwargs):
    """Wipe only the RDS users (leaves Cognito intact)."""
    rds_result = rds.execute_raw_sql("DELETE FROM users;")
    if not rds_result.get("success"):
        util.log("error", "dev_only.wipe_dev_rds_users", f"RDS wipe failed: {rds_result.get('error')}")
        return error_response("Failed to wipe RDS users. Check logs.", 500)
    
    return success_response({
        "success": True,
        "message": "Successfully cleared RDS user tables."
    })


def get_dev_all_users(**kwargs):
    """Retrieve all users from RDS."""
    import psycopg2.extras
    conn = rds.get_connection()
    if not conn:
        return error_response("Database connection failed.", 500)
        
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM users;")
            rows = cur.fetchall()
            data = [{k: str(v) if v is not None else None for k, v in row.items()} for row in rows]
            
        return success_response({
            "success": True,
            "users": data
        })
    except Exception as exc:
        return error_response(f"Failed to fetch users: {exc}", 500)
    finally:
        conn.close()


def get_dev_rds_user(**kwargs):
    """Retrieve a selective user from RDS by username."""
    username = str(kwargs.get("username", "")).strip()
    if not username:
        return error_response("Username is required.", 400)
    
    result = rds.get_record("users", userName=username)
    if not result.get("success"):
        return error_response(f"Failed to fetch user: {result.get('error')}", 404)
    
    return success_response({
        "success": True,
        "user": result.get("data")
    })

def delete_account(**kwargs):
    """Delete a specific user permanently and instantly across all systems."""
    username = str(kwargs.get("username", "")).strip()
    if not username:
        return error_response("Username is required.", 400)
        
    # 1. Delete from Cognito
    cognito.delete_user(username=username)
    
    # Fetch user_id before deleting from RDS
    user_id = None
    rds_user = rds.get_record("users", userName=username)
    if rds_user.get("success") and rds_user.get("data"):
        user_id = rds_user["data"].get("userID")
    
    # 2. Delete from RDS
    rds_result = rds.delete_record("users", userName=username)
    if not rds_result.get("success"):
        util.log("error", "dev_only.delete_account", f"Failed to delete RDS user: {rds_result.get('error')}")
        
    if user_id:
        # 3. Delete from DynamoDB instantly
        dynamo_result = dynamo_db.query_items_by_pk("users", user_id)
        if dynamo_result.get("success"):
            for item in dynamo_result.get("data", []):
                entity = item.get("userEntity")
                if entity:
                    dynamo_db.delete_item("users", user_id, entity)
                    
        # 4. Delete from R2 instantly
        r2_bucket.delete_folder_contents(f"public/{user_id}/")
        r2_bucket.delete_folder_contents(f"private/{user_id}/")
        
    return success_response({
        "success": True,
        "message": f"Successfully deleted user '{username}' permanently from all systems."
    })


def test_db_connection(**kwargs):
    """Debug action to test RDS connection and return the exact error/host string."""
    import os
    import sys
    from utils import dependencies
    import psycopg2

    raw_host_env = os.environ.get("AUTH_DB_HOST")
    raw_host_dep = dependencies.enviroment_variable.get("DATA_DB_HOST")
    
    host = (raw_host_env or raw_host_dep or "").strip()
    port = (os.environ.get("AUTH_DB_PORT") or dependencies.enviroment_variable.get("DATA_DB_PORT", "5432")).strip()
    
    debug_info = {
        "raw_host_env": repr(raw_host_env),
        "raw_host_dep": repr(raw_host_dep),
        "final_host": repr(host),
        "port": port,
        "python_version": sys.version,
    }

    if not host:
        return error_response(f"Host is empty! {debug_info}", 500)

    try:
        conn = psycopg2.connect(
            host=host,
            dbname=(dependencies.enviroment_variable.get("AUTH_DB_NAME") or os.environ.get("AUTH_DB_NAME", "")).strip(),
            user=(dependencies.enviroment_variable.get("AUTH_DB_USER") or os.environ.get("AUTH_DB_USER", "")).strip(),
            password=(dependencies.enviroment_variable.get("AUTH_DB_PASSWORD") or os.environ.get("AUTH_DB_PASSWORD", "")).strip(),
            port=port,
            connect_timeout=5
        )
        conn.close()
        return success_response({"success": True, "message": "Connection successful!", "debug": debug_info})
    except Exception as exc:
        debug_info["exception"] = str(exc)
        debug_info["exception_type"] = exc.__class__.__name__
        return error_response(f"Connection failed: {debug_info}", 500)



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
    "TestDBConnection":  test_db_connection,
    "DeleteAccount":     delete_account,
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
