"""
handlers/profile.py — User profile endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils.utilities import parse_body


def lambda_handler(event, context):
    return error_response("Profile handler not implemented yet.", 501)
