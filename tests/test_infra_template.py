import unittest
from pathlib import Path


class TemplateInfrastructureTests(unittest.TestCase):
    def test_template_exposes_auth_db_parameters(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("AuthDbName:", content)
        self.assertIn("AuthDbUser:", content)
        self.assertIn("AuthDbPassword:", content)
        self.assertIn("AuthDbConnectTimeout:", content)
        self.assertIn("AppVpcId:", content)
        self.assertIn("AppSubnetA:", content)
        self.assertIn("AppSubnetB:", content)

    def test_template_provisions_cognito_user_pool_and_client(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("HappnixUserPool:", content)
        self.assertIn("Type: AWS::Cognito::UserPool", content)
        self.assertIn("HappnixUserPoolClient:", content)
        self.assertIn("Type: AWS::Cognito::UserPoolClient", content)

    def test_template_wires_cognito_triggers_to_lambdas(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("PostConfirmation: !GetAtt CognitoPostConfirmation.Arn", content)
        self.assertIn("PreTokenGenerationConfig:", content)
        self.assertIn("LambdaArn: !GetAtt CognitoPreToken.Arn", content)
        self.assertIn("LambdaVersion: V2_0", content)
        self.assertIn("VpcConfig:", content)
        self.assertIn("SecurityGroupIds:", content)
        self.assertIn("- !Ref HappnixLambdaSecurityGroup", content)

    def test_template_provisions_rds_in_existing_vpc(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("HappnixDbSubnetGroup:", content)
        self.assertIn("Type: AWS::RDS::DBSubnetGroup", content)
        self.assertIn("HappnixDatabaseSecurityGroup:", content)
        self.assertIn("Type: AWS::EC2::SecurityGroup", content)
        self.assertIn("VpcId: !Ref AppVpcId", content)
        self.assertIn("HappnixPostgresDatabase:", content)
        self.assertIn("Type: AWS::RDS::DBInstance", content)
        self.assertIn("DBInstanceClass: db.t3.micro", content)
        self.assertIn("Engine: postgres", content)
        self.assertIn("PubliclyAccessible: false", content)

    def test_template_outputs_user_pool_identifiers(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("HappnixUserPoolId:", content)
        self.assertIn("HappnixUserPoolClientId:", content)
        self.assertIn("HappnixDatabaseEndpoint:", content)
        self.assertIn("HappnixDatabasePort:", content)


class BackendDeployWorkflowTests(unittest.TestCase):
    def test_backend_deploy_workflow_is_pinned_to_ap_south_1(self):
        content = Path(".github/workflows/backend_deploy.yml").read_text(encoding="utf-8")

        self.assertIn("AWS_REGION: ap-south-1", content)
        self.assertIn("aws-region: ap-south-1", content)
        self.assertIn('--region "ap-south-1"', content)
        self.assertIn("AuthDbName=${{ secrets.AUTH_DB_NAME }}", content)
        self.assertIn("AuthDbUser=${{ secrets.AUTH_DB_USER }}", content)
        self.assertIn("AuthDbPassword=${{ secrets.AUTH_DB_PASSWORD }}", content)
