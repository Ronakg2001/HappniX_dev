import psycopg2
import os
import json
from psycopg2.extras import RealDictCursor
from utils import dependencies
from utils import utilities as util

_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "manifest.json")
try:
    with open(_MANIFEST_PATH, "r") as _f:
        _MANIFEST = json.load(_f)
except Exception as e:
    util.log("error", "rds.init", f"Failed to load manifest.json: {e}")
    _MANIFEST = {}

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


def get_record(table_name: str, **kwargs) -> dict:
    """
    Retrieve a single record based on matching kwargs conditions.
    Example: get_record("users", userName="john_doe")
    """
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
        
    if not kwargs:
        return {"success": False, "error": "No query conditions provided."}
        
    where_clauses = []
    values = []
    for k, v in kwargs.items():
        where_clauses.append(f'"{k}" = %s')
        values.append(v)
        
    where_str = " AND ".join(where_clauses)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'SELECT * FROM {table_name} WHERE {where_str} LIMIT 1;', tuple(values))
            row = cur.fetchone()
            if row:
                data = {k: str(v) if v is not None else None for k, v in row.items()}
                return {"success": True, "data": data}
            else:
                return {"success": False, "error": "Record not found."}
    except Exception as exc:
        util.log("error", "rds.get_record", f"Failed to fetch record: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def record_exists(table_name: str, **kwargs) -> bool:
    """
    Ultra-fast check to see if a record exists based on kwargs.
    """
    conn = get_connection()
    if not conn:
        return True # fail-safe
        
    if not kwargs:
        return True
        
    where_clauses = []
    values = []
    for k, v in kwargs.items():
        where_clauses.append(f'"{k}" = %s')
        values.append(v)
        
    where_str = " AND ".join(where_clauses)
    
    try:
        with conn.cursor() as cur:
            cur.execute(f'SELECT 1 FROM {table_name} WHERE {where_str} LIMIT 1;', tuple(values))
            return cur.fetchone() is not None
    except Exception as exc:
        util.log("error", "rds.record_exists", f"Failed to check record: {exc}")
        return True
    finally:
        conn.close()


def insert_record(table_name: str, **kwargs) -> dict:
    """
    Dynamically insert a record into the table.
    Uses manifest.json to pull allowed columns and default statuses.
    """
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}
        
    table_config = _MANIFEST.get("rds", {}).get("tables", {}).get(table_name, {})
    columns = table_config.get("columns", [])
    
    if not columns:
        return {"success": False, "error": f"Table {table_name} not configured in manifest."}
        
    insert_data = {}
    for col in columns:
        if col in kwargs:
            insert_data[col] = kwargs[col]
        elif col == "status":
            insert_data[col] = table_config.get("default_status", "Active")
        else:
            insert_data[col] = None
            
    cols_str = ", ".join([f'"{k}"' for k in insert_data.keys()])
    placeholders = ", ".join(["%s"] * len(insert_data))
    values = tuple(insert_data.values())
    
    # We assume 'userID' is primary key based on prior implementation. 
    # For full genericness, could put pk in manifest, but DO NOTHING on conflict is standard for users.
    pk = table_config.get("pk", "userID")
    sql = f'INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders}) ON CONFLICT ("{pk}") DO NOTHING;'
    
    try:
        with conn.cursor() as cur:
            cur.execute(sql, values)
            conn.commit()
        util.log("info", "rds.insert_record", f"Record inserted into {table_name}")
        return {"success": True}
    except Exception as exc:
        conn.rollback()
        util.log("error", "rds.insert_record", f"Failed to insert: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def delete_record(table_name: str, **kwargs) -> dict:
    """
    Delete records from the table based on kwargs conditions.
    """
    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    if not kwargs:
        return {"success": False, "error": "No query conditions provided for deletion."}

    where_clauses = []
    values = []
    for k, v in kwargs.items():
        where_clauses.append(f'"{k}" = %s')
        values.append(v)

    where_str = " AND ".join(where_clauses)
    sql = f'DELETE FROM {table_name} WHERE {where_str};'

    try:
        with conn.cursor() as cur:
            cur.execute(sql, tuple(values))
            deleted_count = cur.rowcount
            conn.commit()
        util.log("info", "rds.delete_record", f"Deleted {deleted_count} records from {table_name}")
        return {"success": True, "deletedCount": deleted_count}
    except Exception as exc:
        conn.rollback()
        util.log("error", "rds.delete_record", f"Failed to delete record: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def update_record(table_name: str, pk_name: str, pk_value: str, updates: dict) -> dict:
    """
    Update a record in the RDS table based on its primary key.
    Only updates columns that are defined in the manifest for the table.
    """
    if not updates:
        return {"success": False, "error": "No updates provided."}

    conn = get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    table_config = _MANIFEST.get("rds", {}).get("tables", {}).get(table_name, {})
    columns = table_config.get("columns", [])
    
    if not columns:
        conn.close()
        return {"success": False, "error": f"Table {table_name} not configured in manifest."}

    set_clauses = []
    values = []
    
    for k, v in updates.items():
        if k in columns:
            set_clauses.append(f'"{k}" = %s')
            values.append(v)
            
    if not set_clauses:
        conn.close()
        return {"success": False, "error": "No valid columns to update."}
        
    set_str = ", ".join(set_clauses)
    sql = f'UPDATE {table_name} SET {set_str} WHERE "{pk_name}" = %s;'
    values.append(pk_value)
    
    try:
        with conn.cursor() as cur:
            cur.execute(sql, tuple(values))
            updated_count = cur.rowcount
            conn.commit()
        util.log("info", "rds.update_record", f"Updated {updated_count} records in {table_name}", pk_value=pk_value)
        return {"success": True, "updatedCount": updated_count}
    except Exception as exc:
        conn.rollback()
        util.log("error", "rds.update_record", f"Failed to update record: {exc}", pk_value=pk_value)
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()
