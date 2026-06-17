"""
services/event_services.py — Event creation, update, and retrieval logic.

Follows the CQRS pattern:
  - Writes go to RDS (source of truth) then sync to DynamoDB (read projection).
  - Reads come from DynamoDB for feeds, RDS for detail pages.
"""
import uuid
import hashlib
from utils import utilities as util
from integration import rds, dynamo_db


def _generate_event_uid() -> str:
    """Generate a short, human-readable event code like 'HX-A7K9M2'."""
    raw = uuid.uuid4().hex[:6].upper()
    return f"HX-{raw}"


def _build_event_card(event_data: dict) -> dict:
    """
    Build the denormalized EVENT_CARD for DynamoDB from the full RDS event row.
    This is what appears in feeds and discovery.
    """
    return {
        "entityType": "EVENT_CARD",
        "eventID": event_data.get("eventID"),
        "eventUID": event_data.get("eventUID"),
        "hostUserID": event_data.get("hostUserID"),
        "title": event_data.get("title"),
        "description": (event_data.get("description") or "")[:200],
        "eventCategory": event_data.get("eventCategory"),
        "tags": event_data.get("tags", []),
        "startAt": event_data.get("startAt"),
        "endAt": event_data.get("endAt"),
        "locationName": event_data.get("locationName"),
        "isOnline": event_data.get("isOnline", False),
        "ticketType": event_data.get("ticketType", "Free"),
        "basePrice": str(event_data.get("basePrice", "0.00")),
        "coverImageUrl": event_data.get("coverImageUrl"),
        "visibility": event_data.get("visibility", "Public"),
        "status": event_data.get("status", "Draft"),
        "engagementScore": str(event_data.get("engagementScore", "0.00")),
        "ticketsSold": 0,
        "createdAt": util.now_iso(),
        "updatedAt": util.now_iso(),
    }


def _format_event_payload(payload: dict) -> dict:
    """Map the frontend JSON payload to the backend RDS schema fields."""
    schedule = payload.get("schedule", {})
    location = payload.get("location", {})
    ticketing = payload.get("ticketing", {})
    policies = payload.get("policies", {})
    
    # Parse dates to ISO 8601 (or fallback to current time if missing)
    start_at = None
    if schedule.get("startDate") and schedule.get("startTime"):
        start_at = f"{schedule.get('startDate')}T{schedule.get('startTime')}:00+00:00"
    else:
        start_at = util.now_iso()
            
    end_at = None
    if schedule.get("endDate") and schedule.get("endTime"):
        end_at = f"{schedule.get('endDate')}T{schedule.get('endTime')}:00+00:00"
            
    # Parse ticket type
    t_mode = str(ticketing.get("mode", "free")).lower()
    ticket_type = "Paid" if t_mode == "paid" else "Free"
    
    return {
        "title": payload.get("title") or payload.get("eventData", {}).get("title", "Untitled Event"),
        "description": payload.get("description", ""),
        "eventCategory": payload.get("category") or payload.get("eventData", {}).get("category", "General"),
        "tags": payload.get("tags", []),
        
        "startAt": start_at,
        "endAt": end_at,
        "timezone": "Asia/Kolkata",
        
        "locationName": location.get("venue", "Venue TBD"),
        "locationAddress": location.get("address", ""),
        "isOnline": location.get("isOnline", False),
        
        "ticketType": ticket_type,
        "basePrice": 0.00,
        "maxAttendees": ticketing.get("capacity", 0),
        
        "coverImageUrl": payload.get("bannerUrl", ""),
        
        "policies": policies,
        "metadata": {
            "ageGroup": payload.get("ageGroup"),
            "artists": payload.get("artists", []),
            "dresscode": payload.get("dresscode", {}),
            "highlightText": payload.get("highlightText", ""),
            "highlights": payload.get("highlights", []),
            "services": payload.get("services", [])
        },
        "ticketTiers": ticketing.get("tiers", [])
    }


def create_event(host_user_id: str, raw_payload: dict, status: str = "Draft") -> dict:
    """
    Create a new event:
    1. Parse frontend raw payload into RDS format
    2. INSERT into RDS `events` table
    3. INSERT ticket tiers into RDS `event_ticket_tiers`
    4. PUT EVENT_CARD into DynamoDB
    """
    event_id = str(uuid.uuid4())
    event_uid = _generate_event_uid()
    
    event_data = _format_event_payload(raw_payload)
    event_data["status"] = status

    # ── Step 1: Insert into RDS ──
    rds_payload = {
        "eventID": event_id,
        "hostUserID": host_user_id,
        "eventUID": event_uid,
        "title": event_data.get("title"),
        "description": event_data.get("description"),
        "eventCategory": event_data.get("eventCategory", "General"),
        "tags": event_data.get("tags", []),
        "startAt": event_data.get("startAt"),
        "endAt": event_data.get("endAt"),
        "startLabel": event_data.get("startLabel"),
        "timezone": event_data.get("timezone", "Asia/Kolkata"),
        "locationName": event_data.get("locationName"),
        "locationAddress": event_data.get("locationAddress"),
        "latitude": event_data.get("latitude"),
        "longitude": event_data.get("longitude"),
        "isOnline": event_data.get("isOnline", False),
        "onlineLink": event_data.get("onlineLink"),
        "ticketType": event_data.get("ticketType", "Free"),
        "basePrice": event_data.get("basePrice", 0.00),
        "currency": event_data.get("currency", "INR"),
        "maxAttendees": event_data.get("maxAttendees"),
        "visibility": event_data.get("visibility", "Public"),
        "status": event_data.get("status", "Draft"),
        "coverImageUrl": event_data.get("coverImageUrl"),
        "metadata": event_data.get("metadata", {}),
        "policies": event_data.get("policies", {}),
    }

    rds_result = rds.insert_record("events", **rds_payload)
    if not rds_result.get("success"):
        util.log("error", "event_services.create_event",
                 f"RDS insert failed: {rds_result.get('error')}")
        return {"success": False, "error": "Failed to create event."}

    # ── Step 2: Insert ticket tiers (if provided) ──
    tiers = event_data.get("ticketTiers", [])
    for tier in tiers:
        tier_id = str(uuid.uuid4())
        rds.insert_record("event_ticket_tiers",
            tierID=tier_id,
            eventID=event_id,
            name=tier.get("name", "General"),
            description=tier.get("description"),
            price=tier.get("price", 0.00),
            capacity=tier.get("capacity"),
        )

    # ── Step 3: Sync to DynamoDB (EVENT_CARD) ──
    card = _build_event_card({**rds_payload, "eventID": event_id, "eventUID": event_uid})
    dynamo_result = dynamo_db.put_item(
        table_key="events",
        pk_value=f"EVENT#{event_id}",
        sk_value="CARD",
        **card,
    )

    if not dynamo_result.get("success"):
        util.log("warning", "event_services.create_event",
                 f"DynamoDB sync failed (non-fatal): {dynamo_result.get('error')}",
                 event_id=event_id)

    util.log("info", "event_services.create_event",
             f"Event created successfully", event_id=event_id, event_uid=event_uid)

    return {
        "success": True,
        "eventID": event_id,
        "eventUID": event_uid,
    }


def get_event_detail(event_id: str) -> dict:
    """
    Fetch full event detail from RDS (for the event detail page).
    Includes ticket tier information.
    """
    event_result = rds.get_record("events", eventID=event_id)
    if not event_result.get("success"):
        return {"success": False, "error": "Event not found."}

    # TODO: JOIN ticket tiers via raw SQL for richer detail
    return {"success": True, "data": event_result.get("data")}


def get_my_events(host_user_id: str) -> dict:
    """
    Fetch all events hosted by a user.
    Uses RDS for now; will migrate to DynamoDB HOST# partition later.
    """
    conn = rds.get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM events WHERE "hostUserID" = %s ORDER BY "createdAt" DESC;',
                (host_user_id,)
            )
            rows = cur.fetchall()
            events = [{k: str(v) if v is not None else None for k, v in row.items()} for row in rows]
            return {"success": True, "data": events}
    except Exception as exc:
        util.log("error", "event_services.get_my_events", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def update_event(event_id: str, updates: dict) -> dict:
    """
    Update an event in RDS and re-sync the EVENT_CARD to DynamoDB.
    """
    updates["updatedAt"] = util.now_iso()
    rds_result = rds.update_record("events", "eventID", event_id, updates)

    if not rds_result.get("success"):
        return {"success": False, "error": "Failed to update event."}

    # Re-sync to DynamoDB
    event_result = rds.get_record("events", eventID=event_id)
    if event_result.get("success"):
        card = _build_event_card(event_result["data"])
        dynamo_db.put_item(
            table_key="events",
            pk_value=f"EVENT#{event_id}",
            sk_value="CARD",
            **card,
        )

    return {"success": True}
