"""
integration/r2_bucket.py — Cloudflare R2 integration for HappniX.
"""

import os
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from utils import utilities as util
from utils import dependencies

# Global variables for caching the client
_r2_client = None
_bucket_name = None

def get_r2_client():
    global _r2_client, _bucket_name
    if _r2_client is not None:
        return _r2_client, _bucket_name

    account_id = dependencies.enviroment_variable.get("CLOUDFLARE_ACCOUNT_ID")
    access_key = dependencies.enviroment_variable.get("R2_ACCESS_KEY_ID")
    secret_key = dependencies.enviroment_variable.get("R2_SECRET_ACCESS_KEY")
    _bucket_name = dependencies.enviroment_variable.get("R2_USERMEDIA_BUCKET", "happnix-media")

    if not all([account_id, access_key, secret_key]):
        util.log("error", "r2_bucket.get_r2_client", "Missing R2 credentials in environment.")
        return None, _bucket_name

    endpoint_url = dependencies.enviroment_variable.get("R2_ENDPOINT")
    if not endpoint_url:
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    try:
        _r2_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
    except Exception as exc:
        util.log("error", "r2_bucket.get_r2_client", f"Failed to initialize R2 client: {exc}")

    return _r2_client, _bucket_name

def create_folder(folder_key: str) -> dict:
    """
    Creates an empty object with a trailing slash to simulate a folder.
    """
    client, bucket = get_r2_client()
    if not client:
        return {"success": False, "error": "R2 Client not initialized"}

    # Ensure trailing slash
    if not folder_key.endswith('/'):
        folder_key += '/'

    try:
        client.put_object(Bucket=bucket, Key=folder_key)
        return {"success": True, "folder_key": folder_key}
    except ClientError as exc:
        util.log("error", "r2_bucket.create_folder", f"Failed to create folder {folder_key}: {exc}")
        return {"success": False, "error": str(exc)}

def generate_presigned_url(object_key: str, method: str = 'put_object', expires_in: int = 3600) -> dict:
    """
    Generates a presigned URL for uploading or viewing files.
    method: 'put_object' for upload, 'get_object' for download/viewing private files.
    """
    client, bucket = get_r2_client()
    if not client:
        return {"success": False, "error": "R2 Client not initialized"}

    try:
        url = client.generate_presigned_url(
            ClientMethod=method,
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=expires_in
        )
        return {"success": True, "url": url}
    except ClientError as exc:
        util.log("error", "r2_bucket.generate_presigned_url", f"Failed to generate presigned URL for {object_key}: {exc}")
        return {"success": False, "error": str(exc)}
