"""
CognitoPreToken.py — Cognito Pre-Token Generation trigger Lambda.

Injects custom claims (userID, userType) into the Cognito JWT.
Uses utilities/rds.py for the DB lookup.
"""

import json
import os

from utilities.rds import get_user_claims_by_sub


def lambda_handler(event, context):
    sub = event["request"]["userAttributes"]["sub"]

    result = get_user_claims_by_sub(sub)

    if not result["success"]:
        print(json.dumps({"level": "error", "message": "claims lookup failed", "error": result["error"], "sub": sub}))
        return event

    claims = result["data"]
    if not claims:
        print(json.dumps({"level": "warning", "message": "missing cognito mapping", "sub": sub}))
        return event

    if not claims.get("isActive", True):
        print(json.dumps({"level": "warning", "message": "inactive user attempted token generation", "sub": sub}))
        if os.environ.get("ALLOW_MISSING_CLAIMS_FALLBACK", "false").lower() != "true":
            return event

    override = event.setdefault("response", {}).setdefault("claimsOverrideDetails", {})
    override["claimsToAddOrOverride"] = {
        "userID":   claims["userID"],
        "userType": claims["userType"],
    }
    return event
