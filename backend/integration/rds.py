import psycopg2
import os
from psycopg2.extras import RealDictCursor
from utils import dependencies
from utils import utilities as util

def get_connection():
    """Establish a connection to the RDS PostgreSQL database."""
    try:
        host = os.environ.get("AUTH_DB_HOST") or dependencies.enviroment_variable.get("DATA_DB_HOST", "")
        port = os.environ.get("AUTH_DB_PORT") or dependencies.enviroment_variable.get("DATA_DB_PORT", "5432")
        
        conn = psycopg2.connect(
            host=host,
            dbname=dependencies.enviroment_variable.get("AUTH_DB_NAME", ""),
            user=dependencies.enviroment_variable.get("AUTH_DB_USER", ""),
            password=dependencies.enviroment_variable.get("AUTH_DB_PASSWORD", ""),
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


def get_user_by_username(username: str) -> dict:
    """Retrieve a specific user by username."""
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Note: adjust the column name if username is stored as something else (e.g. user_name or cognito_username)
            cur.execute("SELECT * FROM users WHERE username = %s LIMIT 1;", (username,))
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
