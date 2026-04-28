import unittest
from unittest.mock import patch

from backend.CognitoPreToken import lambda_handler


class CognitoPreTokenTests(unittest.TestCase):
    @patch("backend.CognitoPreToken.auth_db.fetch_user_claims_by_sub")
    def test_pre_token_adds_user_claims(self, mock_fetch):
        mock_fetch.return_value = {"userID": "AB12CD34", "userType": "Business", "isActive": True}
        event = {
            "request": {"userAttributes": {"sub": "11111111-1111-1111-1111-111111111111"}},
            "response": {"claimsOverrideDetails": {}},
        }

        response = lambda_handler(event, None)

        claims = response["response"]["claimsOverrideDetails"]["claimsToAddOrOverride"]
        self.assertEqual(claims["userID"], "AB12CD34")
        self.assertEqual(claims["userType"], "Business")

    @patch("backend.CognitoPreToken.auth_db.fetch_user_claims_by_sub", return_value=None)
    def test_pre_token_leaves_event_unchanged_when_mapping_missing(self, _mock_fetch):
        event = {
            "request": {"userAttributes": {"sub": "11111111-1111-1111-1111-111111111111"}},
            "response": {"claimsOverrideDetails": {}},
        }

        response = lambda_handler(event, None)

        self.assertEqual(response["response"]["claimsOverrideDetails"], {})
