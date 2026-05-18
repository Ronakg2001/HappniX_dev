import importlib
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def reload_module(name):
    sys.modules.pop(name, None)
    return importlib.import_module(name)


class SignupSigninContractTests(unittest.TestCase):
    def setUp(self):
        self.mod = reload_module("SignupSignin")

    def test_signup_session_details_returns_pending_mobile_for_readonly_form(self):
        with patch.object(self.mod.dev_store, "ensure_session", return_value=("tok", {"pending_signup_mobile": "9876543210"})):
            response = self.mod.GetSignupSessionDetails({"headers": {"Cookie": "happnix_session=tok"}}, {})

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["mobile"], "9876543210")
        self.assertEqual(body["formattedMobile"], "+919876543210")

    def test_logout_clears_session_cookie_and_deletes_server_session(self):
        with patch.object(self.mod, "_ExtractSessionToken", return_value="tok"), \
             patch.object(self.mod.dev_store, "delete_session") as delete_session:
            response = self.mod.Logout({"headers": {"Cookie": "happnix_session=tok"}}, {})

        delete_session.assert_called_once_with("tok")
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("happnix_session=;", response["headers"]["Set-Cookie"])


class ProfilesApiContractTests(unittest.TestCase):
    def setUp(self):
        self.mod = reload_module("profiles_api")

    def test_session_user_accepts_happnix_session_cookie_and_authenticated_user_id(self):
        row = {"userID": "ABCD1234", "cognitoSub": "sub-1", "userName": "ronak"}
        with patch.object(self.mod, "get_session", return_value=("tok", {"authenticated_user_id": "sub-1"})), \
             patch.object(self.mod, "get_user_by_cognito_sub", return_value=row):
            cognito_sub, user = self.mod._get_session_user({"headers": {"Cookie": "happnix_session=tok"}})

        self.assertEqual(cognito_sub, "sub-1")
        self.assertEqual(user, row)

    def test_get_me_returns_rds_profile_when_optional_dynamo_tables_are_disabled(self):
        row = {"userID": "ABCD1234", "cognitoSub": "sub-1", "userName": "ronak"}
        with patch.object(self.mod, "_get_session_user", return_value=("sub-1", row)), \
             patch.object(self.mod.ddb, "list_following", side_effect=RuntimeError("DynamoDB table name not configured")), \
             patch.object(self.mod.ddb, "list_followers", side_effect=RuntimeError("DynamoDB table name not configured")), \
             patch.object(self.mod.ddb, "get_preferences", side_effect=RuntimeError("DynamoDB table name not configured")):
            response = self.mod.GetMe({}, {}, {}, {})

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["profile"]["username"], "ronak")
        self.assertEqual(body["profile"]["followingCount"], 0)
        self.assertEqual(body["preferences"], {})


class InfraContractTests(unittest.TestCase):
    def test_signup_lambda_policy_allows_users_table_name_pattern(self):
        template = (ROOT / "infra" / "app" / "template.yaml").read_text(encoding="utf-8")
        self.assertIn("table/Happnix-userInfoTable-${EnvironmentName}", template)

    def test_auth_lambda_supports_canonical_and_legacy_paths(self):
        template = (ROOT / "infra" / "app" / "template.yaml").read_text(encoding="utf-8")
        self.assertIn("Path: /api/auth", template)
        self.assertIn("Path: /auth", template)


class WebContractTests(unittest.TestCase):
    def test_signup_profile_optional_posts_to_canonical_auth_endpoint(self):
        script = (ROOT / "web_frontend" / "signup_profile_optional.js").read_text(encoding="utf-8")
        self.assertIn('const AUTH_ENDPOINT = "/api/auth";', script)
        self.assertNotIn('const AUTH_ENDPOINT = "/auth";', script)


if __name__ == "__main__":
    unittest.main()
