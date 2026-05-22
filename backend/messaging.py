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
    target_user_id = body.get("targetUserId") or body.get("userId")
    conversation = {
        "id": util.new_id(8),
        "type": "direct",
        "targetUserId": target_user_id,
        "messages": [],
        "unreadCount": 0,
        "updatedAt": util.now_iso(),
    }
    return util.ok({"success": True, "conversation": conversation})


def ListConversations(event, path_params, query_params, body):
    # TODO: query_items for all conversations where user is a participant
    return util.ok({"success": True, "conversations": []})


def GetConversation(event, path_params, query_params, body):
    # TODO: get_item conversation + query messages by conversationId
    return util.ok({
        "success": True,
        "conversation": {"id": path_params.get("id"), "messages": []},
        "messages": [],
    })


def SendMessage(event, path_params, query_params, body):
    # TODO: Validate auth + conversation membership, put_item message record
    message = {
        "id": util.new_id(10),
        "conversationId": path_params.get("id"),
        "text": body.get("text") or body.get("message") or "",
        "createdAt": util.now_iso(),
        "status": "sent",
    }
    return util.ok({"success": True, "message": message})


def GetGroupMessages(event, path_params, query_params, body):
    # TODO: query_items messages for a group conversation
    return util.ok({
        "success": True,
        "conversation": {"id": path_params.get("id"), "type": "group"},
        "messages": [],
    })


def CreateGroup(event, path_params, query_params, body):
    conversation = {
        "id": util.new_id(8),
        "type": "group",
        "name": body.get("name") or "New group",
        "memberUserIds": body.get("memberUserIds") or [],
        "messages": [],
        "unreadCount": 0,
        "updatedAt": util.now_iso(),
    }
    return util.ok({"success": True, "conversation": conversation})


def UpdateMessage(event, path_params, query_params, body):
    return util.ok({"success": True, "id": path_params.get("id")})


# ── Router ────────────────────────────────────────────────────────────────────

def _resolve(method, path):
    m = method.upper()
    p = [s for s in path.split("/") if s]

    base = ["api", "messages"]

    if m == "POST" and p == base + ["conversations", "start"]:                              return StartConversation, {}
    if m == "GET"  and p == base + ["conversations"]:                                       return ListConversations, {}
    if m == "GET"  and len(p) == 4 and p[:3] == base + ["conversations"]:                  return GetConversation, {"id": p[3]}
    if m == "GET"  and len(p) == 5 and p[:3] == base + ["conversations"] and p[4] == "messages": return GetConversation, {"id": p[3]}
    if m == "POST" and len(p) == 5 and p[:3] == base + ["conversations"] and p[4] == "messages": return SendMessage, {"id": p[3]}
    if m == "POST" and len(p) == 5 and p[:3] == base + ["conversations"] and p[4] == "send": return SendMessage, {"id": p[3]}
    if m == "POST" and len(p) == 5 and p[:3] == base + ["conversations"] and p[4] in ("read", "clear", "delete"): return UpdateMessage, {"id": p[3]}
    if m == "POST" and p == base + ["groups", "create"]:                                    return CreateGroup, {}
    if m == "GET"  and len(p) == 5 and p[:3] == base + ["groups"] and p[4] == "messages":  return GetGroupMessages, {"id": p[3]}
    if m == "POST" and len(p) >= 4 and p[:3] == base + ["groups"]:                         return UpdateMessage, {"id": p[3]}
    if m in ("POST", "DELETE") and len(p) >= 4 and p[:3] == base + ["messages"]:           return UpdateMessage, {"id": p[3]}
    if m in ("POST", "DELETE") and len(p) >= 4 and p[:3] == base + ["group-messages"]:     return UpdateMessage, {"id": p[3]}

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

    # ── Centralized JWT Authentication ────────────────────────────────────────
    sub = util.get_jwt_sub(event)
    if not sub:
        util.log("warning", trace_id, "Unauthorized request blocked in lambda_handler", path=path)
        return util.err("Not authenticated.", 401)
    event["auth_sub"] = sub

    try:
        return handler(event, merged_params, query_params, body)
    except Exception as exc:
        util.log("error", trace_id, f"Unhandled error in {handler.__name__}: {exc}",
                 functionName=context.function_name)
        return util.err("An internal error occurred.", 500)
