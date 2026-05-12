"""
dynamo_db.py — DynamoDB helper layer for HappniX serverless backend.

All tables use cognitoSub as the primary partition key to link with
the RDS users table (users.cognitoSub is the foreign-key bridge).

Tables:
  EVENTS_TABLE   — PK: cognitoSub | SK: itemId (EVENT#<id>)
  TICKETS_TABLE  — PK: cognitoSub | SK: ticketId (TICKET#<id>)
  SOCIAL_TABLE   — PK: cognitoSub | SK: relationKey (FOLLOW#<sub>, LIKE#<eventId> …)
  SETTINGS_TABLE — PK: cognitoSub | SK: settingKey (PREFERENCES, BLOCKED, MUTED …)
  NOTIFICATIONS_TABLE — PK: cognitoSub | SK: notifId (NOTIF#<ts>#<uuid>)
"""

import os
import uuid
import boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key, Attr

# ── Environment variable names ────────────────────────────────────────────────
_EVENTS_TABLE_NAME        = os.environ.get("EVENTS_TABLE_NAME", "")
_TICKETS_TABLE_NAME       = os.environ.get("TICKETS_TABLE_NAME", "")
_SOCIAL_TABLE_NAME        = os.environ.get("SOCIAL_TABLE_NAME", "")
_SETTINGS_TABLE_NAME      = os.environ.get("SETTINGS_TABLE_NAME", "")
_NOTIFICATIONS_TABLE_NAME = os.environ.get("NOTIFICATIONS_TABLE_NAME", "")

_dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-south-1"))


def _table(name):
    if not name:
        raise RuntimeError(f"DynamoDB table name not configured (env var empty).")
    return _dynamodb.Table(name)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _new_id():
    return uuid.uuid4().hex[:16]


# ══════════════════════════════════════════════════════════════════════════════
# EVENTS TABLE
# PK: cognitoSub  SK: EVENT#<eventId>
# GSI: status-startAt-index, geohash-index
# ══════════════════════════════════════════════════════════════════════════════

def put_event(cognito_sub, event_data: dict) -> dict:
    """Create or replace an event record."""
    event_id = event_data.get("eventId") or f"EVENT#{_new_id()}"
    if not event_id.startswith("EVENT#"):
        event_id = f"EVENT#{event_id}"
    item = {
        "cognitoSub": cognito_sub,
        "itemId": event_id,
        "type": "event",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
        **{k: v for k, v in event_data.items() if k not in ("cognitoSub", "itemId")},
        # GSI keys — composite for efficient status+time queries
        "statusStartAt": f"{event_data.get('status', 'upcoming')}#{event_data.get('startAt', '')}",
        "geohash": event_data.get("geohash", ""),
    }
    _table(_EVENTS_TABLE_NAME).put_item(Item=item)
    return item


def get_event(cognito_sub, event_id) -> dict | None:
    """Fetch a single event by owner cognitoSub + eventId."""
    sk = event_id if event_id.startswith("EVENT#") else f"EVENT#{event_id}"
    resp = _table(_EVENTS_TABLE_NAME).get_item(Key={"cognitoSub": cognito_sub, "itemId": sk})
    return resp.get("Item")


def list_events_by_user(cognito_sub) -> list:
    """All events posted by a user."""
    resp = _table(_EVENTS_TABLE_NAME).query(
        KeyConditionExpression=Key("cognitoSub").eq(cognito_sub) & Key("itemId").begins_with("EVENT#")
    )
    return resp.get("Items", [])


def list_live_events(limit=20) -> list:
    """Query the status-startAt GSI for live events."""
    now = _now_iso()
    resp = _table(_EVENTS_TABLE_NAME).query(
        IndexName="status-startAt-index",
        KeyConditionExpression=Key("statusStartAt").begins_with("live#"),
        Limit=limit,
        ScanIndexForward=False,
    )
    return resp.get("Items", [])


def list_upcoming_events(limit=30) -> list:
    """Query upcoming events sorted by start time."""
    resp = _table(_EVENTS_TABLE_NAME).query(
        IndexName="status-startAt-index",
        KeyConditionExpression=Key("statusStartAt").begins_with("upcoming#"),
        Limit=limit,
        ScanIndexForward=True,
    )
    return resp.get("Items", [])


def list_nearby_events(geohash_prefix, limit=30) -> list:
    """Query events by geohash prefix (first 4–5 chars for ~5 km radius)."""
    resp = _table(_EVENTS_TABLE_NAME).query(
        IndexName="geohash-index",
        KeyConditionExpression=Key("geohash").begins_with(geohash_prefix),
        Limit=limit,
    )
    return resp.get("Items", [])


def delete_event(cognito_sub, event_id):
    """Delete an event (only the owner can call this)."""
    sk = event_id if event_id.startswith("EVENT#") else f"EVENT#{event_id}"
    _table(_EVENTS_TABLE_NAME).delete_item(Key={"cognitoSub": cognito_sub, "itemId": sk})


# ══════════════════════════════════════════════════════════════════════════════
# TICKETS TABLE
# PK: cognitoSub (buyer)  SK: TICKET#<ticketId>
# GSI: eventId-index
# ══════════════════════════════════════════════════════════════════════════════

def put_ticket(cognito_sub, ticket_data: dict) -> dict:
    """Create or update a ticket."""
    ticket_id = ticket_data.get("ticketId") or f"TICKET#{_new_id()}"
    if not ticket_id.startswith("TICKET#"):
        ticket_id = f"TICKET#{ticket_id}"
    item = {
        "cognitoSub": cognito_sub,
        "ticketId": ticket_id,
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
        "status": "active",
        **{k: v for k, v in ticket_data.items() if k not in ("cognitoSub", "ticketId")},
    }
    _table(_TICKETS_TABLE_NAME).put_item(Item=item)
    return item


def get_ticket(cognito_sub, ticket_id) -> dict | None:
    sk = ticket_id if ticket_id.startswith("TICKET#") else f"TICKET#{ticket_id}"
    resp = _table(_TICKETS_TABLE_NAME).get_item(Key={"cognitoSub": cognito_sub, "ticketId": sk})
    return resp.get("Item")


def list_tickets_by_user(cognito_sub) -> list:
    resp = _table(_TICKETS_TABLE_NAME).query(
        KeyConditionExpression=Key("cognitoSub").eq(cognito_sub)
    )
    return resp.get("Items", [])


def list_tickets_by_event(event_id) -> list:
    """All tickets for a given event (host view via GSI)."""
    resp = _table(_TICKETS_TABLE_NAME).query(
        IndexName="eventId-index",
        KeyConditionExpression=Key("eventId").eq(event_id),
    )
    return resp.get("Items", [])


def update_ticket_status(cognito_sub, ticket_id, new_status: str) -> dict | None:
    sk = ticket_id if ticket_id.startswith("TICKET#") else f"TICKET#{ticket_id}"
    resp = _table(_TICKETS_TABLE_NAME).update_item(
        Key={"cognitoSub": cognito_sub, "ticketId": sk},
        UpdateExpression="SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": new_status, ":u": _now_iso()},
        ReturnValues="ALL_NEW",
    )
    return resp.get("Attributes")


def delete_ticket(cognito_sub, ticket_id):
    sk = ticket_id if ticket_id.startswith("TICKET#") else f"TICKET#{ticket_id}"
    _table(_TICKETS_TABLE_NAME).delete_item(Key={"cognitoSub": cognito_sub, "ticketId": sk})


# ══════════════════════════════════════════════════════════════════════════════
# SOCIAL TABLE  (follows, likes, comments — adjacency list)
# PK: cognitoSub (actor)  SK: relationKey
# GSI: targetSub-index (reverse lookup — who follows me)
# ══════════════════════════════════════════════════════════════════════════════

def follow_user(actor_sub, target_sub) -> dict:
    """Record actor follows target."""
    item = {
        "cognitoSub": actor_sub,
        "relationKey": f"FOLLOW#{target_sub}",
        "targetSub": target_sub,
        "relationType": "follow",
        "status": "active",     # pending for private accounts
        "createdAt": _now_iso(),
    }
    _table(_SOCIAL_TABLE_NAME).put_item(Item=item)
    return item


def unfollow_user(actor_sub, target_sub):
    _table(_SOCIAL_TABLE_NAME).delete_item(
        Key={"cognitoSub": actor_sub, "relationKey": f"FOLLOW#{target_sub}"}
    )


def is_following(actor_sub, target_sub) -> bool:
    resp = _table(_SOCIAL_TABLE_NAME).get_item(
        Key={"cognitoSub": actor_sub, "relationKey": f"FOLLOW#{target_sub}"}
    )
    item = resp.get("Item")
    return bool(item and item.get("status") == "active")


def list_following(cognito_sub) -> list:
    """List of targetSub values that cognitoSub follows."""
    resp = _table(_SOCIAL_TABLE_NAME).query(
        KeyConditionExpression=Key("cognitoSub").eq(cognito_sub) & Key("relationKey").begins_with("FOLLOW#")
    )
    return resp.get("Items", [])


def list_followers(cognito_sub) -> list:
    """Reverse lookup — who follows me."""
    resp = _table(_SOCIAL_TABLE_NAME).query(
        IndexName="targetSub-index",
        KeyConditionExpression=Key("targetSub").eq(cognito_sub),
    )
    return [item for item in resp.get("Items", []) if item.get("relationKey", "").startswith("FOLLOW#")]


def list_follow_requests(cognito_sub) -> list:
    """Pending follow requests directed at me."""
    resp = _table(_SOCIAL_TABLE_NAME).query(
        IndexName="targetSub-index",
        KeyConditionExpression=Key("targetSub").eq(cognito_sub),
        FilterExpression=Attr("status").eq("pending"),
    )
    return resp.get("Items", [])


def update_follow_status(actor_sub, target_sub, new_status: str):
    """Accept or reject a follow request."""
    _table(_SOCIAL_TABLE_NAME).update_item(
        Key={"cognitoSub": actor_sub, "relationKey": f"FOLLOW#{target_sub}"},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": new_status},
    )


def like_event(actor_sub, event_id):
    item = {
        "cognitoSub": actor_sub,
        "relationKey": f"LIKE#{event_id}",
        "targetSub": event_id,   # event acts as target for GSI
        "relationType": "like",
        "createdAt": _now_iso(),
    }
    _table(_SOCIAL_TABLE_NAME).put_item(Item=item)
    return item


def unlike_event(actor_sub, event_id):
    _table(_SOCIAL_TABLE_NAME).delete_item(
        Key={"cognitoSub": actor_sub, "relationKey": f"LIKE#{event_id}"}
    )


# ══════════════════════════════════════════════════════════════════════════════
# SETTINGS TABLE
# PK: cognitoSub  SK: PREFERENCES | BLOCKED | MUTED | GUEST_INVITE#<token>
# ══════════════════════════════════════════════════════════════════════════════

def get_preferences(cognito_sub) -> dict:
    resp = _table(_SETTINGS_TABLE_NAME).get_item(
        Key={"cognitoSub": cognito_sub, "settingKey": "PREFERENCES"}
    )
    return resp.get("Item", {})


def save_preferences(cognito_sub, prefs: dict) -> dict:
    item = {
        "cognitoSub": cognito_sub,
        "settingKey": "PREFERENCES",
        "updatedAt": _now_iso(),
        **{k: v for k, v in prefs.items() if k not in ("cognitoSub", "settingKey")},
    }
    _table(_SETTINGS_TABLE_NAME).put_item(Item=item)
    return item


def get_people_list(cognito_sub, category: str) -> list:
    """category: blocked | muted"""
    sk = category.upper()
    resp = _table(_SETTINGS_TABLE_NAME).get_item(
        Key={"cognitoSub": cognito_sub, "settingKey": sk}
    )
    return resp.get("Item", {}).get("people", [])


def add_to_people_list(cognito_sub, category: str, target_sub: str):
    sk = category.upper()
    _table(_SETTINGS_TABLE_NAME).update_item(
        Key={"cognitoSub": cognito_sub, "settingKey": sk},
        UpdateExpression="ADD people :t SET updatedAt = :u",
        ExpressionAttributeValues={":t": {target_sub}, ":u": _now_iso()},
    )


def remove_from_people_list(cognito_sub, category: str, target_sub: str):
    sk = category.upper()
    _table(_SETTINGS_TABLE_NAME).update_item(
        Key={"cognitoSub": cognito_sub, "settingKey": sk},
        UpdateExpression="DELETE people :t SET updatedAt = :u",
        ExpressionAttributeValues={":t": {target_sub}, ":u": _now_iso()},
    )


def put_guest_invite(cognito_sub, token: str, invite_data: dict) -> dict:
    item = {
        "cognitoSub": cognito_sub,
        "settingKey": f"GUEST_INVITE#{token}",
        "token": token,
        "createdAt": _now_iso(),
        **{k: v for k, v in invite_data.items() if k not in ("cognitoSub", "settingKey")},
    }
    _table(_SETTINGS_TABLE_NAME).put_item(Item=item)
    return item


def get_guest_invite(cognito_sub, token: str) -> dict | None:
    resp = _table(_SETTINGS_TABLE_NAME).get_item(
        Key={"cognitoSub": cognito_sub, "settingKey": f"GUEST_INVITE#{token}"}
    )
    return resp.get("Item")


def update_guest_invite(cognito_sub, token: str, updates: dict):
    sk = f"GUEST_INVITE#{token}"
    set_exprs = [f"#{k} = :{k}" for k in updates]
    names = {f"#{k}": k for k in updates}
    values = {f":{k}": v for k, v in updates.items()}
    names["#updatedAt"] = "updatedAt"
    values[":updatedAt"] = _now_iso()
    set_exprs.append("#updatedAt = :updatedAt")
    _table(_SETTINGS_TABLE_NAME).update_item(
        Key={"cognitoSub": cognito_sub, "settingKey": sk},
        UpdateExpression="SET " + ", ".join(set_exprs),
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )


# ══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS TABLE
# PK: cognitoSub (recipient)  SK: NOTIF#<timestamp>#<uuid>
# ══════════════════════════════════════════════════════════════════════════════

def put_notification(recipient_sub, notif_type: str, payload: dict) -> dict:
    ts = _now_iso()
    uid = _new_id()
    item = {
        "cognitoSub": recipient_sub,
        "notifId": f"NOTIF#{ts}#{uid}",
        "type": notif_type,
        "isRead": False,
        "createdAt": ts,
        **{k: v for k, v in payload.items() if k not in ("cognitoSub", "notifId")},
    }
    _table(_NOTIFICATIONS_TABLE_NAME).put_item(Item=item)
    return item


def list_notifications(cognito_sub, limit=50) -> list:
    resp = _table(_NOTIFICATIONS_TABLE_NAME).query(
        KeyConditionExpression=Key("cognitoSub").eq(cognito_sub),
        Limit=limit,
        ScanIndexForward=False,
    )
    return resp.get("Items", [])


def mark_all_notifications_read(cognito_sub):
    items = list_notifications(cognito_sub, limit=100)
    tbl = _table(_NOTIFICATIONS_TABLE_NAME)
    with tbl.batch_writer() as batch:
        for item in items:
            if not item.get("isRead"):
                batch.put_item(Item={**item, "isRead": True})
