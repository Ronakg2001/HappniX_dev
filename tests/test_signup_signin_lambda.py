import json
import os
from pathlib import Path
import re
import unittest
import uuid
from unittest.mock import patch

from backend.SignupSignin import ROUTES, lambda_handler


class SignupSigninLambdaTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path("tests").joinpath("_tmp")
        temp_root.mkdir(parents=True, exist_ok=True)
        self._state_path = temp_root.joinpath(f"{uuid.uuid4().hex}.json")
        os.environ["HAPPNIX_DEV_STORE_PATH"] = str(self._state_path)

    def tearDown(self):
        os.environ.pop("HAPPNIX_DEV_STORE_PATH", None)
        if self._state_path.exists():
            self._state_path.unlink()

    def _post(self, path, payload, cookie=None):
        event = {
            "httpMethod": "POST",
            "path": path,
            "body": json.dumps(payload),
            "headers": {},
        }
        if cookie:
            event["headers"]["Cookie"] = cookie
        return lambda_handler(event, None)

    def test_send_mobile_otp_route_returns_success_for_valid_mobile(self):
        response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})

        self.assertEqual(response["statusCode"], 200)
        self.assertIn("X-Happnix-Trace-Id", response["headers"])

    def test_send_mobile_otp_rejects_invalid_mobile(self):
        response = self._post("/api/auth/mobile/send-otp", {"mobile": "123"})
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(body["message"], "Please enter a valid 10-digit mobile number.")

    def test_verify_mobile_otp_returns_new_user_redirect(self):
        send_response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
        send_body = json.loads(send_response["body"])
        cookie = send_response["headers"]["Set-Cookie"]

        response = self._post(
            "/api/auth/mobile/verify-otp",
            {"mobile": "9876543210", "otp": send_body["debugOtp"]},
            cookie=cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(body["userStatus"], "new")
        self.assertEqual(body["redirectUrl"], "/signup/details/")

    def test_verify_mobile_otp_returns_existing_user_redirect(self):
        send_response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
        send_body = json.loads(send_response["body"])
        signup_cookie = send_response["headers"]["Set-Cookie"]
        self._post(
            "/api/auth/mobile/verify-otp",
            {"mobile": "9876543210", "otp": send_body["debugOtp"]},
            cookie=signup_cookie,
        )
        register_response = self._post(
            "/api/signup/details",
            {
                "fullName": "Test User",
                "username": "testuser",
                "password": "Secret123!",
                "sex": "mr.",
                "dateOfBirth": "2000-01-01",
                "email": "test@example.com",
                "govId": "ABC1234",
            },
            cookie=signup_cookie,
        )
        auth_cookie = register_response["headers"]["Set-Cookie"]
        resend_response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
        resend_body = json.loads(resend_response["body"])
        existing_cookie = resend_response["headers"]["Set-Cookie"]

        response = self._post(
            "/api/auth/mobile/verify-otp",
            {"mobile": "9876543210", "otp": resend_body["debugOtp"]},
            cookie=existing_cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(auth_cookie.startswith("happnix_session="), True)
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(body["userStatus"], "existing")
        self.assertEqual(body["redirectUrl"], "/home/")

    def test_login_with_password_rejects_invalid_credentials(self):
        response = self._post(
            "/api/auth/username/login",
            {"identifier": "missing-user", "password": "bad-password"},
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 401)
        self.assertEqual(body["message"], "Invalid username/email or password.")

    def test_register_user_details_requires_pending_signup_mobile(self):
        response = self._post(
            "/api/signup/details",
            {
                "fullName": "Test User",
                "username": "testuser",
                "password": "Secret123!",
                "sex": "mr.",
                "dateOfBirth": "2000-01-01",
                "email": "test@example.com",
                "govId": "ABC1234",
            },
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 401)
        self.assertEqual(body["message"], "Signup session expired. Verify mobile OTP again.")

    def test_complete_profile_setup_requires_authenticated_user(self):
        response = self._post(
            "/api/signup/profile",
            {"skip": True},
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 401)
        self.assertEqual(body["message"], "Please sign in first.")

    def test_route_table_includes_signup_profile_path(self):
        self.assertIn(("POST", "/api/signup/profile"), ROUTES)

    def test_invalid_json_returns_traceable_bad_request(self):
        response = lambda_handler(
            {
                "httpMethod": "POST",
                "path": "/api/auth/mobile/send-otp",
                "body": "{bad json",
                "headers": {},
                "requestContext": {"requestId": "req-invalid-json"},
            },
            None,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(body["message"], "Invalid JSON body.")
        self.assertEqual(body["traceId"], "req-invalid-json")
        self.assertEqual(response["headers"]["X-Happnix-Trace-Id"], "req-invalid-json")

    def test_unhandled_exception_returns_traceable_internal_error(self):
        def broken_handler(event):
            raise RuntimeError("boom")

        with patch.dict(ROUTES, {("POST", "/api/auth/mobile/send-otp"): broken_handler}, clear=False):
            response = lambda_handler(
                {
                    "httpMethod": "POST",
                    "path": "/api/auth/mobile/send-otp",
                    "body": json.dumps({"mobile": "9876543210"}),
                    "headers": {},
                    "requestContext": {"requestId": "req-broken-handler"},
                },
                None,
            )

        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 500)
        self.assertEqual(body["message"], "Internal server error.")
        self.assertEqual(body["traceId"], "req-broken-handler")
        self.assertEqual(response["headers"]["X-Happnix-Trace-Id"], "req-broken-handler")

    def test_send_aadhaar_otp_requires_authenticated_user(self):
        response = self._post("/api/auth/aadhaar/send-otp", {"aadhaarNumber": "123412341234"})
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 401)
        self.assertIn("X-Happnix-Trace-Id", response["headers"])
        self.assertEqual(body["message"], "Please sign in first.")

    def test_send_aadhaar_otp_rejects_invalid_number(self):
        cookie = self._create_authenticated_profile_setup_session()
        response = self._post(
            "/api/auth/aadhaar/send-otp",
            {"aadhaarNumber": "123"},
            cookie=cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 400)
        self.assertIn("traceId", body)
        self.assertEqual(body["message"], "Please enter a valid 12-digit Aadhaar number.")

    def test_send_aadhaar_otp_returns_success_for_authenticated_user(self):
        cookie = self._create_authenticated_profile_setup_session()
        response = self._post(
            "/api/auth/aadhaar/send-otp",
            {"aadhaarNumber": "123412341234"},
            cookie=cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertIn("traceId", body)
        self.assertEqual(
            body["message"],
            "OTP sent successfully to mobile linked with Aadhaar ending in 1234.",
        )

    def test_verify_aadhaar_otp_rejects_invalid_code(self):
        cookie = self._create_authenticated_profile_setup_session()
        self._post(
            "/api/auth/aadhaar/send-otp",
            {"aadhaarNumber": "123412341234"},
            cookie=cookie,
        )
        response = self._post(
            "/api/auth/aadhaar/verify-otp",
            {"otp": "000000"},
            cookie=cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 400)
        self.assertIn("traceId", body)
        self.assertEqual(body["message"], "Invalid OTP. Please try again.")

    def test_verify_aadhaar_otp_marks_user_verified(self):
        cookie = self._create_authenticated_profile_setup_session()
        self._post(
            "/api/auth/aadhaar/send-otp",
            {"aadhaarNumber": "123412341234"},
            cookie=cookie,
        )
        response = self._post(
            "/api/auth/aadhaar/verify-otp",
            {"otp": "123456"},
            cookie=cookie,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertIn("traceId", body)
        self.assertTrue(body["isVerified"])
        self.assertTrue(body["canCreateOrJoinParties"])

    def _create_authenticated_profile_setup_session(self):
        send_response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
        send_body = json.loads(send_response["body"])
        signup_cookie = send_response["headers"]["Set-Cookie"]
        self._post(
            "/api/auth/mobile/verify-otp",
            {"mobile": "9876543210", "otp": send_body["debugOtp"]},
            cookie=signup_cookie,
        )
        register_response = self._post(
            "/api/signup/details",
            {
                "fullName": "Test User",
                "username": "testuser",
                "password": "Secret123!",
                "sex": "mr.",
                "dateOfBirth": "2000-01-01",
                "email": "test@example.com",
                "govId": "ABC1234",
            },
            cookie=signup_cookie,
        )
        return register_response["headers"]["Set-Cookie"]


class FrontendRuntimeConfigTests(unittest.TestCase):
    def test_auth_pages_load_runtime_config_before_page_script(self):
        page_expectations = [
            ("web_frontend/signup_signin.html", "signup_signin.js"),
            ("web_frontend/signup_details.html", "signup_details.js"),
            ("web_frontend/signup_profile_optional.html", "signup_profile_optional.js"),
            ("web_frontend/forgot_password.html", "forgot_password.js"),
        ]

        for relative_path, page_script in page_expectations:
            content = Path(relative_path).read_text(encoding="utf-8")
            runtime_index = content.find("runtime-config.js")
            script_index = content.find(page_script)

            self.assertNotEqual(runtime_index, -1, f"{relative_path} should load runtime-config.js")
            self.assertNotEqual(script_index, -1, f"{relative_path} should load {page_script}")
            self.assertLess(
                runtime_index,
                script_index,
                f"{relative_path} should load runtime-config.js before {page_script}",
            )

    def test_runtime_config_has_non_empty_api_base_url(self):
        content = Path("web_frontend/runtime-config.js").read_text(encoding="utf-8")
        match = re.search(r'apiBaseUrl:\s*"([^"]+)"', content)

        self.assertIsNotNone(match, "runtime-config.js should define apiBaseUrl")
        self.assertTrue(match.group(1).startswith("https://"), "apiBaseUrl should point at the deployed AWS API")
