"""
handlers/varification.py — Identity verification endpoints for HappniX.
(e.g. Aadhaar OTP verification, document upload)
"""

from utils.Response import success_response, error_response
from utils.utilities import parse_body


def lambda_handler(event, context):
    return error_response("Verification handler not implemented yet.", 501)
