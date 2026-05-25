"""
SignupSignin.py — Auth Lambda for HappniX.

Handles all sign-up / sign-in flows via a single `actionItem` dispatcher.
All shared utilities live in utilities/; this file is only action logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH ARCHITECTURE (post-JWT migration)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pre-auth token flow (OTP + signup — no login yet):
  SendMobileOtp   → response body: { preAuthToken }
  VerifyMobileOtp → header: X-HappniX-PreAuth: <token>
                  → new user:      response body: { preAuthToken, redirectUrl: /signup }
                  → existing user: response body: { redirectUrl: /login } (no token)
  RegisterUserDetails  → header: X-HappniX-PreAuth: <token>
                       → response body: { redirectUrl: /login }
  CompleteProfileSetup → header: X-HappniX-PreAuth: <token>
                       → response body: { redirectUrl: /login }

JWT flow (post-login):
  LoginWithPassword → response body: { accessToken, refreshToken, sessionId, expiresIn }
  All auth'd APIs  → header: Authorization: Bearer <accessToken>
  RefreshToken     → body: { refreshToken, sessionId } → new { accessToken, expiresIn }
  Logout           → header: Authorization: Bearer <accessToken>
                   → body: { sessionId } → Cognito global_sign_out + delete session row

Action Registry:
  SendMobileOtp, ResendMobileOtp, VerifyMobileOtp
  LoginWithPassword, RefreshToken, ForgotPasswordRequest
  RegisterUserDetails, CompleteProfileSetup, CheckUsername
  SendAadhaarOtp, VerifyAadhaarOtp
  GetCurrentUser, GetSignupSessionDetails, Logout
  GetDevAuthStatus, WipeDevUsers, GetDevAllUsers   (dev only)
"""

import os
import uuid
from datetime import datetime, timezone

import boto3

import utilities.util as util           # ok, err, log, validators, formatters
import utilities.rds as rds             # get_user_by_sub, upsert_user, ...
import utilities.sessions as sessions   # pre-auth token storage (OTP/signup flow)
import utilities.dynamo as dynamo       # put_item, get_item, query_items, ...
import utilities.jwt_sessions as jwt_sessions  # refresh-token session storage
from utilities.r2_helper import upload_profile_picture, init_user_folder_structure

# ── Cognito client ─────────────────────────────────────────────────────────────
try:
    _cognito = boto3.client("cognito-idp")
except Exception:
    _cognito = None

_USERS_TABLE = os.environ.get("USERS_TABLE_NAME", "")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PRE-AUTH HELPERS  (OTP / signup flow — before login)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _get_or_create_preauth(event):
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


def _get_preauth_session(event):
    """
    Return (token, session_dict) for an existing pre-auth session.
    Returns (token, None) if the session does not exist (token expired or absent).
    """
    token = util.extract_preauth_token(event)
    result = sessions.get_session(token)
    if not result["success"] or not result["data"]["session"]:
        return token, None
    return token, result["data"]["session"]


def _save_preauth(token, session):
    sessions.replace_session(token, session)


def _preauth_response(status, body, token):
    """
    Build a JSON response that includes the preAuthToken in the body.
    The frontend reads it and sends it back in the X-HappniX-PreAuth header
    on the next signup-flow request.
    """
    if token:
        body["preAuthToken"] = token
    return util.ok(body, status)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT HELPERS  — delegate to util to avoid duplication across all Lambdas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _fetch_user_profile(sub):
    """Fetch the full user profile (RDS + DynamoDB merge) using a validated sub."""
    if not sub:
        return None
    r_res = rds.get_user_by_sub(sub)
    if not r_res.get("success") or not r_res.get("data"):
        return None
    user = r_res["data"]
    if _USERS_TABLE:
        d_res = dynamo.get_item(_USERS_TABLE, {"userID": user["userID"]})
        if d_res.get("success") and d_res.get("data"):
            user.update(d_res["data"])
    return user


def _device_info(event) -> str:
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

def SendMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.err("Please enter a valid 10-digit mobile number.")

    token, session = _get_or_create_preauth(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    _save_preauth(token, session)

    body = {"success": True, "message": f"OTP sent successfully to {mobile}."}
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return _preauth_response(200, body, token)


def ResendMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.err("Please enter a valid 10-digit mobile number.")

    token, session = _get_or_create_preauth(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    _save_preauth(token, session)

    body = {"success": True, "message": f"OTP resent to {mobile}."}
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return _preauth_response(200, body, token)


def VerifyMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    otp    = str(payload.get("otp", "")).strip()
    if not mobile or not otp:
        return util.err("Mobile and OTP are required.")

    token, session = _get_or_create_preauth(event)
    saved_otp = session.get("mobile_otp_map", {}).get(mobile)

    fixed_otp_allowed = (
        util.is_test_otp_mode()
        and util.env("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and util.app_env() != "prod"
    )
    using_fixed = fixed_otp_allowed and otp == "123456"

    # Check: no saved OTP AND not using the dev bypass → session expired
    if not saved_otp and not using_fixed:
        return _preauth_response(400, {
            "success": False,
            "message": "OTP session expired. Please request a new OTP.",
        }, token)

    # Check: OTP mismatch (fixed OTP bypass takes priority)
    if saved_otp and saved_otp != otp and not using_fixed:
        return _preauth_response(400, {
            "success": False,
            "message": "Invalid OTP.",
        }, token)

    formatted = util.format_phone_in(mobile)
    user_result = rds.get_user_by_mobile(formatted)
    user = user_result["data"] if user_result["success"] else None

    # Clear the used OTP from the session
    session.get("mobile_otp_map", {}).pop(mobile, None)

    if session.get("warning_verification_required"):
        _save_preauth(token, session)
        return _preauth_response(200, {
            "success": True,
            "message": "Verification required before linking this device.",
            "loginStatus": "warning_verification_required",
            "redirectUrl": "/auth/warning-verification/",
        }, token)

    if user:
        # Existing user — they must log in with username/password to get a JWT.
        # Do NOT issue a JWT here; drop the pre-auth session (no longer needed).
        sessions.delete_session(token)
        return util.ok({
            "success": True,
            "message": f"Welcome back, {user.get('userName', 'User')}! Please sign in with your password.",
            "userStatus": "existing",
            "redirectUrl": "/login.html",
        })

    # New user — carry the pre-auth token into the signup flow.
    session["pending_signup_mobile"] = mobile
    _save_preauth(token, session)
    return _preauth_response(200, {
        "success": True,
        "message": "Mobile OTP verified. Continue to sign up.",
        "userStatus": "new",
        "redirectUrl": "/signup_details.html",
    }, token)


def LoginWithPassword(event, payload):
    """
    Authenticate with username/email + password.

    On success, returns Cognito JWT tokens:
      accessToken  — short-lived (~1 hour). Used as Authorization: Bearer for all API calls.
      refreshToken — long-lived (30 days). Stored in jwt_sessions table. Send to RefreshToken.
      idToken      — user identity claims. Frontend only; not sent to backend APIs.
      sessionId    — server-side session ID. Send alongside refreshToken for RefreshToken/Logout.
      expiresIn    — accessToken lifetime in seconds.
    """
    identifier = str(payload.get("identifier", payload.get("username", ""))).strip()
    password   = str(payload.get("password", "")).strip()
    if not identifier or not password:
        return util.err("Username/email and password are required.")

    pool_id   = os.environ.get("COGNITO_USER_POOL_ID")
    client_id = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")

    access_token  = None
    refresh_token = None
    id_token      = None
    expires_in    = 3600
    cognito_sub   = None
    full_name     = "User"

    if _cognito and pool_id and client_id:
        try:
            auth_resp = _cognito.admin_initiate_auth(
                UserPoolId=pool_id,
                ClientId=client_id,
                AuthFlow="ADMIN_NO_SRP_AUTH",
                AuthParameters={"USERNAME": identifier, "PASSWORD": password},
            )
            result = auth_resp.get("AuthenticationResult", {})
            access_token  = result.get("AccessToken")
            refresh_token = result.get("RefreshToken")
            id_token      = result.get("IdToken")
            expires_in    = result.get("ExpiresIn", 3600)

            # Fetch user attributes for the response
            info = _cognito.admin_get_user(UserPoolId=pool_id, Username=identifier)
            attrs = {a["Name"]: a["Value"] for a in info["UserAttributes"]}
            cognito_sub = attrs.get("sub")
            full_name   = attrs.get("name", identifier)

        except (_cognito.exceptions.NotAuthorizedException,
                _cognito.exceptions.UserNotFoundException):
            return util.err("Invalid username/email or password.", 401)
        except Exception as exc:
            return util.err(f"Login failed: {exc}", 500)
    else:
        # Cognito not configured — dev-only fallback via RDS lookup
        result = rds.get_user_by_identifier(identifier)
        user = result["data"] if result["success"] else None
        if not user:
            return util.err("Invalid username/email or password.", 401)
        cognito_sub = user["cognitoSub"]
        full_name   = user.get("userName", "User")
        access_token  = f"mock-jwt-{cognito_sub}"
        refresh_token = f"mock-refresh-{cognito_sub}"
        id_token      = "mock-id-token"

    # Persist the refresh token in the JWT sessions table
    session_id = None
    if refresh_token and cognito_sub:
        device = _device_info(event)
        sess_result = jwt_sessions.create_session(cognito_sub, refresh_token, device)
        if sess_result["success"] and sess_result["data"]:
            session_id = sess_result["data"].get("sessionId")

    # Look up canCreateOrJoinParties
    can_create = False
    lookup = rds.get_user_by_identifier(identifier)
    if lookup["success"] and lookup["data"]:
        can_create = util.can_create_or_join_parties(lookup["data"])

    return util.ok({
        "success":      True,
        "message":      f"Signed in successfully. Welcome, {full_name}.",
        "accessToken":  access_token,
        "refreshToken": refresh_token,
        "idToken":      id_token,
        "sessionId":    session_id,
        "expiresIn":    expires_in,
        "tokenType":    "Bearer",
        "userStatus":   "existing",
        "canCreateOrJoinParties": can_create,
        "redirectUrl":  "/home_page.html",
    })


def RefreshToken(event, payload):
    """
    Exchange a refresh token for a new access token.

    Frontend sends:
      { "refreshToken": "<token>", "sessionId": "<id>" }
    Returns:
      { "accessToken": "...", "expiresIn": 3600 }
    """
    refresh_token = str(payload.get("refreshToken", "")).strip()
    session_id    = str(payload.get("sessionId", "")).strip()

    if not refresh_token:
        return util.err("refreshToken is required.", 400)

    # Verify with Cognito
    pool_id   = os.environ.get("COGNITO_USER_POOL_ID")
    client_id = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")

    if not _cognito or not pool_id or not client_id:
        return util.err("Token refresh not available in this environment.", 503)

    try:
        auth_resp = _cognito.admin_initiate_auth(
            UserPoolId=pool_id,
            ClientId=client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={"REFRESH_TOKEN": refresh_token},
        )
        result      = auth_resp.get("AuthenticationResult", {})
        new_access  = result.get("AccessToken")
        expires_in  = result.get("ExpiresIn", 3600)
        new_id      = result.get("IdToken")
    except (_cognito.exceptions.NotAuthorizedException,):
        return util.err("Refresh token is invalid or expired. Please log in again.", 401)
    except Exception as exc:
        return util.err(f"Token refresh failed: {exc}", 500)

    # Enforce 7-day inactivity window and update lastUsedAt
    if session_id:
        sub, _ = util.verify_cognito_token(new_access)
        if sub:
            session_resp = jwt_sessions.get_session(sub, session_id)
            if not session_resp["success"] or not session_resp["data"]:
                # If session isn't in DynamoDB, it was revoked or expired
                return util.err("Session is invalid or expired. Please log in again.", 401)

            session_data = session_resp["data"]
            last_used_str = session_data.get("lastUsedAt")
            if last_used_str:
                try:
                    # Parse ISO 8601 string
                    last_used = datetime.fromisoformat(last_used_str.replace("Z", "+00:00"))
                    days_inactive = (datetime.now(timezone.utc) - last_used).days
                    if days_inactive >= 7:
                        jwt_sessions.delete_session(sub, session_id)
                        return util.err("Session expired due to inactivity. Please log in again.", 401)
                except Exception as e:
                    util.log(f"Error parsing lastUsedAt: {e}")

            jwt_sessions.refresh_session(sub, session_id)

    return util.ok({
        "success":     True,
        "accessToken": new_access,
        "idToken":     new_id,
        "expiresIn":   expires_in,
        "tokenType":   "Bearer",
    })


def ForgotPasswordRequest(event, payload):
    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return util.err("Please enter your email address.")
    if not util.is_valid_email(email):
        return util.err("Please enter a valid email address.")
    result = rds.get_user_by_identifier(email)
    exists = result["success"] and result["data"] is not None
    msg = (
        "Verification email request accepted. Please check your inbox."
        if exists
        else "If this email is registered, verification instructions will be sent."
    )
    return util.ok({"success": True, "message": msg})


def CheckUsername(event, payload):
    """
    Check if a username is available before the user submits the signup form.
    Frontend calls this when the user types/leaves the username field.
    """
    username = str(payload.get("username", "")).strip()
    if not username:
        return util.err("Please enter a username.")
    if len(username) < 3:
        return util.err("Username must be at least 3 characters.")
    if len(username) > 30:
        return util.err("Username must be 30 characters or less.")
    if not username.replace("_", "").replace(".", "").isalnum():
        return util.err("Username can only contain letters, numbers, underscores, and dots.")

    result = rds.get_user_by_identifier(username)
    if not result["success"]:
        return util.err("Could not check username availability. Try again.", 500)
    if result["data"]:
        return util.ok({"available": False, "message": "Username already taken. Please choose another one."})
    return util.ok({"available": True, "message": "Username is available!"})


def RegisterUserDetails(event, payload):
    token, session = _get_preauth_session(event)
    if not session:
        return util.err("Signup session expired. Please verify your mobile number again.", 401)

    pending_mobile = session.get("pending_signup_mobile")
    if not pending_mobile:
        return _preauth_response(401, {
            "success": False,
            "message": "Signup session expired. Verify mobile OTP again.",
        }, token)

    full_name = str(payload.get("fullName", "")).strip()
    username  = str(payload.get("username", "")).strip()
    password  = str(payload.get("password", "")).strip()
    sex       = str(payload.get("sex", "")).strip().lower()
    dob       = str(payload.get("dateOfBirth", "")).strip()
    email     = str(payload.get("email", "")).strip().lower()
    gov_id    = str(payload.get("govId", "")).strip()

    if not all([full_name, username, password, sex, dob, email]):
        return _preauth_response(400, {"success": False, "message": "All mandatory fields are required."}, token)
    if len(full_name) < 3:
        return _preauth_response(400, {"success": False, "message": "Please enter a valid full name."}, token)
    if sex not in {"mr.", "miss.", "mrs.", "other"}:
        return _preauth_response(400, {"success": False, "message": "Select a valid sex option."}, token)
    if not util.is_valid_date(dob):
        return _preauth_response(400, {"success": False, "message": "Enter a valid date of birth (YYYY-MM-DD)."}, token)
    if not util.is_valid_email(email):
        return _preauth_response(400, {"success": False, "message": "Enter a valid email address."}, token)
    if not util.is_strong_password(password):
        return _preauth_response(400, {"success": False, "message": "Password must include uppercase, lowercase, number, special character, and minimum 8 characters."}, token)
    if rds.get_user_by_identifier(username)["data"]:
        return _preauth_response(400, {"success": False, "message": "Username already exists. Please choose another one."}, token)
    if rds.get_user_by_identifier(email)["data"]:
        return _preauth_response(400, {"success": False, "message": "Email already registered. Please use another email."}, token)

    formatted_mobile = util.format_phone_in(pending_mobile)
    if rds.get_user_by_mobile(formatted_mobile)["data"]:
        return _preauth_response(400, {"success": False, "message": "Mobile number already registered."}, token)

    pool_id     = os.environ.get("COGNITO_USER_POOL_ID")
    cognito_sub = None

    if _cognito and pool_id:
        try:
            resp = _cognito.admin_create_user(
                UserPoolId=pool_id, Username=username,
                UserAttributes=[
                    {"Name": "email",                "Value": email},
                    {"Name": "phone_number",          "Value": formatted_mobile},
                    {"Name": "preferred_username",    "Value": username},
                    {"Name": "name",                  "Value": full_name},
                    {"Name": "custom:dateOfBirth",    "Value": dob},
                    {"Name": "custom:userType",       "Value": "General"},
                    {"Name": "email_verified",        "Value": "true"},
                    {"Name": "phone_number_verified", "Value": "true"},
                ],
                MessageAction="SUPPRESS",
            )
            attrs = {a["Name"]: a["Value"] for a in resp["User"]["Attributes"]}
            cognito_sub = attrs.get("sub")
            _cognito.admin_set_user_password(
                UserPoolId=pool_id, Username=username,
                Password=password, Permanent=True,
            )
        except Exception as exc:
            return _preauth_response(500, {"success": False, "message": f"Cognito registration failed: {exc}"}, token)

    if not cognito_sub:
        cognito_sub = f"mock-{uuid.uuid4().hex[:12]}"

    user_id = util.new_user_id()

    rds_result = rds.upsert_user({
        "userID": user_id, "cognitoSub": cognito_sub, "userName": username,
        "emailAddress": email, "userType": "General", "phoneNumber": formatted_mobile,
        "emailVerified": True, "isActive": True, "dateOfBirth": dob,
    })
    if not rds_result["success"]:
        return _preauth_response(500, {"success": False, "message": f"Failed to save user: {rds_result['error']}"}, token)

    if _USERS_TABLE:
        dynamo_result = dynamo.put_item(_USERS_TABLE, {
            "userID":    user_id,
            "userName":  username,
            "cognitoSub": cognito_sub,
            "createdAt": util.now_iso(),
            "updatedAt": util.now_iso(),
            "personalDetails": {
                "fullName":    full_name,
                "email":       email,
                "phoneNumber": formatted_mobile,
                "address":     "",
                "aadharNumber": gov_id,
            },
        })
        if not dynamo_result["success"]:
            util.log("error", "RegisterUserDetails",
                     "DynamoDB put_item failed — user not written to userInfoTable",
                     userID=user_id, table=_USERS_TABLE, error=dynamo_result["error"])
        else:
            util.log("info", "RegisterUserDetails",
                     "DynamoDB write OK", userID=user_id, table=_USERS_TABLE)
    else:
        util.log("warning", "RegisterUserDetails",
                 "USERS_TABLE_NAME env var is empty — DynamoDB write skipped")

    # Keep the pre-auth token alive briefly for CompleteProfileSetup.
    session.pop("pending_signup_mobile", None)
    session["pending_profile_setup"]   = True
    session["authenticated_user_id"]   = cognito_sub
    _save_preauth(token, session)

    return _preauth_response(200, {
        "success":  True,
        "message":  "Details saved successfully. You can add profile details next.",
        "canCreateOrJoinParties": False,
        "redirectUrl": "/signup_profile_optional.html",
    }, token)


def CompleteProfileSetup(event, payload):
    token, session = _get_preauth_session(event)
    if not session:
        return util.err("Profile setup session not found. Please sign in.", 401)

    cognito_sub = session.get("authenticated_user_id")
    if not cognito_sub:
        return util.err("Please sign in first.", 401)
    if not session.get("pending_profile_setup"):
        return _preauth_response(400, {"success": False, "message": "Profile setup session not found."}, token)

    user_result = rds.get_user_by_sub(cognito_sub)
    user = user_result["data"] if user_result["success"] else None
    if not user:
        return util.err("User not found.", 404)

    if not payload.get("skip", False):
        bio       = str(payload.get("bio", "")).strip()
        pic_input = str(payload.get("profilePictureUrl", "")).strip()

        if pic_input.startswith("data:image/"):
            pic_url   = upload_profile_picture(user["userID"], user["userName"], pic_input)
            pic_input = pic_url if pic_url else ""

        if _USERS_TABLE:
            dynamo_updates = {"updatedAt": util.now_iso()}
            if bio:
                dynamo_updates["bio"] = bio
            if pic_input:
                dynamo_updates["profilePictureUrl"] = pic_input
            if dynamo_updates:
                dynamo.update_item(_USERS_TABLE, {"userID": user["userID"]}, dynamo_updates)

        user["bio"] = bio
        if pic_input:
            user["profilePictureUrl"] = pic_input

    # Pre-auth session is no longer needed — delete it.
    sessions.delete_session(token)

    try:
        init_user_folder_structure(user["userID"], user["userName"])
    except Exception as _r2_err:
        print(f"WARN: R2 folder init failed: {_r2_err}")

    return util.ok({
        "success":    True,
        "message":    "Profile setup completed. Please sign in to continue.",
        "redirectUrl": "/login.html",
    })


def SendAadhaarOtp(event, payload):
    sub = event.get("auth_sub")
    user = _fetch_user_profile(sub)
    if not user:
        return util.err("Please sign in first.", 401)
    aadhaar = str(payload.get("aadhaarNumber", "")).strip()
    if aadhaar:
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return util.err("Please enter a valid 12-digit Aadhaar number.", 400)
        current_aadhaar = aadhaar
    else:
        current_aadhaar = user.get("profile", {}).get("gov_id_number", "")
        if not current_aadhaar:
            return util.err("Please provide an Aadhaar number.", 400)
    return util.ok({
        "success": True,
        "message": f"OTP sent successfully to mobile linked with Aadhaar ending in {current_aadhaar[-4:]}.",
    })


def VerifyAadhaarOtp(event, payload):
    sub = event.get("auth_sub")
    user = _fetch_user_profile(sub)
    if not user:
        return util.err("Please sign in first.", 401)
    otp = str(payload.get("otp", "")).strip()
    if not otp:
        return util.err("Please enter the OTP.", 400)
    if otp != "123456":
        return util.err("Invalid OTP. Please try again.", 400)
    return util.ok({
        "success":              True,
        "message":             "Aadhaar verified successfully! You can now host and join parties.",
        "isVerified":          True,
        "canCreateOrJoinParties": True,
    })


def GetCurrentUser(event, payload):
    sub = event.get("auth_sub")
    user = _fetch_user_profile(sub)
    if not user:
        return util.err("Not authenticated.", 401)
    return util.ok({
        "success":          True,
        "userID":           user.get("userID", ""),
        "userName":         user.get("userName", ""),
        "email":            user.get("emailAddress", ""),
        "mobile":           user.get("phoneNumber", ""),
        "profilePictureUrl": user.get("profilePictureUrl", ""),
        "isVerified":       bool(user.get("adharVerified")),
        "bio":              user.get("bio", ""),
    })


def GetSignupSessionDetails(event, payload):
    token, session = _get_preauth_session(event)
    if not session:
        return util.err("Signup session expired. Verify mobile OTP again.", 401)
    pending_mobile = str(session.get("pending_signup_mobile") or "").strip()
    if not pending_mobile:
        return _preauth_response(401, {
            "success": False,
            "message": "Signup session expired. Verify mobile OTP again.",
        }, token)
    return _preauth_response(200, {
        "success":         True,
        "mobile":          pending_mobile,
        "formattedMobile": util.format_phone_in(pending_mobile),
    }, token)


def Logout(event, payload):
    """
    Logout the current user.

    Accepts:
      Authorization: Bearer <accessToken>   (required — used to call global_sign_out)
      Body: { "sessionId": "<id>" }         (optional — to delete the specific device session)
           or { "globalLogout": true }      (optional — delete ALL device sessions)
    """
    access_token = util.extract_bearer_token(event)
    session_id   = str(payload.get("sessionId", "")).strip()
    global_logout = bool(payload.get("globalLogout", False))

    # Revoke in Cognito (invalidates the access token and refresh token for this session)
    if access_token and _cognito:
        try:
            _cognito.global_sign_out(AccessToken=access_token)
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

    return util.ok({"success": True, "message": "Signed out successfully."})


# ── Dev-only endpoints ─────────────────────────────────────────────────────────

def GetDevAuthStatus(event, payload):
    if util.app_env() != "dev":
        return util.err("Route not found.", 404)
    users_ready   = rds.table_exists("users")
    devices_ready = rds.table_exists("user_devices")
    return util.ok({
        "success": True,
        "apiStatus": "ok",
        "environment": util.app_env(),
        "cognitoUserPoolId": util.env("COGNITO_USER_POOL_ID"),
        "tables": {
            "users":        users_ready["data"]   if users_ready["success"]   else False,
            "user_devices": devices_ready["data"] if devices_ready["success"] else False,
        },
    })


def WipeDevUsers(event, payload):
    if util.app_env() != "dev":
        return util.err("Forbidden outside of dev.", 403)
    result = rds.execute_raw_sql("DELETE FROM user_devices; DELETE FROM users;")
    if not result["success"]:
        return util.err(f"Failed to wipe users: {result['error']}", 500)
    return util.ok({"success": True, "message": "All users and devices deleted from RDS successfully!"})


def GetDevAllUsers(event, payload):
    if util.app_env() != "dev":
        return util.err("Forbidden outside of dev.", 403)
    result = rds.get_all_users()
    if not result["success"]:
        return util.err(f"Failed to fetch users: {result['error']}", 500)
    return util.ok({"success": True, "users": result["data"]})


# ── Action Registry ────────────────────────────────────────────────────────────

ACTION_REGISTRY = {
    "SendMobileOtp":           SendMobileOtp,
    "ResendMobileOtp":         ResendMobileOtp,
    "VerifyMobileOtp":         VerifyMobileOtp,
    "LoginWithPassword":       LoginWithPassword,
    "RefreshToken":            RefreshToken,
    "ForgotPasswordRequest":   ForgotPasswordRequest,
    "CheckUsername":           CheckUsername,
    "RegisterUserDetails":     RegisterUserDetails,
    "CompleteProfileSetup":    CompleteProfileSetup,
    "SendAadhaarOtp":          SendAadhaarOtp,
    "VerifyAadhaarOtp":        VerifyAadhaarOtp,
    "GetCurrentUser":          GetCurrentUser,
    "GetSignupSessionDetails": GetSignupSessionDetails,
    "Logout":                  Logout,
    "GetDevAuthStatus":        GetDevAuthStatus,
    "WipeDevUsers":            WipeDevUsers,
    "GetDevAllUsers":          GetDevAllUsers,
}


# ── Lambda Entry Point ─────────────────────────────────────────────────────────

def lambda_handler(event, context):
    # ── Trace ID: prefer Lambda's own request ID for CloudWatch correlation ──
    trace_id = (
        context.aws_request_id                                    # unique per invocation
        or (event.get("requestContext") or {}).get("requestId")   # API Gateway fallback
        or util.extract_trace_id(event)                           # UUID fallback
    )

    http_method = event.get("httpMethod", "POST")

    if http_method == "OPTIONS":
        return util.ok({}, 200)

    # ── Timeout guard: bail early if < 1.5 s remaining ──────────────────────
    if context.get_remaining_time_in_millis() < 1500:
        util.log("warning", trace_id, "Lambda near timeout — returning 503",
                 functionName=context.function_name)
        return util.err("Request timed out. Please try again.", 503, trace_id)

    payload = util.parse_body(event)
    actionItem  = str(payload.get("actionItem", "")).strip()

    util.log("info", trace_id, "Incoming request",
             actionItem=actionItem, functionName=context.function_name)

    if not actionItem:
        return util.err("Missing actionItem in request body.", 400, trace_id)

    # ── Centralized JWT Authentication ───────────────────────────────────────
    UNPROTECTED_ACTIONS = {
        "SendMobileOtp", "VerifyMobileOtp", "LoginWithPassword",
        "RefreshToken", "CheckUsername", "RegisterUserDetails",
        "CompleteProfileSetup", "GetSignupSessionDetails",
        "GetDevAuthStatus", "WipeDevUsers", "GetDevAllUsers"
    }
    
    if actionItem not in UNPROTECTED_ACTIONS:
        sub = util.get_jwt_sub(event)
        if not sub:
            util.log("warning", trace_id, "Unauthorized request blocked in lambda_handler", actionItem=actionItem)
            return util.err("Not authenticated.", 401, trace_id)
        event["auth_sub"] = sub
        
    handler = ACTION_REGISTRY.get(actionItem)
    if handler is None:
        util.log("warning", trace_id, "Unknown actionItem", actionItem=actionItem)
        return util.err(
            f"Unknown actionItem: '{actionItem}'. Available: {', '.join(sorted(ACTION_REGISTRY))}",
            400, trace_id,
        )

    try:
        response = handler(event, payload)
    except Exception as exc:
        util.log("error", trace_id, "Unhandled exception",
                 actionItem=actionItem, errorType=type(exc).__name__,
                 error=str(exc), functionName=context.function_name)
        return util.err(f"Internal server error: {exc}", 500, trace_id)

    response.setdefault("headers", {})
    response["headers"]["Access-Control-Allow-Origin"]      = "*"
    response["headers"].setdefault("X-Happnix-Trace-Id", trace_id)

    util.log("info", trace_id, "Request completed",
             actionItem=actionItem, statusCode=response.get("statusCode"))
    return response
