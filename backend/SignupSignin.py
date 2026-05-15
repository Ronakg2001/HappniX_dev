import json
import os
import random
import re
import traceback
import uuid
from email.utils import parseaddr

try:
    from . import dev_store
    from . import auth_db
    from . import dynamo_db
except ImportError:
    import dev_store
    import auth_db
    import dynamo_db

try:
    import boto3
    cognito = boto3.client("cognito-idp")
except ImportError:
    boto3 = None
    cognito = None


# ══════════════════════════════════════════════════════════════════════
# Helpers (only shared utilities that are used by 2+ action methods)
# ══════════════════════════════════════════════════════════════════════

ENV = os.environ.get
APP_ENV = lambda: ENV("APP_ENVIRONMENT", "dev").strip().lower()
TEST_OTP = lambda: ENV("TEST_OTP_MODE", "false").strip().lower() == "true"


def _JsonResponse(statusCode, payload, traceId=None):
    headers = {"Content-Type": "application/json"}
    if traceId:
        headers["X-Happnix-Trace-Id"] = traceId
    return {
        "statusCode": statusCode,
        "headers": headers,
        "body": json.dumps(payload),
    }


def _Error(message, statusCode=400, traceId=None):
    payload = {"message": message}
    if traceId:
        payload["traceId"] = traceId
    return _JsonResponse(statusCode, payload, traceId=traceId)


def _LogTrace(level, traceId, message, **extra):
    logPayload = {"level": level, "traceId": traceId, "message": message}
    if extra:
        logPayload["extra"] = extra
    print(json.dumps(logPayload, sort_keys=True))


def _ExtractSessionToken(event):
    headers = event.get("headers") or {}
    cookieHeader = headers.get("Cookie") or headers.get("cookie") or ""
    for chunk in cookieHeader.split(";"):
        name, separator, value = chunk.strip().partition("=")
        if separator and name == "happnix_session":
            return value
    return None


def _GetOrCreateSession(event):
    incomingToken = _ExtractSessionToken(event)
    return dev_store.ensure_session(incomingToken)


def _WithSession(statusCode, payload, sessionToken, traceId=None):
    if traceId:
        payload = {**payload, "traceId": traceId}
    response = _JsonResponse(statusCode, payload, traceId=traceId)
    if sessionToken:
        response["headers"]["Set-Cookie"] = f"happnix_session={sessionToken}; Path=/; HttpOnly; SameSite=None; Secure"
    return response


def _IsValidEmail(email):
    _, parsed = parseaddr(email)
    return bool(parsed and "@" in parsed and "." in parsed.split("@")[-1])


def _CurrentUser(event):
    token = _ExtractSessionToken(event)
    _, session = dev_store.get_session(token)
    if not session:
        return token, None, None
    userId = session.get("authenticated_user_id")
    if not userId:
        return token, session, None
    return token, session, auth_db.get_user_by_sub(userId)


def _CanCreateOrJoinParties(user):
    return bool(user and user.get("adharVerified"))


# ══════════════════════════════════════════════════════════════════════
# Action Methods — each handles one actionItem from the frontend
# ══════════════════════════════════════════════════════════════════════

def SendMobileOtp(event, payload):
    """Send a 6-digit OTP to the provided mobile number."""
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile.isdigit() or len(mobile) != 10:
        return _Error("Please enter a valid 10-digit mobile number.")
    token, session = _GetOrCreateSession(event)
    otp = "".join(str(random.randint(0, 9)) for _ in range(6))
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    session["last_mobile"] = mobile
    dev_store.replace_session(token, session)
    responsePayload = {"message": f"OTP sent successfully to {mobile}."}
    if TEST_OTP() and APP_ENV() in {"dev", "qa"}:
        responsePayload["debugOtp"] = otp
    return _WithSession(200, responsePayload, token)


def ResendMobileOtp(event, payload):
    """Resend OTP to the same mobile number."""
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile.isdigit() or len(mobile) != 10:
        return _Error("Please enter a valid 10-digit mobile number.")
    token, session = _GetOrCreateSession(event)
    otp = "".join(str(random.randint(0, 9)) for _ in range(6))
    session.setdefault("mobile_otp_map", {})[mobile] = otp
    dev_store.replace_session(token, session)
    responsePayload = {"message": f"OTP resent to {mobile}."}
    if TEST_OTP() and APP_ENV() in {"dev", "qa"}:
        responsePayload["debugOtp"] = otp
    return _WithSession(200, responsePayload, token)


def VerifyMobileOtp(event, payload):
    """Verify OTP and determine if user is new or existing."""
    mobile = str(payload.get("mobile", "")).strip()
    otp = str(payload.get("otp", "")).strip()
    if not mobile or not otp:
        return _Error("Mobile and OTP are required.")
    token, session = _GetOrCreateSession(event)
    mobileOtpMap = session.get("mobile_otp_map", {})
    savedOtp = mobileOtpMap.get(mobile)
    if not savedOtp:
        return _WithSession(400, {"message": "OTP session expired. Please request a new OTP."}, token)
    # Check OTP — allow 123456 in dev when test mode is on
    fixedOtpAllowed = (
        TEST_OTP()
        and ENV("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and APP_ENV() != "prod"
    )
    if savedOtp != otp and not (fixedOtpAllowed and otp == "123456"):
        return _WithSession(400, {"message": "Invalid OTP."}, token)
    formattedMobile = mobile if str(mobile).startswith("+") else f"+91{mobile}"
    user = auth_db.get_user_by_mobile(formattedMobile)
    mobileOtpMap.pop(mobile, None)
    session["mobile_otp_map"] = mobileOtpMap
    # Warning verification flow (device overlap)
    if session.get("warning_verification_required"):
        session["warning_verification_required"] = True
        dev_store.replace_session(token, session)
        return _WithSession(200, {
            "message": "Verification required before linking this device.",
            "loginStatus": "warning_verification_required",
            "overlapType": session.get("warning_overlap_type", "phone"),
            "redirectUrl": "/auth/warning-verification/",
        }, token)
    if user:
        session["authenticated_user_id"] = user["cognitoSub"]
        session.pop("pending_signup_mobile", None)
        dev_store.replace_session(token, session)
        fullName = (user.get("userName") or "User").strip()
        return _WithSession(200, {
            "message": f"Welcome back, {fullName}! Mobile OTP verified.",
            "userStatus": "existing",
            "canCreateOrJoinParties": _CanCreateOrJoinParties(user),
            "redirectUrl": "/home_page.html",
        }, token)
    session["pending_signup_mobile"] = mobile
    dev_store.replace_session(token, session)
    return _WithSession(200, {
        "message": "Mobile OTP verified. User not found; continue sign up.",
        "userStatus": "new",
        "canCreateOrJoinParties": False,
        "redirectUrl": "/signup_details.html",
    }, token)


def LoginWithPassword(event, payload):
    """Authenticate with username/email and password via Cognito."""
    identifier = str(payload.get("identifier", payload.get("username", ""))).strip()
    password = str(payload.get("password", "")).strip()
    if not identifier or not password:
        return _Error("Username/email and password are required.")
        
    userPoolId = os.environ.get("COGNITO_USER_POOL_ID")
    clientId = os.environ.get("COGNITO_USER_POOL_CLIENT_ID")
    
    fullName = "User"
    user_id = None
    
    if cognito and userPoolId and clientId:
        try:
            response = cognito.admin_initiate_auth(
                UserPoolId=userPoolId,
                ClientId=clientId,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': identifier,
                    'PASSWORD': password
                }
            )
            # Fetch user details to get sub and name
            user_info = cognito.admin_get_user(
                UserPoolId=userPoolId,
                Username=identifier
            )
            user_id = next((attr["Value"] for attr in user_info["UserAttributes"] if attr["Name"] == "sub"), None)
            fullName = next((attr["Value"] for attr in user_info["UserAttributes"] if attr["Name"] == "name"), identifier)
        except (cognito.exceptions.NotAuthorizedException, cognito.exceptions.UserNotFoundException):
            return _JsonResponse(401, {"message": "Invalid username/email or password."})
        except Exception as e:
            return _Error(f"Login failed: {str(e)}", statusCode=500)
    else:
        # Fallback for local mock testing if Cognito isn't set up
        user = auth_db.get_user_by_identifier(identifier)
        if not user:
            return _JsonResponse(401, {"message": "Invalid username/email or password."})
        user_id = user["cognitoSub"]
        fullName = (user.get("userName") or "User").strip()

    token, session = _GetOrCreateSession(event)
    session["authenticated_user_id"] = user_id
    dev_store.replace_session(token, session)
    
    # Check if user has government ID verified for party creation
    can_create = False
    fallback_user = auth_db.get_user_by_identifier(identifier)
    if fallback_user:
        can_create = _CanCreateOrJoinParties(fallback_user)

    return _WithSession(200, {
        "message": f"Signed in successfully. Welcome, {fullName}.",
        "userStatus": "existing",
        "canCreateOrJoinParties": can_create,
        "redirectUrl": "/home_page.html",
    }, token)


def ForgotPasswordRequest(event, payload):
    """Handle forgot password email request."""
    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return _Error("Please enter your email address.")
    if not _IsValidEmail(email):
        return _Error("Please enter a valid email address.")
    if dev_store.email_exists(email):
        message = "Verification email request accepted. Please check your inbox."
    else:
        message = "If this email is registered, verification instructions will be sent."
    return _JsonResponse(200, {"message": message})


def RegisterUserDetails(event, payload):
    """Register new user with full details after OTP verification."""
    token, session = _GetOrCreateSession(event)
    pendingMobile = session.get("pending_signup_mobile")
    if not pendingMobile:
        return _WithSession(401, {"message": "Signup session expired. Verify mobile OTP again."}, token)
    fullName = str(payload.get("fullName", "")).strip()
    userName = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()
    sex = str(payload.get("sex", "")).strip().lower()
    dobText = str(payload.get("dateOfBirth", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    govId = str(payload.get("govId", "")).strip()
    if not all([fullName, userName, password, sex, dobText, email]):
        return _WithSession(400, {"message": "All mandatory fields are required."}, token)
    if len(fullName) < 3:
        return _WithSession(400, {"message": "Please enter a valid full name."}, token)
    if sex not in {"mr.", "miss.", "mrs.", "other"}:
        return _WithSession(400, {"message": "Select a valid sex option."}, token)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", dobText):
        return _WithSession(400, {"message": "Enter a valid date of birth."}, token)
    if auth_db.get_user_by_identifier(userName):
        return _WithSession(400, {"message": "Username already exists. Please choose another one."}, token)
    if auth_db.get_user_by_identifier(email):
        return _WithSession(400, {"message": "Email already registered. Please use another email."}, token)
    if not _IsValidEmail(email):
        return _WithSession(400, {"message": "Enter a valid email address."}, token)
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$", password):
        return _WithSession(400, {
            "message": "Password must include uppercase, lowercase, number, special character, and minimum 8 characters."
        }, token)
    if auth_db.get_user_by_mobile(pendingMobile):
        return _WithSession(400, {"message": "Mobile number already registered."}, token)
        
    userPoolId = os.environ.get("COGNITO_USER_POOL_ID")
    cognito_sub = None
    formattedMobile = pendingMobile if str(pendingMobile).startswith("+") else f"+91{pendingMobile}"
    
    if cognito and userPoolId:
        response = cognito.admin_create_user(
            UserPoolId=userPoolId,
            Username=userName,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "phone_number", "Value": formattedMobile},
                {"Name": "preferred_username", "Value": userName},
                {"Name": "name", "Value": fullName},
                {"Name": "custom:dateOfBirth", "Value": dobText},
                {"Name": "custom:userType", "Value": "General"},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "phone_number_verified", "Value": "true"}
            ],
            MessageAction="SUPPRESS"
        )
        cognito_sub = next((attr["Value"] for attr in response["User"]["Attributes"] if attr["Name"] == "sub"), None)
        cognito.admin_set_user_password(
            UserPoolId=userPoolId,
            Username=userName,
            Password=password,
            Permanent=True
        )

    if not cognito_sub:
        cognito_sub = f"mock-{uuid.uuid4().hex[:12]}"

    # Generate 8-char unique User ID
    user_id = "".join(random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(8))

    # 1. Save core auth identity to RDS (PostgreSQL)
    auth_db.upsert_cognito_user({
        "userID": user_id,
        "cognitoSub": cognito_sub,
        "userName": userName,
        "emailAddress": email,
        "userType": "General",
        "phoneNumber": formattedMobile,
        "emailVerified": True,
        "isActive": True,
        "dateOfBirth": dobText
    })

    # 2. Save structured personal details to DynamoDB (using userID as PK)
    dynamo_db.put_user_profile(user_id, userName, {
        "fullName": fullName,
        "email": email,
        "phoneNumber": formattedMobile,
        "address": "", # can be extended in UI later
        "aadharNumber": govId
    })

    session.pop("pending_signup_mobile", None)
    session["pending_profile_setup"] = True
    session["authenticated_user_id"] = cognito_sub
    dev_store.replace_session(token, session)
    return _WithSession(200, {
        "message": "Details saved successfully. You can add profile details next.",
        "canCreateOrJoinParties": False,
        "redirectUrl": "/signup_profile_optional.html",
    }, token)


def CompleteProfileSetup(event, payload):
    """Save optional profile details (bio, picture) or skip."""
    token, session, user = _CurrentUser(event)
    if not user:
        return _JsonResponse(401, {"message": "Please sign in first."})
    if not session or not session.get("pending_profile_setup"):
        return _WithSession(400, {"message": "Profile setup session not found."}, token)
    if not payload.get("skip", False):
        bio = str(payload.get("bio", "")).strip()
        profilePictureUrl = str(payload.get("profilePictureUrl", "")).strip()
        auth_db.update_user_profile(user["cognitoSub"], bio=bio, profile_picture_url=profilePictureUrl)
        user["bio"] = bio
        user["profilePictureUrl"] = profilePictureUrl
    session.pop("pending_profile_setup", None)
    dev_store.replace_session(token, session)
    return _WithSession(200, {
        "message": "Profile setup completed.",
        "canCreateOrJoinParties": _CanCreateOrJoinParties(user),
        "redirectUrl": "/home_page.html",
    }, token)


def SendAadhaarOtp(event, payload):
    """Send OTP for Aadhaar verification."""
    token, session, user = _CurrentUser(event)
    if not user:
        return _JsonResponse(401, {"message": "Please sign in first."})
    aadhaarNumber = str(payload.get("aadhaarNumber", "")).strip()
    currentAadhaar = user.get("profile", {}).get("gov_id_number", "")
    if aadhaarNumber:
        if not aadhaarNumber.isdigit() or len(aadhaarNumber) != 12:
            return _WithSession(400, {"message": "Please enter a valid 12-digit Aadhaar number."}, token)
        dev_store.update_user_profile(user["id"], gov_id_number=aadhaarNumber)
        currentAadhaar = aadhaarNumber
    elif not currentAadhaar:
        return _WithSession(400, {"message": "Please provide an Aadhaar number."}, token)
    session["aadhaar_client_id"] = f"demo-{currentAadhaar[-4:]}"
    dev_store.replace_session(token, session)
    return _WithSession(200, {
        "message": f"OTP sent successfully to mobile linked with Aadhaar ending in {currentAadhaar[-4:]}."
    }, token)


def VerifyAadhaarOtp(event, payload):
    """Verify Aadhaar OTP and mark user as gov ID verified."""
    token, session, user = _CurrentUser(event)
    if not user:
        return _JsonResponse(401, {"message": "Please sign in first."})
    if not session or not session.get("aadhaar_client_id"):
        return _WithSession(400, {"message": "Session expired. Please request OTP again."}, token)
    otp = str(payload.get("otp", "")).strip()
    if not otp:
        return _WithSession(400, {"message": "Please enter the OTP."}, token)
    if otp != "123456":
        return _WithSession(400, {"message": "Invalid OTP. Please try again."}, token)
    user = dev_store.update_user_profile(user["id"], gov_id_verified=True)
    session.pop("aadhaar_client_id", None)
    dev_store.replace_session(token, session)
    return _WithSession(200, {
        "message": "Aadhaar verified successfully! You can now host and join parties.",
        "isVerified": True,
        "canCreateOrJoinParties": _CanCreateOrJoinParties(user),
    }, token)


def GetDevAuthStatus(event, payload):
    """Return dev environment status — schema health, Cognito config."""
    if APP_ENV() != "dev":
        return _JsonResponse(404, {"message": "Route not found."})
    usersReady = auth_db.table_exists("users")
    devicesReady = auth_db.table_exists("user_devices")
    return _JsonResponse(200, {
        "apiStatus": "ok",
        "environment": APP_ENV(),
        "cognitoRegion": ENV("COGNITO_REGION", ""),
        "cognitoUserPoolId": ENV("COGNITO_USER_POOL_ID", ""),
        "cognitoUserPoolClientId": ENV("COGNITO_USER_POOL_CLIENT_ID", ""),
        "databaseEndpoint": ENV("AUTH_DB_HOST", ""),
        "databasePort": ENV("AUTH_DB_PORT", ""),
        "databasePassword": ENV("AUTH_DB_PASSWORD", "PASSWORD_NOT_FOUND"),
        "tables": {"users": usersReady, "user_devices": devicesReady},
    })


def WipeDevUsers(event, payload):
    """Temporary dev endpoint to wipe all users from RDS."""
    if APP_ENV() != "dev":
        return _JsonResponse(403, {"message": "Forbidden outside of dev."})
    try:
        auth_db.execute_sql_script("DELETE FROM user_devices; DELETE FROM users;")
        return _JsonResponse(200, {"message": "All users and devices deleted from RDS successfully!"})
    except Exception as e:
        return _Error(f"Failed to wipe users: {e}", statusCode=500)


def GetDevAllUsers(event, payload):
    """Temporary dev endpoint to fetch all users from RDS."""
    if APP_ENV() != "dev":
        return _JsonResponse(403, {"message": "Forbidden outside of dev."})
    try:
        users = auth_db.get_all_users()
        return _JsonResponse(200, {"users": users})
    except Exception as e:
        return _Error(f"Failed to fetch users: {e}", statusCode=500)


def GetCurrentUser(event, payload):
    """Return the currently authenticated user's profile for the home page."""
    token, session, user = _CurrentUser(event)
    if not user:
        return _JsonResponse(401, {"message": "Not authenticated."})
    return _WithSession(200, {
        "userName": user.get("userName") or user.get("username") or "",
        "profilePictureUrl": user.get("profilePictureUrl") or "",
        "isVerified": bool(user.get("adharVerified") or user.get("gov_id_verified")),
        "bio": user.get("bio") or "",
    }, token)


# ══════════════════════════════════════════════════════════════════════
# Action Registry
# ══════════════════════════════════════════════════════════════════════

ACTION_REGISTRY = {
    "SendMobileOtp": SendMobileOtp,
    "ResendMobileOtp": ResendMobileOtp,
    "VerifyMobileOtp": VerifyMobileOtp,
    "LoginWithPassword": LoginWithPassword,
    "ForgotPasswordRequest": ForgotPasswordRequest,
    "RegisterUserDetails": RegisterUserDetails,
    "CompleteProfileSetup": CompleteProfileSetup,
    "SendAadhaarOtp": SendAadhaarOtp,
    "VerifyAadhaarOtp": VerifyAadhaarOtp,
    "GetDevAuthStatus": GetDevAuthStatus,
    "GetCurrentUser": GetCurrentUser,
    "WipeDevUsers": WipeDevUsers,
    "GetDevAllUsers": GetDevAllUsers,
}


# ══════════════════════════════════════════════════════════════════════
# Lambda Entry Point
# ══════════════════════════════════════════════════════════════════════

def lambda_handler(event, context):
    try:
        response = _lambda_handler_inner(event, context)
    except Exception as exc:
        response = _Error(f"Unhandled exception: {str(exc)}", statusCode=500)
    
    response.setdefault("headers", {})
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin") or "https://happnix-dev.ronakgo1.workers.dev"
    response["headers"]["Access-Control-Allow-Origin"] = origin
    response["headers"]["Access-Control-Allow-Credentials"] = "true"
    return response

def _lambda_handler_inner(event, context):
    del context
    requestContext = event.get("requestContext") or {}
    traceId = requestContext.get("requestId") or uuid.uuid4().hex

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _Error("Invalid JSON body.", statusCode=400, traceId=traceId)

    actionItem = str(payload.get("actionItem", "")).strip()
    _LogTrace("info", traceId, "Incoming request", actionItem=actionItem)

    if not actionItem:
        return _Error("Missing actionItem in request body.", statusCode=400, traceId=traceId)

    handler = ACTION_REGISTRY.get(actionItem)
    if handler is None:
        _LogTrace("warning", traceId, "Unknown actionItem", actionItem=actionItem)
        return _Error(
            f"Unknown actionItem: {actionItem}. Available: {', '.join(sorted(ACTION_REGISTRY.keys()))}",
            statusCode=400, traceId=traceId,
        )

    try:
        response = handler(event, payload)
    except Exception as exc:
        _LogTrace("error", traceId, "Unhandled exception",
                  actionItem=actionItem, errorType=type(exc).__name__,
                  errorMessage=str(exc), traceback=traceback.format_exc())
        return _Error(f"Internal server error: {str(exc)}", statusCode=500, traceId=traceId)

    response.setdefault("headers", {})
    response["headers"].setdefault("X-Happnix-Trace-Id", traceId)
    
    # CORS headers are now injected by the lambda_handler wrapper

    try:
        bodyPayload = json.loads(response.get("body") or "{}")
        if isinstance(bodyPayload, dict) and "traceId" not in bodyPayload:
            bodyPayload["traceId"] = traceId
            response["body"] = json.dumps(bodyPayload)
    except (TypeError, json.JSONDecodeError):
        pass
    _LogTrace("info", traceId, "Request completed",
              actionItem=actionItem, statusCode=response.get("statusCode"))
    return response
