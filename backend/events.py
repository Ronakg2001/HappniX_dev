"""
events.py — Events Lambda for HappniX.

Handles all event creation, management, and ticket operations.

Routes (all /api/events/*):
  POST   /api/events/create          → CreateEvent
  GET    /api/events/live            → GetLiveEvents
  GET    /api/events/nearby          → GetNearbyEvents
  GET    /api/events/{id}            → GetEvent
  DELETE /api/events/{id}            → DeleteEvent

  POST   /api/tickets/book           → BookTicket
  POST   /api/tickets/{id}/pay       → PayTicket

TODO: Implement each handler when the feature is being built.
      The lambda_handler skeleton below is ready to deploy to AWS as-is.
"""

import utilities.util as util


# ── Placeholder handlers ──────────────────────────────────────────────────────
# Replace each `pass` with the actual implementation when building the feature.

def CreateEvent(event, path_params, query_params, body):
    # TODO: Validate auth, validate fields, put_item to EVENTS_TABLE
    return util.err("CreateEvent not implemented yet.", 501)


def GetLiveEvents(event, path_params, query_params, body):
    # TODO: query_items EVENTS_TABLE on status-startAt-index for "live#"
    return util.err("GetLiveEvents not implemented yet.", 501)


def GetNearbyEvents(event, path_params, query_params, body):
    # TODO: query_items EVENTS_TABLE on geohash-index
    return util.err("GetNearbyEvents not implemented yet.", 501)


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
    if m == "GET"    and len(p) == 3 and p[:2] == ["api", "events"]:         return GetEvent, {"id": p[2]}
    if m == "DELETE" and len(p) == 3 and p[:2] == ["api", "events"]:         return DeleteEvent, {"id": p[2]}
    if m == "POST"   and p == ["api", "tickets", "book"]:                     return BookTicket, {}
    if m == "POST"   and len(p) == 4 and p[1] == "tickets" and p[3] == "pay": return PayTicket, {"id": p[2]}

    return None, {}


# ── Lambda Entry Point ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    if http_method == "OPTIONS":
        return util.ok({}, 200)

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
        util.log("error", "events", f"Unhandled error in {handler.__name__}: {exc}")
        return util.err("An internal error occurred.", 500)
