# Network Stack

The network stack creates the project-owned VPC for HappniX dev.

It owns:

- the VPC
- 2 public subnets
- 2 private subnets
- the internet gateway
- the NAT gateway
- public and private route tables
- Lambda and database security groups

Design intent:

- public subnets host internet-facing network infrastructure
- private subnets host Lambda functions and the database
- Lambda functions reach PostgreSQL privately through the database security group
- outbound private traffic uses the NAT gateway

Key outputs:

- `VpcId`
- `PublicSubnetAId`
- `PublicSubnetBId`
- `PrivateSubnetAId`
- `PrivateSubnetBId`
- `LambdaSecurityGroupId`
- `DatabaseSecurityGroupId`
