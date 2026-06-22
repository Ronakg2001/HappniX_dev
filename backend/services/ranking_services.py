"""
services/ranking_services.py — Ranking heuristics for feed items.
"""
from datetime import datetime, timezone
import math

def calculate_time_decay(created_at: datetime) -> float:
    """
    Calculate an exponential time decay factor.
    Items lose half their 'time score' every 12 hours.
    """
    now = datetime.now(timezone.utc)
    delta_hours = (now - created_at).total_seconds() / 3600.0
    
    # Avoid negative hours if item is somehow in the future
    if delta_hours < 0:
        delta_hours = 0
        
    half_life_hours = 12.0
    decay = math.exp(-0.693 * (delta_hours / half_life_hours))
    return decay

def rank_feed_items(items: list) -> list:
    """
    Given a list of feed items from various providers, rank them based on:
    - Time decay (recent items rank higher)
    - Base weight (e.g., recommendations vs followed content)
    - Engagement score (if available)
    """
    ranked = []
    for item in items:
        # Determine base weight based on source/type
        base_weight = 1.0
        if item.get("source") == "RECOMMENDATION":
            base_weight = 0.8  # slightly lower priority than explicitly followed content
        elif item.get("source") == "OWN_CONTENT":
            base_weight = 1.2
            
        # Time decay
        created_at_str = item.get("createdAt")
        try:
            # Assuming ISO format like "2026-06-22T12:00:00Z"
            # Python 3.11+ can parse "Z" with fromisoformat, earlier needs replace
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            created_at = datetime.now(timezone.utc)
            
        time_score = calculate_time_decay(created_at)
        
        # Engagement (assume normalized 0-100)
        engagement = float(item.get("engagementScore", 0))
        engagement_factor = 1.0 + (engagement / 100.0)
        
        final_score = base_weight * time_score * engagement_factor
        
        ranked.append({
            **item,
            "_rankingScore": final_score
        })
        
    # Sort descending by score
    ranked.sort(key=lambda x: x["_rankingScore"], reverse=True)
    return ranked
