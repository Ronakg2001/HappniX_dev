import json
import os

from . import auth_db


def lambda_handler(event, context):
    del context
    sub = event["request"]["userAttributes"]["sub"]
    claims = auth_db.fetch_user_claims_by_sub(sub)
    if not claims:
        print(json.dumps({"level": "warning", "message": "missing cognito mapping", "sub": sub}))
        return event

    if not claims.get("isActive", True):
        print(json.dumps({"level": "warning", "message": "inactive user attempted token generation", "sub": sub}))
        if os.environ.get("ALLOW_MISSING_CLAIMS_FALLBACK", "false").lower() != "true":
            return event

    override = event.setdefault("response", {}).setdefault("claimsOverrideDetails", {})
    override["claimsToAddOrOverride"] = {
        "userID": claims["userID"],
        "userType": claims["userType"],
    }
    return event
