"""
handlers/AuthSchemaInit.py — RDS Schema Initialization Lambda

This Lambda connects to the private RDS database and applies the HappniX
auth schema (happnix_auth_schema.sql).

It is triggered as a CloudFormation Custom Resource during `sam deploy`.
It uses the S3 VPC Gateway Endpoint to securely send the success/failure 
signal back to CloudFormation.
"""

import os
import json
import urllib.request
from integration import rds
from utils import utilities as util


_SCHEMA_SQL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "schemas", "happnix_auth_schema.sql"
)


def send_cfn_response(event, context, response_status, response_data, physical_resource_id=None, no_echo=False):
    """Send an HTTP PUT request to CloudFormation's ResponseURL"""
    response_url = event.get("ResponseURL")
    if not response_url:
        util.log("warning", "AuthSchemaInit.send_cfn_response", "No ResponseURL found in event. Skipping CFN signal.")
        return

    response_body = {
        "Status": response_status,
        "Reason": f"See the details in CloudWatch Log Stream: {context.log_stream_name}",
        "PhysicalResourceId": physical_resource_id or context.log_stream_name,
        "StackId": event.get("StackId"),
        "RequestId": event.get("RequestId"),
        "LogicalResourceId": event.get("LogicalResourceId"),
        "NoEcho": no_echo,
        "Data": response_data
    }

    json_response_body = json.dumps(response_body).encode("utf-8")
    headers = {
        "content-type": "",
        "content-length": str(len(json_response_body))
    }

    try:
        req = urllib.request.Request(response_url, data=json_response_body, headers=headers, method="PUT")
        with urllib.request.urlopen(req) as response:
            util.log("info", "AuthSchemaInit.send_cfn_response", f"Status code: {response.getcode()}")
    except Exception as exc:
        util.log("error", "AuthSchemaInit.send_cfn_response", f"Failed to send CFN response: {exc}")


def lambda_handler(event, context):
    """
    Reads the SQL schema file and executes it against RDS.
    Signals CloudFormation upon completion.
    """
    util.log("info", "AuthSchemaInit", f"Invoked with event: {event}")

    # Handle CloudFormation Delete events immediately (we don't drop tables on delete)
    if event.get("RequestType") == "Delete":
        send_cfn_response(event, context, "SUCCESS", {"Message": "Resource deletion ignored"})
        return {"statusCode": 200, "body": "Resource deletion ignored"}

    try:
        sql_path = os.path.realpath(_SCHEMA_SQL_PATH)
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
    except Exception as exc:
        msg = f"Could not read schema SQL file: {exc}"
        util.log("error", "AuthSchemaInit", msg)
        send_cfn_response(event, context, "FAILED", {"Message": msg})
        return {"statusCode": 500, "body": msg}

    # Execute SQL
    result = rds.execute_raw_sql(sql)

    if result.get("success"):
        msg = "Schema applied successfully."
        util.log("info", "AuthSchemaInit", msg)
        send_cfn_response(event, context, "SUCCESS", {"Message": msg})
        return {"statusCode": 200, "body": msg}
    else:
        error = result.get("error", "Unknown RDS error")
        msg = f"Schema apply failed: {error}"
        util.log("error", "AuthSchemaInit", msg)
        send_cfn_response(event, context, "FAILED", {"Message": msg})
        return {"statusCode": 500, "body": msg}
