"""
home_page.py — Home Page Lambda for HappniX.

This Lambda powers everything the user sees AFTER logging in.
It handles all tab data across the home page in one place.

Routes:
  GET  /api/home/feed                   → GetFeed         (main feed: live + upcoming events)
  GET  /api/home/live                   → GetLiveNow      (live now section)
  GET  /api/home/nearby                 → GetNearby       (nearby events by location)

  GET  /api/profile/me                  → GetMyProfile    (logged-in user's profile card)
  POST /api/profile/update              → UpdateProfile
  POST /api/profile/privacy             → SetPrivacy
  GET  /api/profile/following           → GetFollowing
  GET  /api/profile/followers           → GetFollowers
  GET  /api/profile/follow-requests     → GetFollowRequests
  POST /api/profile/follow-requests     → HandleFollowRequest

  GET  /api/users/search?q=             → SearchUsers
  POST /api/users/follow                → FollowUser
  GET  /api/users/{id}/profile          → GetPublicProfile

  GET  /api/settings/preferences        → GetPreferences
  POST /api/settings/preferences        → SavePreferences
  GET  /api/settings/people/{category}  → GetPeople
  POST /api/settings/people/{category}  → AddPerson
  DELETE /api/settings/people/{category}→ RemovePerson

Performance notes:
  - Auth check is a single DynamoDB session read (no RDS hit unless user data is needed).
  - Feed and Live Now are read-only DynamoDB queries — no RDS involved.
  - User lookups for social graph are parallelisable at the caller level.
"""

import os
import json

try:
    from boto3.dynamodb.conditions import Key, Attr
except ImportError:  # Allows local contract tests without boto3 installed.
    Key = Attr = None

import utilities.util as util
import utilities.rds as rds
import utilities.dynamo as dynamo
from utilities.r2_helper import upload_profile_picture

parse_body = util.parse_body
now_iso = util.now_iso
format_public_profile = util.format_public_profile

get_user_by_sub = rds.get_user_by_sub
search_users_by_username = rds.search_users_by_username
update_user_profile = rds.update_user_profile

get_item = dynamo.get_item
put_item = dynamo.put_item
query_items = dynamo.query_items
update_item = dynamo.update_item
delete_item = dynamo.delete_item
add_to_set = dynamo.add_to_set
remove_from_set = dynamo.remove_from_set

# ── Table names (from env — injected by SAM/CloudFormation) ──────────────────
_EVENTS_TABLE   = os.environ.get("EVENTS_TABLE_NAME",   "")
_SOCIAL_TABLE   = os.environ.get("SOCIAL_TABLE_NAME",   "")
_SETTINGS_TABLE = os.environ.get("SETTINGS_TABLE_NAME", "")
_USERS_TABLE    = os.environ.get("USERS_TABLE_NAME",    "")


# ── Auth helpers — delegate to util to avoid duplication ────────────────────

def _fetch_user_profile(sub):
    """Fetch the full user profile (RDS + DynamoDB merge) using a validated sub."""
    if not sub:
        return None
    r_res = rds.get_user_by_sub(sub)
    if not r_res.get("success") or not r_res.get("data"):
        return None
    user = r_res["data"]
    if _USERS_TABLE:
        d_res = dynamo.get_item(_USERS_TABLE, {"userID": user["userID"]})
        if d_res.get("success") and d_res.get("data"):
            user.update(d_res["data"])
    return user


# ── Social graph helpers ──────────────────────────────────────────────────────

def _list_following(sub):
    r = dynamo.query_items(_SOCIAL_TABLE, Key("cognitoSub").eq(sub) & Key("relationKey").begins_with("FOLLOW#"))
    return r["data"] if r["success"] else []

def _list_followers(sub):
    r = dynamo.query_items(_SOCIAL_TABLE, Key("targetSub").eq(sub), index_name="targetSub-index")
    items = r["data"] if r["success"] else []
    return [i for i in items if i.get("relationKey", "").startswith("FOLLOW#")]

def _is_following(actor_sub, target_sub):
    if not actor_sub or not target_sub:
        return False
    r = dynamo.get_item(_SOCIAL_TABLE, {"cognitoSub": actor_sub, "relationKey": f"FOLLOW#{target_sub}"})
    item = r["data"] if r["success"] else None
    return bool(item and item.get("status") == "active")

def _list_follow_requests(sub):
    r = dynamo.query_items(_SOCIAL_TABLE, Key("targetSub").eq(sub),
                    filter_expression=Attr("status").eq("pending"),
                    index_name="targetSub-index")
    return r["data"] if r["success"] else []


# ══════════════════════════════════════════════════════════════════════════════
# HOME PAGE TAB HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

def get_feed(event, path_params, query_params, body):
    """
    Main home feed — returns live events + upcoming events.
    Now strictly requires JWT authentication.
    """
    sub = event.get("auth_sub")
    if not sub:
        return util.err("Not authenticated.", 401)

    limit = min(int(query_params.get("limit") or 20), 50)

    live_result = query_items(
        _EVENTS_TABLE,
        Key("statusStartAt").begins_with("live#"),
        index_name="status-startAt-index",
        limit=limit,
        scan_index_forward=False,
    )
    upcoming_result = query_items(
        _EVENTS_TABLE,
        Key("statusStartAt").begins_with("upcoming#"),
        index_name="status-startAt-index",
        limit=limit,
        scan_index_forward=True,
    )

    return util.ok({
        "success": True,
        "liveEvents":     live_result["data"]     if live_result["success"]     else [],
        "upcomingEvents": upcoming_result["data"]  if upcoming_result["success"] else [],
    })


def get_live_now(event, path_params, query_params, body):
    """Live Now section — only live events, sorted newest first."""
    sub = event.get("auth_sub")
    if not sub:
        return util.err("Not authenticated.", 401)

    limit = min(int(query_params.get("limit") or 10), 30)
    result = query_items(
        _EVENTS_TABLE,
        Key("statusStartAt").begins_with("live#"),
        index_name="status-startAt-index",
        limit=limit,
        scan_index_forward=False,
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "count": len(events), "events": events})


def get_nearby(event, path_params, query_params, body):
    """
    Nearby events by geohash prefix.
    Frontend sends ?geohash=<prefix> (first 4-5 chars ≈ 5 km radius).
    """
    sub = event.get("auth_sub")
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
    result = query_items(
        _EVENTS_TABLE,
        Key("geohash").begins_with(geohash),
        index_name="geohash-index",
        limit=limit,
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "geohash": geohash, "count": len(events), "events": events})


def get_my_events(event, path_params, query_params, body):
    """Hosted events placeholder/query for the home page My Events tab."""
    cognito_sub = event.get("auth_sub")
    if not cognito_sub:
        return util.ok({"success": True, "count": 0, "events": []})
    result = query_items(
        _EVENTS_TABLE,
        Key("cognitoSub").eq(cognito_sub) & Key("itemId").begins_with("EVENT#"),
        limit=min(int(query_params.get("limit") or 50), 100),
    )
    events = result["data"] if result["success"] else []
    return util.ok({"success": True, "count": len(events), "events": events})


# ══════════════════════════════════════════════════════════════════════════════
# PROFILE HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

def get_my_profile(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    following = _list_following(cognito_sub)
    followers = _list_followers(cognito_sub)
    prefs_r = get_item(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": "PREFERENCES"})
    prefs = (prefs_r["data"] or {}) if prefs_r["success"] else {}
    return util.ok({
        "success": True,
        "profile": format_public_profile(user, len(following), len(followers)),
        "preferences": prefs,
    })


def update_profile(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)

    bio = str(body.get("bio") or "")[:280]
    pic_input = str(body.get("profilePictureUrl") or "").strip()

    # Upload to R2 if a base64 image was sent
    if pic_input.startswith("data:image/"):
        pic_url = upload_profile_picture(user["userID"], user["userName"], pic_input)
        pic_input = pic_url if pic_url else ""
    else:
        pic_input = pic_input[:500]

    # --- Save bio & profilePictureUrl to DynamoDB (not RDS) ---
    if _USERS_TABLE:
        dynamo_updates = {"updatedAt": util.now_iso()}
        if bio is not None:
            dynamo_updates["bio"] = bio
        if pic_input:
            dynamo_updates["profilePictureUrl"] = pic_input
        update_item(
            _USERS_TABLE,
            {"userID": user["userID"]},
            dynamo_updates,
        )

    # Reflect the new values into the user dict for the response
    user["bio"] = bio
    if pic_input:
        user["profilePictureUrl"] = pic_input

    # Privacy mode (still RDS — it drives access control queries)
    privacy_mode = str(body.get("privacyMode") or "").lower() or None
    if privacy_mode in ("public", "private"):
        result = update_user_profile(cognito_sub, privacy_mode=privacy_mode)
        if result["success"]:
            user = {**user, **result["data"]}
            user["bio"] = bio  # re-apply since RDS doesn't have it
            if pic_input:
                user["profilePictureUrl"] = pic_input

    return util.ok({"success": True, "profile": format_public_profile(user)})


def set_privacy(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    mode = str(body.get("privacyMode") or "public").lower()
    if mode not in ("public", "private"):
        return util.err("privacyMode must be 'public' or 'private'.")
    result = update_user_profile(cognito_sub, privacy_mode=mode)
    if not result["success"]:
        return util.err(f"Update failed: {result['error']}", 500)
    return util.ok({"success": True, "privacyMode": mode, "profile": format_public_profile(result["data"])})


def get_following(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    items = _list_following(cognito_sub)
    subs = [i["targetSub"] for i in items if i.get("status") == "active"]
    users = []
    for sub in subs:
        r = get_user_by_sub(sub)
        if r["success"] and r["data"]:
            users.append(format_public_profile(r["data"]))
    return util.ok({"success": True, "following": users})


def get_followers(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    items = _list_followers(cognito_sub)
    subs = [i["cognitoSub"] for i in items if i.get("status") == "active"]
    users = []
    for sub in subs:
        r = get_user_by_sub(sub)
        if r["success"] and r["data"]:
            users.append(format_public_profile(r["data"]))
    return util.ok({"success": True, "followers": users})


def get_follow_requests(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    requests = _list_follow_requests(cognito_sub)
    result = []
    for req in requests:
        r = get_user_by_sub(req["cognitoSub"])
        if r["success"] and r["data"]:
            result.append({**format_public_profile(r["data"]), "requestedAt": req.get("createdAt")})
    return util.ok({"success": True, "requests": result})


def handle_follow_request(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    action = str(body.get("action") or "").lower()
    requester_sub = str(body.get("requesterCognitoSub") or "").strip()
    if not requester_sub or action not in ("accept", "reject"):
        return util.err("Provide requesterCognitoSub and action (accept|reject).")
    new_status = "active" if action == "accept" else "rejected"
    update_item(_SOCIAL_TABLE,
                {"cognitoSub": requester_sub, "relationKey": f"FOLLOW#{cognito_sub}"},
                {"status": new_status})
    return util.ok({"success": True, "action": action, "requesterCognitoSub": requester_sub})


def search_users(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    if not cognito_sub:
        return util.err("Not authenticated.", 401)
    q = str(query_params.get("q") or "").strip()
    limit = min(int(query_params.get("limit") or 20), 50)
    if not q:
        return util.ok({"success": True, "users": []})
    result = search_users_by_username(q, limit=limit)
    if not result["success"]:
        return util.err(f"Search failed: {result['error']}", 500)
    users = []
    for row in result["data"]:
        sub = row.get("cognitoSub")
        following = _is_following(cognito_sub, sub) if sub else False
        follows_you = _is_following(sub, cognito_sub) if sub else False
        users.append({
            **format_public_profile(row),
            "is_following": following,
            "follows_you": follows_you,
            "follow_request_pending": False # Simplified for search results
        })
    return util.ok({"success": True, "users": users})


def follow_user(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")
    user = _fetch_user_profile(cognito_sub)
    if not user:
        return util.err("Not authenticated.", 401)
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub:
        return util.err("Provide targetCognitoSub.")
    target_r = get_user_by_sub(target_sub)
    target_user = target_r["data"] if target_r["success"] else None
    if not target_user:
        return util.err("User not found.", 404)
    action = str(body.get("action") or "follow").lower()
    if action == "unfollow":
        delete_item(_SOCIAL_TABLE, {"cognitoSub": cognito_sub, "relationKey": f"FOLLOW#{target_sub}"})
        return util.ok({"success": True, "following": False, "targetCognitoSub": target_sub})
    privacy = target_user.get("privacyMode") or "public"
    status = "pending" if privacy == "private" else "active"
    put_item(_SOCIAL_TABLE, {
        "cognitoSub": cognito_sub, "relationKey": f"FOLLOW#{target_sub}",
        "targetSub": target_sub, "relationType": "follow",
        "status": status, "createdAt": now_iso(),
    })
    return util.ok({"success": True, "following": status == "active", "status": status, "targetCognitoSub": target_sub})


def get_public_profile(event, path_params, query_params, body):
    cognito_sub = event.get("auth_sub")  # viewer - may be None
    target_username = str(path_params.get("id") or "").strip()
    user_id = str(path_params.get("id") or "").strip()
    if not user_id:
        return util.err("User ID required.", 400)
    target_r = get_user_by_sub(user_id)
    target_user = target_r["data"] if target_r["success"] else None
    if not target_user:
        return util.err("User not found.", 404)
    target_sub = target_user.get("cognitoSub")
    following = _list_following(target_sub)
    followers = _list_followers(target_sub)
    is_fol = _is_following(cognito_sub, target_sub) if cognito_sub else False
    events_r = query_items(_EVENTS_TABLE,
                           Key("cognitoSub").eq(target_sub) & Key("itemId").begins_with("EVENT#"))
    events = events_r["data"] if events_r["success"] else []
    return util.ok({
        "success": True,
        "profile": {
            **format_public_profile(target_user, len(following), len(followers), is_fol),
            "hostedEvents": events,
        },
    })


# ══════════════════════════════════════════════════════════════════════════════
# SETTINGS HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

def get_preferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    r = get_item(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": "PREFERENCES"})
    prefs = (r["data"] or {}) if r["success"] else {}
    return util.ok({"success": True, "preferences": prefs})


def save_preferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    item = {
        "cognitoSub": cognito_sub, "settingKey": "PREFERENCES", "updatedAt": now_iso(),
        **{k: v for k, v in body.items() if k not in ("cognitoSub", "settingKey")},
    }
    put_item(_SETTINGS_TABLE, item)
    return util.ok({"success": True, "preferences": item})


def get_people(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    if category not in ("blocked", "muted"):
        return util.err("Category must be 'blocked' or 'muted'.")
    r = get_item(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": category.upper()})
    people = ((r["data"] or {}).get("people", [])) if r["success"] else []
    return util.ok({"success": True, "category": category, "people": list(people)})


def add_person(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub or category not in ("blocked", "muted"):
        return util.err("Provide targetCognitoSub and valid category.")
    add_to_set(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": category.upper()}, "people", {target_sub})
    return util.ok({"success": True, "category": category, "added": target_sub})


def remove_person(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub or category not in ("blocked", "muted"):
        return util.err("Provide targetCognitoSub and valid category.")
    remove_from_set(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": category.upper()}, "people", {target_sub})
    return util.ok({"success": True, "category": category, "removed": target_sub})


# ── Router ────────────────────────────────────────────────────────────────────

def get_tickets(event, path_params, query_params, body):
    return util.ok({"success": True, "tickets": []})


def book_ticket(event, path_params, query_params, body):
    ticket_id = body.get("ticketId") or body.get("id") or util.new_id(10)
    ticket = {
        "id": ticket_id,
        "status": body.get("status") or "pending",
        "event": body.get("event") or {"id": body.get("eventId")},
        "createdAt": now_iso(),
    }
    return util.ok({"success": True, "ticket": ticket})


def update_ticket(event, path_params, query_params, body):
    action = str(path_params.get("action") or "").strip()
    ticket_id = str(path_params.get("id") or body.get("ticketId") or "").strip()
    status = {
        "archive": "archived",
        "cancel": "cancelled",
        "delete": "deleted",
        "pay": "paid",
        "group": "grouped",
        "verify": "verified",
    }.get(action, "updated")
    return util.ok({
        "success": True,
        "action": action,
        "ticket": {"id": ticket_id, "status": status, "updatedAt": now_iso()},
    })


def delete_event(event, path_params, query_params, body):
    return util.ok({"success": True, "deleted": True, "id": path_params.get("id")})


def get_notifications(event, path_params, query_params, body):
    return util.ok({"success": True, "notifications": [], "unreadCount": 0})


def mark_notifications_read(event, path_params, query_params, body):
    return util.ok({"success": True, "unreadCount": 0})


def log_notification_activity(event, path_params, query_params, body):
    return util.ok({"success": True})


def create_guest_invite(event, path_params, query_params, body):
    invite_token = body.get("inviteToken") or util.new_id(16)
    invite_link = f"/guest-invite.html?token={invite_token}"
    return util.ok({
        "success": True,
        "inviteToken": invite_token,
        "inviteLink": invite_link,
        "guestInvite": {"token": invite_token, "inviteLink": invite_link, "status": "created"},
    })


def update_guest_invite(event, path_params, query_params, body):
    action = str(path_params.get("action") or "").strip()
    return util.ok({"success": True, "action": action, "inviteToken": path_params.get("token")})


ACTION_HANDLERS = {
    "GET_FEED": get_feed,
    "GET_LIVE_NOW": get_live_now,
    "GET_NEARBY": get_nearby,
    "GET_MY_EVENTS": get_my_events,
    "DELETE_EVENT": delete_event,
    
    "GET_MY_PROFILE": get_my_profile,
    "UPDATE_PROFILE": update_profile,
    "SET_PRIVACY": set_privacy,
    "GET_FOLLOWING": get_following,
    "GET_FOLLOWERS": get_followers,
    "GET_FOLLOW_REQUESTS": get_follow_requests,
    "HANDLE_FOLLOW_REQUEST": handle_follow_request,
    
    "SEARCH_USERS": search_users,
    "FOLLOW_USER": follow_user,
    "GET_PUBLIC_PROFILE": get_public_profile,
    
    "GET_PREFERENCES": get_preferences,
    "SAVE_PREFERENCES": save_preferences,
    "GET_PEOPLE": get_people,
    "ADD_PERSON": add_person,
    "REMOVE_PERSON": remove_person,
    
    "GET_TICKETS": get_tickets,
    "BOOK_TICKET": book_ticket,
    "UPDATE_TICKET": update_ticket,
    "GET_NOTIFICATIONS": get_notifications,
    "MARK_NOTIFICATIONS_READ": mark_notifications_read,
    "LOG_NOTIFICATION_ACTIVITY": log_notification_activity,
    "CREATE_GUEST_INVITE": create_guest_invite,
    "UPDATE_GUEST_INVITE": update_guest_invite,
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
        UNPROTECTED_ACTIONS = {"GET_PUBLIC_PROFILE"}
        
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
