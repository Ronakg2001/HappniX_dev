"""
handlers/CognitoPostConfirmation.py — Cognito Post Confirmation Lambda trigger.

AWS Cognito calls this Lambda automatically AFTER a user confirms their account
(i.e. after email/phone verification). It is NOT called by the frontend directly.

Trigger type: Cognito User Pools → Post Confirmation trigger.

Flow:
    1. Cognito fires this Lambda with the full user event after confirmation.
    2. We extract all custom attributes stored during signup (userId, region,
       gender, dateOfBirth, etc.) from the event.
    3. We call rds.insert_user() to persist the user record to PostgreSQL.
    4. We MUST return the original event unchanged for Cognito to proceed.

Custom attributes expected (set during RegisterUserDetails → cognito.create_user):
    custom:userId      — UUIDv7 primary key generated at signup time
    custom:region      — ISO 3166-1 alpha-2 region code (e.g. 'IN')
    custom:gender      — Gender string (e.g. 'Male', 'Female', 'Other')
    custom:dateOfBirth — Date of birth in YYYY-MM-DD format
"""

from integration import rds
from utils import utilities as util


def lambda_handler(event, context):
    """
    Entry point for the Cognito Post Confirmation trigger.

    Args:
        event:   Cognito trigger event dict. Key fields:
                   event["userName"]                — Cognito username
                   event["request"]["userAttributes"] — all user attributes dict
        context: Lambda context object (unused).

    Returns:
        The original event dict unchanged — required by Cognito.
    """
    try:
        username = event.get("userName", "")
        attrs    = event.get("request", {}).get("userAttributes", {})

        # ── Extract all attributes set during signup ───────────────────────────
        user_id     = attrs.get("custom:userId",      "")
        cognito_sub = attrs.get("sub",                "")
        email       = attrs.get("email",              "")
        phone       = attrs.get("phone_number",       "")
        full_name   = attrs.get("name",               "")
        dob         = attrs.get("custom:dateOfBirth", "")
        gender      = attrs.get("custom:gender",      "")
        region      = attrs.get("custom:region",      "IN")
        email_verified = attrs.get("email_verified", "false").lower() == "true"

        # ── Guard: skip insert if critical fields are missing ──────────────────
        if not user_id or not cognito_sub:
            util.log(
                "warning",
                "CognitoPostConfirmation",
                "Missing user_id or cognito_sub — skipping RDS insert",
                username=username,
            )
            return event

        # ── Insert user into RDS ───────────────────────────────────────────────
        result = rds.insert_user(
            user_id=user_id,
            cognito_sub=cognito_sub,
            username=username,
            email=email,
            phone_number=phone,
            full_name=full_name,
            dob=dob,
            gender=gender,
            region=region,
            email_verified=email_verified,
        )

        if not result.get("success"):
            # Log the error but do NOT raise — Cognito must receive the event
            # back or it will retry and the user will be stuck in a broken state.
            util.log(
                "error",
                "CognitoPostConfirmation",
                f"RDS insert failed: {result.get('error')}",
                user_id=user_id,
                cognito_sub=cognito_sub,
            )
        else:
            util.log(
                "info",
                "CognitoPostConfirmation",
                "User synced to RDS successfully",
                user_id=user_id,
                username=username,
            )

    except Exception as exc:
        # Same principle — log but never raise so Cognito can proceed.
        util.log("error", "CognitoPostConfirmation",
                 f"Unhandled exception: {exc}")

    # ── Always return the event unchanged ─────────────────────────────────────
    return event
