# Deployment Architecture

The HappniX dev backend is deployed as three separate stacks:

1. `happnix-network-dev`
2. `happnix-data-dev`
3. `happnix-app-dev`

Deploy order:

1. network
2. data
3. app

Ownership summary:

- network: VPC, subnets, gateways, routes, and security groups
- data: PostgreSQL RDS and DB subnet group
- app: Cognito, API Gateway, Lambda functions, and schema initialization

Cross-stack flow:

- `network` produces VPC and subnet identifiers plus shared security groups
- `data` consumes private subnet IDs and the database security group ID
- `app` consumes private subnet IDs, the Lambda security group ID, and the database endpoint metadata

This split keeps failures easier to localize:

- networking issues belong in `network`
- database provisioning issues belong in `data`
- auth, API, Lambda, and schema-init issues belong in `app`
