import os
import utilities.util as util
import utilities.dynamo as dynamo

try:
    from boto3.dynamodb.conditions import Key, Attr
except ImportError:
    Key = Attr = None

_EVENTS_TABLE = os.environ.get("EVENTS_TABLE_NAME", "")


# ── Placeholder handlers ──────────────────────────────────────────────────────
# Replace each stubs with the actual implementation when building features.

def create_event(event, path_params, query_params, body):
    # TODO: Validate auth, validate fields, put_item to EVENTS_TABLE
    return util.err("CreateEvent not implemented yet.", 501)


def get_live_events(event, path_params, query_params, body):
    """Live Now section — only live events, sorted newest first."""
    sub = event.get("auth_sub")
        
    limit = min(int(query_params.get("limit") or 10), 30)
    result = dynamo.query_items(
        _EVENTS_TABLE,
        Key("statusStartAt").begins_with("live#"),
        index_name="status-startAt-index",
        limit=limit,
        scan_index_forward=False,
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "count": len(events), "events": events})


def get_nearby_events(event, path_params, query_params, body):
    """
    Nearby events by geohash prefix.
    Frontend sends ?geohash=<prefix> (first 4-5 chars ≈ 5 km radius).
    """
    sub = event.get("auth_sub")
        
    geohash = str(query_params.get("geohash") or "").strip()
    if not geohash:
        radius_km = query_params.get("radiusKm") or query_params.get("radius_km")
        return util.ok({
            "success": True,
            "geohash": "",
            "radiusKm": radius_km,
            "count": 0,
            "events": [],
        })
    limit = min(int(query_params.get("limit") or 30), 50)
    result = dynamo.query_items(
        _EVENTS_TABLE,
        Key("geohash").begins_with(geohash),
        index_name="geohash-index",
        limit=limit,
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "geohash": geohash, "count": len(events), "events": events})


def get_my_events(event, path_params, query_params, body):
    """Hosted events for the current logged-in user."""
    cognito_sub = event.get("auth_sub")
    if not cognito_sub:
        return util.ok({"success": True, "count": 0, "events": []})
    result = dynamo.query_items(
        _EVENTS_TABLE,
        Key("cognitoSub").eq(cognito_sub) & Key("itemId").begins_with("EVENT#"),
        limit=min(int(query_params.get("limit") or 50), 100),
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "count": len(events), "events": events})


def get_event(event, path_params, query_params, body):
    # TODO: get_item EVENTS_TABLE by cognitoSub + itemId
    return util.err("GetEvent not implemented yet.", 501)


def delete_event(event, path_params, query_params, body):
    # TODO: Validate ownership, delete_item EVENTS_TABLE
    return util.err("DeleteEvent not implemented yet.", 501)


def book_ticket(event, path_params, query_params, body):
    # TODO: Validate auth + event, put_item TICKETS_TABLE
    return util.err("BookTicket not implemented yet.", 501)


def pay_ticket(event, path_params, query_params, body):
    # TODO: Validate auth + ticket, update_item TICKETS_TABLE status
    return util.err("PayTicket not implemented yet.", 501)


ACTION_HANDLERS = {
    "CREATE_EVENT": create_event,
    "GET_LIVE_EVENTS": get_live_events,
    "GET_NEARBY_EVENTS": get_nearby_events,
    "GET_MY_EVENTS": get_my_events,
    "GET_EVENT": get_event,
    "DELETE_EVENT": delete_event,
    "BOOK_TICKET": book_ticket,
    "PAY_TICKET": pay_ticket,
}

import utilities.cognito_auth as auth

def lambda_handler(event, context):
    try:
        # A. Parse Request Body
        body_str = event.get('body')
        if body_str:
            try:
                body = json.loads(body_str)
            except json.JSONDecodeError:
                return auth.build_response(400, {"error": "Malformed JSON in request body"})
        else:
            body = event.get('body') if isinstance(event.get('body'), dict) else {}
            if not body:
                body = event

        action_item = body.get('actionItem')
        if not action_item:
            return auth.build_response(400, {"error": "Missing 'actionItem' in payload"})

        # B. Verify Authorization
        UNPROTECTED_ACTIONS = set()
        
        decoded_token = {}
        if action_item not in UNPROTECTED_ACTIONS:
            headers = event.get('headers', {})
            auth_header = headers.get('Authorization') or headers.get('authorization')
            if not auth_header:
                return auth.build_response(401, {"error": "Missing Authorization header"})

            token = auth_header.replace('Bearer ', '').replace('bearer ', '')
            try:
                decoded_token = auth.verify_token(token)
                event["auth_sub"] = decoded_token.get("sub")
            except Exception as auth_error:
                print(f"Token verification failed: {str(auth_error)}")
                return auth.build_response(401, {"error": "Unauthorized: Invalid or expired token"})

        # C. Route to the requested function
        selected_action = ACTION_HANDLERS.get(action_item)
        if not selected_action:
            return auth.build_response(400, {"error": f"Invalid actionItem: {action_item}"})

        # Separate payload from actionItem
        payload = {k: v for k, v in body.items() if k != 'actionItem'}

        # Backward compatibility for existing handlers that expect path_params/query_params
        path_params = payload
        query_params = payload

        # D. Execute the function
        result = selected_action(event, path_params, query_params, payload)

        if "statusCode" in result and "body" in result:
            return result
        return auth.build_response(200, result)

    except Exception as e:
        print(f"Internal Server Error: {str(e)}")
        return auth.build_response(500, {"error": "Internal Server Error"})
