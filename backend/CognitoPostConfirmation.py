"""
CognitoPostConfirmation.py — Cognito Post-Confirmation trigger Lambda.

Fires after a user successfully confirms their account in Cognito.
Syncs the user record into RDS via utilities/rds.py.
"""

import json
import random
import string

from utilities.rds import upsert_user, user_id_exists, find_overlap_candidates


_ALPHABET = string.ascii_uppercase + string.digits


def _generate_unique_user_id() -> str:
    """Keep generating 8-char IDs until we find one not already in RDS."""
    while True:
        candidate = "".join(random.choice(_ALPHABET) for _ in range(8))
        result = user_id_exists(candidate)
        if result["success"] and not result["data"]:
            return candidate


def _record_from_cognito_attributes(attributes: dict) -> dict:
    username = (
        attributes.get("preferred_username")
        or attributes.get("name")
        or attributes.get("email", "").split("@")[0]
        or attributes.get("phone_number", "user")
    )
    return {
        "cognitoSub":    attributes["sub"],
        "userName":      username,
        "emailAddress":  attributes.get("email") or f'{attributes["sub"]}@placeholder.local',
        "userType":      attributes.get("custom:userType", "General"),
        "phoneNumber":   attributes.get("phone_number", f'+unverified-{attributes["sub"][:8]}'),
        "emailVerified": str(attributes.get("email_verified", "false")).strip().lower() == "true",
        "isActive":      True,
        "dateOfBirth":   attributes.get("custom:dateOfBirth", "2000-01-01"),
    }


def lambda_handler(event, context):
    attributes = event["request"]["userAttributes"]
    record = _record_from_cognito_attributes(attributes)

    # Warn on overlapping email / phone
    overlap_result = find_overlap_candidates(record["emailAddress"], record["phoneNumber"])
    if overlap_result["success"] and overlap_result["data"]:
        print(json.dumps({
            "level": "warning",
            "message": "identity overlap detected",
            "overlaps": overlap_result["data"],
        }))

    record["userID"] = _generate_unique_user_id()
    upsert_result = upsert_user(record)

    if not upsert_result["success"]:
        print(json.dumps({
            "level": "error",
            "message": "post-confirmation upsert failed",
            "error": upsert_result["error"],
        }))

    return event  # Cognito expects the event returned unchanged
