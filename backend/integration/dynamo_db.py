"""
integration/dynamo_db.py — DynamoDB helper functions for HappniX.

This module owns the boto3 DynamoDB client and all direct DynamoDB API calls.
Import this module in handlers instead of calling boto3 directly.

Available functions:
    create_user_entities(user_id, username, full_name, cognito_sub)
        → Creates PROFILE + SETTINGS rows for a new user (batch write).

    get_user_entity(user_id, entity_type)
        → Fetches a single entity row (e.g. PROFILE, SETTINGS) by PK + SK.

    ensure_user_profile(user_id, username, full_name, cognito_sub)
        → Self-healing: returns the PROFILE if it exists, otherwise creates
          both entities first and then returns the freshly written PROFILE.
"""

import os
import json
import boto3
from botocore.exceptions import ClientError
from utils import utilities as util

# Load manifest
_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "manifest.json")
try:
    with open(_MANIFEST_PATH, "r") as _f:
        _MANIFEST = json.load(_f)
except Exception as e:
    util.log("error", "dynamo_db.init", f"Failed to load manifest.json: {e}")
    _MANIFEST = {}


# ── DynamoDB client (single shared instance) ──────────────────────────────────
_dynamodb_resource = boto3.resource("dynamodb")
_TABLE_CACHE = {}

def _get_table(table_key: str):
    """Return the DynamoDB Table resource, or None if unavailable. Lazy loaded."""
    global _dynamodb_resource, _TABLE_CACHE
    if table_key in _TABLE_CACHE:
        return _TABLE_CACHE[table_key]
        
    try:       
        table_config = _MANIFEST.get("dynamodb", {}).get("tables", {}).get(table_key, {})
        env_var_name = table_config.get("env_var")
        if not env_var_name:
            util.log("error", "dynamo_db._get_table", f"No env_var defined in manifest for table: {table_key}")
            return None
        table_name = os.environ.get(env_var_name, "")
    except Exception as exc:
        util.log("error", "dynamo_db._get_table", f"DynamoDB Init failed: {exc}")
        return None

    if not _dynamodb_resource or not table_name:
        util.log("error", "dynamo_db._get_table",
                 f"DynamoDB resource or {env_var_name} not configured.")
        return None
        
    table = _dynamodb_resource.Table(table_name)
    _TABLE_CACHE[table_key] = table
    return table


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DYNAMIC ENTITY TEMPLATES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _build_entity(table_key: str, entity_type: str, user_id: str, **kwargs) -> dict:
    """
    Build an entity dynamically based on the manifest.json schema.
    """
    schema = _MANIFEST.get("dynamodb", {}).get("tables", {}).get(table_key, {}).get("entities", {}).get(entity_type, {})
    
    # Start with base schema defaults
    item = dict(schema)
    
    # Apply required base fields
    item["userID"] = user_id
    
    # Override with provided dynamic fields
    item.update(kwargs)
    
    # Apply timestamps
    item["createdAt"] = util.now_iso()
    item["updatedAt"] = util.now_iso()
    
    return item


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GENERIC DYNAMODB OPERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_item(table_key: str, pk_value: str, sk_value: str, specific_query: dict = None, **kwargs) -> dict:
    """
    Fetch a single item from DynamoDB dynamically using the manifest config.
    """
    table = _get_table(table_key)
    if not table:
        return {"success": False, "error": f"DynamoDB table {table_key} not available."}
        
    table_config = _MANIFEST.get("dynamodb", {}).get("tables", {}).get(table_key, {})
    pk_name = table_config.get("keys", {}).get("pk", "PK")
    sk_name = table_config.get("keys", {}).get("sk", "SK")

    try:
        response = table.get_item(
            Key={
                pk_name: pk_value,
                sk_name: sk_value,
            }
        )

        item = response.get("Item")
        if not item:
            return {"success": False, "error": "not_found"}

        return {"success": True, "data": item}

    except ClientError as exc:
        util.log("error", "dynamo_db.get_item",
                 f"DynamoDB get_item failed: {exc}",
                 table_key=table_key, pk_value=pk_value)
        return {"success": False, "error": str(exc)}

def put_item(table_key: str, pk_value: str, sk_value: str, entity_type: str = None, **kwargs) -> dict:
    """
    Constructs an entity based on the manifest schema and inserts it into DynamoDB.
    """
    table = _get_table(table_key)
    if not table:
        return {"success": False, "error": f"DynamoDB table {table_key} not available."}
        
    if entity_type:
        item = _build_entity(table_key, entity_type, pk_value, **kwargs)
    else:
        # If no entity type is provided, construct directly from kwargs
        table_config = _MANIFEST.get("dynamodb", {}).get("tables", {}).get(table_key, {})
        pk_name = table_config.get("keys", {}).get("pk", "PK")
        sk_name = table_config.get("keys", {}).get("sk", "SK")
        item = kwargs.copy()
        item[pk_name] = pk_value
        item[sk_name] = sk_value

    try:
        table.put_item(Item=item)
        return {"success": True}
    except ClientError as exc:
        util.log("error", "dynamo_db.put_item",
                 f"DynamoDB put_item failed: {exc}",
                 table_key=table_key, pk_value=pk_value)
        return {"success": False, "error": str(exc)}

def batch_write_items(table_key: str, items_config: list, **kwargs) -> dict:
    """
    Insert multiple items in a batch. 
    items_config is a list of dicts. Example: [{"entity_type": "PROFILE", "pk_value": "user-123", "kwargs": {...}}, ...]
    """
    table = _get_table(table_key)
    if not table:
        return {"success": False, "error": f"DynamoDB table {table_key} not available."}

    try:
        with table.batch_writer() as batch:
            for conf in items_config:
                entity_type = conf.get("entity_type")
                pk_value = conf.get("pk_value")
                item_kwargs = conf.get("kwargs", {})
                
                if entity_type:
                    item = _build_entity(table_key, entity_type, pk_value, **item_kwargs)
                else:
                    item = conf.get("item", {})
                
                batch.put_item(Item=item)
        return {"success": True}
    except ClientError as exc:
        util.log("error", "dynamo_db.batch_write_items",
                 f"DynamoDB batch_write failed: {exc}",
                 table_key=table_key)
        return {"success": False, "error": str(exc)}
    except Exception as exc:
        util.log("error", "dynamo_db.batch_write_items",
                 f"Unexpected error: {exc}", table_key=table_key)
        return {"success": False, "error": str(exc)}
