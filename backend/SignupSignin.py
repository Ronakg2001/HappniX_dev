import json
import os
import random
import re
import traceback
import uuid
from email.utils import parseaddr

try:
    from . import dev_store
except ImportError:  # pragma: no cover
    import dev_store


def _json_response(status_code, payload, trace_id=None):
    headers = {"Content-Type": "application/json"}
    if trace_id:
        headers["X-Happnix-Trace-Id"] = trace_id
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(payload),
    }


def _error(message, status_code=400, trace_id=None):
    payload = {"message": message}
    if trace_id:
        payload["traceId"] = trace_id
    return _json_response(status_code, payload, trace_id=trace_id)


def _parse_body(event):
    raw_body = event.get("body") or "{}"
    return json.loads(raw_body)


def _route_key(event):
    path = event.get("rawPath") or event.get("path") or ""
    return (event.get("httpMethod", "GET").upper(), path)


def _trace_id(event):
    request_context = event.get("requestContext") or {}
    return request_context.get("requestId") or uuid.uuid4().hex


def _log_trace(level, trace_id, message, **extra):
    log_payload = {"level": level, "traceId": trace_id, "message": message}
    if extra:
        log_payload["extra"] = extra
    print(json.dumps(log_payload, sort_keys=True))


def _ensure_trace_in_body(response, trace_id):
    if not trace_id:
        return response
    try:
        payload = json.loads(response.get("body") or "{}")
    except (TypeError, json.JSONDecodeError):
        return response
    if isinstance(payload, dict) and "traceId" not in payload:
        payload["traceId"] = trace_id
        response["body"] = json.dumps(payload)
    return response


def _generate_otp():
    return "".join(str(random.randint(0, 9)) for _ in range(6))


def _app_environment():
    return os.environ.get("APP_ENVIRONMENT", "dev").strip().lower()


def _test_otp_mode_enabled():
    return os.environ.get("TEST_OTP_MODE", "false").strip().lower() == "true"


def _fixed_test_otp_allowed():
    return (
        _test_otp_mode_enabled()
        and os.environ.get("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and _app_environment() != "prod"
    )


def _include_debug_otp():
    return _test_otp_mode_enabled() and _app_environment() in {"dev", "qa"}


def _set_session_cookie(response, session_token):
    if not session_token:
        return response
    response["headers"]["Set-Cookie"] = f"happnix_session={session_token}; Path=/; HttpOnly; SameSite=Lax"
    return response


def _extract_session_token(event):
    headers = event.get("headers") or {}
    cookie_header = headers.get("Cookie") or headers.get("cookie") or ""
    for chunk in cookie_header.split(";"):
        name, separator, value = chunk.strip().partition("=")
        if separator and name == "happnix_session":
            return value
    return None


def _get_or_create_session(event):
    incoming_token = _extract_session_token(event)
    token, session = dev_store.ensure_session(incoming_token)
    return token, session


def _save_session(token, session):
    dev_store.replace_session(token, session)


def _with_session(status_code, payload, session_token, trace_id=None):
    if trace_id:
        payload = {**payload, "traceId": trace_id}
    return _set_session_cookie(_json_response(status_code, payload, trace_id=trace_id), session_token)


def _is_valid_email(email):
    _, parsed = parseaddr(email)
    return bool(parsed and "@" in parsed and "." in parsed.split("@")[-1])


def _is_strong_password(password):
    return bool(re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$", password))


def _current_user(event):
    token = _extract_session_token(event)
    _, session = dev_store.get_session(token)
    if not session:
        return token, None, None
    user_id = session.get("authenticated_user_id")
    if not user_id:
        return token, session, None
    return token, session, dev_store.find_user_by_id(user_id)


def _can_create_or_join_parties(user):
    return bool(user and user.get("profile", {}).get("gov_id_verified"))


def _warning_verification_response(token, session):
    session["warning_verification_required"] = True
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": "Verification required before linking this device.",
            "loginStatus": "warning_verification_required",
            "overlapType": session.get("warning_overlap_type", "phone"),
            "redirectUrl": "/auth/warning-verification/",
        },
        token,
    )


def send_mobile_otp(event):
    payload = _parse_body(event)
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile.isdigit() or len(mobile) != 10:
        return _error("Please enter a valid 10-digit mobile number.")
    token, session = _get_or_create_session(event)
    otp = _generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    _save_session(token, session)
    response_payload = {
        "message": f"OTP sent successfully to {mobile}.",
    }
    if _include_debug_otp():
        response_payload["debugOtp"] = otp
    return _with_session(
        200,
        response_payload,
        token,
    )


def resend_mobile_otp(event):
    payload = _parse_body(event)
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile.isdigit() or len(mobile) != 10:
        return _error("Please enter a valid 10-digit mobile number.")
    token, session = _get_or_create_session(event)
    otp = _generate_otp()
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    _save_session(token, session)
    response_payload = {
        "message": f"OTP resent to {mobile}.",
    }
    if _include_debug_otp():
        response_payload["debugOtp"] = otp
    return _with_session(200, response_payload, token)


def verify_mobile_otp(event):
    payload = _parse_body(event)
    mobile = str(payload.get("mobile", "")).strip()
    otp = str(payload.get("otp", "")).strip()
    if not mobile or not otp:
        return _error("Mobile and OTP are required.")
    token, session = _get_or_create_session(event)
    mobile_otp_map = session.get("mobile_otp_map", {})
    saved_otp = mobile_otp_map.get(mobile)
    if not saved_otp:
        return _with_session(400, {"message": "OTP session expired. Please request a new OTP."}, token)
    if saved_otp != otp:
        if not (_fixed_test_otp_allowed() and otp == "123456"):
            return _with_session(400, {"message": "Invalid OTP."}, token)
    user = dev_store.find_user_by_mobile(mobile)
    mobile_otp_map.pop(mobile, None)
    session["mobile_otp_map"] = mobile_otp_map
    if session.get("warning_verification_required"):
        return _warning_verification_response(token, session)
    if user:
        session["authenticated_user_id"] = user["id"]
        session.pop("pending_signup_mobile", None)
        _save_session(token, session)
        full_name = (user.get("first_name") or user.get("username") or "User").strip()
        return _with_session(
            200,
            {
                "message": f"Welcome back, {full_name}! Mobile OTP verified.",
                "userStatus": "existing",
                "canCreateOrJoinParties": _can_create_or_join_parties(user),
                "redirectUrl": "/home/",
            },
            token,
        )
    session["pending_signup_mobile"] = mobile
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": "Mobile OTP verified. User not found; continue sign up.",
            "userStatus": "new",
            "canCreateOrJoinParties": False,
            "redirectUrl": "/signup/details/",
        },
        token,
    )


def forgot_password_request(event):
    payload = _parse_body(event)
    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return _error("Please enter your email address.")
    if not _is_valid_email(email):
        return _error("Please enter a valid email address.")
    if dev_store.email_exists(email):
        message = "Verification email request accepted. Please check your inbox."
    else:
        message = "If this email is registered, verification instructions will be sent."
    return _json_response(200, {"message": message})


def login_with_password(event):
    payload = _parse_body(event)
    identifier = str(payload.get("identifier", payload.get("username", ""))).strip()
    password = str(payload.get("password", "")).strip()
    if not identifier or not password:
        return _error("Username/email and password are required.")
    user = dev_store.find_user_by_identifier(identifier)
    if not user or not dev_store.verify_password(user, password):
        return _json_response(401, {"message": "Invalid username/email or password."})
    token, session = _get_or_create_session(event)
    session["authenticated_user_id"] = user["id"]
    _save_session(token, session)
    full_name = (user.get("first_name") or user.get("username") or "User").strip()
    return _with_session(
        200,
        {
            "message": f"Signed in successfully. Welcome, {full_name}.",
            "userStatus": "existing",
            "canCreateOrJoinParties": _can_create_or_join_parties(user),
            "redirectUrl": "/home/",
        },
        token,
    )


def register_user_details(event):
    token, session = _get_or_create_session(event)
    pending_mobile = session.get("pending_signup_mobile")
    if not pending_mobile:
        return _with_session(401, {"message": "Signup session expired. Verify mobile OTP again."}, token)
    payload = _parse_body(event)
    full_name = str(payload.get("fullName", "")).strip()
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()
    sex = str(payload.get("sex", "")).strip().lower()
    dob_text = str(payload.get("dateOfBirth", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    gov_id = str(payload.get("govId", "")).strip()
    if not all([full_name, username, password, sex, dob_text, email]):
        return _with_session(400, {"message": "All mandatory fields are required."}, token)
    if len(full_name) < 3:
        return _with_session(400, {"message": "Please enter a valid full name."}, token)
    if sex not in {"mr.", "miss.", "mrs.", "other"}:
        return _with_session(400, {"message": "Select a valid sex option."}, token)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", dob_text):
        return _with_session(400, {"message": "Enter a valid date of birth."}, token)
    if dev_store.username_exists(username):
        return _with_session(400, {"message": "Username already exists. Please choose another one."}, token)
    if dev_store.email_exists(email):
        return _with_session(400, {"message": "Email already registered. Please use another email."}, token)
    if not _is_valid_email(email):
        return _with_session(400, {"message": "Enter a valid email address."}, token)
    if not _is_strong_password(password):
        return _with_session(
            400,
            {
                "message": "Password must include uppercase, lowercase, number, special character, and minimum 8 characters."
            },
            token,
        )
    if dev_store.mobile_exists(pending_mobile):
        return _with_session(400, {"message": "Mobile number already registered."}, token)
    user = dev_store.create_user(
        full_name, username, password, email, sex, dob_text, pending_mobile, gov_id
    )
    session.pop("pending_signup_mobile", None)
    session["pending_profile_setup"] = True
    session["authenticated_user_id"] = user["id"]
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": "Details saved successfully. You can add profile details next.",
            "canCreateOrJoinParties": False,
            "redirectUrl": "/signup/profile/",
        },
        token,
    )


def complete_profile_setup(event):
    token, session, user = _current_user(event)
    if not user:
        return _json_response(401, {"message": "Please sign in first."})
    if not session or not session.get("pending_profile_setup"):
        return _with_session(400, {"message": "Profile setup session not found."}, token)
    payload = _parse_body(event)
    skip = bool(payload.get("skip", False))
    bio = str(payload.get("bio", "")).strip()
    profile_picture_url = str(payload.get("profilePictureUrl", "")).strip()
    if not skip:
        user = dev_store.update_user_profile(
            user["id"], bio=bio, profile_picture_url=profile_picture_url
        )
    session.pop("pending_profile_setup", None)
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": "Profile setup completed.",
            "canCreateOrJoinParties": _can_create_or_join_parties(user),
            "redirectUrl": "/home/",
        },
        token,
    )


def send_aadhaar_otp_api(event):
    token, session, user = _current_user(event)
    if not user:
        return _json_response(401, {"message": "Please sign in first."})
    payload = _parse_body(event)
    aadhaar_number = str(payload.get("aadhaarNumber", "")).strip()
    current_aadhaar = user.get("profile", {}).get("gov_id_number", "")
    if aadhaar_number:
        if not aadhaar_number.isdigit() or len(aadhaar_number) != 12:
            return _with_session(400, {"message": "Please enter a valid 12-digit Aadhaar number."}, token)
        dev_store.update_user_profile(user["id"], gov_id_number=aadhaar_number)
        current_aadhaar = aadhaar_number
    elif not current_aadhaar:
        return _with_session(400, {"message": "Please provide an Aadhaar number."}, token)
    session["aadhaar_client_id"] = f"demo-{current_aadhaar[-4:]}"
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": f"OTP sent successfully to mobile linked with Aadhaar ending in {current_aadhaar[-4:]}."
        },
        token,
    )


def verify_aadhaar_otp_api(event):
    token, session, user = _current_user(event)
    if not user:
        return _json_response(401, {"message": "Please sign in first."})
    if not session or not session.get("aadhaar_client_id"):
        return _with_session(400, {"message": "Session expired. Please request OTP again."}, token)
    payload = _parse_body(event)
    otp = str(payload.get("otp", "")).strip()
    if not otp:
        return _with_session(400, {"message": "Please enter the OTP."}, token)
    if otp != "123456":
        return _with_session(400, {"message": "Invalid OTP. Please try again."}, token)
    user = dev_store.update_user_profile(user["id"], gov_id_verified=True)
    session.pop("aadhaar_client_id", None)
    _save_session(token, session)
    return _with_session(
        200,
        {
            "message": "Aadhaar verified successfully! You can now host and join parties.",
            "isVerified": True,
            "canCreateOrJoinParties": _can_create_or_join_parties(user),
        },
        token,
    )


ROUTES = {
    ("POST", "/api/auth/mobile/send-otp"): send_mobile_otp,
    ("POST", "/api/auth/mobile/resend-otp"): resend_mobile_otp,
    ("POST", "/api/auth/mobile/verify-otp"): verify_mobile_otp,
    ("POST", "/api/auth/password/forgot"): forgot_password_request,
    ("POST", "/api/auth/username/login"): login_with_password,
    ("POST", "/api/signup/details"): register_user_details,
    ("POST", "/api/signup/profile"): complete_profile_setup,
    ("POST", "/api/auth/aadhaar/send-otp"): send_aadhaar_otp_api,
    ("POST", "/api/auth/aadhaar/verify-otp"): verify_aadhaar_otp_api,
}


def lambda_handler(event, context):
    del context
    trace_id = _trace_id(event)
    route_key = _route_key(event)
    _log_trace("info", trace_id, "Incoming request", method=route_key[0], path=route_key[1])
    handler = ROUTES.get(route_key)
    if handler is None:
        response = _error("Route not found.", status_code=404, trace_id=trace_id)
        _log_trace("warning", trace_id, "Route not found", method=route_key[0], path=route_key[1], statusCode=404)
        return response
    try:
        response = handler(event)
    except json.JSONDecodeError:
        response = _error("Invalid JSON body.", status_code=400, trace_id=trace_id)
        _log_trace("warning", trace_id, "Invalid JSON body", method=route_key[0], path=route_key[1], statusCode=400)
        return response
    except Exception as exc:  # pragma: no cover - exercised through test, message body not asserted
        _log_trace(
            "error",
            trace_id,
            "Unhandled exception in route handler",
            method=route_key[0],
            path=route_key[1],
            errorType=type(exc).__name__,
            errorMessage=str(exc),
            traceback=traceback.format_exc(),
        )
        return _error("Internal server error.", status_code=500, trace_id=trace_id)
    response.setdefault("headers", {})
    response["headers"].setdefault("X-Happnix-Trace-Id", trace_id)
    response = _ensure_trace_in_body(response, trace_id)
    _log_trace(
        "info",
        trace_id,
        "Request completed",
        method=route_key[0],
        path=route_key[1],
        statusCode=response.get("statusCode"),
    )
    return response
