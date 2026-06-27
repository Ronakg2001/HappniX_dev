"""
profile_services.py — specific logic for profile DynamoDB interactions.
"""
from utils import utilities as util
from integration import dynamo_db, cognito_auth, rds, r2_bucket
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
        
    # Synchronize shared fields to RDS
    rds_updates = {}
    if "name" in updates:
        rds_updates["fullName"] = updates["name"]
    if "dob" in updates:
        rds_updates["dateOfBirth"] = updates["dob"]
    if "gender" in updates:
        rds_updates["gender"] = updates["gender"]
    if "username" in updates:
        rds_updates["userName"] = updates["username"]
    if "avatar" in updates:
        rds_updates["profilePictureUrl"] = updates['avatar']

    if rds_updates:
        rds_res = rds.update_record("users", "userID", user_id, rds_updates)
        if not rds_res.get("success"):
            util.log("warning", "profile_services.update_user_profile",
                     f"Failed to sync updates to RDS (non-fatal): {rds_res.get('error')}",
                     user_id=user_id)

    return {"success": True, "data": current_profile}

def delete_user_data(user_id: str, username: str, access_token: str) -> dict:
    """
    Deletes all user data across R2, DynamoDB, RDS, and Cognito.
    """
    # =========================================================================
    # ARCHITECTURAL GAP: 30-Day Soft Delete Reversal
    # =========================================================================
    # In the future, to implement a 30-day soft-delete, inject logic here:
    # 1. Update RDS record status: rds.update_record("users", userID=user_id, updates={"status": "PendingDeletion"})
    # 2. Queue an EventBridge / SQS task for 30 days from now to call the hard delete logic.
    # 3. Log out the user: cognito_auth.global_sign_out(access_token)
    # 4. return {"success": True, "message": "Account scheduled for deletion in 30 days."}
    # 
    # For now, we bypass the soft-delete and execute an immediate permanent deletion.
    util.log("info", "profile_services.delete_user_data", "Soft-deletion bypassed: Executing immediate permanent deletion", user_id=user_id)
    # =========================================================================

    results = {"success": True, "details": {}}

    # 1. Delete from R2 Storage (Public and Private)
    public_res = r2_bucket.delete_folder_contents(f"public/{user_id}/")
    private_res = r2_bucket.delete_folder_contents(f"private/{user_id}/")
    results["details"]["r2_public"] = public_res
    results["details"]["r2_private"] = private_res

    # 2. Delete all entities from DynamoDB
    query_res = dynamo_db.query_items_by_pk("users", user_id)
    dynamo_deleted = 0
    if query_res.get("success"):
        for item in query_res.get("data", []):
            sk = item.get("SK")
            if sk:
                del_res = dynamo_db.delete_item("users", user_id, sk)
                if del_res.get("success"):
                    dynamo_deleted += 1
    results["details"]["dynamodb"] = {"deletedCount": dynamo_deleted}

    # 3. Delete from RDS
    rds_res = rds.delete_record("users", userID=user_id)
    results["details"]["rds"] = rds_res

    # 4. Delete from Cognito (and Sign Out)
    if access_token:
        cognito_auth.global_sign_out(access_token)
    
    try:
        cognito_auth.delete_user(username=username)
        results["details"]["cognito"] = {"success": True}
    except Exception as exc:
        results["details"]["cognito"] = {"success": False, "error": str(exc)}
        # We don't fail the overall operation if Cognito delete fails, because we already wiped DBs
        util.log("warning", "profile_services.delete_user_data", f"Cognito delete failed: {exc}", username=username)

    # Note: Even if some steps fail (like R2 missing files), we consider the action successful
    # because the user's core auth/DB footprint is gone, enabling them to re-register.
    return results


def _resolve_user_id(user_id: str) -> str:
    if not user_id:
        return user_id
    res = rds.get_record("users", userID=user_id)
    if res.get("success"):
        return res["data"]["userID"]
    res = rds.get_record("users", userName=user_id)
    if res.get("success"):
        return res["data"]["userID"]
    return user_id


def toggle_follow_user(actor_user_id: str, target_user_id: str) -> dict:
    """
    Toggle follow status between actor and target user.
    Orchestrates RDS insertion/deletion and atomic counter updates in DynamoDB.
    """
    if not actor_user_id or not target_user_id:
        return {"success": False, "error": "User identifiers required."}
        
    actor_user_id = _resolve_user_id(actor_user_id)
    target_user_id = _resolve_user_id(target_user_id)
        
    if actor_user_id == target_user_id:
        return {"success": False, "error": "You cannot follow yourself."}

    target_check = rds.get_record("users", userID=target_user_id)
    if not target_check.get("success"):
        return {"success": False, "error": "Target user not found."}

    is_currently_following = rds.check_if_following(actor_user_id, target_user_id)

    if is_currently_following:
        del_res = rds.delete_record("follows", followerUserID=actor_user_id, followingUserID=target_user_id)
        if not del_res.get("success"):
            return {"success": False, "error": f"Failed to unfollow user in database: {del_res.get('error', '')}"}
            
        dynamo_db.increment_counter("users", actor_user_id, "PROFILE", "following", -1)
        target_counter = dynamo_db.increment_counter("users", target_user_id, "PROFILE", "followers", -1)
        
        return {
            "success": True,
            "data": {
                "isFollowing": False,
                "targetFollowersCount": target_counter.get("newValue", 0)
            }
        }
    else:
        ins_res = rds.insert_record("follows", followerUserID=actor_user_id, followingUserID=target_user_id, createdAt=util.now_iso())
        if not ins_res.get("success"):
            return {"success": False, "error": f"Failed to save follow relationship: {ins_res.get('error', '')}"}
            
        dynamo_db.increment_counter("users", actor_user_id, "PROFILE", "following", 1)
        target_counter = dynamo_db.increment_counter("users", target_user_id, "PROFILE", "followers", 1)
        
        return {
            "success": True,
            "data": {
                "isFollowing": True,
                "targetFollowersCount": target_counter.get("newValue", 0)
            }
        }


def get_user_followers_list(user_id: str, limit: int = 20, offset: int = 0) -> dict:
    """
    Fetch followers list for user profile view.
    """
    if not user_id:
        return {"success": False, "error": "user_id required."}
    user_id = _resolve_user_id(user_id)
    return rds.get_followers(user_id, limit, offset)


def get_user_following_list(user_id: str, limit: int = 20, offset: int = 0) -> dict:
    """
    Fetch following list for user profile view.
    """
    if not user_id:
        return {"success": False, "error": "user_id required."}
    user_id = _resolve_user_id(user_id)
    return rds.get_following(user_id, limit, offset)

