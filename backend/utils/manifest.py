"""
utils/manifest.py — Storage and structure manifest for HappniX.
Defines user folder paths for R2 storage and provides initialization helpers.
"""

from integration import r2_bucket
from utils import utilities as util

def init_user_storage(user_id: str) -> dict:
    """
    Initializes the base directory structure in Cloudflare R2 for a new user.
    Folders to create:
      - public/<user_id>/profile/
      - private/<user_id>/vibe/posts/
      - private/<user_id>/vibe/events/
    """
    folders_to_create = [
        f"public/{user_id}/profile/",
        f"private/{user_id}/vibe/posts/",
        f"private/{user_id}/vibe/events/"
    ]
    
    results = {}
    success = True
    
    for folder in folders_to_create:
        res = r2_bucket.create_folder(folder_key=folder)
        results[folder] = res
        if not res.get("success"):
            success = False
            util.log("error", "manifest.init_user_storage", f"Failed to create {folder}: {res.get('error')}")
            
    return {"success": success, "details": results}

def get_avatar_key(user_id: str, timestamp: int) -> str:
    """
    Generates a unique object key for a new profile avatar.
    """
    return f"public/{user_id}/profile/avatar_{timestamp}.jpg"

def get_post_media_key(user_id: str, post_id: str, media_uuid: str, variant: str = "original", ext: str = "jpg") -> str:
    """
    Generates an object key for a vibe post media file.
    """
    return f"private/{user_id}/vibe/posts/{post_id}/{media_uuid}_{variant}.{ext}"

def get_event_media_key(user_id: str, event_id: str, media_uuid: str, variant: str = "original", ext: str = "jpg") -> str:
    """
    Generates an object key for a vibe event media file.
    """
    return f"private/{user_id}/vibe/events/{event_id}/{media_uuid}_{variant}.{ext}"
