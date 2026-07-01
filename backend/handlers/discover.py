import json
from utils.Response import success_response, error_response
from utils import utilities as util
from utils import dependencies
from services import discover_services

def lambda_handler(event, context):
    """
    AWS Lambda entry point for DiscoverApi.
    Routes:
      GET /api/discover/search
    """
    util.log("info", "discover.lambda_handler", "Request received", event_path=event.get("path"))

    path = event.get("path", "")
    http_method = event.get("httpMethod", "")

    try:
        if path == "/api/discover/search" and http_method == "GET":
            return handle_discover_search(event)
            
        return error_response(f"Route not found: {http_method} {path}", 404)

    except Exception as exc:
        util.log("error", "discover.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error", 500)

def handle_discover_search(event):
    """
    Handle GET /api/discover/search
    Query parameters: q (string), limit (int)
    """
    query_params = event.get("queryStringParameters") or {}
    query = query_params.get("q", "").strip()
    limit = int(query_params.get("limit", 50))
    
    search_res = discover_services.search_discover_content(query, limit_users=limit, limit_events=limit)
    if not search_res.get("success"):
        return error_response("Discover search failed.", 500)
        
    data = search_res.get("data", {})
    users = data.get("users", [])
    events = data.get("events", [])
    
    # Map to frontend expected format
    pub_id = dependencies.enviroment_variable.get("R2_USERMEDIA_BUCKET_PUBID")
    if pub_id and not pub_id.endswith('/'):
        pub_id += '/'
        
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization", "")
    current_user_id = None
    if auth_header.startswith("Bearer "):
        from integration import cognito_auth as cognito
        from integration import rds
        access_token = auth_header.split(" ")[1]
        cognito_user = cognito.get_user(access_token)
        if cognito_user:
            username = cognito_user.get("Username")
            rds_result = rds.get_record("users", userID=username)
            if not rds_result.get("success"):
                rds_result = rds.get_record("users", userName=username)
            if rds_result.get("success"):
                current_user_id = rds_result.get("data", {}).get("userID")

    formatted_users = []
    for u in users:
        avatar = util.fix_media_url(u.get("profilePictureUrl"))
            
        is_following = False
        if current_user_id and u.get("userID") and current_user_id != u.get("userID"):
            from integration import rds
            is_following = rds.check_if_following(current_user_id, u.get("userID"))
            
        formatted_users.append({
            "id": u.get("userID"),
            "username": u.get("userName"),
            "name": u.get("fullName"),
            "profilePictureUrl": avatar,
            "profile_picture_url": avatar,
            "avatar": avatar,
            "is_following": is_following
        })
        
    formatted_events = []
    for e in events:
        cover = util.fix_media_url(e.get("coverImageUrl"))
        host_avatar = util.fix_media_url(e.get("host_profilePictureUrl"))
            
        base_price = e.get("basePrice") or 0
        try:
            base_price_num = float(base_price)
        except (ValueError, TypeError):
            base_price_num = 0

        formatted_events.append({
            "id": e.get("eventID"),
            "title": e.get("title"),
            "category": e.get("eventCategory"),
            "image": cover,
            "coverImageUrl": cover,
            "cover_image": cover,
            "start_at": e.get("startAt"),
            "ticket_type": e.get("ticketType"),
            "price": f"{e.get('currency', '')} {base_price}" if base_price_num > 0 else "Free",
            "venue": e.get("locationName"),
            "host_username": e.get("host_userName"),
            "host_avatar": host_avatar,
            "host_profilePictureUrl": host_avatar,
            "status": e.get("status")
        })
    
    return success_response({
        "success": True,
        "users": formatted_users,
        "events": formatted_events
    })
