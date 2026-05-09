import hashlib
import json
import os
import uuid
import time
from pathlib import Path

try:
    import boto3
    dynamodb = boto3.resource("dynamodb")
    cognito = boto3.client("cognito-idp")
except ImportError:
    boto3 = None
    dynamodb = None
    cognito = None


def _get_sessions_table():
    table_name = os.environ.get("SESSIONS_TABLE_NAME")
    if not dynamodb or not table_name:
        return None
    return dynamodb.Table(table_name)

def _state_path():
    configured = os.environ.get("HAPPNIX_DEV_STORE_PATH", "").strip()
    if configured:
        return Path(configured)
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return Path("/tmp/auth_state.json")
    return Path(__file__).with_name("dev_data").joinpath("auth_state.json")


def _default_state():
    return {"next_user_id": 1, "sessions": {}, "users": []}


def load_state():
    path = _state_path()
    if not path.exists():
        return _default_state()
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(state):
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def ensure_session(session_token=None):
    token = session_token or uuid.uuid4().hex
    table = _get_sessions_table()
    if table:
        response = table.get_item(Key={"sessionToken": token})
        if "Item" in response:
            return token, json.loads(response["Item"].get("data", "{}"))
        
        expires_at = int(time.time()) + 86400  # 24 hours TTL
        table.put_item(Item={
            "sessionToken": token,
            "data": "{}",
            "expiresAt": expires_at
        })
        return token, {}

    state = load_state()
    state["sessions"].setdefault(token, {})
    save_state(state)
    return token, state["sessions"][token]


def get_session(session_token):
    if not session_token:
        return None, None
        
    table = _get_sessions_table()
    if table:
        response = table.get_item(Key={"sessionToken": session_token})
        if "Item" in response:
            return session_token, json.loads(response["Item"].get("data", "{}"))
        return session_token, None

    state = load_state()
    session = state["sessions"].get(session_token)
    return session_token, session


def replace_session(token, session_data):
    if not token:
        return
        
    table = _get_sessions_table()
    if table:
        expires_at = int(time.time()) + 86400
        table.put_item(Item={
            "sessionToken": token,
            "data": json.dumps(session_data),
            "expiresAt": expires_at
        })
        return

    state = load_state()
    state["sessions"][token] = session_data
    save_state(state)



