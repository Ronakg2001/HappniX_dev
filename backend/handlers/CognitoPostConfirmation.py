"""
handlers/CognitoPostConfirmation.py — Cognito Post Confirmation Lambda trigger.

AWS Cognito calls this Lambda automatically AFTER a user confirms their account
(e.g. after verifying their email). It is NOT called by the frontend directly.

Typical use:
    - Sync the newly confirmed Cognito user into your RDS / DynamoDB database.
    - Send a welcome email.
    - Assign default roles or groups.

Not implemented yet — will be wired up when Cognito self-signup flow is enabled.
"""


def lambda_handler(event, context):
    # Cognito passes the full user details in the event.
    # Must return the event unchanged for Cognito to proceed.
    return event
