"""
services/feed_providers.py — Data fetching logic for the hybrid feed system.
"""
from utils import utilities as util
from integration import rds, dynamo_db
from services.interaction_services import get_discover_feed

def get_live_events(user_id: str) -> list:
    """
    Fetch events that are currently 'Live'.
    For V1, this means `startAt` <= now <= `endAt`.
    Returns events hosted by the user, followed users, and nearby/public ones.
    """
    conn = rds.get_connection()
    if not conn:
        return []

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Simple query for public live events (we can restrict this to following/location later)
            # COALESCE is used in case endAt is null
            cur.execute(
                '''
                SELECT * FROM events 
                WHERE "visibility" = 'Public' 
                  AND "startAt" <= CURRENT_TIMESTAMP 
                  AND ( "endAt" IS NULL OR "endAt" >= CURRENT_TIMESTAMP )
                  AND "status" != 'Cancelled'
                ORDER BY "startAt" DESC
                LIMIT 10;
                '''
            )
            rows = cur.fetchall()
            events = [util.format_rds_row(row) for row in rows]
            # Add a source flag
            for e in events:
                e["source"] = "LIVE_EVENT"
                e["entityType"] = "EVENT_CARD"
            return events
    except Exception as exc:
        util.log("error", "feed_providers.get_live_events", f"Failed: {exc}")
        return []
    finally:
        conn.close()

def get_own_content(user_id: str, limit: int = 10) -> list:
    """
    Fetch recent posts and upcoming/active events for the user.
    """
    conn = rds.get_connection()
    if not conn:
        return []

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get latest posts
            cur.execute(
                '''
                SELECT *, 'FEED_POST' as "entityType" FROM posts 
                WHERE "userID" = %s 
                ORDER BY "createdAt" DESC LIMIT %s;
                ''',
                (user_id, limit)
            )
            posts = [util.format_rds_row(row) for row in cur.fetchall()]
            
            # Get latest events
            cur.execute(
                '''
                SELECT *, 'EVENT_CARD' as "entityType" FROM events 
                WHERE "hostUserID" = %s 
                ORDER BY "createdAt" DESC LIMIT %s;
                ''',
                (user_id, limit)
            )
            events = [util.format_rds_row(row) for row in cur.fetchall()]
            
            combined = posts + events
            for c in combined:
                c["source"] = "OWN_CONTENT"
                
            return combined
    except Exception as exc:
        util.log("error", "feed_providers.get_own_content", f"Failed: {exc}")
        return []
    finally:
        conn.close()

def get_following_content(user_id: str, limit: int = 20) -> list:
    """
    Fetch posts and events from followed users.
    We leverage the existing DynamoDB fan-out partition USER#<user_id>
    """
    from boto3.dynamodb.conditions import Key
    table = dynamo_db._get_table("events")
    if not table:
        return []

    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FEED#"),
            ScanIndexForward=False,
            Limit=limit,
        )
        items = response.get("Items", [])
        for item in items:
            item["source"] = "FOLLOWING"
        return items
    except Exception as exc:
        util.log("error", "feed_providers.get_following_content", f"Failed: {exc}")
        return []

def get_recommendations(user_id: str, limit: int = 10) -> list:
    """
    Fetch algorithmic recommendations.
    We leverage the discover feed generator for now.
    """
    result = get_discover_feed(user_id, limit=limit)
    if not result.get("success"):
        return []
        
    items = result.get("data", [])
    for item in items:
        item["source"] = "RECOMMENDATION"
    return items
