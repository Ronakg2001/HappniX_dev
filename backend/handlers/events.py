"""
handlers/events.py — Party/event management endpoints for HappniX.
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import r2_bucket
from services import event_services

def get_my_events(**kwargs):
    """Fetches all events for a user."""
    try:
        username = kwargs.get("username")
        user_id = kwargs.get("user_id")
        util.log("info", "get_my_events", f"Fetching events for {username}")

        if not user_id:
            return success_response({"success": True, "events": []})

        result = event_services.get_my_events(host_user_id=user_id)
        if result.get("success"):
            return success_response({"success": True, "events": result.get("data", [])})
        return error_response(result.get("error", "Failed to fetch events."), 500)
    except Exception as exc:
        util.log("error", "get_my_events", f"Error fetching events: {str(exc)}")
        return error_response(str(exc), 500)


def _handle_event_save(kwargs, status):
    username = kwargs.get("username")
    user_id = kwargs.get("user_id")
    event_data = kwargs.get("eventData", {})
    event_id = event_data.get("id") or kwargs.get("id")
    
    if event_id and not str(event_id).startswith("c_"):
        # Update existing
        updates = event_services._format_event_payload(kwargs)
        updates["status"] = status
        result = event_services.update_event(event_id, user_id, updates)
        if result.get("success"):
            return success_response({
                "success": True,
                "message": f"Event {status.lower()} successfully.",
                "eventID": event_id,
            })
    else:
        # Create new
        result = event_services.create_event(host_user_id=user_id, raw_payload=kwargs, status=status)
        if result.get("success"):
            return success_response({
                "success": True,
                "message": f"Event {status.lower()} successfully.",
                "eventID": result.get("eventID"),
                "eventUID": result.get("eventUID"),
            })
            
    return error_response(result.get("error", f"Failed to {status.lower()} event."), 500)

def create_draft(**kwargs):
    """Handles saving an event draft."""
    try:
        return _handle_event_save(kwargs, "Draft")
    except Exception as exc:
        util.log("error", "create_draft", f"Error saving draft: {str(exc)}")
        return error_response(str(exc), 500)

def publish_event(**kwargs):
    """Handles publishing an event."""
    try:
        return _handle_event_save(kwargs, "Published")
    except Exception as exc:
        util.log("error", "publish_event", f"Error publishing event: {str(exc)}")
        return error_response(str(exc), 500)

def media_upload_url(**kwargs):
    """Generates a presigned URL for the frontend to upload images directly to R2."""
    try:
        username = kwargs.get("username")
        
        file_name = kwargs.get("fileName")
        content_type = kwargs.get("contentType")
        event_id = kwargs.get("eventId")
        
        user_id = kwargs.get("user_id")
        
        if not all([file_name, content_type, event_id, user_id]):
            return error_response("Missing fileName, contentType, eventId, or userId", 400)
            
        # Follow strict manifest folder structure: private/{user_id}/vibe/events/{event_id}/...
        object_key = f"private/{user_id}/vibe/events/{event_id}/{file_name}"
        
        # Note: calling integration layer using strictly **kwargs per guidelines
        url_res = r2_bucket.generate_presigned_url(**{
            "object_key": object_key,
            "method": "put_object",
            "content_type": content_type
        })
        if not url_res.get("success"):
            return error_response("Failed to generate upload URL", 500)
            
        return success_response({
            "success": True, 
            "uploadUrl": url_res.get("url"),
            "objectKey": object_key
        })
    except Exception as exc:
        util.log("error", "media_upload_url", f"Error generating URL: {str(exc)}")
        return error_response(str(exc), 500)

def delete_media(**kwargs):
    """Deletes an image from R2."""
    try:
        user_id = kwargs.get("user_id")
        
        object_key = kwargs.get("objectKey")
        if not object_key:
            return error_response("Missing objectKey", 400)
            
        # Security check: ensure user is deleting their own media
        if not object_key.startswith(f"private/{user_id}/") and not object_key.startswith(f"public/{user_id}/"):
            return error_response("Unauthorized to delete this media", 403)
            
        # Calling integration layer using strictly **kwargs
        delete_res = r2_bucket.delete_object(**{"object_key": object_key})
        if not delete_res.get("success"):
            return error_response("Failed to delete media", 500)
            
        util.log("info", "delete_media", f"Deleted media {object_key}")
        
        return success_response({"success": True, "message": "Media deleted."})
    except Exception as exc:
        util.log("error", "delete_media", f"Error deleting media {kwargs.get('objectKey')}: {str(exc)}")
        return error_response(str(exc), 500)

def delete_event(**kwargs):
    """Handles deleting an event."""
    try:
        user_id = kwargs.get("user_id")
        event_id = kwargs.get("eventID")
        
        if not event_id:
            return error_response("Missing eventID", 400)
            
        result = event_services.delete_event(event_id, user_id)
        
        if result.get("success"):
            return success_response({
                "success": True,
                "message": result.get("message")
            })
        return error_response(result.get("error", "Failed to delete event."), 500)
    except Exception as exc:
        util.log("error", "events.delete_event", f"Error deleting event: {str(exc)}")
        return error_response(str(exc), 500)

ACTION_HANDLERS = {
    "GetMyEvents": get_my_events,
    "CreateEventDraft": create_draft,
    "PublishEvent": publish_event,
    "GetMediaUploadUrl": media_upload_url,
    "DeleteMedia": delete_media,
    "DeleteEvent": delete_event,
}

def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        
        # Browsers send OPTIONS requests without Authorization headers during preflight
        if http_method == "OPTIONS":
            return success_response({"success": True, "message": "CORS preflight successful"})
            
        auth = util.authenticate_request(event)
        if not auth.get("success"):
            return error_response(auth["error"], auth.get("status_code", 401))

        user_id = auth["user_id"]

        if http_method == "GET":
            action_item = "GetMyEvents"
            qs = event.get("queryStringParameters") or {}
            payload = {**qs}
        else:
            body = util.parse_body(event)
            if body == "400":
                return error_response("Malformed JSON in request body.", 400)
                
            action_item = body.get("actionItem")
            if not action_item:
                return error_response("Missing 'actionItem' in request body.", 400)
                
            payload = {k: v for k, v in body.items() if k != "actionItem"}
            
        handler = ACTION_HANDLERS.get(action_item)
        if not handler:
            return error_response(f"Action '{action_item}' not implemented.", 501)

        payload["user_id"] = user_id
        
        return handler(**payload)
        
    except Exception as exc:
        util.log("error", "events.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
