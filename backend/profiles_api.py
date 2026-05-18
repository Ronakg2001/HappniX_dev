"""
profiles_api.py — User profile, social graph, search, and settings Lambda.

Routes (all /api/profile/* and /api/users/*):
  GET  /api/profile/me                    → GetMe
  POST /api/profile/update                → UpdateProfile
  POST /api/profile/privacy               → SetPrivacy
  GET  /api/profile/follow-requests       → GetFollowRequests
  POST /api/profile/follow-requests       → HandleFollowRequest
  GET  /api/profile/following             → GetFollowGraph
  GET  /api/profile/followers             → GetFollowGraph
  GET  /api/users/search?q=               → SearchUsers
  POST /api/users/follow                  → FollowUser
  GET  /api/users/{id}/profile            → GetPublicProfile
  GET  /api/settings/preferences          → GetPreferences
  POST /api/settings/preferences          → SavePreferences
  GET  /api/settings/people/{category}    → GetPeople
  POST /api/settings/people/{category}    → AddPerson
  DELETE /api/settings/people/{category}  → RemovePerson

Data sources:
  - RDS (auth_db.py)  → source of truth for user account records
  - DynamoDB (dynamo_db.py) → social graph (follows), settings, preferences
"""

import json
import os
from auth_db import get_user_by_cognito_sub, search_users_by_username, update_user_profile
import dynamo_db as ddb
from dev_store import get_session


# ── Helpers ───────────────────────────────────────────────────────────────────

def ENV(key, default=""):
    return os.environ.get(key, default)


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": ENV("FRONTEND_URL", "https://happnix-dev.ronakgo1.workers.dev"),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRFToken",
        "Content-Type": "application/json",
    }


def _ok(body: dict, status=200):
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps(body)}


def _err(message: str, status=400):
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps({"message": message})}


def _get_session_user(event):
    """Resolve the current user from the session cookie."""
    cookies_raw = (event.get("headers") or {}).get("cookie") or \
                  (event.get("headers") or {}).get("Cookie") or ""
    token = None
    for part in cookies_raw.split(";"):
        part = part.strip()
        if part.startswith("happnix_session="):
            token = part[len("happnix_session="):].strip()
            break
        if part.startswith("session="):
            token = part[len("session="):].strip()
            break
    if not token:
        return None, None

    _token, session = get_session(token)
    if not session:
        return None, None

    cognito_sub = (
        session.get("authenticated_user_id")
        or session.get("cognitoSub")
        or session.get("sub")
    )
    if not cognito_sub:
        return None, None

    user = get_user_by_cognito_sub(cognito_sub)
    return cognito_sub, user


def _format_public_profile(user_row: dict, following_count=0, followers_count=0, is_following=False) -> dict:
    """Convert a raw RDS user row to the public profile shape the frontend expects."""
    if not user_row:
        return {}
    return {
        "sql_user_id": user_row.get("userID"),
        "userID": user_row.get("userID"),
        "cognitoSub": user_row.get("cognitoSub"),
        "username": user_row.get("userName"),
        "fullName": user_row.get("displayName") or user_row.get("userName"),
        "full_name": user_row.get("displayName") or user_row.get("userName"),
        "email": user_row.get("emailAddress") or "",
        "mobile": user_row.get("phoneNumber") or "",
        "date_of_birth": str(user_row.get("dateOfBirth") or ""),
        "bio": user_row.get("bio") or "",
        "profile_picture_url": user_row.get("profilePictureUrl") or "",
        "isVerified": bool(user_row.get("adharVerified")),
        "gov_id_verified": bool(user_row.get("adharVerified")),
        "privacyMode": user_row.get("privacyMode") or "public",
        "is_private": (user_row.get("privacyMode") or "public") == "private",
        "followingCount": following_count,
        "following_count": following_count,
        "followersCount": followers_count,
        "followers_count": followers_count,
        "isFollowing": is_following,
    }


def _optional_ddb(default, func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except RuntimeError as exc:
        if "DynamoDB table name not configured" in str(exc):
            return default
        raise


# ── Action Handlers ───────────────────────────────────────────────────────────

def GetMe(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    following = _optional_ddb([], ddb.list_following, cognito_sub)
    followers = _optional_ddb([], ddb.list_followers, cognito_sub)
    prefs = _optional_ddb({}, ddb.get_preferences, cognito_sub)

    return _ok({
        "profile": _format_public_profile(
            user,
            following_count=len(following),
            followers_count=len(followers),
        ),
        "preferences": prefs,
    })


def UpdateProfile(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    bio = str(body.get("bio") or "")[:280]
    profile_picture_url = str(body.get("profilePictureUrl") or "")[:500]

    updated = update_user_profile(
        cognito_sub,
        bio=bio,
        profile_picture_url=profile_picture_url,
    )
    return _ok({"profile": _format_public_profile(updated)})


def SetPrivacy(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    mode = str(body.get("privacyMode") or "public").lower()
    if mode not in ("public", "private"):
        return _err("privacyMode must be 'public' or 'private'.")

    updated = update_user_profile(cognito_sub, privacy_mode=mode)
    return _ok({"privacyMode": mode, "profile": _format_public_profile(updated)})


def GetFollowGraph(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    graph_type = (path_params.get("graph_type") or "following").lower()

    if graph_type == "following":
        items = ddb.list_following(cognito_sub)
        subs = [item["targetSub"] for item in items if item.get("status") == "active"]
    elif graph_type == "followers":
        items = ddb.list_followers(cognito_sub)
        subs = [item["cognitoSub"] for item in items if item.get("status") == "active"]
    else:
        return _err(f"Unknown graph type: {graph_type}")

    users = []
    for sub in subs:
        row = get_user_by_cognito_sub(sub)
        if row:
            users.append(_format_public_profile(row))

    return _ok({"graph": graph_type, "users": users})


def GetFollowRequests(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    requests = ddb.list_follow_requests(cognito_sub)
    result = []
    for req in requests:
        row = get_user_by_cognito_sub(req["cognitoSub"])
        if row:
            result.append({**_format_public_profile(row), "requestedAt": req.get("createdAt")})

    return _ok({"requests": result})


def HandleFollowRequest(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    action = str(body.get("action") or "").lower()   # accept | reject
    requester_sub = str(body.get("requesterCognitoSub") or "").strip()
    if not requester_sub or action not in ("accept", "reject"):
        return _err("Provide requesterCognitoSub and action (accept|reject).")

    new_status = "active" if action == "accept" else "rejected"
    ddb.update_follow_status(requester_sub, cognito_sub, new_status)
    return _ok({"action": action, "requesterCognitoSub": requester_sub})


def FollowUser(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub:
        return _err("Provide targetCognitoSub.")

    target_user = get_user_by_cognito_sub(target_sub)
    if not target_user:
        return _err("User not found.", 404)

    action = str(body.get("action") or "follow").lower()

    if action == "unfollow":
        ddb.unfollow_user(cognito_sub, target_sub)
        return _ok({"following": False, "targetCognitoSub": target_sub})

    # Determine status: private account → pending, public → active
    target_privacy = target_user.get("privacyMode") or "public"
    status = "pending" if target_privacy == "private" else "active"
    item = ddb.follow_user(cognito_sub, target_sub)
    # patch status in case it needs to be pending
    if status == "pending":
        ddb.update_follow_status(cognito_sub, target_sub, "pending")

    return _ok({"following": status == "active", "status": status, "targetCognitoSub": target_sub})


def SearchUsers(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)

    q = str(query_params.get("q") or "").strip()
    limit = min(int(query_params.get("limit") or 20), 50)
    if not q:
        return _ok({"users": []})

    rows = search_users_by_username(q, limit=limit)
    results = []
    for row in rows:
        sub = row.get("cognitoSub")
        following = ddb.is_following(cognito_sub, sub) if sub else False
        results.append({**_format_public_profile(row), "isFollowing": following})

    return _ok({"users": results})


def GetPublicProfile(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    viewer_sub = cognito_sub  # may be None for unauthenticated

    user_id = str(path_params.get("id") or "").strip()
    if not user_id:
        return _err("User ID required.", 400)

    target_row = get_user_by_cognito_sub(user_id)
    if not target_row:
        return _err("User not found.", 404)

    target_sub = target_row.get("cognitoSub")
    following = ddb.list_following(target_sub)
    followers = ddb.list_followers(target_sub)
    is_following = ddb.is_following(viewer_sub, target_sub) if viewer_sub else False
    events = ddb.list_events_by_user(target_sub)

    return _ok({
        "profile": {
            **_format_public_profile(
                target_row,
                following_count=len(following),
                followers_count=len(followers),
                is_following=is_following,
            ),
            "hosted_events": events,
        }
    })


def GetPreferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)
    prefs = ddb.get_preferences(cognito_sub)
    return _ok({"preferences": prefs})


def SavePreferences(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)
    prefs = ddb.save_preferences(cognito_sub, body)
    return _ok({"preferences": prefs})


def GetPeople(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    if category not in ("blocked", "muted"):
        return _err("Category must be 'blocked' or 'muted'.")
    people = ddb.get_people_list(cognito_sub, category)
    return _ok({"category": category, "people": list(people)})


def AddPerson(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub or category not in ("blocked", "muted"):
        return _err("Provide targetCognitoSub and valid category.")
    ddb.add_to_people_list(cognito_sub, category, target_sub)
    return _ok({"category": category, "added": target_sub})


def RemovePerson(event, path_params, query_params, body):
    cognito_sub, user = _get_session_user(event)
    if not user:
        return _err("Not authenticated.", 401)
    category = str(path_params.get("category") or "").lower()
    target_sub = str(body.get("targetCognitoSub") or body.get("userId") or "").strip()
    if not target_sub or category not in ("blocked", "muted"):
        return _err("Provide targetCognitoSub and valid category.")
    ddb.remove_from_people_list(cognito_sub, category, target_sub)
    return _ok({"category": category, "removed": target_sub})


# ── Router ────────────────────────────────────────────────────────────────────

def _resolve(http_method, path):
    """
    Map (method, path) → (handler_fn, path_params).
    Path params are extracted inline.
    """
    method = http_method.upper()
    parts = [p for p in path.split("/") if p]

    # GET /api/profile/me
    if method == "GET" and parts == ["api", "profile", "me"]:
        return GetMe, {}

    # POST /api/profile/update
    if method == "POST" and parts == ["api", "profile", "update"]:
        return UpdateProfile, {}

    # POST /api/profile/privacy
    if method == "POST" and parts == ["api", "profile", "privacy"]:
        return SetPrivacy, {}

    # GET /api/profile/follow-requests
    if method == "GET" and parts == ["api", "profile", "follow-requests"]:
        return GetFollowRequests, {}

    # POST /api/profile/follow-requests
    if method == "POST" and parts == ["api", "profile", "follow-requests"]:
        return HandleFollowRequest, {}

    # GET /api/profile/following  OR  /api/profile/followers
    if method == "GET" and len(parts) == 3 and parts[:2] == ["api", "profile"]:
        return GetFollowGraph, {"graph_type": parts[2]}

    # GET /api/users/search
    if method == "GET" and parts == ["api", "users", "search"]:
        return SearchUsers, {}

    # POST /api/users/follow
    if method == "POST" and parts == ["api", "users", "follow"]:
        return FollowUser, {}

    # GET /api/users/{id}/profile
    if method == "GET" and len(parts) == 4 and parts[0] == "api" and parts[1] == "users" and parts[3] == "profile":
        return GetPublicProfile, {"id": parts[2]}

    # GET /api/settings/preferences
    if method == "GET" and parts == ["api", "settings", "preferences"]:
        return GetPreferences, {}

    # POST /api/settings/preferences
    if method == "POST" and parts == ["api", "settings", "preferences"]:
        return SavePreferences, {}

    # GET /api/settings/people/{category}
    if method == "GET" and len(parts) == 4 and parts[:3] == ["api", "settings", "people"]:
        return GetPeople, {"category": parts[3]}

    # POST /api/settings/people/{category}
    if method == "POST" and len(parts) == 4 and parts[:3] == ["api", "settings", "people"]:
        return AddPerson, {"category": parts[3]}

    # DELETE /api/settings/people/{category}
    if method == "DELETE" and len(parts) == 4 and parts[:3] == ["api", "settings", "people"]:
        return RemovePerson, {"category": parts[3]}

    return None, {}


def lambda_handler(event, context):
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    # OPTIONS pre-flight
    if http_method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    query_params = event.get("queryStringParameters") or {}
    path_params  = event.get("pathParameters") or {}

    try:
        body = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        body = {}

    handler, resolved_path_params = _resolve(http_method, path)
    merged_path_params = {**path_params, **resolved_path_params}

    if handler is None:
        return _err(f"Route not found: {http_method} {path}", 404)

    try:
        return handler(event, merged_path_params, query_params, body)
    except Exception as exc:
        print(f"[profiles_api] UNHANDLED ERROR: {exc}")
        return _err("An internal error occurred.", 500)
