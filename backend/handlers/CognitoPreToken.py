"""
handlers/CognitoPreToken.py — Cognito Pre Token Generation Lambda trigger.

AWS Cognito calls this Lambda automatically BEFORE issuing a JWT access token
or ID token to a user. It is NOT called by the frontend directly.

Typical use:
    - Add custom claims to the JWT (e.g. userID, role, canCreateParties).
    - Suppress or override standard Cognito claims.
    - Block token issuance for banned/suspended users.

Not implemented yet — will be wired up when custom JWT claims are needed.
"""


def lambda_handler(event, context):
    # Cognito passes the token claims in event["response"]["claimsOverrideDetails"].
    # Must return the event unchanged (or with modifications) for Cognito to proceed.
    return event
