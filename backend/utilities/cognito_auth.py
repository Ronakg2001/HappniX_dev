import json
import os
import urllib.request
from jose import jwt

# =====================================================================
# 1. Setup Cognito Verifier (Outside handler for warm-start caching)
# =====================================================================
REGION = os.environ.get('AWS_REGION', 'us-east-1')
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', 'us-east-1_xxxxxxxxx')
APP_CLIENT_ID = os.environ.get('COGNITO_USER_POOL_CLIENT_ID', 'your-client-id')

JWKS_URL = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"

# Global variable to cache the keys across Lambda invocations
cached_keys = None

def get_cognito_keys():
    global cached_keys
    if cached_keys is None:
        try:
            with urllib.request.urlopen(JWKS_URL) as response:
                cached_keys = json.loads(response.read().decode('utf-8'))['keys']
        except Exception as e:
            print(f"Failed to fetch JWKS: {e}")
            raise
    return cached_keys

def verify_token(token):
    # Handle mock tokens for local dev environment
    if token.startswith("mock-jwt-"):
        sub = token.replace("mock-jwt-", "")
        return {"sub": sub, "token_use": "access"}

    keys = get_cognito_keys()

    # Extract unverified claims to determine if it's an access or id token
    unverified_claims = jwt.get_unverified_claims(token)
    token_use = unverified_claims.get('token_use')

    # ID tokens use 'aud', Access tokens use 'client_id'
    audience = APP_CLIENT_ID if token_use == 'id' else None

    # Decode and verify the token (validates signature and expiration automatically)
    claims = jwt.decode(
        token,
        keys,
        algorithms=['RS256'],
        audience=audience,
        options={"verify_aud": token_use == 'id'}
    )

    # Manually verify client_id for access tokens
    if token_use == 'access' and claims.get('client_id') != APP_CLIENT_ID:
        raise ValueError("Token was not issued for this client_id")

    return claims
