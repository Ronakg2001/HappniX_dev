"""
SignupSignin.py — Auth Lambda for HappniX.
"""

import os
import uuid
from datetime import datetime, timezone
import boto3

from utilities import sessions   # pre-auth token storage (OTP/signup flow)
from utilities import util          # success, error, log, validators, formatters
from utilities import cognito_auth
from utilities import jwt_sessions  # refresh-token session storage
from utilities import rds             # get_user_by_sub, upsert_user, ...
from utilities import dynamo       # put_item, get_item, query_items, ...
from utilities.r2_helper import upload_profile_picture, init_user_folder_structure

# ── Cognito client ─────────────────────────────────────────────────────────────
try:
    COGNITO = boto3.client("cognito-idp")
except Exception:
    COGNITO = None

USERS_TABLE = os.environ.get("USERS_TABLE_NAME", "")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PRE-AUTH HELPERS  (OTP / signup flow — before login)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_or_create_preauth(event):
    """
    Return (token, session_dict) for the pre-auth session.
    Reads token from X-HappniX-PreAuth header; creates a new empty session
    if the header is absent or the token is not found in DynamoDB.
    """
    incoming = util.extract_preauth_token(event)
    result = sessions.ensure_session(incoming)
    if not result["success"]:
        return None, {}
    return result["data"]["token"], result["data"]["session"]


def get_preauth_session(event):
    """
    Return (token, session_dict) for an existing pre-auth session.
    Returns (token, None) if the session does not exist (token expired or absent).
    """
    token = util.extract_preauth_token(event)
    result = sessions.get_session(token)
    if not result["success"] or not result["data"]["session"]:
        return token, None
    return token, result["data"]["session"]


def save_preauth(token, session):
    sessions.replace_session(token, session)


def preauth_response(status, body, token):
    """
    Build a JSON response that includes the preAuthToken in the body.
    The frontend reads it and sends it back in the X-HappniX-PreAuth header
    on the next signup-flow request.
    """
    if token:
        body["preAuthToken"] = token
    return util.success_response(body, status)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT HELPERS  — delegate to util to avoid duplication across all Lambdas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def fetch_user_profile(sub):
    """Fetch the full user profile (RDS + DynamoDB merge) using a validated sub."""
    if not sub:
        return None
    r_res = rds.get_user_by_sub(sub)
    if not r_res.get("success") or not r_res.get("data"):
        return None
    user = r_res["data"]
    if USERS_TABLE:
        d_res = dynamo.get_item(USERS_TABLE, {"userID": user["userID"]})
        if d_res.get("success") and d_res.get("data"):
            user.update(d_res["data"])
    return user


def device_info(event) -> str:
    """Extract a human-readable device label from User-Agent for session tracking."""
    headers = event.get("headers") or {}
    ua = headers.get("User-Agent") or headers.get("user-agent") or ""
    if "iPhone" in ua or "iPad" in ua:
        return "iOS Safari" if "Safari" in ua else "iOS App"
    if "Android" in ua:
        return "Android"
    if "Chrome" in ua:
        return "Chrome"
    if "Safari" in ua:
        return "Safari"
    if "Firefox" in ua:
        return "Firefox"
    return ua[:80] if ua else "Unknown"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION HANDLERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def send_mobile_otp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.error_responseor_response(
            "Please enter a valid 10-digit mobile number."
        )

    token, session = get_or_create_preauth(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    save_preauth(token, session)

    body = {
        "success": True,
        "message": f"OTP sent successfully to {mobile}."
    }
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return preauth_response(200, body, token)


def resend_mobile_otp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.error_response(
            "Please enter a valid 10-digit mobile number."
        )

    token, session = get_or_create_preauth(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    save_preauth(token, session)

    body = {
        "success": True,
        "message": f"OTP resent to {mobile}."
    }
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return preauth_response(200, body, token)


def verify_mobile_otp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    otp = str(payload.get("otp", "")).strip()
    if not mobile or not otp:
        return util.error_response("Mobile and OTP are required.")

    token, session = get_or_create_preauth(event)
    saved_otp = session.get("mobile_otp_map", {}).get(mobile)

    fixed_otp_allowed = (
        util.is_test_otp_mode()
        and util.env("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and util.app_env() != "prod"
    )
    using_fixed = fixed_otp_allowed and otp == "123456"

    # Check: no saved OTP AND not using the dev bypass → session expired
    if not saved_otp and not using_fixed:
        return preauth_response(400, {
            "success": False,
            "message": "OTP session expired. Please request a new OTP.",
        }, token)

    # Check: OTP mismatch (fixed OTP bypass takes priority)
    if saved_otp and saved_otp != otp and not using_fixed:
        return preauth_response(
            400,
            {"success": False,
             "message": "Invalid OTP."},
            token
        )

    formatted = util.format_phone_in(mobile)
    user_result = rds.get_user_by_mobile(formatted)
    user = user_result["data"] if user_result["success"] else None

    # Clear the used OTP from the session
    session.get("mobile_otp_map", {}).pop(mobile, None)

    if session.get("warning_verification_required"):
        save_preauth(token, session)
        return preauth_response(
            200,
            {"success": True,
             "message": "Verification required before linking this device.",
             "loginStatus": "warning_verification_required",
             "redirectUrl": "/auth/warning-verification/"},
            token
        )

    if user:
        # Existing user — they must log in with username/password to get a JWT.
        # Do NOT issue a JWT here; drop the pre-auth session (no longer needed).
        sessions.delete_session(token)
        return util.success_response({
            "success": True,
            "message": f"Welcome back, {user.get('userName', 'User')}! \
                Please sign in with your password.",
            "userStatus": "existing",
            "redirectUrl": "/login.html",
        })

    # New user — carry the pre-auth token into the signup flow.
    session["pending_signup_mobile"] = mobile
    save_preauth(token, session)
    return preauth_response(
        200,
        {"success": True,
         "message": "Mobile OTP verified. Continue to sign up.",
         "userStatus": "new",
         "redirectUrl": "/signup_details.html"},
        token
    )


def login_with_password(event, payload):
    """
    Authenticate with username/email + password.

    On success, returns Cognito JWT tokens:
      accessToken  — short-lived (~1 hour). Used as Authorization: Bearer for all API calls.
      refreshToken — long-lived (30 days). Stored in jwt_sessions table. Send to RefreshToken.
      idToken      — user identity claims. Frontend only; not sent to backend APIs.
      sessionId    — server-side session ID. Send alongside refreshToken for RefreshToken/Logout.
      expiresIn    — accessToken lifetime in seconds.
    """
    identifier = str(payload.get(
        "identifier", payload.get("username", ""))).strip()
    password = str(payload.get("password", "")).strip()
    if not identifier or not password:
        return util.error_response("Username/email and password are required.")

    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    client_id = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")

    access_token = None
    refreshToken = None
    id_token = None
    expires_in = 3600
    cognito_sub = None
    full_name = "User"

    if COGNITO and pool_id and client_id:
        try:
            auth_resp = COGNITO.admin_initiate_auth(
                UserPoolId=pool_id,
                ClientId=client_id,
                AuthFlow="ADMIN_NO_SRP_AUTH",
                AuthParameters={"USERNAME": identifier, "PASSWORD": password},
            )
            result = auth_resp.get("AuthenticationResult", {})
            access_token = result.get("AccessToken")
            refreshToken = result.get("RefreshToken")
            id_token = result.get("IdToken")
            expires_in = result.get("ExpiresIn", 3600)

            # Fetch user attributes for the response
            info = COGNITO.admin_get_user(
                UserPoolId=pool_id, Username=identifier)
            attrs = {a["Name"]: a["Value"] for a in info["UserAttributes"]}
            cognito_sub = attrs.get("sub")
            full_name = attrs.get("name", identifier)

        except (COGNITO.exceptions.NotAuthorizedException,
                COGNITO.exceptions.UserNotFoundException):
            return util.error_response("Invalid username/email or password.", 401)
        except Exception as exc:
            return util.error_response(f"Login failed: {exc}", 500)
    else:
        # Cognito not configured — dev-only fallback via RDS lookup
        result = rds.get_user_by_identifier(identifier)
        user = result["data"] if result["success"] else None
        if not user:
            return util.error_response("Invalid username/email or password.", 401)
        cognito_sub = user["cognitoSub"]
        full_name = user.get("userName", "User")
        access_token = f"mock-jwt-{cognito_sub}"
        refreshToken = f"mock-refresh-{cognito_sub}"
        id_token = "mock-id-token"

    # Persist the refresh token in the JWT sessions table
    session_id = None
    if refreshToken and cognito_sub:
        device = device_info(event)
        sess_result = jwt_sessions.create_session(
            cognito_sub, refreshToken, device)
        if sess_result["success"] and sess_result["data"]:
            session_id = sess_result["data"].get("sessionId")

    # Look up canCreateOrJoinParties
    can_create = False
    lookup = rds.get_user_by_identifier(identifier)
    if lookup["success"] and lookup["data"]:
        can_create = util.can_create_or_join_parties(lookup["data"])

    return util.success_response({
        "success":      True,
        "message":      f"Signed in successfully. Welcome, {full_name}.",
        "accessToken":  access_token,
        "refreshToken": refreshToken,
        "idToken":      id_token,
        "sessionId":    session_id,
        "expiresIn":    expires_in,
        "tokenType":    "Bearer",
        "userStatus":   "existing",
        "canCreateOrJoinParties": can_create,
        "redirectUrl":  "/home_page.html",
    })


def refresh_token(event, payload):
    """
    Exchange a refresh token for a new access token.

    Frontend sends:
      { "refreshToken": "<token>", "sessionId": "<id>" }
    Returns:
      { "accessToken": "...", "expiresIn": 3600 }
    """
    refreshToken = str(payload.get("refreshToken", "")).strip()
    session_id = str(payload.get("sessionId", "")).strip()

    if not refreshToken:
        return util.error_response("refreshToken is required.", 400)

    # Verify with Cognito
    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    client_id = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")

    if not COGNITO or not pool_id or not client_id:
        return util.error_response("Token refresh not available in this environment.", 503)

    try:
        auth_resp = COGNITO.admin_initiate_auth(
            UserPoolId=pool_id,
            ClientId=client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={"REFRESH_TOKEN": refreshToken},
        )
        result = auth_resp.get("AuthenticationResult", {})
        new_access = result.get("AccessToken")
        expires_in = result.get("ExpiresIn", 3600)
        new_id = result.get("IdToken")
    except (COGNITO.exceptions.NotAuthorizedException,):
        return util.error_response("Refresh token is invalid or expired. Please log in again.", 401)
    except Exception as exc:
        return util.error_response(f"Token refresh failed: {exc}", 500)

    # Enforce 7-day inactivity window and update lastUsedAt
    if session_id:
        sub, _ = util.verifyCOGNITO_token(new_access)
        if sub:
            session_resp = jwt_sessions.get_session(sub, session_id)
            if not session_resp["success"] or not session_resp["data"]:
                # If session isn't in DynamoDB, it was revoked or expired
                return util.error_response("Session is invalid or expired. \
                                           Please log in again.", 401)

            session_data = session_resp["data"]
            last_used_str = session_data.get("lastUsedAt")
            if last_used_str:
                try:
                    # Parse ISO 8601 string
                    last_used = datetime.fromisoformat(
                        last_used_str.replace("Z", "+00:00"))
                    days_inactive = (datetime.now(
                        timezone.utc) - last_used).days
                    if days_inactive >= 7:
                        jwt_sessions.delete_session(sub, session_id)
                        return util.error_response("Session expired due to inactivity. \
                                                   Please log in again.", 401)
                except Exception as e:
                    util.log(f"Error parsing lastUsedAt: {e}")

            jwt_sessions.refresh_session(sub, session_id)

    return util.success_response({
        "success":     True,
        "accessToken": new_access,
        "idToken":     new_id,
        "expiresIn":   expires_in,
        "tokenType":   "Bearer",
    })


def forgot_password_request(event, payload):
    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return util.error_response("Please enter your email address.")
    if not util.is_valid_email(email):
        return util.error_response("Please enter a valid email address.")
    result = rds.get_user_by_identifier(email)
    exists = result["success"] and result["data"] is not None
    msg = (
        "Verification email request accepted. Please check your inbox."
        if exists
        else "If this email is registered, verification instructions will be sent."
    )
    return util.success_response({"success": True, "message": msg})


def check_username(event, payload):
    """
    Check if a username is available before the user submits the signup form.
    Frontend calls this when the user types/leaves the username field.
    """
    username = str(payload.get("username", "")).strip()
    if not username:
        return util.error_response("Please enter a username.")
    if len(username) < 3:
        return util.error_response("Username must be at least 3 characters.")
    if len(username) > 30:
        return util.error_response("Username must be 30 characters or less.")
    if not username.replace("_", "").replace(".", "").isalnum():
        return util.error_response("Username can only contain letters, \
                                   numbers, underscores, and dots.")

    result = rds.get_user_by_identifier(username)
    if not result["success"]:
        return util.error_response("Could not check username availability. Try again.", 500)
    if result["data"]:
        return util.success_response({"available": False,
                                      "message": "Username already taken. \
                                          Please choose another one."})
    return util.success_response({"available": True,
                                  "message": "Username is available!"})


def register_user_details(event, payload):
    token, session = get_preauth_session(event)
    if not session:
        return util.error_response("Signup session expired. \
                                   Please verify your mobile number again.", 401)

    pending_mobile = session.get("pending_signup_mobile")
    if not pending_mobile:
        return preauth_response(401, {
            "success": False,
            "message": "Signup session expired. Verify mobile OTP again.",
        }, token)

    full_name = str(payload.get("fullName", "")).strip()
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()
    sex = str(payload.get("sex", "")).strip().lower()
    dob = str(payload.get("dateOfBirth", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    gov_id = str(payload.get("govId", "")).strip()

    if not all([full_name, username, password, sex, dob, email]):
        return preauth_response(
            400,
            {"success": False,
             "message": "All mandatory fields are required."},
            token
        )

    if len(full_name) < 3:
        return preauth_response(
            400,
            {"success": False,
             "message": "Please enter a valid full name."},
            token
        )

    if sex not in {"mr.", "miss.", "mrs.", "other"}:
        return preauth_response(
            400,
            {"success": False,
             "message": "Select a valid sex option."},
            token
        )

    if not util.is_valid_date(dob):
        return preauth_response(
            400,
            {"success": False,
             "message": "Enter a valid date of birth (YYYY-MM-DD)."},
            token
        )

    if not util.is_valid_email(email):
        return preauth_response(
            400,
            {"success": False,
             "message": "Enter a valid email address."},
            token
        )

    if not util.is_strong_password(password):
        return preauth_response(
            400,
            {"success": False,
             "message": "Password must include uppercase, lowercase, number, \
                 special character, and minimum 8 characters."},
            token
        )

    if rds.get_user_by_identifier(username)["data"]:
        return preauth_response(
            400,
            {"success": False,
             "message": "Username already exists. \
                 Please choose another one."},
            token
        )

    if rds.get_user_by_identifier(email)["data"]:
        return preauth_response(
            400,
            {"success": False,
             "message": "Email already registered. \
                 Please use another email."},
            token
        )

    formatted_mobile = util.format_phone_in(pending_mobile)
    if rds.get_user_by_mobile(formatted_mobile)["data"]:
        return preauth_response(
            400,
            {"success": False,
             "message": "Mobile number already registered."},
            token
        )

    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    cognito_sub = None

    if COGNITO and pool_id:
        try:
            resp = COGNITO.admin_create_user(
                UserPoolId=pool_id, Username=username,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "phone_number", "Value": formatted_mobile},
                    {"Name": "preferred_username", "Value": username},
                    {"Name": "name", "Value": full_name},
                    {"Name": "custom:dateOfBirth", "Value": dob},
                    {"Name": "custom:userType", "Value": "General"},
                    {"Name": "email_verified", "Value": "true"},
                    {"Name": "phone_number_verified", "Value": "true"},
                ],
                MessageAction="SUPPRESS",
            )
            attrs = {a["Name"]: a["Value"] for a in resp["User"]["Attributes"]}
            cognito_sub = attrs.get("sub")
            COGNITO.admin_set_user_password(
                UserPoolId=pool_id, Username=username,
                Password=password, Permanent=True,
            )
        except Exception as exc:
            return preauth_response(
                500,
                {"success": False,
                 "message": f"Cognito registration failed: {exc}"},
                token
            )

    if not cognito_sub:
        cognito_sub = f"mock-{uuid.uuid4().hex[:12]}"

    user_id = util.new_user_id()

    rds_result = rds.upsert_user({
        "userID": user_id,
        "cognitoSub": cognito_sub,
        "userName": username,
        "emailAddress": email,
        "userType": "General",
        "phoneNumber": formatted_mobile,
        "emailVerified": True,
        "isActive": True,
        "dateOfBirth": dob,
    })

    if not rds_result["success"]:
        return preauth_response(
            500,
            {"success": False,
             "message": f"Failed to save user: {rds_result['error']}"},
            token
        )

    if USERS_TABLE:
        dynamo_result = dynamo.put_item(USERS_TABLE, {
            "userID":    user_id,
            "userName":  username,
            "cognitoSub": cognito_sub,
            "createdAt": util.now_iso(),
            "updatedAt": util.now_iso(),
            "personalDetails": {
                "fullName": full_name,
                "email": email,
                "phoneNumber": formatted_mobile,
                "address": "",
                "aadharNumber": gov_id,
            },
        })
        if not dynamo_result["success"]:
            util.log(
                "error",
                "RegisterUserDetails",
                "DynamoDB put_item failed — user not written to userInfoTable",
                userID=user_id,
                table=USERS_TABLE,
                error=dynamo_result["error"]
            )
        else:
            util.log(
                "info",
                "RegisterUserDetails",
                "DynamoDB write OK",
                userID=user_id,
                table=USERS_TABLE
            )
    else:
        util.log(
            "warning",
            "RegisterUserDetails",
            "USERS_TABLE_NAME env var is empty — DynamoDB write skipped"
        )

    # Keep the pre-auth token alive briefly for CompleteProfileSetup.
    session.pop("pending_signup_mobile", None)
    session["pending_profile_setup"] = True
    session["authenticated_user_id"] = cognito_sub
    save_preauth(token, session)

    return preauth_response(
        200,
        {"success":  True,
         "message":  "Details saved successfully. \
            You can add profile details next.",
         "canCreateOrJoinParties": False,
         "redirectUrl": "/signup_profile_optional.html"},
        token
    )


def complete_profile_setup(event, payload):
    token, session = get_preauth_session(event)
    if not session:
        return util.error_response(
            "Profile setup session not found. Please sign in.",
            401
        )

    cognito_sub = session.get("authenticated_user_id")
    if not cognito_sub:
        return util.error_response("Please sign in first.", 401)
    if not session.get("pending_profile_setup"):
        return preauth_response(
            400,
            {"success": False,
             "message": "Profile setup session not found."},
            token
        )

    user_result = rds.get_user_by_sub(cognito_sub)
    user = user_result["data"] if user_result["success"] else None
    if not user:
        return util.error_response("User not found.", 404)

    if not payload.get("skip", False):
        bio = str(payload.get("bio", "")).strip()
        pic_input = str(payload.get("profilePictureUrl", "")).strip()

        if pic_input.startswith("data:image/"):
            pic_url = upload_profile_picture(
                user["userID"],
                user["userName"],
                pic_input
            )
            pic_input = pic_url if pic_url else ""

        if USERS_TABLE:
            dynamo_updates = {"updatedAt": util.now_iso()}
            if bio:
                dynamo_updates["bio"] = bio
            if pic_input:
                dynamo_updates["profilePictureUrl"] = pic_input
            if dynamo_updates:
                dynamo.update_item(
                    USERS_TABLE,
                    {"userID": user["userID"]},
                    dynamo_updates
                )

        user["bio"] = bio
        if pic_input:
            user["profilePictureUrl"] = pic_input

    # Pre-auth session is no longer needed — delete it.
    sessions.delete_session(token)

    try:
        init_user_folder_structure(user["userID"], user["userName"])
    except Exception as _r2_err:
        print(f"WARN: R2 folder init failed: {_r2_err}")

    return util.success_response({
        "success":    True,
        "message":    "Profile setup completed. Please sign in to continue.",
        "redirectUrl": "/login.html",
    })


def send_aadhaar_otp(event, payload):
    sub = event.get("auth_sub")
    user = fetch_user_profile(sub)
    if not user:
        return util.error_response("Please sign in first.", 401)
    aadhaar = str(payload.get("aadhaarNumber", "")).strip()
    if aadhaar:
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return util.error_response(
                "Please enter a valid 12-digit Aadhaar number.",
                400
            )
        current_aadhaar = aadhaar
    else:
        current_aadhaar = user.get("profile", {}).get("gov_id_number", "")
        if not current_aadhaar:
            return util.error_response(
                "Please provide an Aadhaar number.",
                400
            )
    return util.success_response({
        "success": True,
        "message": f"OTP sent successfully to mobile linked with Aadhaar \
            ending in {current_aadhaar[-4:]}.",
    })


def verify_aadhaar_otp(event, payload):
    sub = event.get("auth_sub")
    user = fetch_user_profile(sub)
    if not user:
        return util.error_response("Please sign in first.", 401)
    otp = str(payload.get("otp", "")).strip()
    if not otp:
        return util.error_response("Please enter the OTP.", 400)
    if otp != "123456":
        return util.error_response("Invalid OTP. Please try again.", 400)
    return util.success_response({
        "success": True,
        "message": "Aadhaar verified successfully! \
            You can now host and join parties.",
        "isVerified": True,
        "canCreateOrJoinParties": True,
    })


def get_current_user(event, payload):
    sub = event.get("auth_sub")
    user = fetch_user_profile(sub)
    if not user:
        return util.error_response("Not authenticated.", 401)
    return util.success_response({
        "success": True,
        "userID": user.get("userID", ""),
        "userName": user.get("userName", ""),
        "email": user.get("emailAddress", ""),
        "mobile": user.get("phoneNumber", ""),
        "profilePictureUrl": user.get("profilePictureUrl", ""),
        "isVerified": bool(user.get("adharVerified")),
        "bio": user.get("bio", ""),
    })


def get_signup_session_details(event, payload):
    token, session = get_preauth_session(event)
    if not session:
        return util.error_response(
            "Signup session expired. Verify mobile OTP again.",
            401
        )

    pending_mobile = str(session.get("pending_signup_mobile") or "").strip()
    if not pending_mobile:
        return preauth_response(
            401,
            {"success": False,
             "message": "Signup session expired. Verify mobile OTP again."},
            token
        )

    return preauth_response(
        200,
        {"success": True,
         "mobile": pending_mobile,
         "formattedMobile": util.format_phone_in(pending_mobile)},
        token
    )


def logout(event, payload):
    """
    Logout the current user.

    Accepts:
      Authorization: Bearer <accessToken>   (required — used to call global_sign_out)
      Body: { "sessionId": "<id>" }         (optional — to delete the specific device session)
           or { "globalLogout": true }      (optional — delete ALL device sessions)
    """
    access_token = util.extract_bearer_token(event)
    session_id = str(payload.get("sessionId", "")).strip()
    global_logout = bool(payload.get("globalLogout", False))

    # Revoke in Cognito (invalidates the access token and refresh token for this session)
    if access_token and COGNITO:
        try:
            COGNITO.global_sign_out(AccessToken=access_token)
        except Exception:
            pass  # Non-fatal — token may already be expired

    # Remove session record(s) from the JWT sessions table
    if access_token:
        sub = event.get("auth_sub")
        if sub:
            if global_logout:
                jwt_sessions.delete_all_sessions(sub)
            elif session_id:
                jwt_sessions.delete_session(sub, session_id)

    return util.success_response({"success": True,
                                  "message": "Signed out successfully."})


# ── Dev-only endpoints ─────────────────────────────────────────────────────────

def get_dev_auth_status(event, payload):
    if util.app_env() != "dev":
        return util.error_response("Route not found.", 404)
    users_ready = rds.table_exists("users")
    devices_ready = rds.table_exists("user_devices")
    return util.success_response({
        "success": True,
        "apiStatus": "ok",
        "environment": util.app_env(),
        "cognitoUserPoolId": util.env("COGNITO_USER_POOL_ID"),
        "tables": {
            "users": users_ready["data"]
            if users_ready["success"]
            else False,
            "user_devices": devices_ready["data"]
            if devices_ready["success"]
            else False,
        },
    })


def wipe_dev_users(event, payload):
    if util.app_env() != "dev":
        return util.error_response("Forbidden outside of dev.", 403)
    result = rds.execute_raw_sql(
        "DELETE FROM user_devices; DELETE FROM users;")
    if not result["success"]:
        return util.error_response(
            f"Failed to wipe users: {result['error']}",
            500
        )
    return util.success_response(
        {"success": True,
         "message": "All users and devices deleted from RDS successfully!"})


def get_dev_all_users(event, payload):
    if util.app_env() != "dev":
        return util.error_response("Forbidden outside of dev.", 403)
    result = rds.get_all_users()
    if not result["success"]:
        return util.error_response(
            f"Failed to fetch users: {result['error']}",
            500
        )
    return util.success_response({"success": True, "users": result["data"]})


# ── Action Registry ────────────────────────────────────────────────────────────
action_handlers = {
    "SendMobileOtp":           send_mobile_otp,
    "ResendMobileOtp":         resend_mobile_otp,
    "VerifyMobileOtp":         verify_mobile_otp,
    "LoginWithPassword":       login_with_password,
    "RefreshToken":            refresh_token,
    "ForgotPasswordRequest":   forgot_password_request,
    "CheckUsername":           check_username,
    "RegisterUserDetails":     register_user_details,
    "CompleteProfileSetup":    complete_profile_setup,
    "SendAadhaarOtp":          send_aadhaar_otp,
    "VerifyAadhaarOtp":        verify_aadhaar_otp,
    "GetCurrentUser":          get_current_user,
    "GetSignupSessionDetails": get_signup_session_details,
    "Logout":                  logout,
    "GetDevAuthStatus":        get_dev_auth_status,
    "WipeDevUsers":            wipe_dev_users,
    "GetDevAllUsers":          get_dev_all_users,
}


def lambda_handler(event, context):
    try:
        print(f"SigninSignup_Event: {event}")

        # A. Parse Request Body
        body = util.parse_body(event)
        if body == "400":
            return util.error_responseor_response(
                {"error": "Malformed JSON in request body"},
                400
            )

        actionItem = body.get('actionItem')
        if not actionItem:
            return util.error_responseor_response(
                {"error": "Missing 'actionItem' in payload"},
                400
            )

        # B. Verify Authorization (Skipped for public routes)
        unprotectedActions = {
            "SendMobileOtp", "ResendMobileOtp", "VerifyMobileOtp",
            "LoginWithPassword", "RefreshToken", "CheckUsername",
            "RegisterUserDetails", "CompleteProfileSetup",
            "GetSignupSessionDetails", "GetDevAuthStatus", "WipeDevUsers",
            "GetDevAllUsers"
        }
        authorizationToken = {}
        if actionItem not in unprotectedActions:
            headers = event.get('headers', {})
            authHeader = headers.get(
                'Authorization') or headers.get('authorization')
            if not authHeader:
                return util.error_responseor_response(
                    {"error": "Unauthorized: Missing Authorization header"},
                    401
                )
            authorizationToken = authHeader.replace(
                'Bearer ', '').replace('bearer ', '')
            try:
                authorizationToken = cognito_auth.verify_token(
                    authorizationToken)
                event["auth_sub"] = authorizationToken.get("sub")
            except Exception as auth_error:
                print(f"Token verification failed: {str(auth_error)}")
                return util.error_response(
                    {"error": "Unauthorized: Invalid or expired token"},
                    401
                )

        # C. Route to the requested function
        selected_action = action_handlers.get(actionItem)
        if not selected_action:
            return util.error_responseor_response(
                {"error": f"Invalid actionItem: {actionItem}"},
                400
            )
        # Separate payload from actionItem (optional, but requested by reference)
        payload = {k: v for k, v in body.items() if k != 'actionItem'}

        # D. Execute the function and pass the original event and payload
        # Passing event instead of user_context as the existing functions heavily rely on event properties
        result = selected_action(event, payload)

        # Standardize response if the handler returned a raw dict instead of a full API Gateway response
        if "statusCode" in result and "body" in result:
            return result
        return util.success_response(result, 200)

    except Exception as e:
        print(f"Internal Server Error: {str(e)}")
        return util.error_responseor_response(
            {"error": "Internal Server Error"},
            500
        )
