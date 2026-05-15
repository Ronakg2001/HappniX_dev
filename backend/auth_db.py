import os

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:  # pragma: no cover - exercised only when dependency is absent
    psycopg2 = None
    RealDictCursor = None

try:
    import boto3
    cognito = boto3.client("cognito-idp")
except ImportError:
    cognito = None


def _connect():
    if psycopg2 is None:
        raise RuntimeError("psycopg2 is required for PostgreSQL-backed auth helpers.")
    return psycopg2.connect(
        host=os.environ["AUTH_DB_HOST"],
        port=os.environ.get("AUTH_DB_PORT", "5432"),
        dbname=os.environ["AUTH_DB_NAME"],
        user=os.environ["AUTH_DB_USER"],
        password=os.environ["AUTH_DB_PASSWORD"],
        connect_timeout=int(os.environ.get("AUTH_DB_CONNECT_TIMEOUT", "5")),
    )


def execute_sql_script(sql_text):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql_text)
        connection.commit()


def table_exists(table_name):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = %s
                )
                """,
                (table_name,),
            )
            return bool(cursor.fetchone()[0])


def fetch_user_claims_by_sub(cognito_sub):
    with _connect() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT "userID", "userType", "isActive"
                FROM users
                WHERE "cognitoSub" = %s
                """,
                (cognito_sub,),
            )
            return cursor.fetchone()


def get_all_users():
    with _connect() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute('SELECT * FROM users;')
            rows = cursor.fetchall()
            for row in rows:
                for k, v in row.items():
                    if hasattr(v, 'isoformat'):
                        row[k] = v.isoformat()
            return rows


def user_id_exists(user_id):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1 FROM users WHERE "userID" = %s', (user_id,))
            return cursor.fetchone() is not None


def find_overlap_candidates(email_address, phone_number):
    with _connect() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT "userID", "emailAddress", "phoneNumber"
                FROM users
                WHERE "emailAddress" = %s OR "phoneNumber" = %s
                """,
                (email_address, phone_number),
            )
            return cursor.fetchall()


def upsert_cognito_user(record):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (
                    "userID",
                    "cognitoSub",
                    "userName",
                    "emailAddress",
                    "userType",
                    "phoneNumber",
                    "emailVerified",
                    "isActive",
                    "dateOfBirth"
                )
                VALUES (
                    %(userID)s,
                    %(cognitoSub)s,
                    %(userName)s,
                    %(emailAddress)s,
                    %(userType)s,
                    %(phoneNumber)s,
                    %(emailVerified)s,
                    %(isActive)s,
                    %(dateOfBirth)s
                )
                ON CONFLICT ("cognitoSub") DO UPDATE
                SET
                    "userName" = EXCLUDED."userName",
                    "emailAddress" = EXCLUDED."emailAddress",
                    "userType" = EXCLUDED."userType",
                    "phoneNumber" = EXCLUDED."phoneNumber",
                    "emailVerified" = EXCLUDED."emailVerified",
                    "isActive" = EXCLUDED."isActive",
                    "dateOfBirth" = EXCLUDED."dateOfBirth",
                    "updatedAt" = CURRENT_TIMESTAMP
                """,
                record,
            )


def _auto_heal_user(cognito_user):
    try:
        attrs = {a["Name"]: a["Value"] for a in cognito_user.get("Attributes", cognito_user.get("UserAttributes", []))}
        import string
        import random
        candidate = "".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        record = {
            "userID": candidate,
            "cognitoSub": attrs.get("sub"),
            "userName": cognito_user.get("Username"),
            "emailAddress": attrs.get("email", ""),
            "userType": attrs.get("custom:userType", "General"),
            "phoneNumber": attrs.get("phone_number", ""),
            "emailVerified": str(attrs.get("email_verified", "false")).lower() == "true",
            "isActive": True,
            "dateOfBirth": attrs.get("custom:dateOfBirth", "2000-01-01"),
        }
        upsert_cognito_user(record)
        return record
    except Exception as e:
        print("Auto-heal failed:", e)
    return None

def get_user_by_sub(cognito_sub):
    with _connect() as connection:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute('SELECT * FROM users WHERE "cognitoSub" = %s', (cognito_sub,))
            user = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
            
            if not user and cognito and os.environ.get("COGNITO_USER_POOL_ID"):
                try:
                    response = cognito.list_users(UserPoolId=os.environ["COGNITO_USER_POOL_ID"], Filter=f'sub = "{cognito_sub}"')
                    if response.get("Users"):
                        return _auto_heal_user(response["Users"][0])
                except Exception:
                    pass
            return user


def get_user_by_mobile(phone_number):
    with _connect() as connection:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute('SELECT * FROM users WHERE "phoneNumber" = %s', (phone_number,))
            user = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
            
            if not user and cognito and os.environ.get("COGNITO_USER_POOL_ID"):
                try:
                    response = cognito.list_users(UserPoolId=os.environ["COGNITO_USER_POOL_ID"], Filter=f'phone_number = "{phone_number}"')
                    if response.get("Users"):
                        return _auto_heal_user(response["Users"][0])
                except Exception:
                    pass
            return user


def get_user_by_identifier(identifier):
    with _connect() as connection:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute('SELECT * FROM users WHERE "userName" = %s OR "emailAddress" = %s', (identifier, identifier))
            user = dict(cursor.fetchone()) if cursor.rowcount > 0 else None
            
            if not user and cognito and os.environ.get("COGNITO_USER_POOL_ID"):
                try:
                    try:
                        user_info = cognito.admin_get_user(UserPoolId=os.environ["COGNITO_USER_POOL_ID"], Username=identifier)
                        return _auto_heal_user(user_info)
                    except cognito.exceptions.UserNotFoundException:
                        pass
                    
                    if "@" in identifier:
                        response = cognito.list_users(UserPoolId=os.environ["COGNITO_USER_POOL_ID"], Filter=f'email = "{identifier}"')
                        if response.get("Users"):
                            return _auto_heal_user(response["Users"][0])
                except Exception:
                    pass
            return user


def update_user_profile(cognito_sub, bio=None, profile_picture_url=None, privacy_mode=None):
    with _connect() as connection:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            updates = []
            params = []
            if bio is not None:
                updates.append('"bio" = %s')
                params.append(bio)
            if profile_picture_url is not None:
                updates.append('"profilePictureUrl" = %s')
                params.append(profile_picture_url)
            if privacy_mode is not None:
                updates.append('"privacyMode" = %s')
                params.append(privacy_mode)

            if updates:
                updates.append('"updatedAt" = CURRENT_TIMESTAMP')
                query = f'UPDATE users SET {", ".join(updates)} WHERE "cognitoSub" = %s'
                params.append(cognito_sub)
                cursor.execute(query, tuple(params))
                connection.commit()

            # Return the updated row
            cursor.execute('SELECT * FROM users WHERE "cognitoSub" = %s', (cognito_sub,))
            row = cursor.fetchone()
            return dict(row) if row else {}


# Alias — profiles_api.py uses this name
get_user_by_cognito_sub = get_user_by_sub


def search_users_by_username(query, limit=20):
    """Case-insensitive prefix search on userName and bio."""
    safe_query = str(query or "").strip()
    if not safe_query:
        return []
    pattern = f"%{safe_query}%"
    with _connect() as connection:
        with connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute(
                '''SELECT * FROM users
                   WHERE "isActive" = TRUE
                     AND ("userName" ILIKE %s OR "displayName" ILIKE %s)
                   ORDER BY "userName" ASC
                   LIMIT %s''',
                (pattern, pattern, limit),
            )
            return [dict(row) for row in cursor.fetchall()]
