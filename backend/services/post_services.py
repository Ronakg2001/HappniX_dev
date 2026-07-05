"""
services/post_services.py — Social post and reel creation, feed retrieval.

Posts are saved to RDS (source of truth) and fanned out to DynamoDB
for the polymorphic home feed.
"""
import json
import uuid
from utils import utilities as util
from integration import rds, dynamo_db


def create_post(user_id: str, post_data: dict) -> dict:
    """
    Create a new post/reel:
    1. INSERT into RDS `posts` table
    2. Fan-out FEED_POST to followers' DynamoDB partitions
    """
    post_id = str(uuid.uuid4())

    # ── Step 1: Insert into RDS ──
    rds_payload = {
        "postID": post_id,
        "userID": user_id,
        "eventID": post_data.get("eventID"),
        "postType": post_data.get("postType", "Standard"),
        "mediaItems": post_data.get("mediaItems", []),
        "caption": post_data.get("caption"),
    }

    rds_result = rds.insert_record("posts", **rds_payload)
    if not rds_result.get("success"):
        util.log("error", "post_services.create_post",
                 f"RDS insert failed: {rds_result.get('error')}")
        return {"success": False, "error": "Failed to create post."}

    # ── Step 2: Fan-out to followers ──
    # For now, we write the post to the author's own feed partition.
    # Full fan-out (querying followers and batch-writing) will be implemented
    # when the social graph integration is wired up.
    feed_item = {
        "entityType": "FEED_POST",
        "postID": post_id,
        "authorUserID": user_id,
        "postType": rds_payload["postType"],
        "mediaItems": json.dumps(rds_payload["mediaItems"]) if isinstance(rds_payload["mediaItems"], (list, dict)) else rds_payload["mediaItems"],
        "caption": rds_payload.get("caption", ""),
        "createdAt": util.now_iso(),
    }

    dynamo_db.put_item(
        table_key="events",
        pk_value=f"USER#{user_id}",
        sk_value=f"FEED#{util.now_iso()}#{post_id}",
        **feed_item,
    )

    util.log("info", "post_services.create_post",
             f"Post created", post_id=post_id, post_type=rds_payload["postType"])

    return {"success": True, "postID": post_id}


def get_feed(user_id: str, limit: int = 20) -> dict:
    """
    Fetch the user's home feed from DynamoDB.
    Queries the USER#<userID> partition for FEED# items, sorted by SK (chronological).
    
    TODO: Merge CELEB# partitions for celebrity-tier follow-on-read.
    """
    from boto3.dynamodb.conditions import Key

    table = dynamo_db._get_table("events")
    if not table:
        return {"success": False, "error": "DynamoDB events table not available."}

    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("FEED#"),
            ScanIndexForward=False,  # Newest first
            Limit=limit,
        )
        items = response.get("Items", [])
        return {"success": True, "data": items}
    except Exception as exc:
        util.log("error", "post_services.get_feed", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}


def get_user_posts(user_id: str) -> dict:
    """
    Fetch all posts by a specific user from RDS (for their profile page).
    """
    conn = rds.get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM posts WHERE "userID" = %s ORDER BY "createdAt" DESC;',
                (user_id,)
            )
            rows = cur.fetchall()
            posts = [{k: str(v) if v is not None else None for k, v in row.items()} for row in rows]
            return {"success": True, "data": posts}
    except Exception as exc:
        util.log("error", "post_services.get_user_posts", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()
