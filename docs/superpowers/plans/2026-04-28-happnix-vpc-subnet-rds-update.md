# HappniX VPC Subnet RDS Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mismatched external subnet inputs with stack-created backend subnets inside the approved HappniX VPC, then place Lambda and PostgreSQL RDS consistently inside that VPC.

**Architecture:** Keep the existing Cognito and API Gateway resources unchanged, but move the VPC-dependent backend network shape under CloudFormation ownership. The stack will create two backend subnets inside `vpc-010824d98891a054f`, associate them to route table `rtb-0ba30fda9bcdd76c4`, and use those subnets for Lambda `VpcConfig` and the RDS subnet group.

**Tech Stack:** AWS SAM, CloudFormation, AWS Lambda, AWS RDS PostgreSQL, existing unittest template coverage

---

## File Map

- Modify: `template.yaml`
  - Replace external subnet defaults with stack-created subnet resources and route table associations.
- Modify: `.github/workflows/backend_deploy.yml`
  - Keep DB secret inputs, but avoid passing removed subnet inputs and preserve the `ap-south-1` deploy path.
- Modify: `tests/test_infra_template.py`
  - Assert that new subnet and route table association resources exist and that Lambdas and RDS use them.
- Modify: `docs/project-handbook/cognito-auth-setup.md`
  - Document that the stack now creates backend subnets and that DB host/port come from outputs.

### Task 1: Add Failing Infra Tests For Stack-Owned Subnets

**Files:**
- Modify: `tests/test_infra_template.py`
- Test: `tests/test_infra_template.py`

- [ ] **Step 1: Write the failing tests**

```python
    def test_template_creates_backend_subnets_and_route_table_associations(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("HappnixBackendSubnetA:", content)
        self.assertIn("HappnixBackendSubnetB:", content)
        self.assertIn("Type: AWS::EC2::Subnet", content)
        self.assertIn("HappnixBackendSubnetARouteTableAssociation:", content)
        self.assertIn("HappnixBackendSubnetBRouteTableAssociation:", content)
        self.assertIn("RouteTableId: !Ref AppRouteTableId", content)

    def test_template_uses_stack_created_subnets_for_lambda_and_rds(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("- !Ref HappnixBackendSubnetA", content)
        self.assertIn("- !Ref HappnixBackendSubnetB", content)
        self.assertIn("DBSubnetGroupName: !Ref HappnixDbSubnetGroup", content)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_infra_template -v`
Expected: FAIL because the template still references external subnet parameters and does not create new subnet resources

- [ ] **Step 3: Commit**

```bash
git add tests/test_infra_template.py
git commit -m "Add failing tests for VPC-owned backend subnets"
```

### Task 2: Replace External Subnet Inputs With Stack-Created Subnets

**Files:**
- Modify: `template.yaml`
- Test: `tests/test_infra_template.py`

- [ ] **Step 1: Update template parameters for VPC and route table**

```yaml
  AppVpcId:
    Type: String
    Default: "vpc-010824d98891a054f"
  AppRouteTableId:
    Type: String
    Default: "rtb-0ba30fda9bcdd76c4"
```

- [ ] **Step 2: Remove external subnet parameters and add stack-owned subnet resources**

```yaml
  HappnixBackendSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVpcId
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs ap-south-1]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: happnix-backend-subnet-a

  HappnixBackendSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AppVpcId
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs ap-south-1]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: happnix-backend-subnet-b

  HappnixBackendSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AppRouteTableId
      SubnetId: !Ref HappnixBackendSubnetA

  HappnixBackendSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AppRouteTableId
      SubnetId: !Ref HappnixBackendSubnetB
```

- [ ] **Step 3: Point Lambda and RDS to the new subnet resources**

```yaml
    VpcConfig:
      SecurityGroupIds:
        - !Ref HappnixLambdaSecurityGroup
      SubnetIds:
        - !Ref HappnixBackendSubnetA
        - !Ref HappnixBackendSubnetB
```

```yaml
  HappnixDbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnets for HappniX PostgreSQL database.
      SubnetIds:
        - !Ref HappnixBackendSubnetA
        - !Ref HappnixBackendSubnetB
```

- [ ] **Step 4: Run tests to verify template shape passes**

Run: `python -m unittest tests.test_infra_template -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add template.yaml tests/test_infra_template.py
git commit -m "Create backend subnets inside HappniX VPC"
```

### Task 3: Refresh Deployment Workflow And Docs

**Files:**
- Modify: `.github/workflows/backend_deploy.yml`
- Modify: `docs/project-handbook/cognito-auth-setup.md`

- [ ] **Step 1: Keep workflow aligned with the new stack-owned subnet model**

```yaml
          --parameter-overrides
          ParameterKey=ApiStageName,ParameterValue=dev
          ParameterKey=AppEnvironment,ParameterValue=dev
          ParameterKey=AuthDbName,ParameterValue='${{ secrets.AUTH_DB_NAME }}'
          ParameterKey=AuthDbUser,ParameterValue='${{ secrets.AUTH_DB_USER }}'
          ParameterKey=AuthDbPassword,ParameterValue='${{ secrets.AUTH_DB_PASSWORD }}'
          ParameterKey=AuthDbConnectTimeout,ParameterValue=5
          ParameterKey=TestOtpMode,ParameterValue=false
          ParameterKey=AllowFixedTestOtp,ParameterValue=false
          ParameterKey=R2BucketName,ParameterValue='${{ secrets.R2_BUCKET_NAME }}'
          ParameterKey=R2Endpoint,ParameterValue='${{ secrets.R2_ENDPOINT }}'
```

- [ ] **Step 2: Document the backend subnet ownership**

```markdown
## VPC-Owned Backend Network

The stack now creates two backend subnets inside `vpc-010824d98891a054f` and associates them with route table `rtb-0ba30fda9bcdd76c4`.

- Lambda functions use these stack-created subnets through `VpcConfig`
- RDS uses the same subnets through the DB subnet group
- `AUTH_DB_HOST` and `AUTH_DB_PORT` now come from stack outputs, not manual secrets
```

- [ ] **Step 3: Run verification tests**

Run: `python -m unittest tests.test_infra_template tests.test_signup_signin_lambda tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/backend_deploy.yml docs/project-handbook/cognito-auth-setup.md
git commit -m "Document VPC-owned subnet deployment for backend stack"
```

### Task 4: Final Verification

**Files:**
- Modify: `template.yaml`
- Modify: `.github/workflows/backend_deploy.yml`
- Modify: `tests/test_infra_template.py`
- Modify: `docs/project-handbook/cognito-auth-setup.md`

- [ ] **Step 1: Run full relevant test suite**

Run: `python -m unittest tests.test_infra_template tests.test_signup_signin_lambda tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: PASS

- [ ] **Step 2: Check git status**

Run: `git status --short`
Expected:

```text
M .github/workflows/backend_deploy.yml
M docs/project-handbook/cognito-auth-setup.md
M template.yaml
M tests/test_infra_template.py
```

- [ ] **Step 3: Commit final network update**

```bash
git add template.yaml .github/workflows/backend_deploy.yml docs/project-handbook/cognito-auth-setup.md tests/test_infra_template.py
git commit -m "Move backend network resources under stack ownership"
```

## Self-Review

### Spec coverage

- Stack-owned backend subnets in the approved VPC are covered by Task 2.
- Route table associations are covered by Task 2.
- Lambda and RDS use the same VPC-owned subnets in Task 2.
- Security group and RDS subnet group usage remain preserved in Task 2.
- Workflow and documentation updates are covered by Task 3.

### Placeholder scan

- No placeholders like `TBD` or “implement later” remain.
- Every task includes exact files, commands, and concrete YAML or markdown changes.

### Type consistency

- `AppVpcId`, `AppRouteTableId`, `HappnixBackendSubnetA`, and `HappnixBackendSubnetB` are used consistently across tasks.
- The plan keeps `AuthDbName`, `AuthDbUser`, and `AuthDbPassword` as the only DB secrets passed by the deploy workflow.
