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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTION HANDLERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def check_username(**kwargs):
    """
    Checks if a username is available.
    Does not require a preauth session.
    """
    username = str(kwargs.get("username", "")).strip()

    if not username:
        return success_response({"success": True, "available": False, "message": "Username is required."})

    if not re.match(r"^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9_.]{1,30}$", username):
        return success_response({"success": True, "available": False, "message": "Invalid username format."})

    from integration import rds
    user_exists = rds.record_exists("userName", username)
    
    return success_response({
        "success": True,
        "available": not user_exists
    })


def get_country_codes(**kwargs):
    """
    Returns the region_code_mapping from dependencies.py to the frontend.
    Used to populate the country-code dropdown on the /signin page.

    No preauth session required — this is publicly accessible static data.
    """
    return success_response({
        "success": True,
        "countries": dependencies.region_code_mapping,
    })


def send_mobile_otp(**kwargs):
    """
    Step 1 of the auth flow.
    Generates an OTP for the given mobile number and stores it in a new
    (or existing) preauth session.
    """
    mobile = str(kwargs.get("mobile", "")).strip()
    region = str(kwargs.get("region", "IN")).strip().upper()
    token = kwargs.get("_preauth_token")
    session = kwargs.get("_preauth_session", {})

    if not util.is_valid_mobile(mobile):
        return error_response("Please enter a valid mobile number with country code.")

    otp = uuid_gen.generate_otp()
    session.setdefault("otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    session["region"] = region          # store for SMS gateway routing later
    preauth.save_session(token, session)

    # TODO: integrate SMS gateway here (e.g. Twilio, AWS SNS)
    util.log("info", "send_mobile_otp", "OTP generated", mobile=mobile, region=region)

    body = {
        "success": True,
        "message": f"OTP sent to {mobile}.",
    }
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp

    return preauth.preauth_response(200, body, token)


def resend_mobile_otp(**kwargs):
    """
    Resends OTP to the same mobile number.
    Requires a valid preauth token (set by SendMobileOtp).
    """
    mobile = str(kwargs.get("mobile", "")).strip()
    token = kwargs.get("_preauth_token")
    session = kwargs.get("_preauth_session", {})

    if not util.is_valid_mobile(mobile):
        return error_response("Please enter a valid mobile number with country code.")

    otp = uuid_gen.generate_otp()
    session.setdefault("otp_map", {})[mobile] = otp
    preauth.save_session(token, session)

    # TODO: integrate SMS gateway here
    util.log("info", "resend_mobile_otp", "OTP regenerated", mobile=mobile)

    body = {
        "success": True,
        "message": f"OTP resent to {mobile}.",
    }
    if util.is_test_otp_mode() and util.app_env() in {"dev", "qa"}:
        body["debugOtp"] = otp

    return preauth.preauth_response(200, body, token)


def verify_mobile_otp(**kwargs):
    """
    Step 2 of the auth flow.
    Validates the OTP. On success, checks Cognito to determine whether the
    mobile number belongs to an existing user or a new one.
    """
    mobile = str(kwargs.get("mobile", "")).strip()
    otp = str(kwargs.get("otp", "")).strip()
    token = kwargs.get("_preauth_token")
    session = kwargs.get("_preauth_session", {})

    if not mobile or not otp:
        return error_response("Mobile number and OTP are required.")

    if not util.is_valid_mobile(mobile):
        return error_response("Please enter a valid mobile number with country code.")

    # ── OTP verification ───────────────────────────────────────────────────────
    saved_otp = session.get("otp_map", {}).get(mobile)

    fixed_otp_allowed = (
        util.is_test_otp_mode()
        and util.app_env() != "prod"
    )
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

    # ── Clear used OTP ─────────────────────────────────────────────────────────
    session.get("otp_map", {}).pop(mobile, None)

    # ── Check if user already exists in Cognito and RDS ────────────────────────────────
    phone_e164 = util.format_phone_in(mobile)
    from integration import rds
    
    # We check Cognito first as the primary identity store
    cognito_exists = cognito.user_exists("phone_number", phone_e164)
    
    # We also check RDS, and require both to be true
    rds_exists = rds.record_exists("phoneNumber", phone_e164)
    
    user_exists = cognito_exists and rds_exists

    if user_exists:
        # Existing user — clear session, tell frontend to proceed to login
        preauth.delete_session(token)
        return success_response({
            "success": True,
            "userStatus": "existing",
            "message": "Mobile verified. Please sign in with your password.",
        })

    # New user — save the verified mobile in session for RegisterUserDetails
    session["verified_mobile"] = mobile
    session["otp_verified"] = True
    preauth.save_session(token, session)

    return preauth.preauth_response(200, {
        "success": True,
        "userStatus": "new",
        "message": "Mobile verified. Please complete your signup.",
    }, token)


def register_user_details(**kwargs):
    """
    Step 3 of the signup flow (new users only).
    Registers the user in Cognito and saves their details.
    """
    token = kwargs.get("_preauth_token")
    session = kwargs.get("_preauth_session", {})

    # ── Guard: must have a verified OTP session ────────────────────────────────
    if not session.get("otp_verified"):
        return error_response(
            "Signup session expired. Please verify your mobile number again.",
            401
        )

    verified_mobile = session.get("verified_mobile", "")
    if not verified_mobile:
        return error_response(
            "Signup session expired. Please verify your mobile number again.",
            401
        )

    # ── Extract and validate fields ────────────────────────────────────────────
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
        return error_response(
            "Password must include uppercase, lowercase, number, "
            "special character, and be at least 8 characters long."
        )

    # ── Verify uniqueness in RDS before creating in Cognito ────────────────────
    if rds.record_exists("userName", username):
        return error_response("Username is already taken.")
        
    if rds.record_exists("emailAddress", email):
        return error_response("Email address is already registered.")

    # ── Create user in Cognito ─────────────────────────────────────────────────
    phone_e164 = util.format_phone_in(mobile)
    region = region if region else session.get("region", "IN") or "IN"

    # Generate the UUIDv7 userID — entity=USER/GENERAL by default, embeds region & timestamp
    user_id = uuid_gen.generate_user_id(region_iso=region, user_type="GENERAL")

    try:
        cognito_sub = cognito.create_user(
            username=username,
            email=email,
            phone_e164=phone_e164,
            password=password,
            user_id=user_id,
        )
    except Exception as exc:
        exc_name = exc.__class__.__name__
        util.log("error", "register_user_details",
                 f"Cognito create_user raised {exc_name}: {exc}",
                 username=username, user_id=user_id)

        if exc_name == "UsernameExistsException":
            return error_response("Username is already taken.", 409)
        if exc_name == "InvalidPasswordException":
            return error_response("Password does not meet Cognito requirements.", 400)
        if exc_name == "InvalidParameterException":
            return error_response(f"Invalid parameter: {exc}", 400)

        # Catch-all — log full error and surface it so it is traceable
        return error_response(
            f"Could not create your account. Reason: {exc_name} — {exc}", 500
        )

    util.log("info", "register_user_details", "Cognito user created",
        username=username, user_id=user_id, cognito_sub=cognito_sub)

    # ── Insert user directly into RDS ──────────────────────────────────────────
    rds_result = rds.insert_user(
        user_id=user_id,
        cognito_sub=cognito_sub,
        username=username,
        email=email,
        phone_number=phone_e164,
        full_name=full_name,
        dob=dob,
        gender=gender,
        region=region,
        email_verified=True,
    )

    if not rds_result.get("success"):
        # RDS failed — roll back by deleting the Cognito user to keep stores in sync
        util.log("error", "register_user_details",
                 f"RDS insert failed after Cognito success — rolling back Cognito user. Error: {rds_result.get('error')}",
                 username=username, user_id=user_id)
        try:
            cognito.delete_user(username)
        except Exception as del_exc:
            util.log("error", "register_user_details",
                     f"Cognito rollback also failed: {del_exc}", username=username)
        return error_response(
            "Account creation failed at database step. Please try again.", 500
        )

    util.log("info", "register_user_details", "User inserted into RDS successfully",
        username=username, user_id=user_id)

    # ── Cleanup preauth session — no longer needed ─────────────────────────────
    preauth.delete_session(token)

    return success_response({
        "success": True,
        "message": "Account created successfully. Please sign in.",
        "redirectUrl": "/login.html",
    })


def login_with_password(**kwargs):
    """
    Authenticates a user via Cognito using their username/email/phone and password.
    Returns the real JWT access token. Does not require a preauth session.
    """
    identifier = str(kwargs.get("identifier", "")).strip()
    password = str(kwargs.get("password", "")).strip()

    if not identifier or not password:
        return error_response("Identifier and password are required.")

    # In Cognito, the field is USERNAME but it accepts email or phone (if configured)
    # If the user typed a 10-digit mobile number, format it to E.164
    if util.is_valid_mobile(identifier):
        identifier = util.format_phone_in(identifier)

    try:
        result = cognito.authenticate_user(identifier, password)
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
        util.log("error", "login_with_password", f"Cognito login failed: {exc}")
        return error_response("Login failed due to server error.", 500)


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
        elif action_item in {"LoginWithPassword", "GetCountryCodes", "CheckUsername"}:
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
        return error_response("Internal server error.", 500)
