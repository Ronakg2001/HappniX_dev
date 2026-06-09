"""
integration/cognito_auth.py — AWS Cognito helper functions for HappniX.

This module owns the boto3 Cognito client and all direct Cognito API calls.
Import this module in handlers instead of calling boto3 directly.

Available functions:
    user_exists(attribute_name, value)       → bool
    create_user(username, email, ...)        → cognito_sub | None
    authenticate_user(username, password)    → dict | None
    describe_pool()                          → dict | None
    global_sign_out(access_token)            → None
"""

import boto3
import json
import os

from utils import utilities as util
from utils import dependencies

_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "manifest.json")
try:
    with open(_MANIFEST_PATH, "r") as _f:
        _MANIFEST = json.load(_f)
except Exception as e:
    util.log("error", "cognito_auth.init", f"Failed to load manifest.json: {e}")
    _MANIFEST = {}


# ── Cognito client (single shared instance) ────────────────────────────────────
try:
    _client = boto3.client("cognito-idp")
    pool_config = _MANIFEST.get("cognito", {}).get("user_pool", {})
    env_pool_id = pool_config.get("env_var_id", "COGNITO_USER_POOL_ID")
    env_client_id = pool_config.get("env_var_client", "COGNITO_USER_POOL_CLIENT_ID")
    POOL_ID = os.environ.get(env_pool_id) or dependencies.enviroment_variable.get(env_pool_id, "")
    CLIENT_ID = os.environ.get(env_client_id) or dependencies.enviroment_variable.get(env_client_id, "")
except Exception:
    _client = None
    POOL_ID = ""
    CLIENT_ID = ""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COGNITO HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def user_exists(**kwargs) -> bool:
    """
    Check whether a Cognito user exists based on a key-value attribute.
    Expects exactly one kwarg, e.g. phone_number="+1234567890".
    """
    if not _client or not POOL_ID:
        return False
        
    if not kwargs:
        return False
        
    attribute_name, value = list(kwargs.items())[0]
    
    try:
        resp = _client.list_users(
            UserPoolId=POOL_ID,
            Filter=f'{attribute_name} = "{value}"',
            Limit=1,
        )
        return len(resp.get("Users", [])) > 0
    except Exception as exc:
        util.log("warning", "cognito_auth.user_exists",
                 f"Cognito lookup failed: {exc}", attribute_name=attribute_name, value=value)
        return False


def create_user(**kwargs):
    """
    Create a new Cognito user with a permanent password based on **kwargs.
    Uses manifest.json to map kwargs to Cognito UserAttributes.
    Requires 'username' and 'password' in kwargs.
    """
    if not _client or not POOL_ID:
        return None
        
    username = kwargs.get("username")
    password = kwargs.get("password")
    
    if not username or not password:
        util.log("error", "cognito_auth.create_user", "Missing username or password in kwargs")
        raise ValueError("Missing username or password")
        
    pool_config = _MANIFEST.get("cognito", {}).get("user_pool", {})
    attr_mapping = pool_config.get("create_user_attributes", {})
    
    user_attributes = []
    for cognito_attr, kwarg_key in attr_mapping.items():
        if kwarg_key in ["true", "false"]:
            user_attributes.append({"Name": cognito_attr, "Value": kwarg_key})
        elif kwarg_key in kwargs:
            user_attributes.append({"Name": cognito_attr, "Value": str(kwargs[kwarg_key])})

    try:
        resp = _client.admin_create_user(
            UserPoolId=POOL_ID,
            Username=username,
            UserAttributes=user_attributes,
            MessageAction="SUPPRESS",
        )
        attrs = {
            a["Name"]: a["Value"]
            for a in resp["User"]["Attributes"]
        }
        cognito_sub = attrs.get("sub")

        _client.admin_set_user_password(
            UserPoolId=POOL_ID,
            Username=username,
            Password=password,
            Permanent=True,
        )
        return cognito_sub

    except Exception as exc:
        util.log("error", "cognito_auth.create_user",
                 f"admin_create_user failed: {exc}", username=username)
        raise  # re-raise so the handler can catch the real error


def delete_user(**kwargs):
    """
    Deletes a Cognito user by username via kwargs.
    """
    if not _client or not POOL_ID:
        return
    username = kwargs.get("username")
    if username:
        _client.admin_delete_user(UserPoolId=POOL_ID, Username=username)


def global_sign_out(access_token):
    """
    Signs out users from all devices.
    Invalidates all access tokens and refresh tokens.
    """
    if not _client:
        return
    try:
        _client.global_sign_out(AccessToken=access_token)
    except Exception as exc:
        util.log("error", "cognito_auth.global_sign_out",
                 f"global_sign_out failed: {exc}")


def authenticate_user(**kwargs):
    """
    Authenticate a user with username + password via Cognito using kwargs.
    Expects 'username' and 'password' in kwargs.
    """
    if not _client or not POOL_ID or not CLIENT_ID:
        return None
        
    username = kwargs.get("username")
    password = kwargs.get("password")
    
    resp = _client.admin_initiate_auth(
        UserPoolId=POOL_ID,
        ClientId=CLIENT_ID,
        AuthFlow="ADMIN_NO_SRP_AUTH",
        AuthParameters={
            "USERNAME": username,
            "PASSWORD": password,
        },
    )
    result = resp.get("AuthenticationResult", {})
    return {
        "accessToken":  result.get("AccessToken"),
        "refreshToken": result.get("RefreshToken"),
        "idToken":      result.get("IdToken"),
        "expiresIn":    result.get("ExpiresIn", 3600),
    }


def describe_pool():
    """
    Fetch metadata about the configured Cognito User Pool.
    Used for connectivity checks in dev/QA environments.

    Returns:
        Pool description dict on success, None if unreachable.
    """
    if not _client or not POOL_ID:
        return None
    try:
        resp = _client.describe_user_pool(UserPoolId=POOL_ID)
        return resp.get("UserPool")
    except Exception as exc:
        util.log("warning", "cognito_auth.describe_pool",
                 f"Pool unreachable: {exc}")
        return None


def get_user(access_token):
    """
    Fetch user details from Cognito using an access token.
    This effectively verifies that the token is valid, unexpired,
    and that the user still exists and is not disabled in the user pool.

    Args:
        access_token: A valid active access token for the user.
        
    Returns:
        dict: User details on success.
        None: If the token is invalid, expired, or user is deleted/disabled.
    """
    if not _client:
        return None
    try:
        resp = _client.get_user(AccessToken=access_token)
        return resp
    except Exception as exc:
        util.log("error", "cognito_auth.get_user",
                 f"get_user failed or token invalid: {exc}")
        return None

