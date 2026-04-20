# Signup/Signin Compatibility Lambda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Lambda-native compatibility layer for the HAPPNIX signup/signin flow, wire the frontend to its API base, and maintain a detailed backend record document alongside implementation.

**Architecture:** Replace the placeholder Lambda with a path-based router and small compatibility helpers for request parsing, session state, and user/profile persistence. Use a file-backed development store plus deterministic tests so the migrated endpoint contract can be implemented without bringing Django into this repo.

**Tech Stack:** AWS SAM, Python 3.12, `unittest`, browser JavaScript, JSON file persistence for dev compatibility

---

## File Structure

- Create: `backend/dev_data/`
- Create: `backend/dev_data/.gitkeep`
- Create: `backend/dev_store.py`
- Modify: `backend/SignupSignin.py`
- Modify: `template.yaml`
- Create: `tests/test_signup_signin_lambda.py`
- Modify: `web_frontend/runtime-config.js`
- Modify: `web_frontend/signup_signin.js`
- Modify: `web_frontend/signup_details.js`
- Modify: `web_frontend/signup_profile_optional.js`
- Create: `docs/backend-auth-progress.md`

### Task 1: Create the backend record and the first failing route test

**Files:**
- Create: `docs/backend-auth-progress.md`
- Create: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Write the backend record skeleton**

```md
# Backend Auth Progress

## Current Scope

- Lambda entry file: `backend/SignupSignin.py`
- Frontend clients:
  - `web_frontend/signup_signin.js`
  - `web_frontend/signup_details.js`
  - `web_frontend/signup_profile_optional.js`

## API Inventory

| Method | Path | Frontend file | Lambda handler | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- | --- |

## Lambda Functions

| Function | Purpose | Inputs | Output |
| --- | --- | --- | --- |
```

- [ ] **Step 2: Write the failing route test**

```python
import json
import unittest

from backend.SignupSignin import lambda_handler


class SignupSigninLambdaTests(unittest.TestCase):
    def test_send_mobile_otp_route_returns_success_for_valid_mobile(self):
        event = {
            "httpMethod": "POST",
            "path": "/api/auth/mobile/send-otp",
            "body": json.dumps({"mobile": "9876543210"}),
        }

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `python -m unittest tests.test_signup_signin_lambda.SignupSigninLambdaTests.test_send_mobile_otp_route_returns_success_for_valid_mobile -v`
Expected: FAIL because the placeholder Lambda does not return an API Gateway-style success payload

- [ ] **Step 4: Commit**

```bash
git add docs/backend-auth-progress.md tests/test_signup_signin_lambda.py
git commit -m "test: add first signup signin lambda route test"
```

### Task 2: Build the minimal Lambda router and make the first route pass

**Files:**
- Modify: `backend/SignupSignin.py`
- Create: `backend/dev_data/.gitkeep`

- [ ] **Step 1: Write the next failing test for invalid mobile**

```python
    def test_send_mobile_otp_rejects_invalid_mobile(self):
        event = {
            "httpMethod": "POST",
            "path": "/api/auth/mobile/send-otp",
            "body": json.dumps({"mobile": "123"}),
        }

        response = lambda_handler(event, None)
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(body["message"], "Please enter a valid 10-digit mobile number.")
```

- [ ] **Step 2: Run tests to verify they fail for the right reason**

Run: `python -m unittest tests.test_signup_signin_lambda.SignupSigninLambdaTests -v`
Expected: FAIL with route/response-shape mismatch from placeholder implementation

- [ ] **Step 3: Write the minimal router implementation**

```python
import json
import random


def _json_response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _error(message, status_code=400):
    return _json_response(status_code, {"message": message})


def _parse_body(event):
    raw_body = event.get("body") or "{}"
    return json.loads(raw_body)


def _route_key(event):
    return (event.get("httpMethod", "GET").upper(), event.get("path", ""))


def _generate_otp():
    return "".join(str(random.randint(0, 9)) for _ in range(6))


def send_mobile_otp(event):
    payload = _parse_body(event)
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile.isdigit() or len(mobile) != 10:
        return _error("Please enter a valid 10-digit mobile number.")
    return _json_response(200, {"message": f"OTP sent successfully to {mobile}.", "debugOtp": _generate_otp()})


ROUTES = {
    ("POST", "/api/auth/mobile/send-otp"): send_mobile_otp,
}


def lambda_handler(event, context):
    handler = ROUTES.get(_route_key(event))
    if handler is None:
        return _error("Route not found.", status_code=404)
    return handler(event)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m unittest tests.test_signup_signin_lambda.SignupSigninLambdaTests -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/SignupSignin.py backend/dev_data/.gitkeep tests/test_signup_signin_lambda.py
git commit -m "feat: add signup signin lambda router skeleton"
```

### Task 3: Add compatibility stores and finish the auth/signup endpoint set with TDD

**Files:**
- Create: `backend/dev_store.py`
- Modify: `backend/SignupSignin.py`
- Modify: `tests/test_signup_signin_lambda.py`
- Modify: `docs/backend-auth-progress.md`

- [ ] **Step 1: Add failing tests for the remaining routes**

```python
    def test_verify_mobile_otp_returns_new_user_redirect(self):
        ...

    def test_verify_mobile_otp_returns_existing_user_redirect(self):
        ...

    def test_login_with_password_rejects_invalid_credentials(self):
        ...

    def test_register_user_details_requires_pending_signup_mobile(self):
        ...

    def test_complete_profile_setup_requires_authenticated_user(self):
        ...
```

- [ ] **Step 2: Run the focused test suite to verify failures**

Run: `python -m unittest tests.test_signup_signin_lambda.SignupSigninLambdaTests -v`
Expected: FAIL on unimplemented route behavior

- [ ] **Step 3: Add the compatibility store**

```python
from pathlib import Path
import json
import uuid


DATA_FILE = Path(__file__).with_name("dev_data").joinpath("auth_state.json")


def load_state():
    if not DATA_FILE.exists():
        return {"sessions": {}, "users": []}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def save_state(state):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def create_session(state):
    token = uuid.uuid4().hex
    state["sessions"].setdefault(token, {})
    save_state(state)
    return token
```

- [ ] **Step 4: Extend the Lambda handlers minimally**

```python
def verify_mobile_otp(event):
    ...


def login_with_password(event):
    ...


def register_user_details(event):
    ...


def complete_profile_setup(event):
    ...


def forgot_password_request(event):
    ...


def send_aadhaar_otp_api(event):
    ...


def verify_aadhaar_otp_api(event):
    ...
```

- [ ] **Step 5: Update the backend record with route inventory and function inventory**

```md
## API Inventory

| Method | Path | Frontend file | Lambda handler | Purpose | Request | Response |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/mobile/send-otp` | `web_frontend/signup_signin.js` | `send_mobile_otp` | Start OTP sign-in | `{ "mobile": "9876543210" }` | `{ "message": "...", "debugOtp": "123456" }` |
```

- [ ] **Step 6: Run tests to verify the expanded behavior**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/dev_store.py backend/SignupSignin.py tests/test_signup_signin_lambda.py docs/backend-auth-progress.md
git commit -m "feat: implement signup signin compatibility endpoints"
```

### Task 4: Wire API Gateway routes and frontend API base usage

**Files:**
- Modify: `template.yaml`
- Modify: `web_frontend/runtime-config.js`
- Modify: `web_frontend/signup_signin.js`
- Modify: `web_frontend/signup_details.js`
- Modify: `web_frontend/signup_profile_optional.js`
- Modify: `docs/backend-auth-progress.md`

- [ ] **Step 1: Write the failing frontend/base-path test as a backend routing assertion**

```python
    def test_route_table_includes_signup_profile_path(self):
        from backend.SignupSignin import ROUTES
        self.assertIn(("POST", "/api/signup/profile"), ROUTES)
```

- [ ] **Step 2: Run the targeted test to verify failure if the route table is incomplete**

Run: `python -m unittest tests.test_signup_signin_lambda.SignupSigninLambdaTests.test_route_table_includes_signup_profile_path -v`
Expected: FAIL until all routes are registered

- [ ] **Step 3: Add API Gateway events and frontend API base helper**

```yaml
      Events:
        SendMobileOtp:
          Type: Api
          Properties:
            Path: /api/auth/mobile/send-otp
            Method: post
            RestApiId: !Ref HappnixDevApi
```

```javascript
function getApiBaseUrl() {
  return (window.HAPPNIX_RUNTIME_CONFIG && window.HAPPNIX_RUNTIME_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
}

function buildApiUrl(path) {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}
```

- [ ] **Step 4: Update the backend record with frontend attachments**

```md
| POST | `/api/signup/details` | `web_frontend/signup_details.js` | `register_user_details` | Complete step 2 of signup | `{ ... }` | `{ "message": "...", "redirectUrl": "/signup/profile/" }` |
```

- [ ] **Step 5: Run the backend tests**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add template.yaml web_frontend/runtime-config.js web_frontend/signup_signin.js web_frontend/signup_details.js web_frontend/signup_profile_optional.js docs/backend-auth-progress.md
git commit -m "feat: wire auth frontend to compatibility api"
```

### Task 5: Verify the end-to-end implementation record

**Files:**
- Modify: `docs/backend-auth-progress.md`

- [ ] **Step 1: Expand the record with function parameters and outputs**

```md
## Lambda Functions

| Function | Purpose | Inputs | Output |
| --- | --- | --- | --- |
| `lambda_handler` | Route incoming API Gateway events | `event`, `context` | API Gateway response dict |
| `send_mobile_otp` | Validate mobile and create OTP response | API Gateway event | JSON response with message and optional debug OTP |
```

- [ ] **Step 2: Verify the record includes all implemented routes and handlers**

Run: `rg -n "API Inventory|Lambda Functions|/api/auth|/api/signup" docs/backend-auth-progress.md`
Expected: every migrated endpoint appears in the file

- [ ] **Step 3: Commit**

```bash
git add docs/backend-auth-progress.md
git commit -m "docs: add backend auth implementation record"
```
