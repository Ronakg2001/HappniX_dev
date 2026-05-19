"""
utilities/dynamo.py — Universal DynamoDB helper for HappniX backend.

All functions accept table_name as a parameter so they can be called from
any Lambda without importing a table-specific wrapper.

Naming convention for keys:
  - Pass data dicts that include the primary key (PK) and sort key (SK)
    using the real attribute names of that table, e.g.
      {"cognitoSub": "abc", "relationKey": "FOLLOW#xyz", "status": "active"}

Every function returns a standard response envelope:
  {"success": True,  "data": <result>}       on success
  {"success": False, "error": "<message>"}   on failure

This makes it trivial to log / handle errors at the call site.
"""

import os

try:
    import boto3
    from boto3.dynamodb.conditions import Key, Attr
except ImportError:                        # local envs without AWS SDK
    boto3 = None
    Key = None
    Attr = None


# ── Internal bootstrap ────────────────────────────────────────────────────────

_dynamodb = (
    boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
    if boto3
    else None
)


def _get_table(table_name: str):
    """Return a boto3 Table resource; raises RuntimeError if misconfigured."""
    if not table_name:
        raise RuntimeError("DynamoDB table_name is required but was not provided.")
    if _dynamodb is None:
        raise RuntimeError("boto3 is not installed. DynamoDB operations are unavailable.")
    return _dynamodb.Table(table_name)


def _ok(data):
    return {"success": True, "data": data}


def _fail(error: str):
    return {"success": False, "error": error}


# ── CRUD Operations ───────────────────────────────────────────────────────────

def put_item(table_name: str, item: dict) -> dict:
    """
    Insert or fully replace an item in the table.

    Args:
        table_name: DynamoDB table name (from env or constant).
        item: Full item dict. Must include the table's PK (and SK if composite).

    Returns:
        {"success": True, "data": item}  or  {"success": False, "error": "..."}
    """
    try:
        _get_table(table_name).put_item(Item=item)
        return _ok(item)
    except Exception as exc:
        return _fail(f"put_item failed on '{table_name}': {exc}")


def get_item(table_name: str, key: dict) -> dict:
    """
    Fetch a single item by its exact primary key.

    Args:
        table_name: DynamoDB table name.
        key: Dict with PK (and SK if applicable), e.g. {"cognitoSub": "x", "relationKey": "y"}.

    Returns:
        {"success": True, "data": <item or None>}  or  {"success": False, "error": "..."}
    """
    try:
        response = _get_table(table_name).get_item(Key=key)
        return _ok(response.get("Item"))
    except Exception as exc:
        return _fail(f"get_item failed on '{table_name}': {exc}")


def query_items(table_name: str, key_condition, filter_expression=None,
                index_name: str = None, limit: int = None,
                scan_index_forward: bool = True) -> dict:
    """
    Query items by a KeyConditionExpression (and optional FilterExpression).

    Args:
        table_name:          DynamoDB table name.
        key_condition:       boto3 Key condition, e.g. Key("cognitoSub").eq("abc").
        filter_expression:   Optional boto3 Attr filter, e.g. Attr("status").eq("active").
        index_name:          Optional GSI name.
        limit:               Max number of items to return.
        scan_index_forward:  Sort order (True = ascending).

    Returns:
        {"success": True, "data": [<items>]}  or  {"success": False, "error": "..."}

    Example:
        from boto3.dynamodb.conditions import Key
        result = query_items(SOCIAL_TABLE, Key("cognitoSub").eq(sub))
        if result["success"]:
            items = result["data"]
    """
    try:
        kwargs = {
            "KeyConditionExpression": key_condition,
            "ScanIndexForward": scan_index_forward,
        }
        if filter_expression is not None:
            kwargs["FilterExpression"] = filter_expression
        if index_name:
            kwargs["IndexName"] = index_name
        if limit:
            kwargs["Limit"] = limit

        response = _get_table(table_name).query(**kwargs)
        return _ok(response.get("Items", []))
    except Exception as exc:
        return _fail(f"query_items failed on '{table_name}': {exc}")


def update_item(table_name: str, key: dict, updates: dict) -> dict:
    """
    Partially update an existing item using SET expressions.

    Args:
        table_name: DynamoDB table name.
        key:        Dict with PK (and SK). e.g. {"cognitoSub": "x", "settingKey": "PREFERENCES"}.
        updates:    Dict of fields to set, e.g. {"bio": "hello", "updatedAt": "2026-..."}.

    Returns:
        {"success": True, "data": <updated attributes>}  or  {"success": False, "error": "..."}

    Note: updatedAt is NOT auto-injected here — pass it explicitly in `updates`
          so callers stay in full control of what gets written.
    """
    try:
        set_parts = [f"#{k} = :{k}" for k in updates]
        expr_names = {f"#{k}": k for k in updates}
        expr_values = {f":{k}": v for k, v in updates.items()}

        response = _get_table(table_name).update_item(
            Key=key,
            UpdateExpression="SET " + ", ".join(set_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _ok(response.get("Attributes", {}))
    except Exception as exc:
        return _fail(f"update_item failed on '{table_name}': {exc}")


def delete_item(table_name: str, key: dict) -> dict:
    """
    Delete an item by its primary key.

    Args:
        table_name: DynamoDB table name.
        key:        Dict with PK (and SK if applicable).

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        _get_table(table_name).delete_item(Key=key)
        return _ok(None)
    except Exception as exc:
        return _fail(f"delete_item failed on '{table_name}': {exc}")


def scan_items(table_name: str, filter_expression=None, limit: int = None) -> dict:
    """
    Full-table scan (use sparingly — expensive on large tables).

    Args:
        table_name:        DynamoDB table name.
        filter_expression: Optional boto3 Attr filter.
        limit:             Max items to return.

    Returns:
        {"success": True, "data": [<items>]}  or  {"success": False, "error": "..."}
    """
    try:
        kwargs = {}
        if filter_expression is not None:
            kwargs["FilterExpression"] = filter_expression
        if limit:
            kwargs["Limit"] = limit

        response = _get_table(table_name).scan(**kwargs)
        return _ok(response.get("Items", []))
    except Exception as exc:
        return _fail(f"scan_items failed on '{table_name}': {exc}")


def add_to_set(table_name: str, key: dict, attribute: str, values: set) -> dict:
    """
    Add one or more values to a DynamoDB Set attribute (ADD expression).

    Args:
        table_name: DynamoDB table name.
        key:        Dict with PK (and SK).
        attribute:  Name of the Set attribute.
        values:     Python set of values to add.

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        _get_table(table_name).update_item(
            Key=key,
            UpdateExpression=f"ADD #{attribute} :vals",
            ExpressionAttributeNames={f"#{attribute}": attribute},
            ExpressionAttributeValues={":vals": values},
        )
        return _ok(None)
    except Exception as exc:
        return _fail(f"add_to_set failed on '{table_name}': {exc}")


def remove_from_set(table_name: str, key: dict, attribute: str, values: set) -> dict:
    """
    Remove one or more values from a DynamoDB Set attribute (DELETE expression).

    Args:
        table_name: DynamoDB table name.
        key:        Dict with PK (and SK).
        attribute:  Name of the Set attribute.
        values:     Python set of values to remove.

    Returns:
        {"success": True, "data": None}  or  {"success": False, "error": "..."}
    """
    try:
        _get_table(table_name).update_item(
            Key=key,
            UpdateExpression=f"DELETE #{attribute} :vals",
            ExpressionAttributeNames={f"#{attribute}": attribute},
            ExpressionAttributeValues={":vals": values},
        )
        return _ok(None)
    except Exception as exc:
        return _fail(f"remove_from_set failed on '{table_name}': {exc}")


def batch_write(table_name: str, items: list) -> dict:
    """
    Write multiple items in a single batch operation (max 25 items per call).

    Args:
        table_name: DynamoDB table name.
        items:      List of item dicts to write.

    Returns:
        {"success": True, "data": {"written": <count>}}  or  {"success": False, "error": "..."}
    """
    try:
        table = _get_table(table_name)
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
        return _ok({"written": len(items)})
    except Exception as exc:
        return _fail(f"batch_write failed on '{table_name}': {exc}")
