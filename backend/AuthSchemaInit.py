"""
AuthSchemaInit.py — CloudFormation Custom Resource Lambda.

Runs the RDS schema SQL on stack Create/Update events.
Uses utilities/rds.py for the actual SQL execution.
"""

import json
from pathlib import Path
from urllib.request import Request, urlopen

from utilities.rds import execute_sql_script


def _send_cfn_response(event, context, status, reason, data=None):
    body = json.dumps({
        "Status": status,
        "Reason": f"{reason} See CloudWatch Log Stream: {getattr(context, 'log_stream_name', 'unknown')}",
        "PhysicalResourceId": getattr(context, "log_stream_name", "auth-schema-init"),
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
        "Data": data or {},
    }).encode("utf-8")

    request = Request(
        event["ResponseURL"],
        data=body,
        headers={"content-type": "", "content-length": str(len(body))},
        method="PUT",
    )
    with urlopen(request) as resp:  # nosec B310
        resp.read()


def _load_schema_sql() -> str:
    schema_path = Path(__file__).resolve().parent / "sql" / "happnix_auth_schema.sql"
    return schema_path.read_text(encoding="utf-8")


def lambda_handler(event, context):
    request_type = event.get("RequestType", "Create")
    try:
        if request_type in {"Create", "Update"}:
            result = execute_sql_script(_load_schema_sql())
            if not result["success"]:
                raise RuntimeError(result["error"])
            _send_cfn_response(event, context, "SUCCESS", "Schema initialization completed.", {"SchemaReady": True})
            return {"status": "ok"}

        # Delete — acknowledge without schema teardown
        _send_cfn_response(event, context, "SUCCESS", "Delete acknowledged without schema teardown.", {"SchemaReady": True})
        return {"status": "ok"}

    except Exception as exc:
        _send_cfn_response(event, context, "FAILED", f"Schema initialization failed: {exc}", {"SchemaReady": False})
        raise
