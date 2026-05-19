"""
messaging.py — Messaging Lambda for HappniX.

Handles direct messages and group conversations.

Routes (all /api/messages/*):
  POST /api/messages/conversations/start       → StartConversation
  GET  /api/messages/conversations             → ListConversations
  GET  /api/messages/conversations/{id}        → GetConversation
  POST /api/messages/conversations/{id}/send   → SendMessage
  GET  /api/messages/groups/{id}/messages      → GetGroupMessages

TODO: Implement each handler when the feature is being built.
      The lambda_handler skeleton below is ready to deploy to AWS as-is.
"""

import utilities.util as util


# ── Placeholder handlers ──────────────────────────────────────────────────────

def StartConversation(event, path_params, query_params, body):
    # TODO: Validate auth, find/create conversation record in DynamoDB
    return util.err("StartConversation not implemented yet.", 501)


def ListConversations(event, path_params, query_params, body):
    # TODO: query_items for all conversations where user is a participant
    return util.err("ListConversations not implemented yet.", 501)


def GetConversation(event, path_params, query_params, body):
    # TODO: get_item conversation + query messages by conversationId
    return util.err("GetConversation not implemented yet.", 501)


def SendMessage(event, path_params, query_params, body):
    # TODO: Validate auth + conversation membership, put_item message record
    return util.err("SendMessage not implemented yet.", 501)


def GetGroupMessages(event, path_params, query_params, body):
    # TODO: query_items messages for a group conversation
    return util.err("GetGroupMessages not implemented yet.", 501)


# ── Router ────────────────────────────────────────────────────────────────────

def _resolve(method, path):
    m = method.upper()
    p = [s for s in path.split("/") if s]

    base = ["api", "messages"]

    if m == "POST" and p == base + ["conversations", "start"]:                              return StartConversation, {}
    if m == "GET"  and p == base + ["conversations"]:                                       return ListConversations, {}
    if m == "GET"  and len(p) == 4 and p[:3] == base + ["conversations"]:                  return GetConversation, {"id": p[3]}
    if m == "POST" and len(p) == 5 and p[:3] == base + ["conversations"] and p[4] == "send": return SendMessage, {"id": p[3]}
    if m == "GET"  and len(p) == 5 and p[:3] == base + ["groups"] and p[4] == "messages":  return GetGroupMessages, {"id": p[3]}

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
        util.log("error", "messaging", f"Unhandled error in {handler.__name__}: {exc}")
        return util.err("An internal error occurred.", 500)
