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

def start_conversation(event, path_params, query_params, body):
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


def list_conversations(event, path_params, query_params, body):
    # TODO: query_items for all conversations where user is a participant
    return util.ok({"success": True, "conversations": []})


def get_conversation(event, path_params, query_params, body):
    # TODO: get_item conversation + query messages by conversationId
    return util.ok({
        "success": True,
        "conversation": {"id": path_params.get("id"), "messages": []},
        "messages": [],
    })


def send_message(event, path_params, query_params, body):
    # TODO: Validate auth + conversation membership, put_item message record
    message = {
        "id": util.new_id(10),
        "conversationId": path_params.get("id"),
        "text": body.get("text") or body.get("message") or "",
        "createdAt": util.now_iso(),
        "status": "sent",
    }
    return util.ok({"success": True, "message": message})


def get_group_messages(event, path_params, query_params, body):
    # TODO: query_items messages for a group conversation
    return util.ok({
        "success": True,
        "conversation": {"id": path_params.get("id"), "type": "group"},
        "messages": [],
    })


def create_group(event, path_params, query_params, body):
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


def update_message(event, path_params, query_params, body):
    return util.ok({"success": True, "id": path_params.get("id")})


# ── Router ────────────────────────────────────────────────────────────────────

ACTION_HANDLERS = {
    "START_CONVERSATION": start_conversation,
    "LIST_CONVERSATIONS": list_conversations,
    "GET_CONVERSATION": get_conversation,
    "SEND_MESSAGE": send_message,
    "GET_GROUP_MESSAGES": get_group_messages,
    "CREATE_GROUP": create_group,
    "UPDATE_MESSAGE": update_message,
}

import utilities.cognito_auth as auth
import json

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
