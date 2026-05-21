import os
import utilities.util as util
import utilities.dynamo as dynamo

try:
    from boto3.dynamodb.conditions import Key, Attr
except ImportError:
    Key = Attr = None

_EVENTS_TABLE = os.environ.get("EVENTS_TABLE_NAME", "")


# ── Auth helper — use util.get_jwt_sub instead of duplicating here ────────────
_get_jwt_sub = util.get_jwt_sub


# ── Placeholder handlers ──────────────────────────────────────────────────────
# Replace each stubs with the actual implementation when building features.

def CreateEvent(event, path_params, query_params, body):
    # TODO: Validate auth, validate fields, put_item to EVENTS_TABLE
    return util.err("CreateEvent not implemented yet.", 501)


def GetLiveEvents(event, path_params, query_params, body):
    """Live Now section — only live events, sorted newest first."""
    sub = _get_jwt_sub(event)
    if not sub:
        return util.err("Not authenticated.", 401)
        
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


def GetNearbyEvents(event, path_params, query_params, body):
    """
    Nearby events by geohash prefix.
    Frontend sends ?geohash=<prefix> (first 4-5 chars ≈ 5 km radius).
    """
    sub = _get_jwt_sub(event)
    if not sub:
        return util.err("Not authenticated.", 401)
        
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


def GetMyEvents(event, path_params, query_params, body):
    """Hosted events for the current logged-in user."""
    cognito_sub = _get_jwt_sub(event)
    if not cognito_sub:
        return util.ok({"success": True, "count": 0, "events": []})
    result = dynamo.query_items(
        _EVENTS_TABLE,
        Key("cognitoSub").eq(cognito_sub) & Key("itemId").begins_with("EVENT#"),
        limit=min(int(query_params.get("limit") or 50), 100),
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "count": len(events), "events": events})


def GetEvent(event, path_params, query_params, body):
    # TODO: get_item EVENTS_TABLE by cognitoSub + itemId
    return util.err("GetEvent not implemented yet.", 501)


def DeleteEvent(event, path_params, query_params, body):
    # TODO: Validate ownership, delete_item EVENTS_TABLE
    return util.err("DeleteEvent not implemented yet.", 501)


def BookTicket(event, path_params, query_params, body):
    # TODO: Validate auth + event, put_item TICKETS_TABLE
    return util.err("BookTicket not implemented yet.", 501)


def PayTicket(event, path_params, query_params, body):
    # TODO: Validate auth + ticket, update_item TICKETS_TABLE status
    return util.err("PayTicket not implemented yet.", 501)


# ── Router ────────────────────────────────────────────────────────────────────

def _resolve(method, path):
    m = method.upper()
    p = [s for s in path.split("/") if s]

    if m == "POST"   and p == ["api", "events", "create"]:                    return CreateEvent, {}
    if m == "GET"    and p == ["api", "events", "live"]:                      return GetLiveEvents, {}
    if m == "GET"    and p == ["api", "events", "nearby"]:                    return GetNearbyEvents, {}
    if m == "GET"    and p == ["api", "events", "mine"]:                      return GetMyEvents, {}
    if m == "GET"    and len(p) == 3 and p[:2] == ["api", "events"]:         return GetEvent, {"id": p[2]}
    if m == "DELETE" and len(p) == 3 and p[:2] == ["api", "events"]:         return DeleteEvent, {"id": p[2]}
    if m == "POST"   and p == ["api", "tickets", "book"]:                     return BookTicket, {}
    if m == "POST"   and len(p) == 4 and p[1] == "tickets" and p[3] == "pay": return PayTicket, {"id": p[2]}

    return None, {}


# ── Lambda Entry Point ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    # ── Trace ID: prefer Lambda's own request ID for CloudWatch correlation ──
    trace_id = context.aws_request_id or event.get("requestContext", {}).get("requestId") or "unknown"

    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    if http_method == "OPTIONS":
        return util.ok({}, 200)

    # ── Timeout guard ────────────────────────────────────────────────────────
    if context.get_remaining_time_in_millis() < 1500:
        util.log("warning", trace_id, "Lambda near timeout — returning 503",
                 functionName=context.function_name)
        return util.err("Request timed out. Please try again.", 503)

    query_params = event.get("queryStringParameters") or {}
    path_params  = event.get("pathParameters") or {}
    body = util.parse_body(event)

    handler, resolved_params = _resolve(http_method, path)
    merged_params = {**path_params, **resolved_params}

    if handler is None:
        return util.err(f"Route not found: {http_method} {path}", 404)

    try:
        return handler(event, merged_params, query_params, body)
    except Exception as exc:
        util.log("error", trace_id, f"Unhandled error in {handler.__name__}: {exc}",
                 functionName=context.function_name)
        return util.err("An internal error occurred.", 500)
