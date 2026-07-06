import os

enviroment_variable = {
    "AWS_ACCESS_KEY_ID": os.environ.get("AWS_ACCESS_KEY_ID", ""),
    "AWS_SECRET_ACCESS_KEY": os.environ.get("AWS_SECRET_ACCESS_KEY", ""),
    "AWS_ROLE_ARN": os.environ.get("AWS_ROLE_ARN", ""),
    "AWS_REGION": os.environ.get("AWS_REGION", ""),
    "NETWORK_VPC_ID": os.environ.get("NETWORK_VPC_ID", ""),
    "NETWORK_PRIVATE_SUBNET_A_ID": os.environ.get("NETWORK_PRIVATE_SUBNET_A_ID", ""),
    "NETWORK_PRIVATE_SUBNET_B_ID": os.environ.get("NETWORK_PRIVATE_SUBNET_B_ID", ""),
    "NETWORK_LAMBDA_SECURITY_GROUP_ID": os.environ.get("NETWORK_LAMBDA_SECURITY_GROUP_ID", ""),
    "NETWORK_DATABASE_SECURITY_GROUP_ID": os.environ.get("NETWORK_DATABASE_SECURITY_GROUP_ID", ""),
    "API_BASE_URL": os.environ.get("API_BASE_URL", ""),
    "DATA_DB_HOST": os.environ.get("DATA_DB_HOST", ""),
    "AUTH_DB_NAME": os.environ.get("AUTH_DB_NAME", ""),
    "AUTH_DB_USER": os.environ.get("AUTH_DB_USER", ""),
    "AUTH_DB_PASSWORD": os.environ.get("AUTH_DB_PASSWORD", ""),
    "DATA_DB_PORT": os.environ.get("DATA_DB_PORT", ""),
    "COGNITO_USER_POOL_CLIENT_ID": os.environ.get("COGNITO_USER_POOL_CLIENT_ID", ""),
    "COGNITO_USER_POOL_ID": os.environ.get("COGNITO_USER_POOL_ID", ""),
    "CLOUDFLARE_ACCOUNT_ID": os.environ.get("CLOUDFLARE_ACCOUNT_ID", ""),
    "CLOUDFLARE_API_TOKEN": os.environ.get("CLOUDFLARE_API_TOKEN", ""),
    "R2_ACCESS_KEY_ID": os.environ.get("R2_ACCESS_KEY_ID", ""),
    "R2_SECRET_ACCESS_KEY": os.environ.get("R2_SECRET_ACCESS_KEY", ""),
    "R2_ENDPOINT": os.environ.get("R2_ENDPOINT", ""),
    "R2_USERMEDIA_BUCKET": os.environ.get("R2_USERMEDIA_BUCKET", ""),
    "R2_STATIC_MEDIA_BUCKET": os.environ.get("R2_STATIC_MEDIA_BUCKET", ""),
    "R2_USERMEDIA_BUCKET_PUBID": os.environ.get("NEXT_PUBLIC_R2_USERMEDIA_BUCKET_PUBID", ""),
    "R2_STATIC_MEDIA_BUCKET_PUBID": os.environ.get("NEXT_PUBLIC_R2_STATIC_MEDIA_BUCKET_PUBID", ""),
    "TEST_OTP_MODE": os.environ.get("TEST_OTP_MODE", "false"),
    "APP_ENVIRONMENT": os.environ.get("APP_ENVIRONMENT", "prod"),
    "EXPO_TOKEN": os.environ.get("EXPO_TOKEN", "")
}

# ── Region / Country-Code Mapping ─────────────────────────────────────────────
# Used by the GetCountryCodes action to send country metadata to the frontend.
# Frontend uses this to render a flag + dial-code dropdown and validate phone
# numbers client-side via `mobile_number_pattern` (a regex without anchors
# assumed to be applied with ^ and $).
#
# Structure per entry:
#   country_name → {
#       "region_code":           ISO 3166-1 alpha-2 code,
#       "dial_code":             E.164 dial prefix (e.g. "+91"),
#       "mobile_number_pattern": regex for the local (without dial code) number,
#       "region_flag":           unicode flag emoji,
#   }
#
# India is listed first so the frontend can default to index 0.

region_code_mapping = {
    "India": {
        "region_code": "IN",
        "dial_code": "+91",
        "mobile_number_pattern": "^[6-9]\\d{9}$",
        "region_flag": "🇮🇳",
    },
    "United States": {
        "region_code": "US",
        "dial_code": "+1",
        "mobile_number_pattern": "^[2-9]\\d{9}$",
        "region_flag": "🇺🇸",
    },
    "United Kingdom": {
        "region_code": "GB",
        "dial_code": "+44",
        "mobile_number_pattern": "^7\\d{9}$",
        "region_flag": "🇬🇧",
    },
    "United Arab Emirates": {
        "region_code": "AE",
        "dial_code": "+971",
        "mobile_number_pattern": "^5[0-9]\\d{7}$",
        "region_flag": "🇦🇪",
    },
    "Australia": {
        "region_code": "AU",
        "dial_code": "+61",
        "mobile_number_pattern": "^4\\d{8}$",
        "region_flag": "🇦🇺",
    },
}

# ── Canonical Event Categories ────────────────────────────────────────────────
# Shared source of truth matching mobile_frontend/services/api.ts
EVENT_CATEGORIES = [
    "Fake wedding",
    "Holi party",
    "Prom night",
    "Concert",
    "Halloween",
    "Lights out",
    "New year",
    "Pool",
    "Live concerts",
    "Comedy shows",
    "Dj nights",
    "House party",
    "Club parties",
    "Open mic nights",
    "Navratri",
    "Art and craft exhibitions",
    "Ladies night",
]

