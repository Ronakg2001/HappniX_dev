"""
handlers/home_page.py — Home feed and discovery endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds
from integration import dynamo_db
from services import feed_services

def handle_logout(event, body):
    """
    Backend logout handler located in home_page.
    Reads the Authorization Bearer token and triggers Cognito GlobalSignOut.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        # If no valid token is provided, just return success since they're already logged out locally
        return success_response({"success": True, "message": "Logged out locally."})
    
    access_token = auth_header.split(" ")[1]
    
    try:
        cognito.global_sign_out(access_token)
        util.log("info", "logout", "Successfully revoked tokens in Cognito.")
    except Exception as exc:
        util.log("warning", "logout", f"Failed to revoke tokens: {exc}")
        # We still return success to the client so they aren't stuck logged in on the frontend
    
    return success_response({"success": True, "message": "Logged out globally."})

def handle_home_feed(event):
    """
    Handle GET /api/home/feed
    Acts as the primary gateway for the home page.
    Validates the bearer token against Cognito, verifies the user exists in RDS,
    and returns initial feed data.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return error_response("Missing or invalid Authorization header.", 401)
    
    access_token = auth_header.split(" ")[1]
    
    # 1. Verify token and user existence in Cognito
    cognito_user = cognito.get_user(access_token)
    if not cognito_user:
        util.log("warning", "handle_home_feed", "Cognito token invalid or user deleted.")
        return error_response("Unauthorized. User may be deleted.", 401)
    
    # Extract username from Cognito response
    username = cognito_user.get("Username")
    if not username:
        return error_response("Unauthorized. Invalid Cognito user data.", 401)
        
    # 2. Verify user existence in RDS
    rds_result = rds.get_user_by_username(username)
    if not rds_result.get("success"):
        util.log("warning", "handle_home_feed", "User not found in RDS.", username=username)
        return error_response("User not found in database. Account may be deleted.", 401)
        
    user_data = rds_result.get("data")
    
    # Fetch feed using the hybrid feed generator
    query_params = event.get("queryStringParameters") or {}
    cursor = query_params.get("cursor")
    
    lat = query_params.get("lat")
    lng = query_params.get("lng")
    if lat is not None and lng is not None:
        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            lat = None
            lng = None
    else:
        lat = None
        lng = None
    
    feed_result = feed_services.get_hybrid_feed(user_data.get("userID"), cursor=cursor, lat=lat, lng=lng)
    
    response_data = {
        "success": True,
        "message": "Welcome to the HappniX home feed!",
        "profile": user_data,
    }
    
    if feed_result.get("success"):
        response_data.update(feed_result.get("data", {}))
    else:
        response_data["feed_items"] = []
        response_data["live_now"] = []
        response_data["error"] = "Failed to load feed."

    return success_response(response_data)

def handle_feed_check(event):
    """
    Handle GET /api/home/feed/check?since=<ISO timestamp>
    Lightweight endpoint for polling — only counts if new content exists.
    Returns {has_new: true/false} without rebuilding the entire feed.
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return error_response("Missing or invalid Authorization header.", 401)
    
    access_token = auth_header.split(" ")[1]
    cognito_user = cognito.get_user(access_token)
    if not cognito_user:
        return error_response("Unauthorized.", 401)
    
    query_params = event.get("queryStringParameters") or {}
    since = query_params.get("since")
    
    if not since:
        return success_response({"success": True, "has_new": True})
    
    conn = rds.get_connection()
    if not conn:
        return success_response({"success": True, "has_new": False})
    
    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                '''
                SELECT EXISTS(
                    SELECT 1 FROM events WHERE "createdAt" > %s AND "status" = 'Published' AND "visibility" = 'Public' LIMIT 1
                ) AS has_new_events,
                EXISTS(
                    SELECT 1 FROM posts WHERE "createdAt" > %s LIMIT 1
                ) AS has_new_posts;
                ''',
                (since, since)
            )
            row = cur.fetchone()
            has_new = bool(row and (row.get("has_new_events") or row.get("has_new_posts")))
            return success_response({"success": True, "has_new": has_new})
    except Exception as exc:
        util.log("error", "handle_feed_check", f"Failed: {exc}")
        return success_response({"success": True, "has_new": False})
    finally:
        conn.close()

def handle_user_search(event):
    """
    Handle GET /api/users/search
    Query parameters: q (string), limit (int)
    """
    query_params = event.get("queryStringParameters") or {}
    query = query_params.get("q", "").strip()
    limit = int(query_params.get("limit", 20))
    
    if len(query) < 2:
        return success_response({"success": True, "users": []})
        
    search_res = rds.search_users_by_name(query, limit)
    if not search_res.get("success"):
        return error_response("Search failed.", 500)
        
    users = search_res.get("data", [])
    
    # Map to frontend expected format
    from utils import dependencies
    pub_id = dependencies.enviroment_variable.get("R2_USERMEDIA_BUCKET_PUBID")
    if pub_id and not pub_id.endswith('/'):
        pub_id += '/'
        
    formatted_users = []
    for u in users:
        avatar = u.get("profilePictureUrl")
        if avatar and pub_id and not avatar.startswith("http"):
            avatar = f"{pub_id}{avatar}"
            
        formatted_users.append({
            "id": u.get("userID"),
            "username": u.get("userName"),
            "name": u.get("fullName"),
            "profile_picture_url": avatar,
            "is_following": False # Can be enhanced later to check true follow status
        })
    
    return success_response({
        "success": True,
        "users": formatted_users
    })

def handle_public_profile(event, target_user_id):
    """
    Handle GET /api/users/{id}/profile
    """
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization", "")
    current_user_id = None
    
    # Authenticate to see if they are logged in (so we can check follow status)
    if auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ")[1]
        cognito_user = cognito.get_user(access_token)
        if cognito_user:
            username = cognito_user.get("Username")
            rds_result = rds.get_user_by_username(username)
            if rds_result.get("success"):
                current_user_id = rds_result.get("data", {}).get("userID")
                
    # 1. Fetch target user's RDS basic info
    target_rds = rds.get_record("users", userID=target_user_id)
    if not target_rds.get("success"):
        return error_response("User not found.", 404)
        
    target_data = target_rds.get("data", {})
    is_private = target_data.get("privacyMode", "public").lower() == "private"
    
    # 2. Check follow status if private
    is_following = False
    if current_user_id and current_user_id != target_user_id:
        is_following = rds.check_if_following(current_user_id, target_user_id)
        
    # 3. Fetch full profile from DynamoDB
    profile_data = {}
    dynamo_res = dynamo_db.get_item(table_key="users", pk_value=target_user_id, sk_value="PROFILE")
    if dynamo_res.get("success"):
        profile_data = dynamo_res.get("data", {})
        
    # 4. Build response based on privacy
    can_view_full = not is_private or is_following or (current_user_id == target_user_id)
    
    raw_avatar = profile_data.get("avatar") or target_data.get("profilePictureUrl")
    if raw_avatar:
        from utils import dependencies
        pub_id = dependencies.enviroment_variable.get("R2_USERMEDIA_BUCKET_PUBID")
        if pub_id and not pub_id.endswith('/'):
            pub_id += '/'
        if pub_id and not raw_avatar.startswith("http"):
            raw_avatar = f"{pub_id}{raw_avatar}"

    response_profile = {
        "id": target_user_id,
        "username": target_data.get("userName"),
        "name": target_data.get("fullName"),
        "avatar": raw_avatar,
        "isPrivate": is_private,
        "isFollowing": is_following
    }
    
    if can_view_full:
        response_profile.update({
            "bio": profile_data.get("bio"),
            "followers": profile_data.get("followers", 0),
            "following": profile_data.get("following", 0),
            "vibes": profile_data.get("vibes", 0),
            "verified": profile_data.get("verified", False),
            "accountType": profile_data.get("accountType", "general")
        })
    else:
        # Restricted view
        response_profile["restricted"] = True
        
    return success_response({
        "success": True,
        "profile": response_profile
    })

def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        body = util.parse_body(event) if http_method != "GET" else {}
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)
            
        action_item = body.get("actionItem")
        path = event.get("path", "")
        clean_path = path.rstrip("/")
        
        if "/api/profile" in clean_path or clean_path.endswith("/api/users/follow"):
            from handlers import profile as profile_handler
            return profile_handler.lambda_handler(event, context)
        
        # ── Handle GET paths (no actionItem in body) ──
        if http_method == "GET":
            if clean_path.endswith("/feed/check"):
                return handle_feed_check(event)
            elif clean_path.endswith("/feed"):
                return handle_home_feed(event)
            elif clean_path.endswith("/search"):
                return handle_user_search(event)
            elif "/profile" in clean_path and "/api/users/" in clean_path:
                # Extract target user ID from /api/users/{id}/profile
                parts = clean_path.split("/")
                if len(parts) >= 4 and parts[-1] == "profile":
                    target_user_id = parts[-2]
                    return handle_public_profile(event, target_user_id)
            # Add future GET routes here (e.g. /live, /nearby)
            return error_response("GET endpoint not implemented.", 501)
            
        # ── Handle POST/PUT/DELETE paths via actionItem ──
        if action_item == "Logout" or path.endswith("/logout"):
            return handle_logout(event, body)
            
        # Add future POST actionItems here (e.g. BookTicket, UpdateTicket)
        # elif action_item == "BookTicket":
        #     return handle_book_ticket(event, body)
            
        return error_response(f"Action '{action_item}' not implemented.", 501)
        
    except Exception as exc:
        util.log("error", "home_page.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
