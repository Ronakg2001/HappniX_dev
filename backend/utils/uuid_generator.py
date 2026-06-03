"""
utils/uuid_generator.py — Custom UUIDv7 generator for HappniX.

Structure (128-bit, RFC 9562 compliant):
  ┌──────────────────────┬──────┬──────────┬─────────┬──────────────────────────────────────────────┐
  │  unix_ts_ms (48-bit)  │ ver  │ rand_a   │ variant │               rand_b (62-bit)                │
  │                       │ 0x7  │ entity   │  0b10   │  region(8) | worker(10) | random(44)          │
  └──────────────────────┴──────┴──────────┴─────────┴──────────────────────────────────────────────┘

  - Timestamp-first layout means UUIDs sort chronologically (great for indexed PKs).
  - rand_a  carries the 12-bit entity type code (e.g. USER→GENERAL = 0xA0C).
  - rand_b  carries an 8-bit internal region ID (from REGION_CODE_MAP), a 10-bit
            worker ID, and 44 bits of cryptographic randomness.

Region encoding:
    ISO alpha-2 strings are mapped to sequential 8-bit IDs (1–255) via REGION_CODE_MAP.
    A direct ASCII encoding would require 16 bits (676 combinations > 256), so a
    lookup table is the only collision-free approach for 8-bit region fields.
    Add new entries sequentially as HappniX expands to new regions.

Usage:
    from utils.uuid_generator import generate_user_id

    user_uuid = generate_user_id(region_iso="IN")
    # → "018f4e3a-bcde-7a0c-8901-3f2c1a4d8e9f"  (USER→GENERAL, India)
"""

import time
import secrets
import uuid


# ── Default worker ID ─────────────────────────────────────────────────────────
# Override per Lambda instance / worker process if you have multiple workers.
DEFAULT_WORKER_ID = 1


# ── Internal region ID map (8-bit, 1–255) ────────────────────────────────────
# Sequential IDs assigned to ISO 3166-1 alpha-2 region codes.
# These are HappniX-internal — NOT phone dial codes, NOT ISO numeric codes.
# ISO alpha-2 has 676 possible values; only 256 fit in 8 bits, hence the map.
# Append new entries in order as HappniX expands to new regions.
REGION_CODE_MAP: dict[str, int] = {
    "IN": 1,   # India
    "US": 2,   # United States
    "GB": 3,   # United Kingdom
    "AE": 4,   # United Arab Emirates
    "AU": 5,   # Australia
}


# ── Entity type map ───────────────────────────────────────────────────────────
# 12-bit codes stored in rand_a. Structured as ENTITY → SUB_TYPE → int.
# Extend each category as HappniX adds new entity types.
ENTITY_TYPE_MAP = {
    "USER": {
        "AUTHORITY": 0xA0A,
        "ADMIN":     0xA0F,
        "BUSINESS":  0xA0B,
        "GENERAL":   0xA0C,
        "TEMPORARY": 0xA0D,
    },
    "EVENT": {
        "PARTY":   {"HOUSEPARTY": 0xB1A},
        "STANDUP": {"PUBLIC":     0xB1B},
    },
    "POST": {
        "GENERAL": 0xC0A,
        "REEL":    0xC0B,
        "STORY":   0xC0C,
    },
    "TICKET": 0xD00,
    "CHAT":   0xE00,
}


def resolve_entity_type(entity: str, sub_entity: str) -> int:
    """
    Resolve a two-level entity path to its integer code from ENTITY_TYPE_MAP.

    Args:
        entity     (str): Top-level entity key, e.g. 'USER', 'POST'.
        sub_entity (str): Sub-type key,         e.g. 'GENERAL', 'REEL'.

    Returns:
        int: The entity type code, or 0 if the path is not found.

    Example:
        resolve_entity_type("USER", "GENERAL")  # → 0xA0C
    """
    top = ENTITY_TYPE_MAP.get(entity.upper())
    if isinstance(top, dict):
        return top.get(sub_entity.upper(), 0)
    if isinstance(top, int):
        return top
    return 0


def happnix_uuid_v7(entity_type: int, region_code: int, worker_id: int) -> uuid.UUID:
    """
    Low-level UUIDv7 generator. Returns a raw uuid.UUID object.

    rand_b layout (62-bit):
        region(8) | worker(10) | random(44)

    Args:
        entity_type (int): 12-bit entity code from ENTITY_TYPE_MAP.
        region_code (int): 8-bit internal region ID from REGION_CODE_MAP.
        worker_id   (int): 10-bit worker/machine identifier (0–1023).

    Returns:
        uuid.UUID: The 128-bit custom UUIDv7 object.
    """
    # 1. 48-bit UNIX timestamp in milliseconds
    ts_ms = int(time.time() * 1000) & ((1 << 48) - 1)

    # 2. Version nibble (always 7 for UUIDv7)
    version = 0x7

    # 3. 12-bit rand_a — entity type code (e.g. USER→GENERAL = 0xA0C)
    rand_a = entity_type & 0xFFF

    # 4. 2-bit variant (always 0b10 per RFC 4122 / RFC 9562)
    variant = 0x2

    # 5. 62-bit rand_b: 8-bit region | 10-bit worker | 44-bit random
    safe_region = region_code & 0xFF    # 8 bits
    safe_worker = worker_id  & 0x3FF   # 10 bits
    randomness  = secrets.randbits(44) # 44 bits  (8+10+44 = 62 ✓)
    rand_b = (safe_region << 54) | (safe_worker << 44) | randomness

    # 6. Assemble the full 128-bit integer
    uuid_int = (
        (ts_ms   << 80) |
        (version << 76) |
        (rand_a  << 64) |
        (variant << 62) |
        rand_b
    )

    return uuid.UUID(int=uuid_int)


def generate_user_id(
    region_iso: str = "IN",
    user_type:  str = "GENERAL",
    worker_id:  int = DEFAULT_WORKER_ID,
) -> str:
    """
    Generate a HappniX userID as a UUIDv7 string.

    Entity is always USER. Pass `user_type` to select the sub-category.
    Defaults to USER → GENERAL.

    Args:
        region_iso (str): ISO 3166-1 alpha-2 region code (e.g. 'IN', 'US').
                          Defaults to 'IN'.
        user_type  (str): User sub-type from ENTITY_TYPE_MAP["USER"].
                          Defaults to 'GENERAL' (0xA0C).
        worker_id  (int): Lambda worker ID. Defaults to DEFAULT_WORKER_ID (1).

    Returns:
        str: Lowercase hyphenated UUID string,
             e.g. "018f4e3a-bcde-7a0c-8901-3f2c1a4d8e9f".
    """
    region_code = REGION_CODE_MAP.get(str(region_iso).upper(), 0)
    entity_code = resolve_entity_type("USER", user_type)
    return str(happnix_uuid_v7(entity_code, region_code, worker_id))


def generate_otp(digits: int = 6) -> str:
    """Return a zero-padded cryptographically random numeric OTP string of `digits` length."""
    return "".join(str(secrets.randbelow(10)) for _ in range(digits))
