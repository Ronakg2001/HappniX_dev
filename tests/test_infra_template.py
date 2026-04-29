import unittest
from pathlib import Path


class MultiStackTemplateTests(unittest.TestCase):
    def test_network_template_creates_project_owned_vpc_and_private_subnets(self):
        content = Path("infra/network/template.yaml").read_text(encoding="utf-8")

        self.assertIn("Type: AWS::EC2::VPC", content)
        self.assertIn("Type: AWS::EC2::Subnet", content)
        self.assertIn("MapPublicIpOnLaunch: false", content)
        self.assertIn("Type: AWS::EC2::NatGateway", content)

    def test_data_template_creates_rds_using_network_parameters(self):
        content = Path("infra/data/template.yaml").read_text(encoding="utf-8")

        self.assertIn("Type: AWS::RDS::DBSubnetGroup", content)
        self.assertIn("Type: AWS::RDS::DBInstance", content)
        self.assertIn("PrivateSubnetAId:", content)
        self.assertIn("PrivateSubnetBId:", content)
        self.assertIn("DatabaseSecurityGroupId:", content)

    def test_app_template_creates_cognito_api_and_lambdas(self):
        content = Path("infra/app/template.yaml").read_text(encoding="utf-8")

        self.assertIn("Type: AWS::Cognito::UserPool", content)
        self.assertIn("Type: AWS::Serverless::Api", content)
        self.assertIn("Handler: SignupSignin.lambda_handler", content)
        self.assertIn("Handler: AuthSchemaInit.lambda_handler", content)
        self.assertIn("Type: AWS::CloudFormation::CustomResource", content)


class MultiWorkflowDeployTests(unittest.TestCase):
    def test_network_workflow_targets_network_template(self):
        content = Path(".github/workflows/deploy_network.yml").read_text(encoding="utf-8")

        self.assertIn("STACK_NAME: happnix-network-dev", content)
        self.assertIn("sam build --template-file infra/network/template.yaml", content)
        self.assertIn("--template-file .aws-sam/build/template.yaml", content)

    def test_data_workflow_targets_data_template(self):
        content = Path(".github/workflows/deploy_data.yml").read_text(encoding="utf-8")

        self.assertIn("STACK_NAME: happnix-data-dev", content)
        self.assertIn("sam build --template-file infra/data/template.yaml", content)

    def test_app_workflow_targets_app_template_with_container_build(self):
        content = Path(".github/workflows/deploy_app.yml").read_text(encoding="utf-8")

        self.assertIn("STACK_NAME: happnix-app-dev", content)
        self.assertIn("sam build --use-container --template-file infra/app/template.yaml", content)
        self.assertIn("backend/**", content)
