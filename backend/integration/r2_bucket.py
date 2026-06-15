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

    account_id = dependencies.enviroment_variable.get("CLOUDFLARE_ACCOUNT_ID") or ""
    access_key = dependencies.enviroment_variable.get("R2_ACCESS_KEY_ID") or ""
    secret_key = dependencies.enviroment_variable.get("R2_SECRET_ACCESS_KEY") or ""
    _bucket_name = dependencies.enviroment_variable.get("R2_USERMEDIA_BUCKET") or "happnix-usersmedia-dev"

    if not all([account_id, access_key, secret_key]):
        util.log("error", "r2_bucket.get_r2_client", "Missing R2 credentials in environment.")
        return None, _bucket_name

    endpoint_url = dependencies.enviroment_variable.get("R2_ENDPOINT") or ""
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

def create_folder(**kwargs) -> dict:
    """
    Creates an empty object with a trailing slash to simulate a folder.
    """
    folder_key = kwargs.get("folder_key")
    if not folder_key:
        return {"success": False, "error": "Missing folder_key"}
        
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

def generate_presigned_url(**kwargs) -> dict:
    """
    Generates a presigned URL for uploading or viewing files.
    Requires 'object_key'. Optional: 'method', 'expires_in', 'content_type'.
    """
    object_key = kwargs.get("object_key")
    method = kwargs.get("method", "put_object")
    expires_in = kwargs.get("expires_in", 3600)
    content_type = kwargs.get("content_type")
    
    if not object_key:
        return {"success": False, "error": "Missing object_key"}

    client, bucket = get_r2_client()
    if not client:
        return {"success": False, "error": "R2 Client not initialized"}

    try:
        params = {'Bucket': bucket, 'Key': object_key}
        if content_type:
            params['ContentType'] = content_type
            
        url = client.generate_presigned_url(
            ClientMethod=method,
            Params=params,
            ExpiresIn=expires_in
        )
        return {"success": True, "url": url}
    except ClientError as exc:
        util.log("error", "r2_bucket.generate_presigned_url", f"Failed to generate presigned URL for {object_key}: {exc}")
        return {"success": False, "error": str(exc)}

def delete_folder_contents(**kwargs) -> dict:
    """
    Deletes all objects under a specific prefix (folder).
    """
    prefix = kwargs.get("prefix")
    if not prefix:
        return {"success": False, "error": "Missing prefix"}
        
    client, bucket = get_r2_client()
    if not client:
        return {"success": False, "error": "R2 Client not initialized"}

    # Ensure trailing slash to only delete folder contents, not similarly named folders
    if not prefix.endswith('/'):
        prefix += '/'

    try:
        # First, list all objects with the prefix
        response = client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        objects = response.get('Contents', [])
        
        while response.get('IsTruncated'):
            response = client.list_objects_v2(
                Bucket=bucket, 
                Prefix=prefix, 
                ContinuationToken=response.get('NextContinuationToken')
            )
            objects.extend(response.get('Contents', []))

        if not objects:
            return {"success": True, "deletedCount": 0, "message": "No objects found"}

        # Format for delete_objects
        delete_keys = [{'Key': obj['Key']} for obj in objects]
        
        # Boto3 delete_objects limits to 1000 keys per request, chunk it
        for i in range(0, len(delete_keys), 1000):
            chunk = delete_keys[i:i + 1000]
            client.delete_objects(
                Bucket=bucket,
                Delete={'Objects': chunk}
            )

        util.log("info", "r2_bucket.delete_folder_contents", f"Deleted {len(delete_keys)} objects under {prefix}")
        return {"success": True, "deletedCount": len(delete_keys)}

    except ClientError as exc:
        util.log("error", "r2_bucket.delete_folder_contents", f"Failed to delete folder {prefix}: {exc}")
        return {"success": False, "error": str(exc)}

def delete_object(**kwargs) -> dict:
    """
    Deletes a single object from R2.
    """
    object_key = kwargs.get("object_key")
    if not object_key:
        return {"success": False, "error": "Missing object_key"}
        
    client, bucket = get_r2_client()
    if not client:
        return {"success": False, "error": "R2 Client not initialized"}
        
    try:
        client.delete_object(Bucket=bucket, Key=object_key)
        util.log("info", "r2_bucket.delete_object", f"Deleted object {object_key}")
        return {"success": True}
    except ClientError as exc:
        util.log("error", "r2_bucket.delete_object", f"Failed to delete {object_key}: {exc}")
        return {"success": False, "error": str(exc)}
