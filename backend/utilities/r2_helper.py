import os
import boto3
import base64
import uuid
import mimetypes
from botocore.config import Config

R2_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_USERMEDIA_BUCKET", "happnix-usersmedia-dev")
R2_PUBLIC_DOMAIN = os.environ.get("R2_PUBLIC_DOMAIN", "https://pub-09453339054e4d8894deb9f536888434.r2.dev")


def _get_s3_client():
    if not R2_ENDPOINT_URL or not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        return None
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )


def _get_mime_and_extension(data_uri: str):
    """Parses a base64 data URI to extract mime type and extension."""
    if not data_uri.startswith("data:"):
        return "image/jpeg", ".jpg", data_uri

    parts = data_uri.split(";")
    mime_type = parts[0][5:]  # Extract after "data:"

    base64_data = ""
    if len(parts) > 1 and parts[1].startswith("base64,"):
        base64_data = parts[1][7:]
    else:
        base64_data = data_uri.split(",")[-1]

    ext = mimetypes.guess_extension(mime_type) or ".jpg"
    # Fix common bad guesses by mimetypes module
    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
    ext = ext_map.get(mime_type, ext)
    return mime_type, ext, base64_data


def init_user_folder_structure(user_id: str, username: str) -> bool:
    """
    Creates the base folder structure for a new user in the R2 bucket.
    Called right after signup completes, whether or not user uploaded a picture.

    Folder layout:
        {userID}_{username}/profile_picture/.keep
        {userID}_{username}/Event_highlights/.keep
        {userID}_{username}/Profile_media/.keep

    Returns True if successful (or if R2 is not configured — fail silently).
    """
    s3_client = _get_s3_client()
    if not s3_client:
        print("WARN: R2 not configured — skipping folder init.")
        return True  # Non-fatal

    safe_username = str(username or "user").replace("/", "_").replace(" ", "_")
    user_prefix = f"{user_id}_{safe_username}"

    folders = [
        f"{user_prefix}/profile_picture/.keep",
        f"{user_prefix}/Event_highlights/.keep",
        f"{user_prefix}/Profile_media/.keep",
    ]

    for key in folders:
        try:
            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=b"",          # Empty placeholder file
                ContentType="application/octet-stream"
            )
        except Exception as e:
            print(f"WARN: Could not create R2 folder '{key}': {e}")
            # Non-fatal — continue creating other folders

    return True


def upload_profile_picture(user_id: str, username: str, base64_data_uri: str) -> str:
    """
    Uploads a base64 encoded profile picture to R2.
    Folder structure: {userID}_{username}/profile_picture/filename.ext

    Returns the public URL of the uploaded file, or "" on failure.
    """
    s3_client = _get_s3_client()
    if not s3_client:
        print("WARN: R2 configuration missing, skipping upload.")
        return ""

    if not base64_data_uri:
        return ""

    mime_type, ext, base64_data = _get_mime_and_extension(base64_data_uri)

    try:
        file_bytes = base64.b64decode(base64_data)
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return ""

    safe_username = str(username or "user").replace("/", "_").replace(" ", "_")
    filename = f"{uuid.uuid4().hex}{ext}"
    object_key = f"{user_id}_{safe_username}/profile_picture/{filename}"

    try:
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType=mime_type
        )
        domain = R2_PUBLIC_DOMAIN.rstrip("/")
        return f"{domain}/{object_key}"
    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return ""
