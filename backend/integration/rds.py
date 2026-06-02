import psycopg2
import os
from psycopg2.extras import RealDictCursor
from utils import dependencies
from utils import utilities as util

def get_connection():
    """Establish a connection to the RDS PostgreSQL database."""
    try:
        host = (os.environ.get("AUTH_DB_HOST") or dependencies.enviroment_variable.get("DATA_DB_HOST", "")).strip()
        port = (os.environ.get("AUTH_DB_PORT") or dependencies.enviroment_variable.get("DATA_DB_PORT", "5432")).strip()
        
        conn = psycopg2.connect(
            host=host,
            dbname=(dependencies.enviroment_variable.get("AUTH_DB_NAME") or os.environ.get("AUTH_DB_NAME", "")).strip(),
            user=(dependencies.enviroment_variable.get("AUTH_DB_USER") or os.environ.get("AUTH_DB_USER", "")).strip(),
            password=(dependencies.enviroment_variable.get("AUTH_DB_PASSWORD") or os.environ.get("AUTH_DB_PASSWORD", "")).strip(),
            port=port,
            connect_timeout=5
        )
        return conn
    except Exception as exc:
        util.log("error", "rds.get_connection", f"DB Connection failed: {exc}")
        return None


def execute_raw_sql(sql: str) -> dict:
    """Execute raw SQL statements (for DEV wiping, etc.)."""
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
    
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
        return {"success": True}
    except Exception as exc:
        conn.rollback()
        util.log("error", "rds.execute_raw_sql", f"SQL execution failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def get_all_users() -> dict:
    """Retrieve all users from the users table."""
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM users;")
            rows = cur.fetchall()
            # Convert UUIDs/dates to strings for JSON serialization
            data = []
            for row in rows:
                data.append({k: str(v) if v is not None else None for k, v in row.items()})
        return {"success": True, "data": data}
    except Exception as exc:
        util.log("error", "rds.get_all_users", f"Failed to fetch users: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def record_exists(column_name: str, value: str) -> bool:
    """
    Ultra-fast check to see if a record exists in the users table 
    based on a specific column (e.g. "userName", "phoneNumber", "emailAddress").
    """
    conn = get_connection()
    if not conn:
        # If DB is down, return True to fail-safe and prevent duplicates/errors
        return True
    
    # Whitelist allowed columns to prevent SQL injection
    allowed_columns = {"userName", "phoneNumber", "emailAddress", "cognitoSub", "userID"}
    if column_name not in allowed_columns:
        util.log("error", "rds.record_exists", f"Invalid column name: {column_name}")
        return True
    
    try:
        with conn.cursor() as cur:
            # We use f-string for the column name (safe because of the whitelist above), 
            # and parameterized query %s for the value (safe from injection)
            cur.execute(f'SELECT 1 FROM users WHERE "{column_name}" = %s LIMIT 1;', (value,))
            return cur.fetchone() is not None
    except Exception as exc:
        util.log("error", "rds.record_exists", f"Failed to check {column_name}: {exc}")
        return True # fail-safe
    finally:
        conn.close()


def get_user_by_username(username: str) -> dict:
    """Retrieve a specific user by username."""
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM users WHERE "userName" = %s LIMIT 1;',
                (username,)
            )
            row = cur.fetchone()
            if row:
                data = {k: str(v) if v is not None else None for k, v in row.items()}
                return {"success": True, "data": data}
            else:
                return {"success": False, "error": "User not found."}
    except Exception as exc:
        util.log("error", "rds.get_user_by_username", f"Failed to fetch user: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def insert_user(
    user_id:      str,
    cognito_sub:  str,
    username:     str,
    email:        str,
    phone_number: str,
    full_name:    str,
    dob:          str,
    gender:       str,
    region:       str,
    email_verified: bool = True,
) -> dict:
    """
    Insert a new user row into the `users` table.

    Called by the Cognito Post Confirmation Lambda after a user successfully
    confirms their account. All required columns must be provided; optional
    profile columns (bio, profilePictureUrl, etc.) default to NULL.

    Args:
        user_id:        UUIDv7 string — primary key, generated during signup.
        cognito_sub:    Cognito sub UUID — unique identity bridge.
        username:       Chosen username.
        email:          Email address.
        phone_number:   E.164 phone number (e.g. '+919876543210').
        full_name:      Full display name (stored as userName).
        dob:            Date of birth string in YYYY-MM-DD format.
        gender:         Gender string (e.g. 'Male', 'Female', 'Other').
        region:         ISO 3166-1 alpha-2 region code (e.g. 'IN').
        email_verified: Whether the email is verified. Defaults to True.

    Returns:
        dict: {"success": True} on success, {"success": False, "error": ...} on failure.
    """
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    sql = """
        INSERT INTO users (
            "userID",
            "cognitoSub",
            "userName",
            "fullName",
            "emailAddress",
            "phoneNumber",
            "dateOfBirth",
            "gender",
            "region",
            "emailVerified",
            "status"
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Active'
        )
        ON CONFLICT ("userID") DO NOTHING;
    """
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (
                user_id,
                cognito_sub,
                username,
                full_name,
                email,
                phone_number,
                dob,
                gender,
                region,
                email_verified,
            ))
            conn.commit()
        util.log("info", "rds.insert_user", "User inserted into RDS",
                 user_id=user_id, cognito_sub=cognito_sub)
        return {"success": True}
    except Exception as exc:
        conn.rollback()
        util.log("error", "rds.insert_user", f"Failed to insert user: {exc}",
                 user_id=user_id)
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()

