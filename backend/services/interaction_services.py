"""
services/interaction_services.py — User interaction tracking and recommendation engine.

Tracks views, likes, saves, shares, and attendance for the recommendation algorithm.
The engagement score worker recalculates scores periodically and syncs to DynamoDB GSI-Discover.
"""
import hashlib
from utils import utilities as util
from integration import rds, dynamo_db


# Interaction weight mapping
INTERACTION_WEIGHTS = {
    "view": 0.5,
    "like": 1.0,
    "save": 1.5,
    "share": 2.0,
    "attend": 5.0,
}


def track_interaction(user_id: str, entity_id: str, entity_type: str, interaction_type: str) -> dict:
    """
    Record a user interaction (view, like, save, share, attend).
    Uses UPSERT via ON CONFLICT to prevent duplicates.
    """
    weight = INTERACTION_WEIGHTS.get(interaction_type, 1.0)

    conn = rds.get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    try:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO user_interactions ("userID", "entityID", "entityType", "interactionType", "weight")
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT ("userID", "entityID", "interactionType")
                DO UPDATE SET "weight" = EXCLUDED."weight", "createdAt" = CURRENT_TIMESTAMP;
                ''',
                (user_id, entity_id, entity_type, interaction_type, weight)
            )
            conn.commit()

        util.log("info", "interaction_services.track_interaction",
                 f"Interaction tracked", user_id=user_id, entity_id=entity_id,
                 interaction_type=interaction_type, weight=weight)
        return {"success": True}
    except Exception as exc:
        conn.rollback()
        util.log("error", "interaction_services.track_interaction", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def recalculate_engagement(entity_id: str, entity_type: str) -> dict:
    """
    Recalculate the engagement score for a single entity (event or post).
    Score = SUM(weight) of all interactions for this entity.
    Updates RDS and syncs to DynamoDB GSI-Discover.
    """
    conn = rds.get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    try:
        with conn.cursor() as cur:
            # Calculate total engagement
            cur.execute(
                'SELECT COALESCE(SUM("weight"), 0) FROM user_interactions WHERE "entityID" = %s;',
                (entity_id,)
            )
            row = cur.fetchone()
            score = float(row[0]) if row else 0.0

            # Update the source table
            table_name = "events" if entity_type == "event" else "posts"
            pk_name = "eventID" if entity_type == "event" else "postID"
            cur.execute(
                f'UPDATE {table_name} SET "engagementScore" = %s, "updatedAt" = CURRENT_TIMESTAMP WHERE "{pk_name}" = %s;',
                (score, entity_id)
            )
            conn.commit()

        # Sync to DynamoDB GSI-Discover
        shard_index = int(hashlib.md5(entity_id.encode()).hexdigest(), 16) % 10
        shard_key = f"DISCOVER#SHARD_{shard_index}"
        engagement_sort_key = f"{score:012.2f}#{util.now_iso()}"

        table = dynamo_db._get_table("events")
        if table:
            table.update_item(
                Key={"PK": f"EVENT#{entity_id}" if entity_type == "event" else f"POST#{entity_id}", "SK": "CARD"},
                UpdateExpression="SET discoverShard = :ds, engagementSortKey = :esk, engagementScore = :es",
                ExpressionAttributeValues={
                    ":ds": shard_key,
                    ":esk": engagement_sort_key,
                    ":es": str(score),
                },
            )

        util.log("info", "interaction_services.recalculate_engagement",
                 f"Engagement recalculated", entity_id=entity_id, score=score, shard=shard_key)
        return {"success": True, "score": score}
    except Exception as exc:
        conn.rollback()
        util.log("error", "interaction_services.recalculate_engagement", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def get_discover_feed(user_id: str, limit: int = 20) -> dict:
    """
    Fetch the Discover feed by scatter-gathering across GSI-Discover shards,
    then re-ranking with the user's PREFERENCE_CLUSTER.
    """
    from boto3.dynamodb.conditions import Key

    table = dynamo_db._get_table("events")
    if not table:
        return {"success": False, "error": "DynamoDB events table not available."}

    # ── Step 1: Scatter-gather across 10 shards ──
    all_items = []
    for shard_index in range(10):
        shard_key = f"DISCOVER#SHARD_{shard_index}"
        try:
            response = table.query(
                IndexName="GSI-Discover",
                KeyConditionExpression=Key("discoverShard").eq(shard_key),
                ScanIndexForward=False,  # Highest engagement first
                Limit=10,
            )
            all_items.extend(response.get("Items", []))
        except Exception as exc:
            util.log("warning", "interaction_services.get_discover_feed",
                     f"Shard {shard_index} query failed: {exc}")

    # ── Step 2: Fetch user's preference cluster ──
    pref_result = dynamo_db.get_item(
        table_key="events",
        pk_value=f"USER#{user_id}",
        sk_value="PREF#CLUSTER",
    )

    preferences = {}
    if pref_result.get("success"):
        pref_data = pref_result.get("data", {})
        # Check staleness
        last_calc = pref_data.get("lastCalculatedAt", "")
        preferences = {
            "categories": pref_data.get("topCategories", {}),
            "tags": pref_data.get("topTags", {}),
        }

    # ── Step 3: Re-rank with preferences ──
    for item in all_items:
        base_score = float(item.get("engagementScore", 0))
        category = item.get("eventCategory", "")
        category_boost = float(preferences.get("categories", {}).get(category, 0.5))
        item["_personalizedScore"] = base_score * (1 + category_boost)

    all_items.sort(key=lambda x: x.get("_personalizedScore", 0), reverse=True)

    # Clean up internal fields and slice
    for item in all_items:
        item.pop("_personalizedScore", None)

    return {"success": True, "data": all_items[:limit]}
