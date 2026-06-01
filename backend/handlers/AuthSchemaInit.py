"""
handlers/AuthSchemaInit.py — RDS Schema Initialization Lambda

This Lambda connects to the private RDS database and applies the HappniX
auth schema (happnix_auth_schema.sql).

Since it is no longer a CloudFormation Custom Resource, it does NOT attempt
to signal cfn-response back to S3. Instead, it is meant to be invoked manually
or via a GitHub Actions pipeline script after deployment:

    aws lambda invoke --function-name HappniX-dev-AuthSchemaInit response.json
"""

import os
from integration import rds
from utils import utilities as util


_SCHEMA_SQL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "schemas", "happnix_auth_schema.sql"
)


def lambda_handler(event, context):
    """
    Reads the SQL schema file and executes it against RDS.
    Returns success/failure directly (for aws lambda invoke to read).
    """
    util.log("info", "AuthSchemaInit", "Invoked schema initializer.")

    try:
        sql_path = os.path.realpath(_SCHEMA_SQL_PATH)
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
    except Exception as exc:
        msg = f"Could not read schema SQL file: {exc}"
        util.log("error", "AuthSchemaInit", msg)
        return {"statusCode": 500, "body": msg}

    result = rds.execute_raw_sql(sql)

    if result.get("success"):
        msg = "Schema applied successfully."
        util.log("info", "AuthSchemaInit", msg)
        return {"statusCode": 200, "body": msg}
    else:
        error = result.get("error", "Unknown RDS error")
        msg = f"Schema apply failed: {error}"
        util.log("error", "AuthSchemaInit", msg)
        return {"statusCode": 500, "body": msg}
