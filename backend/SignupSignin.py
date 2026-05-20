"""
SignupSignin.py — Auth Lambda for HappniX.

Handles all sign-up / sign-in flows via a single `actionItem` dispatcher.
All shared utilities live in utilities/; this file is only action logic.

Action Registry:
  SendMobileOtp, ResendMobileOtp, VerifyMobileOtp
  LoginWithPassword, ForgotPasswordRequest
  RegisterUserDetails, CompleteProfileSetup
  SendAadhaarOtp, VerifyAadhaarOtp
  GetCurrentUser, GetSignupSessionDetails, Logout
  GetDevAuthStatus, WipeDevUsers, GetDevAllUsers   (dev only)
"""

import os
import uuid

import boto3

import utilities.util as util        # ok, err, log, validators, formatters
import utilities.rds as rds          # get_user_by_sub, upsert_user, ...
import utilities.sessions as sessions # get_session, ensure_session, ...
import utilities.dynamo as dynamo    # put_item, get_item, query_items, ...
from utilities.r2_helper import upload_profile_picture

# ── Cognito client ────────────────────────────────────────────────────────────
try:
    _cognito = boto3.client("cognito-idp")
except Exception:
    _cognito = None

_USERS_TABLE = os.environ.get("USERS_TABLE_NAME", "")


# ── Session shortcuts ─────────────────────────────────────────────────────────

def _get_or_create_session(event):
    incoming = util.extract_session_token(event)
    result = sessions.ensure_session(incoming)
    if not result["success"]:
        return None, {}
    return result["data"]["token"], result["data"]["session"]


def _get_current_user(event):
    token = util.extract_session_token(event)
    result = sessions.get_session(token)
    if not result["success"] or not result["data"]["session"]:
        return token, None, None
    session = result["data"]["session"]
    user_id = session.get("authenticated_user_id")
    if not user_id:
        return token, session, None
    user_result = rds.get_user_by_sub(user_id)
    user = user_result["data"] if user_result["success"] else None
    return token, session, user


def _save_session(token, session):
    sessions.replace_session(token, session)


def _session_response(status, body, token, trace_id=None):
    response = util.ok(body, status, trace_id)
    return util.with_session_cookie(response, token)


# ── Action Handlers ───────────────────────────────────────────────────────────

def SendMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.err("Please enter a valid 10-digit mobile number.")
    token, session = _get_or_create_session(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    _save_session(token, session)
    body = {"success": True, "message": f"OTP sent successfully to {mobile}."}
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return _session_response(200, body, token)


def ResendMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    if not util.is_valid_mobile(mobile):
        return util.err("Please enter a valid 10-digit mobile number.")
    token, session = _get_or_create_session(event)
    otp = util.generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    _save_session(token, session)
    body = {"success": True, "message": f"OTP resent to {mobile}."}
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp
    return _session_response(200, body, token)


def VerifyMobileOtp(event, payload):
    mobile = str(payload.get("mobile", "")).strip()
    otp = str(payload.get("otp", "")).strip()
    if not mobile or not otp:
        return util.err("Mobile and OTP are required.")

    token, session = _get_or_create_session(event)
    saved_otp = session.get("mobile_otp_map", {}).get(mobile)
    if not saved_otp:
        return _session_response(400, {"success": False, "message": "OTP session expired. Please request a new OTP."}, token)

    fixed_otp_allowed = (
        util.is_test_otp_mode()
        and util.env("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and util.app_env() != "prod"
    )
    if saved_otp != otp and not (fixed_otp_allowed and otp == "123456"):
        return _session_response(400, {"success": False, "message": "Invalid OTP."}, token)

    formatted = util.format_phone_in(mobile)
    user_result = rds.get_user_by_mobile(formatted)
    user = user_result["data"] if user_result["success"] else None

    session.get("mobile_otp_map", {}).pop(mobile, None)

    if session.get("warning_verification_required"):
        _save_session(token, session)
        return _session_response(200, {
            "success": True,
            "message": "Verification required before linking this device.",
            "loginStatus": "warning_verification_required",
            "redirectUrl": "/auth/warning-verification/",
        }, token)

    if user:
        session["authenticated_user_id"] = user["cognitoSub"]
        session.pop("pending_signup_mobile", None)
        _save_session(token, session)
        return _session_response(200, {
            "success": True,
            "message": f"Welcome back, {user.get('userName', 'User')}! Mobile OTP verified.",
            "userStatus": "existing",
            "canCreateOrJoinParties": util.can_create_or_join_parties(user),
            "redirectUrl": "/home_page.html",
        }, token)

    session["pending_signup_mobile"] = mobile
    _save_session(token, session)
    return _session_response(200, {
        "success": True,
        "message": "Mobile OTP verified. User not found; continue sign up.",
        "userStatus": "new",
        "canCreateOrJoinParties": False,
        "redirectUrl": "/signup_details.html",
    }, token)


def LoginWithPassword(event, payload):
    identifier = str(payload.get("identifier", payload.get("username", ""))).strip()
    password = str(payload.get("password", "")).strip()
    if not identifier or not password:
        return util.err("Username/email and password are required.")

    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    client_id = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")
    user_id = None
    full_name = "User"

    if _cognito and pool_id and client_id:
        try:
            _cognito.admin_initiate_auth(
                UserPoolId=pool_id, ClientId=client_id,
                AuthFlow="ADMIN_NO_SRP_AUTH",
                AuthParameters={"USERNAME": identifier, "PASSWORD": password},
            )
            info = _cognito.admin_get_user(UserPoolId=pool_id, Username=identifier)
            attrs = {a["Name"]: a["Value"] for a in info["UserAttributes"]}
            user_id = attrs.get("sub")
            full_name = attrs.get("name", identifier)
        except (_cognito.exceptions.NotAuthorizedException,
                _cognito.exceptions.UserNotFoundException):
            return util.err("Invalid username/email or password.", 401)
        except Exception as exc:
            return util.err(f"Login failed: {exc}", 500)
    else:
        result = rds.get_user_by_identifier(identifier)
        user = result["data"] if result["success"] else None
        if not user:
            return util.err("Invalid username/email or password.", 401)
        user_id = user["cognitoSub"]
        full_name = user.get("userName", "User")

    token, session = _get_or_create_session(event)
    session["authenticated_user_id"] = user_id
    _save_session(token, session)

    can_create = False
    lookup = rds.get_user_by_identifier(identifier)
    if lookup["success"] and lookup["data"]:
        can_create = util.can_create_or_join_parties(lookup["data"])

    return _session_response(200, {
        "success": True,
        "message": f"Signed in successfully. Welcome, {full_name}.",
        "userStatus": "existing",
        "canCreateOrJoinParties": can_create,
        "redirectUrl": "/home_page.html",
    }, token)


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
    token, session = _get_or_create_session(event)
    pending_mobile = session.get("pending_signup_mobile")
    if not pending_mobile:
        return _session_response(401, {"success": False, "message": "Signup session expired. Verify mobile OTP again."}, token)

    full_name = str(payload.get("fullName", "")).strip()
    username  = str(payload.get("username", "")).strip()
    password  = str(payload.get("password", "")).strip()
    sex       = str(payload.get("sex", "")).strip().lower()
    dob       = str(payload.get("dateOfBirth", "")).strip()
    email     = str(payload.get("email", "")).strip().lower()
    gov_id    = str(payload.get("govId", "")).strip()

    if not all([full_name, username, password, sex, dob, email]):
        return _session_response(400, {"success": False, "message": "All mandatory fields are required."}, token)
    if len(full_name) < 3:
        return _session_response(400, {"success": False, "message": "Please enter a valid full name."}, token)
    if sex not in {"mr.", "miss.", "mrs.", "other"}:
        return _session_response(400, {"success": False, "message": "Select a valid sex option."}, token)
    if not util.is_valid_date(dob):
        return _session_response(400, {"success": False, "message": "Enter a valid date of birth (YYYY-MM-DD)."}, token)
    if not util.is_valid_email(email):
        return _session_response(400, {"success": False, "message": "Enter a valid email address."}, token)
    if not util.is_strong_password(password):
        return _session_response(400, {"success": False, "message": "Password must include uppercase, lowercase, number, special character, and minimum 8 characters."}, token)
    if rds.get_user_by_identifier(username)["data"]:
        return _session_response(400, {"success": False, "message": "Username already exists. Please choose another one."}, token)
    if rds.get_user_by_identifier(email)["data"]:
        return _session_response(400, {"success": False, "message": "Email already registered. Please use another email."}, token)

    formatted_mobile = util.format_phone_in(pending_mobile)
    if rds.get_user_by_mobile(formatted_mobile)["data"]:
        return _session_response(400, {"success": False, "message": "Mobile number already registered."}, token)

    pool_id = os.environ.get("COGNITO_USER_POOL_ID")
    cognito_sub = None

    if _cognito and pool_id:
        try:
            resp = _cognito.admin_create_user(
                UserPoolId=pool_id, Username=username,
                UserAttributes=[
                    {"Name": "email",                 "Value": email},
                    {"Name": "phone_number",           "Value": formatted_mobile},
                    {"Name": "preferred_username",     "Value": username},
                    {"Name": "name",                   "Value": full_name},
                    {"Name": "custom:dateOfBirth",     "Value": dob},
                    {"Name": "custom:userType",        "Value": "General"},
                    {"Name": "email_verified",         "Value": "true"},
                    {"Name": "phone_number_verified",  "Value": "true"},
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
            return _session_response(500, {"success": False, "message": f"Cognito registration failed: {exc}"}, token)

    if not cognito_sub:
        cognito_sub = f"mock-{uuid.uuid4().hex[:12]}"

    user_id = util.new_user_id()

    rds_result = rds.upsert_user({
        "userID": user_id, "cognitoSub": cognito_sub, "userName": username,
        "emailAddress": email, "userType": "General", "phoneNumber": formatted_mobile,
        "emailVerified": True, "isActive": True, "dateOfBirth": dob,
    })
    if not rds_result["success"]:
        return _session_response(500, {"success": False, "message": f"Failed to save user: {rds_result['error']}"}, token)

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
            # Log the error but don't block signup — user is already in Cognito + RDS
            util.log("error", "RegisterUserDetails",
                     "DynamoDB put_item failed — user not written to userInfoTable",
                     userID=user_id, table=_USERS_TABLE, error=dynamo_result["error"])
        else:
            util.log("info", "RegisterUserDetails",
                     "DynamoDB write OK", userID=user_id, table=_USERS_TABLE)
    else:
        util.log("warning", "RegisterUserDetails",
                 "USERS_TABLE_NAME env var is empty — DynamoDB write skipped")

    session.pop("pending_signup_mobile", None)
    session["pending_profile_setup"] = True
    session["authenticated_user_id"] = cognito_sub
    _save_session(token, session)

    return _session_response(200, {
        "success": True,
        "message": "Details saved successfully. You can add profile details next.",
        "canCreateOrJoinParties": False,
        "redirectUrl": "/signup_profile_optional.html",
    }, token)


def CompleteProfileSetup(event, payload):
    token, session, user = _get_current_user(event)
    if not user:
        return util.err("Please sign in first.", 401)
    if not session or not session.get("pending_profile_setup"):
        return _session_response(400, {"success": False, "message": "Profile setup session not found."}, token)

    if not payload.get("skip", False):
        bio = str(payload.get("bio", "")).strip()
        pic_input = str(payload.get("profilePictureUrl", "")).strip()
        
        if pic_input.startswith("data:image/"):
            pic_url = upload_profile_picture(user["userID"], user["userName"], pic_input)
            pic_input = pic_url if pic_url else ""
            
        result = rds.update_user_profile(user["cognitoSub"], bio=bio, profile_picture_url=pic_input)
        if result["success"]:
            user = result["data"]

    session.pop("pending_profile_setup", None)
    _save_session(token, session)
    return _session_response(200, {
        "success": True,
        "message": "Profile setup completed.",
        "canCreateOrJoinParties": util.can_create_or_join_parties(user),
        "redirectUrl": "/home_page.html",
    }, token)


def SendAadhaarOtp(event, payload):
    token, session, user = _get_current_user(event)
    if not user:
        return util.err("Please sign in first.", 401)
    aadhaar = str(payload.get("aadhaarNumber", "")).strip()
    if aadhaar:
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return _session_response(400, {"success": False, "message": "Please enter a valid 12-digit Aadhaar number."}, token)
        current_aadhaar = aadhaar
    else:
        current_aadhaar = user.get("profile", {}).get("gov_id_number", "")
        if not current_aadhaar:
            return _session_response(400, {"success": False, "message": "Please provide an Aadhaar number."}, token)
    session["aadhaar_client_id"] = f"demo-{current_aadhaar[-4:]}"
    _save_session(token, session)
    return _session_response(200, {
        "success": True,
        "message": f"OTP sent successfully to mobile linked with Aadhaar ending in {current_aadhaar[-4:]}.",
    }, token)


def VerifyAadhaarOtp(event, payload):
    token, session, user = _get_current_user(event)
    if not user:
        return util.err("Please sign in first.", 401)
    if not session or not session.get("aadhaar_client_id"):
        return _session_response(400, {"success": False, "message": "Session expired. Please request OTP again."}, token)
    otp = str(payload.get("otp", "")).strip()
    if not otp:
        return _session_response(400, {"success": False, "message": "Please enter the OTP."}, token)
    if otp != "123456":
        return _session_response(400, {"success": False, "message": "Invalid OTP. Please try again."}, token)
    session.pop("aadhaar_client_id", None)
    _save_session(token, session)
    return _session_response(200, {
        "success": True,
        "message": "Aadhaar verified successfully! You can now host and join parties.",
        "isVerified": True,
        "canCreateOrJoinParties": True,
    }, token)


def GetCurrentUser(event, payload):
    token, session, user = _get_current_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    return _session_response(200, {
        "success": True,
        "userID":            user.get("userID", ""),
        "userName":          user.get("userName", ""),
        "email":             user.get("emailAddress", ""),
        "mobile":            user.get("phoneNumber", ""),
        "profilePictureUrl": user.get("profilePictureUrl", ""),
        "isVerified":        bool(user.get("adharVerified")),
        "bio":               user.get("bio", ""),
    }, token)


def GetSignupSessionDetails(event, payload):
    token, session = _get_or_create_session(event)
    pending_mobile = str(session.get("pending_signup_mobile") or "").strip()
    if not pending_mobile:
        return _session_response(401, {"success": False, "message": "Signup session expired. Verify mobile OTP again."}, token)
    return _session_response(200, {
        "success": True,
        "mobile": pending_mobile,
        "formattedMobile": util.format_phone_in(pending_mobile),
    }, token)


def Logout(event, payload):
    token = util.extract_session_token(event)
    if token:
        sessions.delete_session(token)
    response = util.ok({"success": True, "message": "Signed out successfully."})
    return util.clear_session_cookie(response)


# ── Dev-only endpoints ────────────────────────────────────────────────────────

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


# ── Action Registry ───────────────────────────────────────────────────────────

ACTION_REGISTRY = {
    "SendMobileOtp":           SendMobileOtp,
    "ResendMobileOtp":         ResendMobileOtp,
    "VerifyMobileOtp":         VerifyMobileOtp,
    "LoginWithPassword":       LoginWithPassword,
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


# ── Lambda Entry Point ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    trace_id    = util.extract_trace_id(event)
    http_method = event.get("httpMethod", "POST")

    if http_method == "OPTIONS":
        return util.ok({}, 200)

    payload = util.parse_body(event)
    action  = str(payload.get("actionItem", "")).strip()

    util.log("info", trace_id, "Incoming request", actionItem=action)

    if not action:
        return util.err("Missing actionItem in request body.", 400, trace_id)

    handler = ACTION_REGISTRY.get(action)
    if handler is None:
        util.log("warning", trace_id, "Unknown actionItem", actionItem=action)
        return util.err(
            f"Unknown actionItem: '{action}'. Available: {', '.join(sorted(ACTION_REGISTRY))}",
            400, trace_id,
        )

    try:
        response = handler(event, payload)
    except Exception as exc:
        util.log("error", trace_id, "Unhandled exception", actionItem=action,
                 errorType=type(exc).__name__, error=str(exc))
        return util.err(f"Internal server error: {exc}", 500, trace_id)

    # Inject CORS origin from request header
    headers = event.get("headers") or {}
    origin   = headers.get("origin") or headers.get("Origin") or util.env("FRONTEND_URL", "https://happnix-dev.ronakgo1.workers.dev")
    response.setdefault("headers", {})
    response["headers"]["Access-Control-Allow-Origin"]      = origin
    response["headers"]["Access-Control-Allow-Credentials"] = "true"
    response["headers"].setdefault("X-Happnix-Trace-Id", trace_id)

    util.log("info", trace_id, "Request completed", actionItem=action, statusCode=response.get("statusCode"))
    return response
