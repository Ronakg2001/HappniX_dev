"""
services/feed_services.py — Orchestrates the hybrid feed generation.
"""
import base64
import json
from services import feed_providers, ranking_services
from integration import rds
from utils import utilities as util

# Fields that must never be sent to the frontend
_INTERNAL_FIELDS = {
    "_rankingScore", "source", "engagementScore",
    "engagementSortKey", "discoverShard", "_personalizedScore"
}

def _strip_internal_fields(items: list) -> list:
    """Remove internal scoring/routing metadata before sending to client."""
    for item in items:
        for field in _INTERNAL_FIELDS:
            item.pop(field, None)
    return items

def get_hybrid_feed(user_id: str, cursor: str = None, limit: int = 15, lat: float = None, lng: float = None) -> dict:
    """
    Fetch the hybrid home feed and the live-now carousel data.
    Implements cursor-based pagination for the main feed list.
    Uses a single shared RDS connection for all RDS-based providers.
    """
    # Parse composite cursor state
    cursor_state = {
        "score": None,
        "item_id": None,
        "own_offset": 0,
        "following_key": None,
        "rec_offset": 0
    }
    
    if cursor:
        try:
            decoded = base64.b64decode(cursor).decode('utf-8')
            parsed = json.loads(decoded)
            cursor_state.update(parsed)
        except Exception:
            util.log("warning", "feed_services.get_hybrid_feed", "Invalid base64 cursor provided")

    # Open a single shared RDS connection for all RDS-based providers
    conn = rds.get_connection()

    # If it's a fresh load (no cursor), we fetch live events for the carousel
    live_now = []
    if not cursor_state.get("score"):
        live_now = feed_providers.get_live_events(user_id, lat, lng, conn=conn)
        
    # Fetch from RDS providers using the shared connection
    own_content = feed_providers.get_own_content(user_id, 10, cursor_state.get("own_offset", 0), conn=conn)
    nearby_content = feed_providers.get_nearby_events(user_id, lat, lng, radius_km=5.0, limit=20, conn=conn) if lat is not None and lng is not None else []
    
    # Close shared connection before non-RDS calls
    if conn:
        try:
            conn.close()
        except Exception:
            pass
    
    # DynamoDB and recommendation calls (no RDS connection needed)
    following_content, next_following_key = feed_providers.get_following_content(user_id, 20, cursor_state.get("following_key"))
    recommendations = feed_providers.get_recommendations(user_id, 15, cursor_state.get("rec_offset", 0))
        
    all_items = own_content + nearby_content + following_content + recommendations
    
    # Deduplicate items (an event might be both in own_content and recommendations)
    seen_ids = set()
    seen_titles = set()
    unique_items = []
    for item in all_items:
        item_id = item.get("postID") or item.get("eventID")
        if not item_id or item_id in seen_ids:
            continue
        title = str(item.get("title") or "").lower().strip()
        if item.get("entityType") == "EVENT_CARD" and title and title in seen_titles:
            continue
        if item.get("entityType") == "EVENT_CARD" and title:
            seen_titles.add(title)
        seen_ids.add(item_id)
        unique_items.append(item)
            
    # Rank the items
    ranked_items = ranking_services.rank_feed_items(unique_items)
    
    # Apply cursor pagination with composite filtering
    if cursor_state.get("score") is not None:
        try:
            cursor_score = float(cursor_state.get("score"))
            cursor_item_id = str(cursor_state.get("item_id") or "")
            
            filtered = []
            for item in ranked_items:
                score = item.get("_rankingScore", 0)
                item_id = str(item.get("postID") or item.get("eventID") or "")
                
                # Tie-breaker logic: strictly less score, OR equal score but lesser item_id string comparison
                if score < cursor_score:
                    filtered.append(item)
                elif score == cursor_score and item_id < cursor_item_id:
                    filtered.append(item)
            ranked_items = filtered
        except ValueError:
            util.log("warning", "feed_services.get_hybrid_feed", "Failed to apply cursor filtering")
            
    # Slice to limit
    paginated_items = ranked_items[:limit]
    
    # Determine the next cursor
    next_cursor = None
    if len(paginated_items) > 0 and len(ranked_items) > limit:
        # there's more data, generate the new state
        next_state = {
            "score": paginated_items[-1].get("_rankingScore", 0),
            "item_id": paginated_items[-1].get("postID") or paginated_items[-1].get("eventID"),
            "own_offset": cursor_state.get("own_offset", 0) + len(own_content),
            "following_key": next_following_key,
            "rec_offset": cursor_state.get("rec_offset", 0) + len(recommendations)
        }
        state_json = json.dumps(next_state)
        next_cursor = base64.b64encode(state_json.encode('utf-8')).decode('utf-8')
    
    # Strip internal fields before sending to frontend (prevent algorithm leakage)
    _strip_internal_fields(paginated_items)
    _strip_internal_fields(live_now)
        
    return {
        "success": True,
        "data": {
            "live_now": live_now,
            "feed_items": paginated_items,
            "next_cursor": next_cursor
        }
    }
