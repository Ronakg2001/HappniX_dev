from integration import rds
from utils import utilities as util

def search_discover_content(query: str, limit_users: int = 50, limit_events: int = 50) -> dict:
    """
    Orchestrates the unified discover search for users and events.
    """
    query = (query or "").strip()
    query_lower = query.lower()
    
    # 1. Search Users
    users_res = rds.search_users_by_name(query, limit_users)
    users_data = users_res.get("data", []) if users_res.get("success") else []
    
    # 2. Search Public Events from RDS
    events_res = rds.search_public_events(query, limit_events)
    events_data = events_res.get("data", []) if events_res.get("success") else []
    
    # 3. Fallback / Merge from DynamoDB Discover Feed
    try:
        from services.interaction_services import get_discover_feed
        ddb_res = get_discover_feed("anonymous", limit=100)
        if ddb_res.get("success"):
            ddb_items = ddb_res.get("data", [])
            seen_ids = {str(e.get("eventID")) for e in events_data if e.get("eventID")}
            seen_titles = {(e.get("title") or "").lower().strip() for e in events_data if e.get("title")}
            for item in ddb_items:
                eid = str(item.get("eventID") or item.get("id") or "")
                title = item.get("title") or ""
                t_lower = title.lower().strip()
                cat = item.get("eventCategory") or ""
                desc = item.get("description") or ""
                if query_lower and not (query_lower in t_lower or query_lower in cat.lower() or query_lower in desc.lower()):
                    continue
                if eid and eid in seen_ids:
                    continue
                if t_lower and t_lower in seen_titles:
                    continue
                if eid:
                    seen_ids.add(eid)
                if t_lower:
                    seen_titles.add(t_lower)
                events_data.append(item)
    except Exception as exc:
        util.log("warning", "search_discover_content", f"DynamoDB fallback failed: {exc}")
        
    return {
        "success": True,
        "data": {
            "users": users_data[:limit_users],
            "events": events_data[:limit_events]
        }
    }
