import json
from pathlib import Path
from urllib.request import Request, urlopen

try:
    from .auth_db import execute_sql_script
except ImportError:  # pragma: no cover
    from auth_db import execute_sql_script


def _send_cfn_response(event, context, status, reason, data=None):
    response_body = json.dumps(
        {
            "Status": status,
            "Reason": f"{reason} See CloudWatch Log Stream: {getattr(context, 'log_stream_name', 'unknown')}",
            "PhysicalResourceId": getattr(context, "log_stream_name", "auth-schema-init"),
            "StackId": event["StackId"],
            "RequestId": event["RequestId"],
            "LogicalResourceId": event["LogicalResourceId"],
            "Data": data or {},
        }
    ).encode("utf-8")
    request = Request(
        event["ResponseURL"],
        data=response_body,
        headers={"content-type": "", "content-length": str(len(response_body))},
        method="PUT",
    )
    with urlopen(request) as response:  # nosec B310
        response.read()


def _load_schema_sql():
    schema_path = Path(__file__).resolve().parent / "sql" / "happnix_auth_schema.sql"
    return schema_path.read_text(encoding="utf-8")


def lambda_handler(event, context):
    request_type = event.get("RequestType", "Create")
    try:
        if request_type in {"Create", "Update"}:
            execute_sql_script(_load_schema_sql())
            _send_cfn_response(
                event,
                context,
                "SUCCESS",
                "Schema initialization completed.",
                {"SchemaReady": True},
            )
            return {"status": "ok"}

        _send_cfn_response(
            event,
            context,
            "SUCCESS",
            "Delete acknowledged without schema teardown.",
            {"SchemaReady": True},
        )
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - exercised in AWS
        _send_cfn_response(
            event,
            context,
            "FAILED",
            f"Schema initialization failed: {exc}",
            {"SchemaReady": False},
        )
        raise
