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
        # Fallback or fail gracefully if environment variables are not set
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
    mime_type = parts[0][5:] # Extract after "data:"
    
    # Extract base64 data
    base64_data = ""
    if len(parts) > 1 and parts[1].startswith("base64,"):
        base64_data = parts[1][7:]
    else:
        # Just in case there is no base64 prefix
        base64_data = data_uri.split(",")[-1]

    ext = mimetypes.guess_extension(mime_type) or ".jpg"
    return mime_type, ext, base64_data

def upload_profile_picture(user_id: int, username: str, base64_data_uri: str) -> str:
    """
    Uploads a base64 encoded profile picture to R2.
    Folder structure: userID_username/profile_picture/filename.ext
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

    safe_username = str(username).replace("/", "_").replace(" ", "")
    filename = f"{uuid.uuid4().hex}{ext}"
    object_key = f"{user_id}_{safe_username}/profile_picture/{filename}"

    try:
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType=mime_type
        )
        # R2 public domain URLs don't have trailing slash by convention, but we join with /
        domain = R2_PUBLIC_DOMAIN.rstrip("/")
        return f"{domain}/{object_key}"
    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return ""
