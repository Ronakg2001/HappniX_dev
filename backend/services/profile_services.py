"""
profile_services.py — specific logic for profile DynamoDB interactions.
"""
from utils import utilities as util
from integration import dynamo_db
from services import signup_signin_services

def ensure_user_profile(**kwargs) -> dict:
    """
    Self-healing profile fetch.
    
    1. Try to fetch the PROFILE entity from DynamoDB.
    2. If it exists → return it.
    3. If it does NOT exist (e.g. DynamoDB write failed during signup) →
       create both PROFILE and SETTINGS entities via signup_signin_services, then return the fresh PROFILE.
    """
    user_id = kwargs.get("user_id")
    username = kwargs.get("username")
    
    if not user_id:
        return {"success": False, "error": "user_id is required."}

    # 1. Try fetching the existing profile
    result = dynamo_db.get_item(table_key="users", pk_value=user_id, sk_value="PROFILE")

    if result.get("success"):
        return result

    # 2. Profile not found — self-heal by creating both entities
    if result.get("error") == "not_found":
        util.log("warning", "profile_services.ensure_user_profile",
                 "PROFILE not found — self-healing by creating entities",
                 user_id=user_id, username=username)

        create_result = signup_signin_services.create_user_entities(**kwargs)

        if not create_result.get("success"):
            util.log("error", "profile_services.ensure_user_profile",
                     "Self-healing creation also failed",
                     user_id=user_id, error=create_result.get("error"))
            return {"success": False, "error": "Failed to create user profile."}

        # 3. Fetch the freshly created profile
        return dynamo_db.get_item(table_key="users", pk_value=user_id, sk_value="PROFILE")

    # 4. Some other DynamoDB error
    return result

def update_user_profile(user_id: str, updates: dict) -> dict:
    """
    Updates the PROFILE entity with the given fields.
    """
    if not user_id:
        return {"success": False, "error": "user_id is required"}

    # Fetch existing to merge
    fetch_res = dynamo_db.get_item(table_key="users", pk_value=user_id, sk_value="PROFILE")
    if not fetch_res.get("success"):
        return {"success": False, "error": "Profile not found to update."}
        
    current_profile = fetch_res.get("data", {})
    current_profile.update(updates)
    current_profile["updatedAt"] = util.now_iso()
    
    # We use put_item without entity_type to replace the item with merged data
    put_res = dynamo_db.put_item("users", user_id, "PROFILE", **current_profile)
    if not put_res.get("success"):
        return {"success": False, "error": "Failed to save profile updates."}
        
    return {"success": True, "data": current_profile}

