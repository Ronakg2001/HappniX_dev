# Data Stack

The data stack creates the private PostgreSQL database for the HappniX dev environment.

It owns:

- the RDS DB subnet group
- the PostgreSQL RDS instance

It consumes:

- `PrivateSubnetAId`
- `PrivateSubnetBId`
- `DatabaseSecurityGroupId`

It exports:

- `DatabaseEndpointAddress`
- `DatabaseEndpointPort`
- `DatabaseInstanceIdentifier`

Operational notes:

- the database stays private
- the database should only accept PostgreSQL traffic from the Lambda security group path defined by the network stack
- application stacks should use the exported endpoint and port rather than hard-coding host values
