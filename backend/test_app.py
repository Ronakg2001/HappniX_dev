import unittest

from backend.app import lambda_handler


class LambdaHandlerTests(unittest.TestCase):
    def test_health_endpoint_returns_runtime_configuration(self):
        event = {
            "requestContext": {"http": {"method": "GET", "path": "/health"}},
            "rawPath": "/health",
        }

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(response["headers"]["Content-Type"], "application/json")
        self.assertIn('"status": "ok"', response["body"])
        self.assertIn('"service": "happnix-backend"', response["body"])


if __name__ == "__main__":
    unittest.main()
