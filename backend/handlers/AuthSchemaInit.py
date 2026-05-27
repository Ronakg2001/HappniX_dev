"""
handlers/AuthSchemaInit.py — One-time RDS schema initialisation for HappniX.

This handler is triggered manually (or via a custom CloudFormation resource)
to create database tables on first deploy. It is NOT a regular API endpoint.
"""

from utils.Response import success_response, error_response


def lambda_handler(event, context):
    return error_response("AuthSchemaInit not implemented yet.", 501)
