import hashlib
import json
import os
import uuid
from pathlib import Path


def _state_path():
    configured = os.environ.get("HAPPNIX_DEV_STORE_PATH", "").strip()
    if configured:
        return Path(configured)
    return Path(__file__).with_name("dev_data").joinpath("auth_state.json")


def _default_state():
    return {"next_user_id": 1, "sessions": {}, "users": []}


def load_state():
    path = _state_path()
    if not path.exists():
        return _default_state()
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(state):
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def ensure_session(session_token=None):
    state = load_state()
    token = session_token or uuid.uuid4().hex
    state["sessions"].setdefault(token, {})
    save_state(state)
    return token, state["sessions"][token]


def get_session(session_token):
    state = load_state()
    if not session_token:
        return None, None
    session = state["sessions"].get(session_token)
    return session_token, session


def replace_session(token, session_data):
    state = load_state()
    state["sessions"][token] = session_data
    save_state(state)


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(user, password):
    return user.get("password_hash") == hash_password(password)


def find_user_by_mobile(mobile):
    state = load_state()
    for user in state["users"]:
        if user.get("profile", {}).get("mobile") == mobile or user.get("username") == mobile:
            return user
    return None


def find_user_by_identifier(identifier):
    lookup = (identifier or "").strip().lower()
    state = load_state()
    for user in state["users"]:
        if user.get("username") == identifier or user.get("email", "").lower() == lookup:
            return user
    return None


def username_exists(username):
    state = load_state()
    return any(user.get("username") == username for user in state["users"])


def email_exists(email):
    lookup = (email or "").strip().lower()
    state = load_state()
    return any(user.get("email", "").lower() == lookup for user in state["users"])


def mobile_exists(mobile):
    state = load_state()
    return any(user.get("profile", {}).get("mobile") == mobile for user in state["users"])


def create_user(full_name, username, password, email, sex, date_of_birth, mobile, gov_id):
    state = load_state()
    user = {
        "id": state["next_user_id"],
        "first_name": full_name,
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "profile": {
            "sex": sex,
            "date_of_birth": date_of_birth,
            "mobile": mobile,
            "gov_id_number": gov_id,
            "gov_id_verified": False,
            "bio": "",
            "profile_picture_url": "",
        },
    }
    state["next_user_id"] += 1
    state["users"].append(user)
    save_state(state)
    return user


def update_user_profile(user_id, *, bio=None, profile_picture_url=None, gov_id_number=None, gov_id_verified=None):
    state = load_state()
    for user in state["users"]:
        if user.get("id") != user_id:
            continue
        profile = user.setdefault("profile", {})
        if bio is not None:
            profile["bio"] = bio
        if profile_picture_url is not None:
            profile["profile_picture_url"] = profile_picture_url
        if gov_id_number is not None:
            profile["gov_id_number"] = gov_id_number
        if gov_id_verified is not None:
            profile["gov_id_verified"] = gov_id_verified
        save_state(state)
        return user
    return None


def find_user_by_id(user_id):
    state = load_state()
    for user in state["users"]:
        if user.get("id") == user_id:
            return user
    return None
