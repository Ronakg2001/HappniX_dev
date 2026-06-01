"""
handlers/AuthSchemaInit.py — CloudFormation Custom Resource for RDS schema init.

AWS CloudFormation invokes this Lambda when the HappnixAuthSchemaInitializer
Custom Resource is created or updated (e.g., when SchemaVersion changes).

Protocol:
  - CloudFormation passes a pre-signed ResponseURL in the event.
  - The Lambda MUST PUT a JSON response to that URL — SUCCESS or FAILED.
  - If the Lambda exits without doing so, CloudFormation waits until it times
    out (up to 1 hour) then marks the stack UPDATE_FAILED.
  - We use urllib to send the response directly — no external library needed.
"""

import json
import os
import urllib.request

from integration import rds
from utils import utilities as util


# ─── cfn-response helpers ─────────────────────────────────────────────────────

def _cfn_respond(event: dict, context, status: str, reason: str = "", data: dict = None):
    """
    Send a CloudFormation custom resource response via the pre-signed ResponseURL.

    Args:
        event:   The Lambda event from CloudFormation.
        context: Lambda context (used for LogStreamName).
        status:  "SUCCESS" or "FAILED".
        reason:  Human-readable reason string (shown in CloudFormation console).
        data:    Optional dict of output key/value pairs.
    """
    response_body = json.dumps({
        "Status":             status,
        "Reason":             reason or f"See CloudWatch log stream: {context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or context.log_stream_name,
        "StackId":            event.get("StackId"),
        "RequestId":          event.get("RequestId"),
        "LogicalResourceId":  event.get("LogicalResourceId"),
        "Data":               data or {},
    }).encode("utf-8")

    url = event["ResponseURL"]
    req = urllib.request.Request(
        url,
        data=response_body,
        headers={"Content-Type": ""},   # CloudFormation requires empty Content-Type
        method="PUT",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
        util.log("info", "AuthSchemaInit", f"cfn-response sent: {status}")
    except Exception as exc:
        # Last resort — log it. CloudFormation will time out eventually.
        util.log("error", "AuthSchemaInit", f"Failed to send cfn-response: {exc}")


# ─── Schema SQL path ──────────────────────────────────────────────────────────

_SCHEMA_SQL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "schemas", "happnix_auth_schema.sql"
)


# ─── Lambda entrypoint ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    """
    CloudFormation Custom Resource handler.

    On CREATE / UPDATE: runs happnix_auth_schema.sql against RDS.
    On DELETE:          no-op (schema is never dropped automatically).
    Always signals CloudFormation back with SUCCESS or FAILED.
    """
    request_type = event.get("RequestType", "")
    schema_version = event.get("ResourceProperties", {}).get("SchemaVersion", "unknown")

    util.log("info", "AuthSchemaInit",
             f"Invoked — RequestType={request_type}, SchemaVersion={schema_version}")

    # DELETE is always a no-op — we never drop the schema automatically.
    if request_type == "Delete":
        _cfn_respond(event, context, "SUCCESS", "Delete is a no-op; schema retained.")
        return

    # CREATE or UPDATE — run the SQL file.
    try:
        sql_path = os.path.realpath(_SCHEMA_SQL_PATH)
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
    except Exception as exc:
        msg = f"Could not read schema SQL file: {exc}"
        util.log("error", "AuthSchemaInit", msg)
        _cfn_respond(event, context, "FAILED", msg)
        return

    result = rds.execute_raw_sql(sql)

    if result.get("success"):
        util.log("info", "AuthSchemaInit",
                 f"Schema applied successfully. SchemaVersion={schema_version}")
        _cfn_respond(event, context, "SUCCESS",
                     f"Schema applied. Version={schema_version}",
                     {"SchemaVersion": schema_version})
    else:
        error = result.get("error", "Unknown RDS error")
        util.log("error", "AuthSchemaInit", f"Schema apply failed: {error}")
        _cfn_respond(event, context, "FAILED", f"RDS error: {error}")
