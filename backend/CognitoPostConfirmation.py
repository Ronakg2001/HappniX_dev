import json
import random
import string

from . import auth_db


ALPHABET = string.ascii_uppercase + string.digits


def _generate_candidate_ids():
    while True:
        yield "".join(random.choice(ALPHABET) for _ in range(8))


def _bool_text(value):
    return str(value).strip().lower() == "true"


def _record_from_event(attributes):
    user_name = (
        attributes.get("preferred_username")
        or attributes.get("name")
        or attributes.get("email", "").split("@")[0]
        or attributes.get("phone_number", "user")
    )
    return {
        "cognitoSub": attributes["sub"],
        "userName": user_name,
        "emailAddress": attributes.get("email") or f'{attributes["sub"]}@placeholder.local',
        "userType": attributes.get("custom:userType", "General"),
        "phoneNumber": attributes.get("phone_number", f'+unverified-{attributes["sub"][:8]}'),
        "emailVerified": _bool_text(attributes.get("email_verified", "false")),
        "isActive": True,
        "dateOfBirth": attributes.get("custom:dateOfBirth", "2000-01-01"),
    }


def lambda_handler(event, context):
    del context
    attributes = event["request"]["userAttributes"]
    record = _record_from_event(attributes)
    overlaps = auth_db.find_overlap_candidates(record["emailAddress"], record["phoneNumber"])
    if overlaps:
        print(json.dumps({"level": "warning", "message": "identity overlap detected", "overlaps": overlaps}))

    for candidate in _generate_candidate_ids():
        if not auth_db.user_id_exists(candidate):
            record["userID"] = candidate
            break
    auth_db.upsert_cognito_user(record)
    return event
