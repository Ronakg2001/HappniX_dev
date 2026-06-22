"""
services/feed_services.py — Orchestrates the hybrid feed generation.
"""
import concurrent.futures
from services import feed_providers, ranking_services
from utils import utilities as util

def get_hybrid_feed(user_id: str, cursor: str = None, limit: int = 15) -> dict:
    """
    Fetch the hybrid home feed and the live-now carousel data.
    Implements cursor-based pagination for the main feed list.
    """
    # If it's a fresh load (no cursor), we fetch live events for the carousel
    live_now = []
    if not cursor:
        live_now = feed_providers.get_live_events(user_id)
        
    # We fetch from all providers concurrently to minimize latency
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_own = executor.submit(feed_providers.get_own_content, user_id, 10)
        future_following = executor.submit(feed_providers.get_following_content, user_id, 20)
        future_recs = executor.submit(feed_providers.get_recommendations, user_id, 15)
        
        own_content = future_own.result()
        following_content = future_following.result()
        recommendations = future_recs.result()
        
    all_items = own_content + following_content + recommendations
    
    # Deduplicate items (an event might be both in own_content and recommendations)
    seen = set()
    unique_items = []
    for item in all_items:
        # Determine the primary key for the item
        item_id = item.get("postID") or item.get("eventID")
        if not item_id:
            continue
            
        if item_id not in seen:
            seen.add(item_id)
            unique_items.append(item)
            
    # Rank the items
    ranked_items = ranking_services.rank_feed_items(unique_items)
    
    # Apply cursor pagination
    # The cursor will simply be the _rankingScore of the last item seen
    if cursor:
        try:
            cursor_score = float(cursor)
            # Filter items that have a score strictly less than the cursor score
            ranked_items = [item for item in ranked_items if item.get("_rankingScore", 0) < cursor_score]
        except ValueError:
            util.log("warning", "feed_services.get_hybrid_feed", "Invalid cursor provided")
            
    # Slice to limit
    paginated_items = ranked_items[:limit]
    
    # Determine the next cursor
    next_cursor = None
    if len(paginated_items) > 0 and len(ranked_items) > limit:
        # there's more data
        next_cursor = str(paginated_items[-1].get("_rankingScore", 0))
        
    return {
        "success": True,
        "data": {
            "live_now": live_now,
            "feed_items": paginated_items,
            "next_cursor": next_cursor
        }
    }
