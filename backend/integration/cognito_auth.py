"""
integration/cognito_auth.py — AWS Cognito helper functions for HappniX.

This module owns the boto3 Cognito client and all direct Cognito API calls.
Import this module in handlers instead of calling boto3 directly.

Available functions:
    user_exists_by_phone(phone_e164)         → bool
    create_user(username, email, ...)        → cognito_sub | None
    authenticate_user(username, password)    → dict | None
    describe_pool()                          → dict | None
"""

import boto3

from backend.utils import utilities as util
from backend.utils import dependencies


# ── Cognito client (single shared instance) ────────────────────────────────────
try:
    _client = boto3.client("cognito-idp")
    POOL_ID = dependencies.enviroment_variable.get("COGNITO_USER_POOL_ID", "")
    CLIENT_ID = dependencies.enviroment_variable.get("COGNITO_USER_POOL_CLIENT_ID", "")
except Exception:
    _client = None
    POOL_ID = ""
    CLIENT_ID = ""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COGNITO HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def user_exists_by_phone(phone_e164):
    """
    Check whether a Cognito user with the given phone_number attribute exists.

    Args:
        phone_e164: Phone number in E.164 format, e.g. '+919876543210'.

    Returns:
        True if a matching user exists, False otherwise.
    """
    if not _client or not POOL_ID:
        return False
    try:
        resp = _client.list_users(
            UserPoolId=POOL_ID,
            Filter=f'phone_number = "{phone_e164}"',
            Limit=1,
        )
        return len(resp.get("Users", [])) > 0
    except Exception as exc:
        util.log("warning", "cognito_auth.user_exists_by_phone",
                 f"Cognito lookup failed: {exc}", phone=phone_e164)
        return False


def create_user(username, email, phone_e164, full_name, dob, gender, password):
    """
    Create a new Cognito user with a permanent password.

    Args:
        username:   Cognito username (also the preferred_username attribute).
        email:      User's email address.
        phone_e164: Phone number in E.164 format, e.g. '+919876543210'.
        full_name:  User's full display name.
        dob:        Date of birth string in YYYY-MM-DD format.
        gender:     Gender string (e.g. 'Male', 'Female', 'Other').
        password:   Plain-text password — Cognito hashes it internally.

    Returns:
        cognito_sub (str) on success, None on failure.
    """
    if not _client or not POOL_ID:
        return None
    try:
        resp = _client.admin_create_user(
            UserPoolId=POOL_ID,
            Username=username,
            UserAttributes=[
                {"Name": "email",                 "Value": email},
                {"Name": "phone_number",          "Value": phone_e164},
                {"Name": "name",                  "Value": full_name},
                {"Name": "custom:dateOfBirth",    "Value": dob},
                {"Name": "custom:gender",         "Value": gender},
                {"Name": "email_verified",        "Value": "true"},
                {"Name": "phone_number_verified", "Value": "true"},
            ],
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
        return None


def authenticate_user(username, password):
    """
    Authenticate a user with username + password via Cognito.

    Args:
        username: Cognito username or email.
        password: Plain-text password.

    Returns:
        dict with keys: accessToken, refreshToken, idToken, expiresIn
        None if authentication failed (wrong credentials, user not found, etc.)

    Raises:
        CognitoNotAuthorized: if credentials are wrong (caller should handle 401)
        CognitoUserNotFound:  if the user does not exist (caller should handle 404)
    """
    if not _client or not POOL_ID or not CLIENT_ID:
        return None
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
