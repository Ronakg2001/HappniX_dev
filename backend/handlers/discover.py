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
    
    if len(query) < 2:
        return success_response({"success": True, "users": [], "events": []})
        
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
            "is_following": False # Can be enhanced later
        })
        
    formatted_events = []
    for e in events:
        cover = e.get("coverImageUrl")
        if cover and pub_id and not cover.startswith("http"):
            cover = f"{pub_id}{cover}"
            
        host_avatar = e.get("host_profilePictureUrl")
        if host_avatar and pub_id and not host_avatar.startswith("http"):
            host_avatar = f"{pub_id}{host_avatar}"
            
        formatted_events.append({
            "id": e.get("eventID"),
            "title": e.get("title"),
            "category": e.get("eventCategory"),
            "image": cover,
            "start_at": e.get("startAt"),
            "ticket_type": e.get("ticketType"),
            "price": f"{e.get('currency')} {e.get('basePrice')}" if e.get("basePrice") > 0 else "Free",
            "venue": e.get("locationName"),
            "host_username": e.get("host_userName"),
            "host_avatar": host_avatar,
            "status": e.get("status")
        })
    
    return success_response({
        "success": True,
        "users": formatted_users,
        "events": formatted_events
    })
