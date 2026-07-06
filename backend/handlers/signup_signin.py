"""
handlers/signup_signin.py — Auth Lambda for HappniX.

Flow:
    SendMobileOtp     → sends OTP to the mobile number, creates a preauth session
    ResendMobileOtp   → resends OTP, reuses the existing preauth session
    VerifyMobileOtp   → verifies OTP, checks if user exists in Cognito
                        → existing user: tells frontend to proceed to login
                        → new user:      tells frontend to proceed to signup
    RegisterUserDetails → saves new user details (username, fullName, DOB, gender,
                          email, password) — requires a valid verified preauth session

Session model:
    A short-lived preauth token is created on SendMobileOtp.
    It travels between client and server via the X-HappniX-PreAuth header.
    The lambda_handler reads this header, validates the session exists, and
    passes the token + session dict into every action as kwargs.
    No JWT / Cognito access token is used during signup or login initiation.
"""

import re
from utils.Response import success_response, error_response
from utils import utilities as util
from utils import dependencies
from utils import uuid_generator as uuid_gen
from integration import cognito_auth as cognito
from integration import rds
from services import preauth_session_service as preauth
from services import signup_signin_services

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION HANDLERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def check_username(**kwargs):
    """
    Checks if a username is available.
    """
    try:
        username = str(kwargs.get("username", "")).strip()
        if not username:
            return success_response({"success": True, "available": False, "message": "Username is required."})

        if not re.match(r"^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9_.]{1,30}$", username):
            return success_response({"success": True, "available": False, "message": "Invalid username format."})

        available = signup_signin_services.is_username_available(username)
        
        return success_response({
            "success": True,
            "available": available
        })
    except Exception as exc:
        util.log("error", "check_username", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def get_country_codes(**kwargs):
    """
    Returns the region_code_mapping from dependencies.py to the frontend.
    """
    try:
        return success_response({
            "success": True,
            "countries": dependencies.region_code_mapping,
        })
    except Exception as exc:
        util.log("error", "get_country_codes", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def send_mobile_otp(**kwargs):
    """
    Step 1 of the auth flow.
    """
    try:
        mobile = str(kwargs.get("mobile", "")).strip()
        region = str(kwargs.get("region", "IN")).strip().upper()
        token = kwargs.get("_preauth_token")
        session = kwargs.get("_preauth_session", {})

        if not util.is_valid_mobile(mobile):
            return error_response("Please enter a valid mobile number with country code.")

        otp = uuid_gen.generate_otp()
        session.setdefault("otp_map", {})[mobile] = otp
        session["last_mobile"] = mobile
        session["region"] = region
        preauth.save_session(token, session)

        util.log("info", "send_mobile_otp", "OTP generated", mobile=mobile, region=region)

        body = {
            "success": True,
            "message": f"OTP sent to {mobile}.",
        }
        if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
            util.log("debug", "send_mobile_otp", f"TEST MODE OTP: {otp}", mobile=mobile)

        return preauth.preauth_response(200, body, token)
    except Exception as exc:
        util.log("error", "send_mobile_otp", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def resend_mobile_otp(**kwargs):
    """
    Resends OTP to the same mobile number.
    """
    try:
        mobile = str(kwargs.get("mobile", "")).strip()
        token = kwargs.get("_preauth_token")
        session = kwargs.get("_preauth_session", {})

        if not util.is_valid_mobile(mobile):
            return error_response("Please enter a valid mobile number with country code.")

        otp = uuid_gen.generate_otp()
        session.setdefault("otp_map", {})[mobile] = otp
        preauth.save_session(token, session)

        util.log("info", "resend_mobile_otp", "OTP regenerated", mobile=mobile)

        body = {
            "success": True,
            "message": f"OTP resent to {mobile}.",
        }
        if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
            body["debugOtp"] = otp

        return preauth.preauth_response(200, body, token)
    except Exception as exc:
        util.log("error", "resend_mobile_otp", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def verify_mobile_otp(**kwargs):
    """
    Step 2 of the auth flow.
    """
    try:
        mobile = str(kwargs.get("mobile", "")).strip()
        otp = str(kwargs.get("otp", "")).strip()
        token = kwargs.get("_preauth_token")
        session = kwargs.get("_preauth_session", {})

        if not mobile or not otp:
            return error_response("Mobile number and OTP are required.")

        if not util.is_valid_mobile(mobile):
            return error_response("Please enter a valid mobile number with country code.")

        saved_otp = session.get("otp_map", {}).get(mobile)
        fixed_otp_allowed = util.is_test_otp_mode() and util.app_env() != "prod"
        using_fixed = fixed_otp_allowed and otp == "123456"

        if not saved_otp and not using_fixed:
            return preauth.preauth_response(400, {
                "success": False,
                "message": "OTP session expired. Please request a new OTP.",
            }, token)

        if saved_otp and saved_otp != otp and not using_fixed:
            return preauth.preauth_response(400, {
                "success": False,
                "message": "Invalid OTP. Please try again.",
            }, token)

        session.get("otp_map", {}).pop(mobile, None)

        phone_e164 = util.format_phone_in(mobile)
        
        user_exists = signup_signin_services.check_user_exists(phone_e164)

        if user_exists:
            preauth.delete_session(token)
            return success_response({
                "success": True,
                "userStatus": "existing",
                "message": "Mobile verified. Please sign in with your password.",
                "redirectUrl": "/signin?view=password"
            })

        session["verified_mobile"] = mobile
        session["otp_verified"] = True
        preauth.save_session(token, session)

        return preauth.preauth_response(200, {
            "success": True,
            "userStatus": "new",
            "message": "Mobile verified. Please complete your signup.",
            "redirectUrl": "/signup"
        }, token)
    except Exception as exc:
        util.log("error", "verify_mobile_otp", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def register_user_details(**kwargs):
    """
    Step 3 of the signup flow (new users only).
    """
    try:
        token = kwargs.get("_preauth_token")
        session = kwargs.get("_preauth_session", {})

        if not session.get("otp_verified") or not session.get("verified_mobile"):
            return error_response("Signup session expired. Please verify your mobile number again.", 401)

        username = str(kwargs.get("username", "")).strip()
        full_name = str(kwargs.get("fullName", "")).strip()
        dob = str(kwargs.get("dateOfBirth", "")).strip()
        gender = str(kwargs.get("gender", "")).strip()
        email = str(kwargs.get("email", "")).strip().lower()
        password = str(kwargs.get("password", "")).strip()
        mobile = str(kwargs.get("mobile", "")).strip()
        region = str(kwargs.get("region", "")).strip().upper()

        if not all([username, full_name, dob, gender, email, password, mobile, region]):
            return error_response("All fields are required.")

        if not re.match(r"^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9_.]{1,30}$", username):
            return error_response("Invalid username format.")

        if len(full_name) < 3:
            return error_response("Please enter a valid full name.")

        if not util.is_valid_date(dob):
            return error_response("Enter a valid date of birth (YYYY-MM-DD).")

        if not util.is_valid_email(email):
            return error_response("Enter a valid email address.")

        if not util.is_strong_password(password):
            return error_response("Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.")

        phone_e164 = util.format_phone_in(mobile)
        region = region if region else session.get("region", "IN") or "IN"

        result = signup_signin_services.execute_user_registration(
            username=username,
            full_name=full_name,
            dob=dob,
            gender=gender,
            email=email,
            password=password,
            phone_e164=phone_e164,
            region=region
        )

        if not result.get("success"):
            return error_response(result.get("error", "Signup failed"), result.get("code", 500))

        preauth.delete_session(token)

        return success_response({
            "success": True,
            "message": "Account created successfully.",
            "accessToken": result.get("accessToken"),
            "refreshToken": result.get("refreshToken"),
            "idToken": result.get("idToken"),
            "expiresIn": result.get("expiresIn"),
            "tokenType": "Bearer",
            "userStatus": "existing",
            "redirectUrl": result.get("redirectUrl", "/login.html"),
        })
    except Exception as exc:
        util.log("error", "register_user_details", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def login_with_password(**kwargs):
    """
    Authenticates a user via Cognito using their username/email/phone and password.
    """
    try:
        identifier = str(kwargs.get("identifier", "")).strip()
        password = str(kwargs.get("password", "")).strip()

        if not identifier or not password:
            return error_response("Identifier and password are required.")

        if util.is_valid_mobile(identifier):
            identifier = util.format_phone_in(identifier)

        result = cognito.authenticate_user(username=identifier, password=password)
        if not result:
            return error_response("Authentication failed.", 500)

        return success_response({
            "success": True,
            "message": "Signed in successfully.",
            "accessToken": result["accessToken"],
            "refreshToken": result["refreshToken"],
            "idToken": result["idToken"],
            "expiresIn": result["expiresIn"],
            "tokenType": "Bearer",
            "userStatus": "existing",
            "redirectUrl": "/home_page.html",
        })
    except Exception as exc:
        if hasattr(exc, '__class__'):
            name = exc.__class__.__name__
            if name == "NotAuthorizedException":
                return error_response("Invalid credentials.", 401)
            if name == "UserNotFoundException":
                return error_response("User not found.", 404)
        util.log("error", "login_with_password", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def refresh_token_action(**kwargs):
    """
    Refreshes an expired access token using a valid refresh token.
    """
    try:
        refresh_token_str = str(kwargs.get("refreshToken", "")).strip()

        if not refresh_token_str:
            return error_response("Refresh token is required.", 400)

        result = cognito.refresh_token(refresh_token_str)
        if not result or not result.get("accessToken"):
            return error_response("Invalid or expired refresh token.", 401)

        return success_response({
            "success": True,
            "message": "Token refreshed successfully.",
            "accessToken": result["accessToken"],
            "refreshToken": result["refreshToken"],
            "idToken": result["idToken"],
            "expiresIn": result["expiresIn"],
            "tokenType": "Bearer",
        })
    except Exception as exc:
        if hasattr(exc, '__class__'):
            name = exc.__class__.__name__
            if name in ["NotAuthorizedException", "UserNotFoundException"]:
                return error_response("Invalid or expired refresh token.", 401)
        util.log("error", "refresh_token_action", f"Action failed: {exc}")
        return error_response(f"Action error: {str(exc)}", 500)


def forgot_password_action(**kwargs):
    """
    Initiates Cognito password reset flow for a user by email or username.
    """
    try:
        identifier = str(kwargs.get("email") or kwargs.get("identifier") or "").strip()
        if not identifier:
            return error_response("Email or username is required.", 400)
        
        # Look up username in RDS if email was provided
        username = identifier
        if "@" in identifier:
            rds_result = rds.get_record("users", emailAddress=identifier)
            if rds_result.get("success"):
                username = rds_result.get("data", {}).get("userID") or rds_result.get("data", {}).get("userName") or identifier
        
        result = cognito.forgot_password(username=username)
        if not result.get("success"):
            return error_response(result.get("error", "Failed to initiate password reset."), 400)
            
        return success_response({
            "success": True,
            "message": "Password reset code sent to your registered contact."
        })
    except Exception as exc:
        util.log("error", "forgot_password_action", f"Action failed: {exc}")
        return error_response("Failed to initiate password reset.", 500)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION REGISTRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION_HANDLERS = {
    "CheckUsername":        check_username,
    "GetCountryCodes":      get_country_codes,
    "SendMobileOtp":        send_mobile_otp,
    "ResendMobileOtp":      resend_mobile_otp,
    "VerifyMobileOtp":      verify_mobile_otp,
    "RegisterUserDetails":  register_user_details,
    "LoginWithPassword":    login_with_password,
    "RefreshToken":         refresh_token_action,
    "ForgotPassword":       forgot_password_action,
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LAMBDA HANDLER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def lambda_handler(event, context):
    """
    Entry point for all signup/signin actions.

    Steps:
        A. Parse the JSON request body.
        B. Read the preauth token from X-HappniX-PreAuth header.
           - For SendMobileOtp: create a fresh session if none exists.
           - For all other actions: the session must already exist.
        C. Build a payload dict from the body (minus actionItem).
        D. Inject the preauth token and session into the payload as private kwargs.
        E. Call the matching action handler with **payload.
    """
    try:
        # A. Parse body
        body = util.parse_body(event)
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)

        action_item = body.get("actionItem")
        if not action_item:
            return error_response("Missing 'actionItem' in request body.", 400)

        # B. Resolve the action handler
        handler = ACTION_HANDLERS.get(action_item)
        if not handler:
            return error_response(f"Unknown action: {action_item}.", 400)

        # C. Read the preauth token from the request header
        incoming_token = util.extract_preauth_token(event)
        token = None
        session = {}

        if action_item == "SendMobileOtp":
            # Always create / retrieve a session — no prior token required
            token, session = preauth.get_or_create_session(incoming_token)
        elif action_item in {"LoginWithPassword", "GetCountryCodes", "CheckUsername", "RefreshToken", "ForgotPassword"}:
            # These actions do not use a preauth session
            pass
        else:
            # All other actions need an existing valid session
            token, session = preauth.get_session(incoming_token)
            if session is None:
                return error_response(
                    "Session expired or not found. "
                    "Please start the flow again.",
                    401
                )

        # D. Build payload — strip actionItem, inject private session fields
        payload = {k: v for k, v in body.items() if k != "actionItem"}
        payload["_preauth_token"] = token
        payload["_preauth_session"] = session

        # E. Call the handler
        return handler(**payload)

    except Exception as exc:
        util.log("error", "lambda_handler", f"Unhandled exception: {exc}")
        return error_response(f"Internal server error: {str(exc)}", 500)
