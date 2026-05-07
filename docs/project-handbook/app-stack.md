# App Stack

The app stack creates the application-facing AWS resources for HappniX dev.

It owns:

- the API Gateway
- the Cognito User Pool
- the Cognito app client
- the `SignupSignin` Lambda
- the `CognitoPostConfirmation` Lambda
- the `CognitoPreToken` Lambda
- the `AuthSchemaInit` Lambda
- the schema initialization custom resource

It consumes:

- `PrivateSubnetAId`
- `PrivateSubnetBId`
- `LambdaSecurityGroupId`
- `AuthDbHost`
- `AuthDbPort`
- app configuration parameters and secrets

Schema initialization flow:

1. the data stack creates PostgreSQL
2. the app stack deploys `AuthSchemaInit`
3. the custom resource invokes `AuthSchemaInit`
4. `AuthSchemaInit` runs the idempotent SQL schema against PostgreSQL
5. the app stack finishes only after CloudFormation receives a success response
