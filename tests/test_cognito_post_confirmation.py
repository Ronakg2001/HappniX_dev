import unittest
from unittest.mock import patch

from backend.CognitoPostConfirmation import lambda_handler


class CognitoPostConfirmationTests(unittest.TestCase):
    @patch("backend.CognitoPostConfirmation.auth_db.find_overlap_candidates", return_value=[])
    @patch("backend.CognitoPostConfirmation.auth_db.user_id_exists", side_effect=[True, False])
    @patch("backend.CognitoPostConfirmation.auth_db.upsert_cognito_user")
    @patch("backend.CognitoPostConfirmation._generate_candidate_ids", return_value=iter(["AAAA1111", "BBBB2222"]))
    def test_post_confirmation_retries_until_unique_user_id(
        self,
        _mock_candidates,
        mock_upsert,
        _mock_exists,
        _mock_overlaps,
    ):
        event = {
            "request": {
                "userAttributes": {
                    "sub": "11111111-1111-1111-1111-111111111111",
                    "email": "person@example.com",
                    "phone_number": "+919876543210",
                    "email_verified": "true",
                    "preferred_username": "person",
                    "custom:dateOfBirth": "2000-01-01",
                }
            }
        }

        response = lambda_handler(event, None)

        mock_upsert.assert_called_once()
        saved_record = mock_upsert.call_args[0][0]
        self.assertEqual(saved_record["userID"], "BBBB2222")
        self.assertEqual(response, event)

    @patch("backend.CognitoPostConfirmation.auth_db.find_overlap_candidates")
    @patch("backend.CognitoPostConfirmation.auth_db.upsert_cognito_user")
    @patch("backend.CognitoPostConfirmation.auth_db.user_id_exists", return_value=False)
    @patch("backend.CognitoPostConfirmation._generate_candidate_ids", return_value=iter(["WXYZ6789"]))
    def test_post_confirmation_logs_overlap_without_merging(
        self,
        _mock_candidates,
        _mock_exists,
        mock_upsert,
        mock_find_overlap_candidates,
    ):
        mock_find_overlap_candidates.return_value = [{"userID": "OLDUSER1"}]
        event = {
            "request": {
                "userAttributes": {
                    "sub": "22222222-2222-2222-2222-222222222222",
                    "email": "person@example.com",
                    "phone_number": "+919876543210",
                    "email_verified": "false",
                    "preferred_username": "person-2",
                    "custom:dateOfBirth": "2000-01-01",
                }
            }
        }

        with patch("builtins.print") as mock_print:
            lambda_handler(event, None)

        mock_upsert.assert_called_once()
        self.assertTrue(mock_print.called)
