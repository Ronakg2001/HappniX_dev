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


# ── Auth helpers (JWT Bearer token) ──────────────────────────────────────────

def _get_jwt_user(event):
    """
    Resolve the authenticated user from the Authorization: Bearer JWT header.
    Returns: (cognito_sub, user_dict) — both None if not authenticated.
    Performance: One Cognito API call (get_user) + one RDS read.
    """
    token = util.extract_bearer_token(event)
    if not token:
        return None, None
    sub, _ = util.verify_cognito_token(token)
    if not sub:
        return None, None
    user_result = rds.get_user_by_sub(sub)
    user = user_result["data"] if user_result["success"] else None
    if user and _USERS_TABLE:
        # Merge DynamoDB profile fields (bio, profilePictureUrl) into the RDS user dict
        dynamo_r = get_item(_USERS_TABLE, {"userID": user["userID"]})
        if dynamo_r["success"] and dynamo_r["data"]:
            d = dynamo_r["data"]
            user["bio"] = d.get("bio") or user.get("bio") or ""
            user["profilePictureUrl"] = d.get("profilePictureUrl") or user.get("profilePictureUrl") or ""
    return sub, user


def _get_jwt_sub(event):
    """
    Faster auth check — returns only cognitoSub without hitting RDS.
    Use when you only need to know WHO is asking, not their full profile.
    """
    token = util.extract_bearer_token(event)
    if not token:
        return None
    sub, _ = util.verify_cognito_token(token)
    return sub


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

def GetFeed(event, path_params, query_params, body):
    """
    Main home feed — returns live events + upcoming events.
    Does NOT require auth so unauthenticated users can browse.
    """
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


def GetLiveNow(event, path_params, query_params, body):
    """Live Now section — only live events, sorted newest first."""
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


def GetNearby(event, path_params, query_params, body):
    """
    Nearby events by geohash prefix.
    Frontend sends ?geohash=<prefix> (first 4-5 chars ≈ 5 km radius).
    """
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


def GetMyEvents(event, path_params, query_params, body):
    """Hosted events placeholder/query for the home page My Events tab."""
    cognito_sub = _get_jwt_sub(event)
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

def GetMyProfile(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def UpdateProfile(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def SetPrivacy(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    mode = str(body.get("privacyMode") or "public").lower()
    if mode not in ("public", "private"):
        return util.err("privacyMode must be 'public' or 'private'.")
    result = update_user_profile(cognito_sub, privacy_mode=mode)
    if not result["success"]:
        return util.err(f"Update failed: {result['error']}", 500)
    return util.ok({"success": True, "privacyMode": mode, "profile": format_public_profile(result["data"])})


def GetFollowing(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def GetFollowers(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def GetFollowRequests(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    requests = _list_follow_requests(cognito_sub)
    result = []
    for req in requests:
        r = get_user_by_sub(req["cognitoSub"])
        if r["success"] and r["data"]:
            result.append({**format_public_profile(r["data"]), "requestedAt": req.get("createdAt")})
    return util.ok({"success": True, "requests": result})


def HandleFollowRequest(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def SearchUsers(event, path_params, query_params, body):
    cognito_sub = _get_jwt_sub(event)
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


def FollowUser(event, path_params, query_params, body):
    cognito_sub, user = _get_jwt_user(event)
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


def GetPublicProfile(event, path_params, query_params, body):
    cognito_sub = _get_jwt_sub(event)  # viewer — may be None
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

def GetPreferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    r = get_item(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": "PREFERENCES"})
    prefs = (r["data"] or {}) if r["success"] else {}
    return util.ok({"success": True, "preferences": prefs})


def SavePreferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    item = {
        "cognitoSub": cognito_sub, "settingKey": "PREFERENCES", "updatedAt": now_iso(),
        **{k: v for k, v in body.items() if k not in ("cognitoSub", "settingKey")},
    }
    put_item(_SETTINGS_TABLE, item)
    return util.ok({"success": True, "preferences": item})


def GetPeople(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    if category not in ("blocked", "muted"):
        return util.err("Category must be 'blocked' or 'muted'.")
    r = get_item(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": category.upper()})
    people = ((r["data"] or {}).get("people", [])) if r["success"] else []
    return util.ok({"success": True, "category": category, "people": list(people)})


def AddPerson(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return util.err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub or category not in ("blocked", "muted"):
        return util.err("Provide targetCognitoSub and valid category.")
    add_to_set(_SETTINGS_TABLE, {"cognitoSub": cognito_sub, "settingKey": category.upper()}, "people", {target_sub})
    return util.ok({"success": True, "category": category, "added": target_sub})


def RemovePerson(event, path_params, query_params, body):
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

def GetTickets(event, path_params, query_params, body):
    return util.ok({"success": True, "tickets": []})


def BookTicket(event, path_params, query_params, body):
    ticket_id = body.get("ticketId") or body.get("id") or util.new_id(10)
    ticket = {
        "id": ticket_id,
        "status": body.get("status") or "pending",
        "event": body.get("event") or {"id": body.get("eventId")},
        "createdAt": now_iso(),
    }
    return util.ok({"success": True, "ticket": ticket})


def UpdateTicket(event, path_params, query_params, body):
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


def DeleteEvent(event, path_params, query_params, body):
    return util.ok({"success": True, "deleted": True, "id": path_params.get("id")})


def GetNotifications(event, path_params, query_params, body):
    return util.ok({"success": True, "notifications": [], "unreadCount": 0})


def MarkNotificationsRead(event, path_params, query_params, body):
    return util.ok({"success": True, "unreadCount": 0})


def LogNotificationActivity(event, path_params, query_params, body):
    return util.ok({"success": True})


def CreateGuestInvite(event, path_params, query_params, body):
    invite_token = body.get("inviteToken") or util.new_id(16)
    invite_link = f"/guest-invite.html?token={invite_token}"
    return util.ok({
        "success": True,
        "inviteToken": invite_token,
        "inviteLink": invite_link,
        "guestInvite": {"token": invite_token, "inviteLink": invite_link, "status": "created"},
    })


def UpdateGuestInvite(event, path_params, query_params, body):
    action = str(path_params.get("action") or "").strip()
    return util.ok({"success": True, "action": action, "inviteToken": path_params.get("token")})


def _resolve(method, path):
    m = method.upper()
    p = [s for s in path.split("/") if s]

    # Home feed routes
    if m == "GET" and p == ["api", "home", "feed"]:               return GetFeed, {}
    if m == "GET" and p == ["api", "home", "live"]:               return GetLiveNow, {}
    if m == "GET" and p == ["api", "home", "nearby"]:             return GetNearby, {}
    if m == "GET" and p == ["api", "events", "live"]:             return GetLiveNow, {}
    if m == "GET" and p == ["api", "events", "nearby"]:           return GetNearby, {}
    if m == "GET" and p == ["api", "events", "mine"]:             return GetMyEvents, {}
    if m == "DELETE" and len(p) == 3 and p[:2] == ["api", "events"]: return DeleteEvent, {"id": p[2]}

    # Profile routes
    if m == "GET"  and p == ["api", "profile", "me"]:                                         return GetMyProfile, {}
    if m == "POST" and p == ["api", "profile", "update"]:                                     return UpdateProfile, {}
    if m == "POST" and p == ["api", "profile", "privacy"]:                                    return SetPrivacy, {}
    if m == "GET"  and p == ["api", "profile", "following"]:                                  return GetFollowing, {}
    if m == "GET"  and p == ["api", "profile", "followers"]:                                  return GetFollowers, {}
    if m == "GET"  and p == ["api", "profile", "follow-requests"]:                            return GetFollowRequests, {}
    if m == "POST" and p == ["api", "profile", "follow-requests"]:                            return HandleFollowRequest, {}

    # User routes
    if m == "GET"  and p == ["api", "users", "search"]:                                       return SearchUsers, {}
    if m == "POST" and p == ["api", "users", "follow"]:                                       return FollowUser, {}
    if m == "GET"  and len(p) == 4 and p[1] == "users" and p[3] == "profile":                return GetPublicProfile, {"id": p[2]}

    # Settings routes
    if m == "GET"  and p == ["api", "settings", "preferences"]:                               return GetPreferences, {}
    if m == "POST" and p == ["api", "settings", "preferences"]:                               return SavePreferences, {}
    if m == "GET"    and len(p) == 4 and p[:3] == ["api", "settings", "people"]:             return GetPeople, {"category": p[3]}
    if m == "POST"   and len(p) == 4 and p[:3] == ["api", "settings", "people"]:             return AddPerson, {"category": p[3]}
    if m == "DELETE" and len(p) == 4 and p[:3] == ["api", "settings", "people"]:             return RemovePerson, {"category": p[3]}

    # Home page feature routes that are safe while their full services mature.
    if m == "GET"  and p == ["api", "tickets"]:                                        return GetTickets, {}
    if m == "POST" and p == ["api", "tickets", "book"]:                                return BookTicket, {}
    if m in ("POST", "DELETE") and len(p) == 4 and p[:2] == ["api", "tickets"]:       return UpdateTicket, {"id": p[2], "action": p[3]}
    if m == "GET"  and p == ["api", "notifications"]:                                  return GetNotifications, {}
    if m == "POST" and p == ["api", "notifications"]:                                  return MarkNotificationsRead, {}
    if m == "POST" and p == ["api", "notifications", "activity"]:                      return LogNotificationActivity, {}
    if m == "POST" and p == ["api", "guest-invites"]:                                  return CreateGuestInvite, {}
    if m == "POST" and len(p) == 4 and p[:2] == ["api", "guest-invites"]:             return UpdateGuestInvite, {"token": p[2], "action": p[3]}

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
    body = parse_body(event)

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
