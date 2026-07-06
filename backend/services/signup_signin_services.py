"""
signup_signin_services.py — specific logic for signup/signin.
Orchestrates Cognito, RDS, DynamoDB, and Preauth session logic for heavy tasks.
"""
from utils import utilities as util
from utils import uuid_generator as uuid_gen
from integration import cognito_auth as cognito
from integration import rds
from integration import dynamo_db
from utils import manifest


def check_user_exists(phone_e164: str) -> bool:
    """
    Checks both Cognito and RDS to see if a user exists.
    """
    cognito_exists = cognito.user_exists(phone_number=phone_e164)
    rds_exists = rds.record_exists("users", phoneNumber=phone_e164)
    return cognito_exists and rds_exists


def is_username_available(username: str) -> bool:
    """
    Checks both Cognito and RDS to see if a username is available.
    Returns True if available, False if already taken.
    """
    cognito_exists = cognito.user_exists(username=username)
    rds_exists = rds.record_exists("users", userName=username)
    return not (cognito_exists or rds_exists)


def execute_user_registration(
    username: str,
    full_name: str,
    dob: str,
    gender: str,
    email: str,
    password: str,
    phone_e164: str,
    region: str
) -> dict:
    """
    Executes the heavy DB orchestration for creating a user.
    Assumes all validation has already been performed by the handler.
    """
    # ── Verify uniqueness in RDS before creating in Cognito ────────────────────
    if rds.record_exists("users", userName=username):
        return {"success": False, "error": "Username is already taken.", "code": 409}
        
    if rds.record_exists("users", emailAddress=email):
        return {"success": False, "error": "Email address is already registered.", "code": 409}

    # Generate the UUIDv7 userID
    user_id = uuid_gen.generate_user_id(region_iso=region, user_type="GENERAL")

    try:
        cognito_sub = cognito.create_user(
            username=user_id,
            email=email,
            phone_e164=phone_e164,
            password=password,
            user_id=user_id,
            preferred_username=username,
        )
    except Exception as exc:
        exc_name = exc.__class__.__name__
        util.log("error", "execute_user_registration", f"Cognito create_user raised {exc_name}: {exc}", username=username, user_id=user_id)
        if exc_name == "UsernameExistsException":
            return {"success": False, "error": "Username is already taken.", "code": 409}
        if exc_name == "InvalidPasswordException":
            return {"success": False, "error": "Password does not meet Cognito requirements.", "code": 400}
        if exc_name == "InvalidParameterException":
            return {"success": False, "error": f"Invalid parameter: {exc}", "code": 400}
        return {"success": False, "error": f"Could not create your account. Reason: {exc_name} — {exc}", "code": 500}

    util.log("info", "execute_user_registration", "Cognito user created", username=username, user_id=user_id, cognito_sub=cognito_sub)

    rds_result = rds.insert_record(
        table_name="users",
        userID=user_id,
        cognitoSub=cognito_sub,
        userName=username,
        emailAddress=email,
        phoneNumber=phone_e164,
        fullName=full_name,
        dateOfBirth=dob,
        gender=gender,
        region=region,
        emailVerified=False,
    )

    if not rds_result.get("success"):
        util.log("error", "execute_user_registration", f"RDS insert failed after Cognito success. Error: {rds_result.get('error')}", username=username, user_id=user_id)
        try:
            cognito.delete_user(username=user_id)
        except Exception as del_exc:
            util.log("error", "execute_user_registration", f"Cognito rollback also failed: {del_exc}", username=user_id)
        return {"success": False, "error": "Account creation failed at database step. Please try again.", "code": 500}

    util.log("info", "execute_user_registration", "User inserted into RDS successfully", username=username, user_id=user_id)

    dynamo_result = create_user_entities(
        user_id=user_id,
        username=username,
        full_name=full_name,
        cognitoSub=cognito_sub,
        dob=dob,
        gender=gender,
        email=email,
        phone_number=phone_e164,
        region=region,
    )
    if not dynamo_result.get("success"):
        util.log("warning", "execute_user_registration", "DynamoDB entity creation failed (non-fatal)", user_id=user_id, error=dynamo_result.get("error"))

    try:
        auth_result = cognito.authenticate_user(username=user_id, password=password)
    except Exception as exc:
        util.log("error", "execute_user_registration", f"Auto-login failed after signup: {exc}")
        auth_result = None

    return {
        "success": True, 
        "redirectUrl": "/home_page.html",
        "accessToken": auth_result.get("accessToken") if auth_result else None,
        "refreshToken": auth_result.get("refreshToken") if auth_result else None,
        "idToken": auth_result.get("idToken") if auth_result else None,
        "expiresIn": auth_result.get("expiresIn") if auth_result else None,
    }


def create_user_entities(**kwargs) -> dict:
    """
    Create both PROFILE and SETTINGS rows for a new user in a single batch_write call.
    Uses the generic dynamo_db batch_write_items method.
    """
    user_id = kwargs.get("user_id", None)
    username = kwargs.get("username")
    
    if not user_id:
        return {"success": False, "error": "user_id is required to create entities."}

    items_config = [
        {
            "entity_type": "PROFILE",
            "pk_value": user_id,
            "kwargs": kwargs
        },
        {
            "entity_type": "SETTINGS",
            "pk_value": user_id,
            "kwargs": kwargs
        }
    ]

    result = dynamo_db.batch_write_items(
        table_key="users",
        items_config=items_config
    )
    
    if result.get("success"):
        util.log("info", "signup_signin_services.create_user_entities",
                 "PROFILE + SETTINGS created in DynamoDB",
                 user_id=user_id, username=username)
        # Initialize R2 storage folders
        manifest.init_user_storage(user_id)
    else:
        util.log("error", "signup_signin_services.create_user_entities",
                 f"DynamoDB batch write failed: {result.get('error')}",
                 user_id=user_id)
                 
    return result
