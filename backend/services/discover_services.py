from integration import rds
from utils import utilities as util

def search_discover_content(query: str, limit_users: int = 50, limit_events: int = 50) -> dict:
    """
    Orchestrates the unified discover search for users and events.
    """
    query = (query or "").strip()

    
    # 1. Search Users
    users_res = rds.search_users_by_name(query, limit_users)
    users_data = users_res.get("data", []) if users_res.get("success") else []
    
    # 2. Search Public Events
    events_res = rds.search_public_events(query, limit_events)
    events_data = events_res.get("data", []) if events_res.get("success") else []
    
    return {
        "success": True,
        "data": {
            "users": users_data,
            "events": events_data
        }
    }
