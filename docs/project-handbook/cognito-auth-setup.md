# Cognito Auth Setup

## Stack Ownership

Cognito is created by the `app` stack and should not be created manually in the AWS console for the normal dev flow.

The `app` stack owns:

- the Cognito User Pool
- the Cognito app client
- the Cognito trigger Lambda wiring

## Lambda Triggers

The `app` stack wires these Lambda functions to Cognito:

1. `CognitoPostConfirmation`
2. `CognitoPreToken`

## Required Deployment Secrets

The app deploy workflow expects these secrets:

- `AUTH_DB_NAME`
- `AUTH_DB_USER`
- `AUTH_DB_PASSWORD`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `AWS_ROLE_ARN`
- `NETWORK_VPC_ID`
- `NETWORK_PRIVATE_SUBNET_A_ID`
- `NETWORK_PRIVATE_SUBNET_B_ID`
- `NETWORK_LAMBDA_SECURITY_GROUP_ID`
- `DATA_DB_HOST`
- `DATA_DB_PORT`

## Automatic Schema Initialization

The app stack runs the auth schema automatically during deployment through the `AuthSchemaInit` Lambda-backed custom resource.

- no manual schema SQL step is required for a normal deploy
- repeat deploys are safe because the schema SQL is idempotent

## Cognito Outputs

After deployment, use these app stack outputs for downstream frontend or mobile configuration:

- `HappnixUserPoolId`
- `HappnixUserPoolClientId`
- `HappnixCognitoRegion`

## Recommended Sign-In Model

1. Use Cognito for email or username plus password.
2. Keep phone OTP in the custom backend flow for the current phase.
3. Let the app stack own all Cognito trigger changes so auth behavior and infrastructure stay together.
