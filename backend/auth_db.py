import os

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:  # pragma: no cover - exercised only when dependency is absent
    psycopg2 = None
    RealDictCursor = None


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
