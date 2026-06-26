"""
services/feed_providers.py — Data fetching logic for the hybrid feed system.
"""
from utils import utilities as util
from integration import rds, dynamo_db
from services.interaction_services import get_discover_feed


def get_live_events(user_id: str, lat: float = None, lng: float = None, conn=None) -> list:
    """
    Fetch events that are currently 'Live'.
    For V1, this means `startAt` <= now <= `endAt`.
    Includes the host's profile info via JOIN.
    Optionally filters by geographic radius if lat/lng are provided.
    """
    owns_conn = conn is None
    if owns_conn:
        conn = rds.get_connection()
    if not conn:
        return []

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build geo filter clause if coordinates are available
            geo_clause = ""
            params = []
            
            if lat is not None and lng is not None:
                # Haversine-based radius filter (50 km default)
                geo_clause = """
                  AND e."latitude" IS NOT NULL
                  AND e."longitude" IS NOT NULL
                  AND (6371 * acos(LEAST(1.0, GREATEST(-1.0,
                      cos(radians(%s)) * cos(radians(e."latitude"))
                      * cos(radians(e."longitude") - radians(%s))
                      + sin(radians(%s)) * sin(radians(e."latitude"))
                  )))) <= 50
                """
                params = [lat, lng, lat]
            
            query = f'''
                SELECT e.*, u."fullName" AS "hostName", u."userName" AS "hostUserName",
                       u."profilePictureUrl" AS "hostAvatar"
                FROM events e
                LEFT JOIN users u ON e."hostUserID" = u."userID"
                WHERE e."visibility" = 'Public' 
                  AND e."startAt" <= CURRENT_TIMESTAMP 
                  AND ( e."endAt" IS NULL OR e."endAt" >= CURRENT_TIMESTAMP )
                  AND e."status" != 'Cancelled'
                  {geo_clause}
                ORDER BY e."startAt" DESC
                LIMIT 10;
            '''
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            events = [util.format_rds_row(row) for row in rows]
            seen_titles = set()
            unique_live = []
            for e in events:
                title = str(e.get("title") or "").lower().strip()
                if title and title in seen_titles:
                    continue
                if title:
                    seen_titles.add(title)
                e["source"] = "LIVE_EVENT"
                e["entityType"] = "EVENT_CARD"
                unique_live.append(e)
            return unique_live
    except Exception as exc:
        util.log("error", "feed_providers.get_live_events", f"Failed: {exc}")
        return []
    finally:
        if owns_conn and conn:
            conn.close()


def get_own_content(user_id: str, limit: int = 10, offset: int = 0, conn=None) -> list:
    """
    Fetch recent posts and upcoming/active events for the user.
    Excludes drafts and cancelled events.
    JOINs the users table to include author profile info.
    """
    owns_conn = conn is None
    if owns_conn:
        conn = rds.get_connection()
    if not conn:
        return []

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get latest posts with author info
            cur.execute(
                '''
                SELECT p.*, 'FEED_POST' as "entityType",
                       u."fullName", u."userName", u."profilePictureUrl"
                FROM posts p
                LEFT JOIN users u ON p."userID" = u."userID"
                WHERE p."userID" = %s 
                ORDER BY p."createdAt" DESC LIMIT %s OFFSET %s;
                ''',
                (user_id, limit, offset)
            )
            posts = [util.format_rds_row(row) for row in cur.fetchall()]
            
            # Get latest events with host info
            cur.execute(
                '''
                SELECT e.*, 'EVENT_CARD' as "entityType",
                       u."fullName" AS "hostName", u."userName" AS "hostUserName",
                       u."profilePictureUrl" AS "hostAvatar"
                FROM events e
                LEFT JOIN users u ON e."hostUserID" = u."userID"
                WHERE e."hostUserID" = %s AND e."status" NOT IN ('Draft', 'Cancelled')
                ORDER BY e."createdAt" DESC LIMIT %s OFFSET %s;
                ''',
                (user_id, limit, offset)
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
        if owns_conn and conn:
            conn.close()


def get_following_content(user_id: str, limit: int = 20, last_key: dict = None) -> tuple[list, dict]:
    """
    Fetch posts and events from followed users.
    Returns (items, next_evaluated_key)
    """
    from boto3.dynamodb.conditions import Key
    table = dynamo_db._get_table("events")
    if not table:
        return [], None

    try:
        query_params = {
            "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FEED#"),
            "ScanIndexForward": False,
            "Limit": limit
        }
        if last_key:
            query_params["ExclusiveStartKey"] = last_key
            
        response = table.query(**query_params)
        items = response.get("Items", [])
        for item in items:
            item["source"] = "FOLLOWING"
        return items, response.get("LastEvaluatedKey")
    except Exception as exc:
        util.log("error", "feed_providers.get_following_content", f"Failed: {exc}")
        return [], None


def get_recommendations(user_id: str, limit: int = 10, offset: int = 0) -> list:
    """
    Fetch algorithmic recommendations.
    We leverage the discover feed generator for now.
    """
    result = get_discover_feed(user_id, limit=limit, offset=offset)
    if not result.get("success"):
        return []
        
    items = result.get("data", [])
    for item in items:
        item["source"] = "RECOMMENDATION"
    return items


def get_nearby_events(user_id: str, lat: float = None, lng: float = None, radius_km: float = 5.0, limit: int = 20, conn=None) -> list:
    """
    Fetch public events within radius_km (default 5km) of the user coordinates.
    Excludes drafts and cancelled events.
    Includes host profile info.
    """
    if lat is None or lng is None:
        return []

    owns_conn = conn is None
    if owns_conn:
        conn = rds.get_connection()
    if not conn:
        return []

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = '''
                SELECT e.*, 'EVENT_CARD' as "entityType", 'NEARBY' as "source",
                       u."fullName" AS "hostName", u."userName" AS "hostUserName",
                       u."profilePictureUrl" AS "hostAvatar",
                       (6371 * acos(LEAST(1.0, GREATEST(-1.0,
                           cos(radians(%s)) * cos(radians(e."latitude"))
                           * cos(radians(e."longitude") - radians(%s))
                           + sin(radians(%s)) * sin(radians(e."latitude"))
                       )))) AS distance_km
                FROM events e
                LEFT JOIN users u ON e."hostUserID" = u."userID"
                WHERE e."visibility" = 'Public'
                  AND e."status" NOT IN ('Draft', 'Cancelled')
                  AND e."latitude" IS NOT NULL AND e."longitude" IS NOT NULL
                  AND (6371 * acos(LEAST(1.0, GREATEST(-1.0,
                           cos(radians(%s)) * cos(radians(e."latitude"))
                           * cos(radians(e."longitude") - radians(%s))
                           + sin(radians(%s)) * sin(radians(e."latitude"))
                       )))) <= %s
                ORDER BY e."startAt" ASC
                LIMIT %s;
            '''
            params = [lat, lng, lat, lat, lng, lat, radius_km, limit]
            cur.execute(query, tuple(params))
            events = [util.format_rds_row(row) for row in cur.fetchall()]
            return events
    except Exception as exc:
        util.log("error", "feed_providers.get_nearby_events", f"Failed: {exc}")
        return []
    finally:
        if owns_conn and conn:
            conn.close()

