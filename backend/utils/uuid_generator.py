import time
import secrets
import uuid

# HappniX Entity Categories
ENTITY_USER = 0x001

def happnix_uuid_generator(region_code: int, worker_id: int) -> uuid.UUID:
    """
    Generates a custom RFC 9562 compliant UUIDv7 specifically for HappniX Users.
    
    Args:
        region_code (int): 8-bit region identifier (0-255).
        worker_id (int): 10-bit worker/machine identifier (0-1023).
        
    Returns:
        uuid.UUID: The custom 128-bit UUID object.
    """
    # 1. 48-bit UNIX Timestamp (milliseconds)
    ts_ms = int(time.time() * 1000) & ((1 << 48) - 1)
    
    # 2. 4-bit Version (Always 7)
    version = 0x7
    
    # 3. 12-bit rand_a (Entity Type set strictly to USER)
    rand_a = ENTITY_USER & 0xFFF 
    
    # 4. 2-bit Variant (Always 0b10 for RFC 4122/9562)
    variant = 0x2
    
    # 5. 62-bit rand_b (8-bit Region + 10-bit Worker + 44-bit Random)
    safe_region = region_code & 0xFF
    safe_worker = worker_id & 0x3FF
    randomness = secrets.randbits(44)
    
    rand_b = (safe_region << 54) | (safe_worker << 44) | randomness
    
    # 6. Assemble the 128-bit integer
    uuid_int = (
        (ts_ms << 80) |
        (version << 76) |
        (rand_a << 64) |
        (variant << 62) |
        rand_b
    )
    
    return uuid.UUID(int=uuid_int)

# --- Example Usage ---
if __name__ == "__main__":
    # Generate a User ID for a user in Region 91 (India) 
    # created by Worker Node 42
    new_user_id = happnix_uuid_generator(region_code=91, worker_id=42)
    
    print(f"HappniX User ID: {new_user_id}")