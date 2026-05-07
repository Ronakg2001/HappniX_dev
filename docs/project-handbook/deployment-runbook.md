# Deployment Runbook

## Fresh Dev Deploy

Deploy the stacks in this order:

1. Deploy `happnix-network-dev`
2. Deploy `happnix-data-dev`
3. Deploy `happnix-app-dev`

## Redeploy Guidance

- if only VPC or subnet resources changed, redeploy `network`
- if only RDS configuration changed, redeploy `data`
- if only Lambda, Cognito, or API resources changed, redeploy `app`

## Reset Order

To cleanly reset the dev environment, delete stacks in reverse dependency order:

1. delete `happnix-app-dev`
2. delete `happnix-data-dev`
3. delete `happnix-network-dev`

## Common Failure Checks

- if a stack cannot find subnet or security group IDs, verify the network stack outputs and workflow secrets
- if schema initialization fails, verify database credentials and private network reachability
- if Cognito trigger resources fail, verify the app stack owns the User Pool and Lambda permissions together
